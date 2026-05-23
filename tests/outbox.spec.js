// @ts-check
const { test, expect } = require('@playwright/test');

// Outbox guarantees: rows added while offline survive a reload, get retried
// when the page regains connectivity, and are dropped only after 8 failed
// attempts.

test.describe('outbox: offline queue + retry semantics', () => {
  test('outboxPush appends and outboxRead returns the queue', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].outboxPush));

    const result = await page.evaluate(() => {
      // Start clean.
      localStorage.removeItem(window['__crl'].OUTBOX_KEY);
      const before = window['__crl'].outboxRead();
      window['__crl'].outboxPush('progress', { staff_name: 'test-A', event_type: 'unit_test' });
      window['__crl'].outboxPush('certifications', { staff_name: 'test-B', level: 'L1' });
      const after = window['__crl'].outboxRead();
      const pending = window['__crl'].outboxPending();
      return { before: before.length, after: after.length, pending, firstTable: after[0]?.table, secondTable: after[1]?.table };
    });

    expect(result.before).toBe(0);
    expect(result.after).toBe(2);
    expect(result.pending).toBe(2);
    expect(result.firstTable).toBe('progress');
    expect(result.secondTable).toBe('certifications');
  });

  test('queue survives reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].outboxPush));

    await page.evaluate(() => {
      localStorage.removeItem(window['__crl'].OUTBOX_KEY);
      window['__crl'].outboxPush('progress', { staff_name: 'persistence-test' });
    });

    await page.reload();
    await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].outboxPending));

    const pending = await page.evaluate(() => window['__crl'].outboxPending());
    expect(pending).toBe(1);
  });

  test('outboxFlush returns skipped when sync disabled', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].outboxFlush));

    const result = await page.evaluate(async () => {
      localStorage.removeItem(window['__crl'].OUTBOX_KEY);
      window['__crl'].outboxPush('progress', { staff_name: 'no-sync-test' });
      // Sync is disabled by default — outboxFlush should refuse and report it.
      const r = await window['__crl'].outboxFlush();
      return { ...r, pending: window['__crl'].outboxPending() };
    });

    expect(result.flushed).toBe(0);
    expect(result.remaining).toBeGreaterThanOrEqual(1);
    expect(result.skipped).toMatch(/sync disabled/i);
    expect(result.pending).toBe(1); // still queued, not dropped
  });

  test('sbInsert queues when sync enabled but client unavailable', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].sbInsert));

    const result = await page.evaluate(async () => {
      localStorage.removeItem(window['__crl'].OUTBOX_KEY);
      // Simulate a configured-but-broken sync target: enabled flag on,
      // but URL is a non-resolving placeholder so the client can't connect.
      const raw = JSON.parse(localStorage.getItem('crl_v2_state') || '{}');
      raw.prefs = raw.prefs || {};
      raw.prefs.supabase = {
        url: 'https://nope.invalid.localhost.example',
        anonKey: 'h.eyJyb2xlIjoiYW5vbiJ9.s',
        enabled: true,
        schemaPrefix: 'roofing_training_'
      };
      localStorage.setItem('crl_v2_state', JSON.stringify(raw));
      location.reload();
    });

    await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].sbInsert));

    // With network blocked to the bogus host, sbInsert should still resolve
    // (queued=true) rather than throw. The queue's bound to grow.
    const after = await page.evaluate(async () => {
      const r = await window['__crl'].sbInsert('progress', { staff_name: 'queue-on-failure', event_type: 'test' });
      return { ok: r.ok, queued: r.queued || false, pending: window['__crl'].outboxPending() };
    });

    // Two acceptable outcomes: (a) network/DNS fails fast → queued.
    // (b) client construction fails → queued.
    // Both must NOT throw and MUST leave the row in the outbox for retry.
    expect(after.pending).toBeGreaterThanOrEqual(1);
  });
});
