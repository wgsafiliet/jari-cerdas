/* Service worker Si Jari Pintar: bisa dipakai tanpa internet.
   Naikkan VERSI setiap kali index.html diubah agar pembaruan sampai ke HP. */
const VERSI = 'jari-pintar-v1';
const INTI = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSI).then(c => c.addAll(INTI)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSI).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // POST ke Google Sheets tidak disentuh
  const url = new URL(req.url);
  if (url.hostname === 'script.google.com' || url.hostname === 'script.googleusercontent.com') return; // data peringkat selalu terbaru

  // Halaman: coba jaringan dulu, jika offline pakai cache
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => { caches.open(VERSI).then(c => c.put('./index.html', r.clone())); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Aset lain (ikon, font): cache dulu, lalu simpan hasil jaringan
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const salin = r.clone(); caches.open(VERSI).then(c => c.put(req, salin)); }
      return r;
    }).catch(() => hit))
  );
});
