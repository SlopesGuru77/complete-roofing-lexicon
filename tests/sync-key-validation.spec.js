// @ts-check
const { test, expect } = require('@playwright/test');

// sbParseAnonKey is the client-side JWT decode that catches common paste
// mistakes (truncation, accidental service_role, expired key) before they
// reach Supabase. These cases should NEVER regress — they were a real footgun
// resolved in commit 37456ca.

const cases = [
  { name: 'empty',         key: '',                                                                                                                                                              expectOk: false, expectMsgRe: /empty/i },
  { name: 'not a JWT',     key: 'not-a-jwt',                                                                                                                                                      expectOk: false, expectMsgRe: /3 dot/i },
  { name: 'malformed b64', key: 'aaa.!!!.ccc',                                                                                                                                                    expectOk: false, expectMsgRe: /base64|payload/i },
  // payload `{"role":"service_role"}` base64url (no padding)
  { name: 'service_role',  key: 'h.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.s',                                                                                                                            expectOk: false, expectMsgRe: /service_role|never/i },
  // payload `{"role":"anon"}` base64url
  { name: 'valid anon',    key: 'h.eyJyb2xlIjoiYW5vbiJ9.s',                                                                                                                                       expectOk: true,  expectMsgRe: null },
  // payload `{"role":"anon","exp":1}` — exp in 1970, far expired
  { name: 'expired anon',  key: 'h.eyJyb2xlIjoiYW5vbiIsImV4cCI6MX0.s',                                                                                                                            expectOk: false, expectMsgRe: /expired/i },
  // payload `{"role":"authenticated"}` — wrong role
  { name: 'wrong role',    key: 'h.eyJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.s',                                                                                                                           expectOk: false, expectMsgRe: /Unexpected role/i }
];

test('sbParseAnonKey: all input variants return correct verdict', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => !!(window['__crl'] && window['__crl'].sbParseAnonKey));

  for (const c of cases) {
    const result = await page.evaluate(k => window['__crl'].sbParseAnonKey(k), c.key);
    if (c.expectOk) {
      expect(result.ok, `${c.name}: should be ok, got ${JSON.stringify(result)}`).toBe(true);
    } else {
      expect(result.ok, `${c.name}: should NOT be ok, got ${JSON.stringify(result)}`).toBe(false);
      if (c.expectMsgRe) expect(result.msg, `${c.name}: msg mismatch`).toMatch(c.expectMsgRe);
    }
  }
});

test('sbCleanKey strips all whitespace (including internal)', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => window['__crl'].sbCleanKey(' a b\nc\td\r '));
  expect(result).toBe('abcd');
});
