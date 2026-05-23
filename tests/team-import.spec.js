// @ts-check
const { test, expect } = require('@playwright/test');

// Team import: each device exports its progress JSON, lead device imports
// them on the Manager dashboard and sees a combined cert table. Lives in
// separate localStorage key (crl_team_v1) so it doesn't bloat per-device state.

function mkSnap(over) {
  return {
    v: 3,
    name: 'Test Tech',
    role: 'Inspector',
    location: 'Kankakee, IL',
    cards: { 'Hailstone': { box: 4, seen: 6, missed: 1, last: '2026-05-10' } },
    certs: [{ at: '2026-05-15', level: 2, levelName: 'Field Roofing Professional', score: 90, pass: true }],
    quizMissed: [],
    missedCount: {},
    bestSpeed: 12,
    scenDone: [],
    compatDone: [],
    tcDone: [],
    vf: {},
    streak: { n: 3, last: '2026-05-15' },
    view: 'overview',
    prefs: { dark: false, themeManual: false, passcode: 'ROOF123', supabase: { url: '', anonKey: '', enabled: false, schemaPrefix: 'roofing_training_' } },
    mgrUnlocked: false,
    ...over
  };
}

test.describe('Team import: storage, helpers, manager UI, combined certs', () => {
  test('teamImport accepts valid snapshot; teamRead returns stored devices', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].teamImport));

    const result = await page.evaluate((snap) => {
      const c = window['__crl'];
      localStorage.removeItem(c.TEAM_KEY);
      const r1 = c.teamImport(snap);
      const list = c.teamRead();
      return { ok: r1.ok, id: r1.id, length: list.length, name: list[0]?.name, certs: list[0]?.snap?.certs?.length };
    }, mkSnap({}));

    expect(result.ok).toBe(true);
    expect(result.length).toBe(1);
    expect(result.name).toBe('Test Tech');
    expect(result.certs).toBe(1);
  });

  test('teamImport rejects malformed JSON + non-CRL objects', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].teamImport));

    const result = await page.evaluate(() => {
      const c = window['__crl'];
      localStorage.removeItem(c.TEAM_KEY);
      const badJson = c.teamImport('{not json');
      const badShape = c.teamImport({ foo: 'bar' });
      const badArr = c.teamImport([1, 2, 3]);
      return {
        badJson: { ok: badJson.ok, msg: badJson.msg },
        badShape: { ok: badShape.ok, msg: badShape.msg },
        badArr: { ok: badArr.ok, msg: badArr.msg },
        nothingStored: c.teamRead().length
      };
    });

    expect(result.badJson.ok).toBe(false);
    expect(result.badJson.msg).toMatch(/not valid json/i);
    expect(result.badShape.ok).toBe(false);
    expect(result.badShape.msg).toMatch(/roofing lexicon|v.*cards|missing/i);
    expect(result.badArr.ok).toBe(false);
    expect(result.nothingStored).toBe(0);
  });

  test('teamImport dedupes same staff+role+location to a single slot', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].teamImport));

    const result = await page.evaluate((snap) => {
      const c = window['__crl'];
      localStorage.removeItem(c.TEAM_KEY);
      // Same staff name/role/location, but a different cert run on the second import.
      c.teamImport(snap);
      const snap2 = JSON.parse(JSON.stringify(snap));
      snap2.certs = [{ at: '2026-05-20', level: 3, levelName: 'Claims & Forensics Specialist', score: 95, pass: true }];
      c.teamImport(snap2);
      const list = c.teamRead();
      return {
        length: list.length,
        latestCertDate: list[0]?.snap?.certs?.[0]?.at
      };
    }, mkSnap({}));

    expect(result.length).toBe(1); // same id ⇒ replaced
    expect(result.latestCertDate).toBe('2026-05-20'); // overwritten with newer
  });

  test('teamRemove drops one device; teamClear empties the list', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].teamImport));

    const result = await page.evaluate(() => {
      const c = window['__crl'];
      localStorage.removeItem(c.TEAM_KEY);
      const a = c.teamImport({ v: 3, name: 'Tech A', role: 'Estimator', location: 'IL', cards: {}, certs: [] });
      const b = c.teamImport({ v: 3, name: 'Tech B', role: 'Inspector', location: 'IL', cards: {}, certs: [] });
      const beforeRemove = c.teamRead().length;
      c.teamRemove(a.id);
      const afterRemove = c.teamRead().length;
      c.teamClear();
      const afterClear = c.teamRead().length;
      return { beforeRemove, afterRemove, afterClear };
    });

    expect(result.beforeRemove).toBe(2);
    expect(result.afterRemove).toBe(1);
    expect(result.afterClear).toBe(0);
  });

  test('teamCombinedCerts merges local certs + imported, sorted by date desc', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].teamImport));

    const result = await page.evaluate(() => {
      const c = window['__crl'];
      localStorage.removeItem(c.TEAM_KEY);
      // Inject one local cert + one imported cert.
      const raw = JSON.parse(localStorage.getItem('crl_v2_state') || '{}');
      raw.name = 'Local Lead';
      raw.role = 'Manager';
      raw.certs = [{ at: '2026-05-22', level: 1, score: 85, pass: true }];
      localStorage.setItem('crl_v2_state', JSON.stringify(raw));
      // Reload so state.certs picks up the seeded value.
      location.reload();
    });

    await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].teamImport));

    const out = await page.evaluate(() => {
      const c = window['__crl'];
      c.teamImport({ v: 3, name: 'Tech B', role: 'Inspector', location: 'IL', cards: {}, certs: [{ at: '2026-05-21', level: 2, score: 90, pass: true }] });
      const rows = c.teamCombinedCerts();
      return rows.map(r => ({ staff: r.staff, src: r.src, at: r.at, score: r.score }));
    });

    expect(out.length).toBe(2);
    // sorted desc
    expect(out[0].at).toBe('2026-05-22');
    expect(out[0].src).toBe('local');
    expect(out[0].staff).toBe('Local Lead');
    expect(out[1].at).toBe('2026-05-21');
    expect(out[1].src).toBe('imported');
  });

  test('Manager: Team Roll-Up section appears with empty state + import button', async ({ page }) => {
    await page.goto('/');
    await page.click('#tabs button[data-v="manager"]');
    await page.fill('#mgrPin', 'ROOF123');
    await page.click('#mgrIn');
    await expect(page.locator('#manager')).toContainText(/Team Roll-Up/i);
    await expect(page.locator('#manager')).toContainText(/Each device exports its progress/i);
    await expect(page.locator('label[for="mgrTeamFile"]')).toBeVisible();
    await expect(page.locator('#mgrTeamClear')).toBeDisabled();
  });

  test('Manager: imported device shows in devices table + combined certs table', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].teamImport));

    // Seed an import directly to skip the file-upload dialog.
    await page.evaluate(() => {
      const c = window['__crl'];
      localStorage.removeItem(c.TEAM_KEY);
      c.teamImport({ v: 3, name: 'Field Tech B', role: 'Inspector', location: 'Manteno', cards: {}, certs: [{ at: '2026-05-19', level: 2, levelName: 'Field Roofing Professional', score: 91, pass: true }] });
    });

    await page.click('#tabs button[data-v="manager"]');
    await page.fill('#mgrPin', 'ROOF123');
    await page.click('#mgrIn');

    // Header copy reflects 1 imported device
    await expect(page.locator('#manager')).toContainText(/1 device imported/i);
    // Devices table row
    await expect(page.locator('#manager')).toContainText('Field Tech B');
    await expect(page.locator('#manager')).toContainText('Manteno');
    // Combined certs section
    await expect(page.locator('#manager')).toContainText(/Combined Certifications/i);
    await expect(page.locator('#manager')).toContainText('91%');
    // Remove button works
    await page.click('#manager .mgr-team-rm');
    await expect(page.locator('#manager')).not.toContainText('Field Tech B');
  });
});
