// Service worker: simpan semua fail supaya app boleh dibuka tanpa internet.
const CACHE = 'sks-photobooth-v1';
const FAIL = ['./', 'index.html', 'style.css', 'app.js', 'config.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'frames/ungu-potret.webp', 'frames/ungu-landskap.webp', 'frames/biru-potret.webp', 'frames/biru-landskap.webp'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FAIL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;   // jangan sentuh muat naik ke Google
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => {
    const rangkaian = fetch(r).then(res => {
      if (res.ok) { const salin = res.clone(); caches.open(CACHE).then(c => c.put(r, salin)); }
      return res;
    }).catch(() => hit);
    return hit || rangkaian;
  }));
});
