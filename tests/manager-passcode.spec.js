// @ts-check
const { test, expect } = require('@playwright/test');

test('Manager: wrong passcode shows error, right passcode unlocks dashboard', async ({ page }) => {
  await page.goto('/');
  await page.click('#tabs button[data-v="manager"]');
  await expect(page.locator('#manager')).toContainText(/Manager Sign-?In/i);

  // Wrong pin
  await page.fill('#mgrPin', 'WRONG');
  await page.click('#mgrIn');
  await expect(page.locator('#mgrPinMsg')).toContainText(/Wrong passcode/i);

  // Correct default pin
  await page.fill('#mgrPin', 'ROOF123');
  await page.click('#mgrIn');
  await expect(page.locator('#manager')).toContainText(/Manager Dashboard|Local Roll-?Up/i);
  await expect(page.locator('#manager')).toContainText(/Sync Settings/i);
});

test('Manager: Sign Out re-locks', async ({ page }) => {
  await page.goto('/');
  await page.click('#tabs button[data-v="manager"]');
  await page.fill('#mgrPin', 'ROOF123');
  await page.click('#mgrIn');
  await expect(page.locator('#manager')).toContainText(/Sync Settings/i);
  await page.click('#mgrOut');
  await expect(page.locator('#manager')).toContainText(/Enter Passcode/i);
});
