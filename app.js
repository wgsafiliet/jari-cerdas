/* =========================================================
   JARI CERDAS - Antarmuka utama (layar, menu, leaderboard)
   ========================================================= */

"use strict";

const App = {
  deferredInstall: null,

  /* ---------- Navigasi layar ---------- */
  showScreen(name) {
    $$(".screen").forEach(s => s.classList.remove("active"));
    const el = $("#screen-" + name);
    if (el) el.classList.add("active");
    window.scrollTo(0, 0);
    if (name === "board") this.renderBoard();
  },

  /* ---------- Inisialisasi ---------- */
  init() {
    // Maskot & judul
    $("#home-mascot").innerHTML = mascotSVG();
    $("#home-title").textContent = window.CONFIG.APP_NAME;
    $("#home-tagline").textContent = window.CONFIG.APP_TAGLINE;

    // Kartu mode
    const grid = $("#mode-grid");
    grid.innerHTML = "";
    MODE_LIST.forEach(id => grid.appendChild(this.buildModeCard(id)));

    // Profil
    this.renderProfileChip();
    this.renderSyncChip();

    // Suara
    this.updateSoundIcon();
    $("#btn-sound").addEventListener("click", () => {
      const muted = Sound.toggle();
      this.updateSoundIcon();
      if (!muted) Sound.click();
    });

    // Tombol-tombol
    $("#btn-profile").addEventListener("click", () => this.openProfile());
    $("#btn-learn").addEventListener("click", () => { Sound.click(); this.showScreen("learn"); });
    $("#btn-board-home").addEventListener("click", () => { Sound.click(); this.showScreen("board"); });
    $("#btn-back-home-2").addEventListener("click", () => { Sound.click(); this.showScreen("home"); });
    $("#btn-back-home-3").addEventListener("click", () => { Sound.click(); this.showScreen("home"); });
    $("#btn-quit-game").addEventListener("click", () => { Sound.click(); Game.quit(); });
    $("#btn-play-again").addEventListener("click", () => { Sound.click(); Game.start(Game.modeId, Game.level); });
    $("#btn-result-home").addEventListener("click", () => { Sound.click(); this.showScreen("home"); });
    $("#btn-board-refresh").addEventListener("click", () => { Sound.click(); this.renderBoard(true); });
    $("#btn-flush").addEventListener("click", async () => {
      Sound.click();
      if (!Sheets.configured) return toast("Isi URL Apps Script di js/config.js dulu ya.");
      toast("Mengirim data tertunda...");
      await Sheets.flushQueue();
      toast("Sinkronisasi selesai!");
      this.renderBoard(true);
    });

    // Modal profil
    $("#btn-profile-close").addEventListener("click", () => hide($("#modal-profile")));
    $("#btn-profile-save").addEventListener("click", () => this.saveProfile());
    $("#btn-test-conn").addEventListener("click", async () => {
      const st = $("#conn-status");
      st.textContent = "Menguji koneksi...";
      const r = await Sheets.ping();
      st.textContent = r.ok
        ? "Terhubung ke Google Sheets! ( spreadsheet respons OK )"
        : (r.reason === "not-configured"
          ? "Belum dikonfigurasi - isi APPS_SCRIPT_URL di js/config.js (lihat README.md)."
          : "Gagal terhubung. Pastikan deployment Apps Script 'Anyone' dan URL benar.");
    });

    // Demo interaktif trik x9 di layar Belajar
    this.initNineDemo();

    // Ilustrasi statis di layar Belajar
    $("#learn-count-visual").innerHTML = mascotSVG();
    $("#learn-add-visual").innerHTML = addHandsSVG(4, 3);
    $("#learn-alg-visual").innerHTML =
      `<div class="hands-row">${addHandSingle(4)}<span class="plus-sign">+</span>${addHandSingle(5, true, true)}<span class="total-badge">total 9</span></div>`;

    // Pasang PWA
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredInstall = e;
      show($("#btn-install"));
    });
    $("#btn-install").addEventListener("click", async () => {
      if (!this.deferredInstall) return;
      this.deferredInstall.prompt();
      await this.deferredInstall.userChoice;
      this.deferredInstall = null;
      hide($("#btn-install"));
    });

    // Sinkron ulang saat online kembali
    window.addEventListener("online", () => Sheets.flushQueue());

    // Confetti & layar awal
    Confetti.init();
    this.showScreen("home");

    // Service worker (untuk mode offline saat dipasang)
    if ("serviceWorker" in navigator) {
      try { navigator.serviceWorker.register("./sw.js").catch(() => {}); } catch (e) {}
    }
  },

  /* ---------- Kartu mode di beranda ---------- */
  buildModeCard(modeId) {
    const m = MODES[modeId];
    const unlocked = Game.unlockedLevel(modeId);
    const best = Game.progress[modeId] || { bestStars: 0, bestScore: 0 };

    const card = document.createElement("div");
    card.className = "mode-card";
    card.style.setProperty("--mode-color", m.color);

    const pills = [1, 2, 3].map(lv => {
      const open = lv <= unlocked;
      return `<button class="level-pill ${open ? "open" : "locked"}" data-mode="${modeId}" data-lv="${lv}" ${open ? "" : "disabled"}
        aria-label="Level ${lv}${open ? "" : " terkunci"}">
        ${open ? lv : lockSVG(14)}
      </button>`;
    }).join("");

    const starsMini = [1, 2, 3].map(i => starSVG(i <= (best.bestStars || 0), 18)).join("");

    card.innerHTML = `
      <div class="mode-ico">${MODE_ICONS[modeId]}</div>
      <div class="mode-info">
        <div class="mode-name">${m.name} <span class="mode-aud">${m.audience}</span></div>
        <div class="mode-desc">${m.desc}</div>
        <div class="mode-stars">${starsMini}<span class="mode-best">Rekor ${best.bestScore || 0}</span></div>
        <div class="level-pills">${pills}</div>
      </div>`;

    card.querySelectorAll(".level-pill.open").forEach(btn => {
      btn.addEventListener("click", () => {
        Sound.click();
        Game.start(btn.dataset.mode, Number(btn.dataset.lv));
      });
    });
    return card;
  },

  refreshModeCards() {
    const grid = $("#mode-grid");
    grid.innerHTML = "";
    MODE_LIST.forEach(id => grid.appendChild(this.buildModeCard(id)));
  },

  /* ---------- Profil ---------- */
  renderProfileChip() {
    const p = Store.get("profile", { nama: "", kelas: "" });
    $("#profile-name").textContent = p.nama || "Isi nama dulu";
    $("#profile-class").textContent = p.kelas || "TK/SD";
    $("#input-nama").value = p.nama || "";
    $("#input-kelas").value = p.kelas || "";
  },
  openProfile() {
    Sound.click();
    this.renderProfileChip();
    this.renderSyncChip();
    show($("#modal-profile"));
  },
  saveProfile() {
    const nama = $("#input-nama").value.trim().slice(0, 24);
    const kelas = $("#input-kelas").value;
    Store.set("profile", { nama, kelas });
    this.renderProfileChip();
    hide($("#modal-profile"));
    Sound.correct();
    toast(nama ? "Hai, " + nama + "! Profil disimpan." : "Profil disimpan.");
  },
  renderSyncChip() {
    const chip = $("#sync-chip");
    if (Sheets.configured) {
      chip.textContent = "Google Sheets: terhubung";
      chip.className = "sync-chip ok";
    } else {
      chip.textContent = "Mode perangkat: skor disimpan lokal";
      chip.className = "sync-chip warn";
    }
  },

  updateSoundIcon() {
    $("#btn-sound").innerHTML = Sound.muted ? soundOffSVG() : soundOnSVG();
    $("#btn-sound").setAttribute("aria-label", Sound.muted ? "Nyalakan suara" : "Matikan suara");
  },

  /* ---------- Layar Belajar: demo trik x9 ---------- */
  initNineDemo() {
    const wrap = $("#nine-demo");
    let sel = 4;
    const render = () => {
      const hasil = 9 * sel;
      wrap.innerHTML = `
        <div class="nine-chooser">${[1,2,3,4,5,6,7,8,9,10].map(n =>
          `<button class="nine-btn ${n === sel ? "sel" : ""}" data-n="${n}">${n}</button>`).join("")}
        </div>
        ${nineFingersSVG(sel)}
        <p class="nine-explain">Tekuk jari ke-<b>${sel}</b>. Kiri tinggal <b>${sel - 1}</b> jari (= ${sel - 1} puluhan),
        kanan tinggal <b>${10 - sel}</b> jari (= ${10 - sel} satuan) &rarr; 9 &times; ${sel} = <b>${hasil}</b>.</p>`;
      wrap.querySelectorAll(".nine-btn").forEach(b =>
        b.addEventListener("click", () => { sel = Number(b.dataset.n); Sound.click(); render(); }));
    };
    render();
  },

  /* ---------- Papan skor ---------- */
  async renderBoard(force) {
    const listEl = $("#board-list");
    const statusEl = $("#board-status");
    listEl.innerHTML = `<div class="board-loading">Memuat papan skor...</div>`;
    if (force && Sheets.configured) await Sheets.flushQueue();

    const res = await Sheets.leaderboard(20);
    if (res.source === "sheets") {
      statusEl.textContent = "Data langsung dari Google Sheets.";
      statusEl.className = "board-status ok";
    } else if (Sheets.configured) {
      statusEl.textContent = "Tidak bisa menghubungi Google Sheets - ini data perangkat ini.";
      statusEl.className = "board-status warn";
    } else {
      statusEl.textContent = "Google Sheets belum dihubungkan - ini peringkat lokal perangkat ini.";
      statusEl.className = "board-status warn";
    }

    const rows = res.rows || [];
    if (!rows.length) {
      listEl.innerHTML = `<div class="board-loading">Belum ada skor. Mainkan dulu satu sesi, ya!</div>`;
      return;
    }
    const medal = ["#FFC93C", "#C9CDD4", "#E8A16B"];
    listEl.innerHTML = rows.map((r, i) => `
      <div class="board-row ${i < 3 ? "podium" : ""}">
        <span class="board-rank" style="${i < 3 ? "background:" + medal[i] : ""}">${i + 1}</span>
        <span class="board-name">${escapeHTML(r.nama || "Anak Hebat")}<small>${escapeHTML(r.kelas && r.kelas !== "-" ? r.kelas : "")} · ${escapeHTML(modeShort(r.mode))} Lv ${r.level ?? "-"}</small></span>
        <span class="board-score">${r.skor ?? 0}<small>skor</small></span>
      </div>`).join("");

    const pending = Store.get(Sheets.QUEUE_KEY, []);
    const flushRow = $("#board-flush");
    if (pending.length && Sheets.configured) {
      flushRow.textContent = pending.length + " skor menunggu dikirim. Tekan tombol sinkron di atas.";
      show(flushRow);
    } else hide(flushRow);
  }
};

function modeShort(modeId) {
  return MODES[modeId] ? MODES[modeId].name : modeId || "-";
}
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function lockSVG(size = 16) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="3" fill="#B9AFA4"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#B9AFA4" stroke-width="2.6"/></svg>`;
}
function soundOnSVG() {
  return `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="#7A5A3A"/><path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a9 9 0 0 1 0 13" fill="none" stroke="#7A5A3A" stroke-width="2" stroke-linecap="round"/></svg>`;
}
function soundOffSVG() {
  return `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="#B9AFA4"/><path d="M16 9l6 6M22 9l-6 6" fill="none" stroke="#B9AFA4" stroke-width="2.4" stroke-linecap="round"/></svg>`;
}

/* Jalankan aplikasi */
document.addEventListener("DOMContentLoaded", () => App.init());
