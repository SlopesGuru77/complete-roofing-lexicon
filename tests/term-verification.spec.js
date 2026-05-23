// @ts-check
const { test, expect } = require('@playwright/test');

// Term Verification Queue: time-sensitive terms (vf:true) carry a 365-day
// freshness window. The Manager queue surfaces stale + never entries first,
// and the Lexicon badge swaps among three states based on state.vf[termKey].

const STATE_KEY = 'crl_v2_state';

test.describe('vf workflow: state, helpers, lexicon badge, manager queue', () => {
  test('defState includes vf={}; markVerified writes a dated entry', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].markVerified));

    const result = await page.evaluate(() => {
      const c = window['__crl'];
      // pick the first vf-flagged term for the test
      const target = c.TERMS.find(t => t.vf);
      // start clean
      const raw = JSON.parse(localStorage.getItem('crl_v2_state') || '{}');
      raw.vf = {};
      localStorage.setItem('crl_v2_state', JSON.stringify(raw));
      location.reload();
      return target.t;
    });

    await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].markVerified));

    const after = await page.evaluate((termKey) => {
      const c = window['__crl'];
      const before = c.vfStatus(termKey);
      c.markVerified(termKey, 'tester');
      const entry = c.vfState[termKey];
      const after = c.vfStatus(termKey);
      return { before, after, hasDate: !!(entry && entry.date), by: entry && entry.by };
    }, result);

    expect(after.before).toBe('never');
    expect(after.after).toBe('fresh');
    expect(after.hasDate).toBe(true);
    expect(after.by).toBe('tester');
  });

  test('vfStatus flips to stale once an entry passes the 365-day window', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].markVerified));

    const result = await page.evaluate(() => {
      const c = window['__crl'];
      const target = c.TERMS.find(t => t.vf);
      // backdate an entry to 400 days ago
      const past = new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10);
      const raw = JSON.parse(localStorage.getItem('crl_v2_state') || '{}');
      raw.vf = { [target.t]: { date: past, by: 'aging-test' } };
      localStorage.setItem('crl_v2_state', JSON.stringify(raw));
      location.reload();
      return target.t;
    });

    await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].vfStatus));

    const status = await page.evaluate((termKey) => window['__crl'].vfStatus(termKey), result);
    expect(status).toBe('stale');
  });

  test('Lexicon badge reflects current vf status (fresh ⇒ green pill)', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].markVerified));

    // Mark a vf-flagged term verified in-session (no reload race) and pick it back out.
    const termKey = await page.evaluate(() => {
      const c = window['__crl'];
      const target = c.TERMS.find(t => t.vf);
      c.markVerified(target.t, 'badge-test');
      return target.t;
    });

    await page.click('#tabs button[data-v="lexicon"]');
    // Narrow to the target term so we don't fight other cards.
    await page.fill('#lexSearch', termKey);

    // Scope by the .name element so we don't pick up cards that *reference*
    // the term in their definition (e.g., Ponding Water mentions Positive Drainage).
    const card = page.locator('.term', { has: page.locator('.name', { hasText: new RegExp(`^${termKey}$`) }) });
    await expect(card).toBeVisible();
    const badge = card.locator('.vflag.vf-fresh');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText(/Verified/i);
  });

  test('Manager: Verification Queue lists stale+never by default, "Verify" button marks fresh', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!(window['__crl']));

    // unlock manager
    await page.click('#tabs button[data-v="manager"]');
    await page.fill('#mgrPin', 'ROOF123');
    await page.click('#mgrIn');
    await expect(page.locator('#manager')).toContainText(/Term Verification Queue/i);

    // counts should add up to total vf-flagged terms
    const counts = await page.evaluate(() => {
      const c = window['__crl'];
      const all = c.TERMS.filter(t => t.vf).length;
      const fresh = c.TERMS.filter(t => t.vf && c.vfStatus(t.t) === 'fresh').length;
      const stale = c.TERMS.filter(t => t.vf && c.vfStatus(t.t) === 'stale').length;
      const never = c.TERMS.filter(t => t.vf && c.vfStatus(t.t) === 'never').length;
      return { all, fresh, stale, never };
    });
    expect(counts.all).toBe(counts.fresh + counts.stale + counts.never);
    expect(counts.all).toBeGreaterThan(0);

    // click the first "Verify" row button — it should disappear from the
    // queue on next render (because the row is now fresh)
    const firstBtn = page.locator('#manager .mgr-vf-mark').first();
    const firstTerm = await firstBtn.getAttribute('data-term');
    await firstBtn.click();

    // after re-render, the row for firstTerm should no longer be in the
    // queue-only view
    const stillPresent = await page.evaluate((termKey) => {
      const rows = Array.from(document.querySelectorAll('#manager .mgr-vf-mark'));
      return rows.some(r => r.getAttribute('data-term') === termKey);
    }, firstTerm);
    expect(stillPresent).toBe(false);

    // and vfStatus should now report fresh
    const status = await page.evaluate((termKey) => window['__crl'].vfStatus(termKey), firstTerm);
    expect(status).toBe('fresh');
  });

  test('Manager: "Show all flagged terms" toggle includes fresh rows', async ({ page }) => {
    await page.goto('/');
    await page.click('#tabs button[data-v="manager"]');
    await page.fill('#mgrPin', 'ROOF123');
    await page.click('#mgrIn');

    // mark one term fresh first so toggle has something to reveal
    await page.evaluate(() => {
      const c = window['__crl'];
      const target = c.TERMS.find(t => t.vf);
      c.markVerified(target.t, 'toggle-test');
    });

    // click toggle to show all
    await page.click('#mgrVfToggle');

    // table should now show the total vf term count
    const visibleRows = await page.evaluate(() => document.querySelectorAll('#manager .mgr-vf-mark').length);
    const total = await page.evaluate(() => window['__crl'].TERMS.filter(t => t.vf).length);
    expect(visibleRows).toBe(total);
  });

  test('loadState migration: pre-vf state gets vf={} without losing other fields', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!(window['__crl']));

    await page.evaluate(() => {
      // simulate a v3 state from before this change — no vf key
      const legacy = {
        v: 3, name: 'Pre-Migration User', role: 'Inspector',
        cards: { 'Hailstone': { box: 3, seen: 5, missed: 1, last: '2026-05-01' } },
        certs: [{ at: '2026-04-15', level: 2, score: 88, pass: true }],
        prefs: { dark: false, themeManual: false, passcode: 'ROOF123', supabase: { url: '', anonKey: '', enabled: false, schemaPrefix: 'roofing_training_' } }
      };
      localStorage.setItem('crl_v2_state', JSON.stringify(legacy));
      location.reload();
    });

    await page.waitForFunction(() => !!(window['__crl']));

    const result = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('crl_v2_state'));
      return {
        hasVf: typeof raw.vf === 'object' && raw.vf !== null && !Array.isArray(raw.vf),
        vfEmpty: Object.keys(raw.vf).length === 0,
        nameKept: raw.name,
        cardKept: raw.cards && raw.cards.Hailstone && raw.cards.Hailstone.box,
        certKept: raw.certs && raw.certs[0] && raw.certs[0].score
      };
    });

    expect(result.hasVf).toBe(true);
    expect(result.vfEmpty).toBe(true);
    expect(result.nameKept).toBe('Pre-Migration User');
    expect(result.cardKept).toBe(3);
    expect(result.certKept).toBe(88);
  });
});
