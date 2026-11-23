/* =========================================================
   JARI CERDAS - Koneksi ke Google Sheets (via Apps Script)
   ---------------------------------------------------------
   Database memakai Google Spreadsheet yang dihubungkan
   lewat Google Apps Script Web App (lihat apps-script/Code.gs
   dan README.md untuk cara settingnya).

   - Simpan skor  : POST JSON (content-type text/plain agar
                    tidak memicu CORS preflight)
   - Leaderboard  : GET ?action=leaderboard
   Jika URL belum diisi / offline, semua data disimpan di
   perangkat (localStorage) dan dikirim saat online kembali.
   ========================================================= */

"use strict";

const Sheets = {
  QUEUE_KEY: "pendingScores",

  get configured() {
    const url = window.CONFIG.APPS_SCRIPT_URL;
    return typeof url === "string" && url.indexOf("https://script.google.com/") === 0;
  },

  /* ---------- Simpan skor ---------- */
  async saveScore(record) {
    // 1) Selalu simpan riwayat lokal
    const local = Store.get("localScores", []);
    local.push(Object.assign({ waktu: new Date().toISOString() }, record));
    while (local.length > 100) local.shift();
    Store.set("localScores", local);

    // 2) Jika belum dikonfigurasi, antrekan untuk sinkron nanti
    if (!this.configured) {
      this.enqueue(record);
      return { ok: false, reason: "not-configured" };
    }

    // 3) Coba kirim langsung + flush antrean lama
    const sent = await this.post({ action: "save", data: record });
    if (sent.ok) {
      await this.flushQueue();
      return { ok: true };
    }
    this.enqueue(record);
    return { ok: false, reason: sent.reason || "network" };
  },

  enqueue(record) {
    const q = Store.get(this.QUEUE_KEY, []);
    q.push(record);
    while (q.length > 200) q.shift();
    Store.set(this.QUEUE_KEY, q);
  },

  async flushQueue() {
    if (!this.configured) return;
    const q = Store.get(this.QUEUE_KEY, []);
    if (!q.length) return;
    const sisa = [];
    for (const item of q) {
      const r = await this.post({ action: "save", data: item });
      if (!r.ok) sisa.push(item);
    }
    Store.set(this.QUEUE_KEY, sisa);
  },

  async post(payload) {
    try {
      const res = await fetch(window.CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        redirect: "follow"
      });
      const json = await res.json().catch(() => null);
      if (json && json.ok) return { ok: true };
      return { ok: false, reason: "response" };
    } catch (e) {
      return { ok: false, reason: "network" };
    }
  },

  /* ---------- Leaderboard ---------- */
  async leaderboard(limit) {
    limit = limit || 20;
    if (this.configured) {
      try {
        const url = window.CONFIG.APPS_SCRIPT_URL +
          "?action=leaderboard&limit=" + limit +
          "&t=" + Date.now();
        const res = await fetch(url, { redirect: "follow" });
        const json = await res.json();
        if (json && json.ok && Array.isArray(json.rows)) {
          Store.set("lastBoard", { rows: json.rows, waktu: Date.now() });
          return { ok: true, rows: json.rows, source: "sheets" };
        }
      } catch (e) { /* lanjut ke data lokal */ }
    }
    return { ok: false, rows: this.localLeaderboard(limit), source: "local" };
  },

  /* Peringkat dari data perangkat (mode offline / preview) */
  localLeaderboard(limit) {
    const all = Store.get("localScores", []);
    const best = {};
    for (const r of all) {
      const key = r.nama || "Anak Hebat";
      if (!best[key] || (r.skor || 0) > (best[key].skor || 0)) {
        best[key] = r;
      }
    }
    return Object.values(best)
      .sort((a, b) => (b.skor || 0) - (a.skor || 0))
      .slice(0, limit);
  },

  /* Cek koneksi ke Apps Script (dipakai tombol "Tes Koneksi") */
  async ping() {
    if (!this.configured) return { ok: false, reason: "not-configured" };
    try {
      const res = await fetch(window.CONFIG.APPS_SCRIPT_URL + "?action=ping&t=" + Date.now(), { redirect: "follow" });
      const json = await res.json();
      return { ok: !!(json && json.ok), reason: json && json.ok ? null : "response" };
    } catch (e) {
      return { ok: false, reason: "network" };
    }
  }
};
