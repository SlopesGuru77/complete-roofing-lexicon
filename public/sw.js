// The Complete Roofing Lexicon — service worker.
// Bump VERSION any time the cached shell changes (HTML, icons, og-cover, manifest).
// Old caches are deleted on activate.
const VERSION = 'crl-2026-05-25-1';

const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/og-cover.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Network-first for the HTML so updates ship immediately; cache-first for
// everything else in the shell + same-origin assets; bypass for Supabase /
// Plausible / qrious / supabase-js (always live, never stale).
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never intercept Supabase API calls or analytics — they need to hit
  // the live server or fail fast.
  const passthrough = [
    'plausible.io',
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com'
  ];
  if (url.origin !== location.origin) {
    // Google Fonts are cache-first (good offline UX, low risk of staleness).
    if (url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com') {
      event.respondWith(cacheFirst(req, 'fonts'));
      return;
    }
    if (passthrough.some(h => url.host.includes(h)) || url.host.endsWith('supabase.zeabur.app') || url.host.endsWith('supabase.co')) {
      return; // let it pass through to network normally
    }
  }

  // Navigation requests: try network, fall back to cached '/'.
  if (req.mode === 'navigate' || (req.headers.get('Accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Same-origin static assets: cache-first.
  event.respondWith(cacheFirst(req, VERSION));
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.ok && res.type !== 'opaque') cache.put(req, res.clone());
    return res;
  } catch (e) {
    return hit || Response.error();
  }
}
