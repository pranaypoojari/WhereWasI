/* WhereWasI service worker — offline reading for previously opened recaps & story-books.
 *
 * Strategy
 *  - /_next/static/*, fonts, icons ........ cache-first (content-hashed, immutable)
 *  - page navigations ...................... network-first, fall back to the cached copy, then /offline.html
 *  - POST /api/generate .................... network-first, cached under a synthetic GET key built from
 *                                            the request body so generated story-books also open offline
 *  - everything else ....................... untouched (straight to network)
 */
const VERSION = 'wherewasi-v1';
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const DATA_CACHE = `${VERSION}-data`;
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/icon.svg', '/manifest.webmanifest'];
const MAX_PAGES = 40;
const MAX_DATA = 40;
const MAX_STATIC = 200;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  await Promise.all(keys.slice(0, keys.length - max).map((key) => cache.delete(key)));
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
    trimCache(STATIC_CACHE, MAX_STATIC);
  }
  return response;
}

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(PAGE_CACHE);
      cache.put(request, response.clone());
      trimCache(PAGE_CACHE, MAX_PAGES);
    }
    return response;
  } catch {
    const cache = await caches.open(PAGE_CACHE);
    // Exact URL first (same checkpoint), then any cached copy of the same show page.
    const cached = (await cache.match(request)) || (await cache.match(request, { ignoreSearch: true }));
    return cached || (await caches.match(OFFLINE_URL)) || Response.error();
  }
}

async function generateDataKey(request) {
  try {
    const body = await request.clone().json();
    const params = new URLSearchParams({
      title: String(body.title || '').trim().toLowerCase(),
      type: String(body.type || 'tv'),
      season: String(Number(body.season) || 1),
      episode: String(Number(body.episode) || 1)
    });
    return new Request(`${self.location.origin}/__offline__/generate?${params.toString()}`);
  } catch {
    return null;
  }
}

async function networkFirstGenerate(request) {
  const key = await generateDataKey(request);
  try {
    const response = await fetch(request);
    if (response.ok && key) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(key, response.clone());
      trimCache(DATA_CACHE, MAX_DATA);
    }
    return response;
  } catch (err) {
    const cached = key ? await caches.match(key) : null;
    if (cached) return cached;
    return new Response(
      JSON.stringify({ success: false, error: "You're offline and this story guide hasn't been saved yet." }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.method === 'POST' && url.pathname === '/api/generate') {
    event.respondWith(networkFirstGenerate(request));
    return;
  }

  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/webpack-hmr')) return;

  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image') ||
    /\.(?:woff2?|svg|png|jpg|jpeg|webp|ico)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Full page loads only; client-side RSC fetches fall back to a hard navigation when offline,
  // which then lands here.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
  }
});
