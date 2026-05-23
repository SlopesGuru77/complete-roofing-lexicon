// @ts-check
const { test, expect } = require('@playwright/test');

// Every tab in VIEWS should render an h-sec or the masthead title without
// JS errors. Catches accidental syntax breaks in the 2,300-line single file.
const VIEWS = [
  ['overview',  /Overview|Welcome/i],
  ['lexicon',   /Lexicon/i],
  ['flash',     /Flashcards/i],
  ['quiz',      /Quiz/i],
  ['scenarios', /Scenarios/i],
  ['compat',    /Compatibility/i],
  ['hail',      /Hail/i],
  ['owner',     /Plain English/i],
  ['report',    /Report|Estimate/i],
  ['certify',   /Certification|Credential|Lexicon/i],
  ['profile',   /Profile/i],
  ['manager',   /Manager|Sign-?In/i],
  ['about',     /About|Reference|Colophon/i]
];

test.describe('smoke — every view renders without console errors', () => {
  for (const [view, marker] of VIEWS) {
    test(`view: ${view}`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

      await page.goto('/');
      await page.waitForFunction(() => !!document.getElementById('tabs')?.children.length);
      await page.click(`#tabs button[data-v="${view}"]`);
      // Each view either renders an h-sec OR (overview) a curriculum panel.
      await expect(page.locator(`#${view}`)).toBeVisible();
      const text = await page.locator(`#${view}`).innerText();
      expect(text, `view ${view} should contain text matching ${marker}`).toMatch(marker);

      // Filter out CDN-block noise unrelated to our code.
      const real = errors.filter(e => !/qrious|plausible|supabase|net::ERR|Failed to load resource/i.test(e));
      expect(real, `view ${view} should have no JS errors. Got: ${real.join(' | ')}`).toEqual([]);
    });
  }
});
