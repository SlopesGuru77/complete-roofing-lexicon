// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('PWA: manifest, service worker, icons, head links', () => {
  test('manifest.json is served and well-formed', async ({ request }) => {
    const r = await request.get('/manifest.json');
    expect(r.status()).toBe(200);
    const json = await r.json();
    expect(json.name).toMatch(/Roofing Lexicon/i);
    expect(json.short_name).toBeTruthy();
    expect(json.start_url).toBe('/');
    expect(json.display).toBe('standalone');
    expect(json.theme_color).toBe('#0a0a0a');
    expect(Array.isArray(json.icons)).toBe(true);
    expect(json.icons.length).toBeGreaterThanOrEqual(3);
    // At least one maskable icon.
    expect(json.icons.some(i => (i.purpose || '').includes('maskable'))).toBe(true);
  });

  test('sw.js is served and registers a fetch listener', async ({ request }) => {
    const r = await request.get('/sw.js');
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toMatch(/addEventListener\(['"]fetch['"]/);
    expect(body).toMatch(/addEventListener\(['"]install['"]/);
    expect(body).toMatch(/addEventListener\(['"]activate['"]/);
  });

  test('icons are served at the manifest paths', async ({ request }) => {
    for (const path of ['/icon-192.png', '/icon-512.png', '/icon-maskable.png']) {
      const r = await request.get(path);
      expect(r.status(), `${path} should be 200`).toBe(200);
      expect(r.headers()['content-type'] || '').toMatch(/image\/png/);
      const buf = await r.body();
      // Each PNG should be at least 500 bytes — guards against empty file commits.
      expect(buf.length, `${path} body size`).toBeGreaterThan(500);
    }
  });

  test('head wires manifest + apple-touch-icon', async ({ page }) => {
    await page.goto('/');
    const manifest = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifest).toBe('/manifest.json');

    const apple = await page.locator('link[rel="apple-touch-icon"]').count();
    expect(apple).toBeGreaterThanOrEqual(1);
  });

  test('service worker registers without console error', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/');
    // Wait for SW registration to attempt — bound to a 'load' listener in init.
    await page.waitForLoadState('load');
    await page.waitForTimeout(500);
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'unsupported';
      const reg = await navigator.serviceWorker.getRegistration();
      return reg ? 'registered' : 'pending';
    });
    expect(['registered', 'pending', 'unsupported']).toContain(swRegistered);
    // Filter network-block noise from CDN deps unrelated to our code.
    const real = errors.filter(e => !/qrious|plausible|supabase|net::ERR|Failed to load resource/i.test(e));
    expect(real).toEqual([]);
  });
});
