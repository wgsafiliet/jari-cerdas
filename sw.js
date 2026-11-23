/* =========================================================
   JARI CERDAS - Service Worker (agar aplikasi bisa offline)
   ========================================================= */

"use strict";

const CACHE_NAME = "jari-cerdas-1file-v1";

/* Semua berkas inti aplikasi */
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest"
];

/* Pasang: simpan semua berkas inti */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

/* Aktifkan: bersihkan cache versi lama */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Strategi: cache dulu, jika tidak ada ambil dari jaringan.
   Permintaan ke Google Sheets (lintas domain) tidak dibaca dari cache. */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        // Fallback navigasi ke halaman utama saat offline
        if (req.mode === "navigate") return caches.match("./index.html");
        return Response.error();
      });
    })
  );
});
