// @ts-check
const { test, expect } = require('@playwright/test');

// Regression test for the L1 distractor bug — the original code drew distractors
// from the full TERMS list, so Apprentice exams could surface forensic-tier-3
// wrong answers. Fix: distractors drawn from the tier-filtered pool.

test('L1 buildCert distractors are all tier ≤ 1', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].buildCert && window['__crl'].TERMS));

  // Run buildCert(1) many times in the browser, collect every distractor term,
  // and verify all of them sit at tier 1. We expose the data already lives on
  // window via the closure-free top-level `TERMS` and `LEVELS` consts in the script.
  const result = await page.evaluate(() => {
    // The script runs at <script> in the body, so TERMS/LEVELS/buildCert are
    // window-accessible. Defensive lookup in case the bundle is ever reshaped.
    const TERMS  = window['__crl'].TERMS;
    const build  = window['__crl'].buildCert;
    if (!TERMS || !build) return { ok: false, msg: 'TERMS or buildCert not on window' };

    const tierByTerm = new Map(TERMS.map(t => [t.t, t.tier || 1]));
    const violations = [];
    let inspected = 0;

    for (let run = 0; run < 25; run++) {
      const qs = build(1);
      for (const q of qs) {
        // Only term-type questions have distractors; scenario/compat opts are
        // strings that don't appear in TERMS, so filter on membership.
        for (const opt of q.opts) {
          if (!tierByTerm.has(opt.t)) continue;
          const tier = tierByTerm.get(opt.t);
          inspected++;
          if (tier > 1) violations.push({ run, term: opt.t, tier });
        }
      }
    }
    return { ok: true, inspected, violations };
  });

  expect(result.ok, result['msg'] || '').toBe(true);
  expect(result.inspected, 'should have inspected many distractors').toBeGreaterThan(100);
  expect(result.violations, `Found tier-2+ distractors in L1 exam: ${JSON.stringify(result.violations).slice(0, 500)}`).toEqual([]);
});

test('L2 distractors are all tier ≤ 2', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].buildCert));

  const result = await page.evaluate(() => {
    const TERMS = window['__crl'].TERMS;
    const build = window['__crl'].buildCert;
    const tierByTerm = new Map(TERMS.map(t => [t.t, t.tier || 1]));
    const violations = [];
    for (let run = 0; run < 25; run++) {
      const qs = build(2);
      for (const q of qs) for (const opt of q.opts) {
        if (!tierByTerm.has(opt.t)) continue;
        const tier = tierByTerm.get(opt.t);
        if (tier > 2) violations.push({ run, term: opt.t, tier });
      }
    }
    return { violations };
  });

  expect(result.violations, `Found tier-3 distractors in L2 exam: ${JSON.stringify(result.violations).slice(0, 500)}`).toEqual([]);
});
