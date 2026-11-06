// Service worker: keeps the whole app on the device so it opens offline after the first visit.
// The version and the file list below are filled in by scripts/build-web.js (the version changes whenever any file
// changes, so browsers pick up an update by themselves).
const CACHE = 'pragmatics-adab-0.9.4-9b1b26be';
const FILES = [
 "./",
 "./app.js",
 "./assets/icon.png",
 "./assets/logo.svg",
 "./assets/u9-workflow.png",
 "./boot.js",
 "./content.js",
 "./fonts/LICENSE",
 "./fonts/amiri-arabic-400-normal.woff2",
 "./fonts/amiri-arabic-700-normal.woff2",
 "./fonts/noto-sans-latin-400-italic.woff2",
 "./fonts/noto-sans-latin-400-normal.woff2",
 "./fonts/noto-sans-latin-600-normal.woff2",
 "./fonts/noto-sans-latin-700-normal.woff2",
 "./fonts/noto-sans-latin-ext-400-italic.woff2",
 "./fonts/noto-sans-latin-ext-400-normal.woff2",
 "./fonts/noto-sans-latin-ext-600-normal.woff2",
 "./fonts/noto-sans-latin-ext-700-normal.woff2",
 "./fonts/noto-serif-latin-400-italic.woff2",
 "./fonts/noto-serif-latin-400-normal.woff2",
 "./fonts/noto-serif-latin-600-italic.woff2",
 "./fonts/noto-serif-latin-600-normal.woff2",
 "./fonts/noto-serif-latin-700-italic.woff2",
 "./fonts/noto-serif-latin-700-normal.woff2",
 "./fonts/noto-serif-latin-ext-400-italic.woff2",
 "./fonts/noto-serif-latin-ext-400-normal.woff2",
 "./fonts/noto-serif-latin-ext-600-italic.woff2",
 "./fonts/noto-serif-latin-ext-600-normal.woff2",
 "./fonts/noto-serif-latin-ext-700-italic.woff2",
 "./fonts/noto-serif-latin-ext-700-normal.woff2",
 "./fonts.css",
 "./icons/icon-192.png",
 "./icons/icon-512.png",
 "./icons/icon-maskable-192.png",
 "./icons/icon-maskable-512.png",
 "./index.html",
 "./instructor.enc.js",
 "./manifest.webmanifest",
 "./pillars.js",
 "./pwa.js",
 "./style.css",
 "./x-framework.js",
 "./x-info.js",
 "./x-journal.js",
 "./x-practice.js",
 "./x-ribbon.js",
 "./x-snippets.js",
 "./x-welcome.js"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('pragmatics-adab-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit ||
      fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
  );
});
