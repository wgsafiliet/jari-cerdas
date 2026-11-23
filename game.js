/* =========================================================
   JARI CERDAS - Mesin permainan (sesi, soal, skor, bintang)
   ========================================================= */

"use strict";

/* Lencana pencapaian */
const BADGES = [
  { id: "first",      name: "Langkah Pertama",  desc: "Selesaikan sesi permainan pertamamu" },
  { id: "star_hitung",  name: "Penghitung Jago",  desc: "Raih 3 bintang di Hitung Jari" },
  { id: "star_jumlah",  name: "Jago Jumlah",      desc: "Raih 3 bintang di Jumlah Cepat" },
  { id: "star_kali",    name: "Tuan Sembilan",    desc: "Raih 3 bintang di Trik Jari kali 9" },
  { id: "star_aljabar", name: "Detektif Angka",   desc: "Raih 3 bintang di Aljabar Jari" },
  { id: "streak10",   name: "Api Semangat",     desc: "Jawab benar 10 kali berturut-turut" },
  { id: "stars15",    name: "Kolektor Bintang", desc: "Kumpulkan total 15 bintang" },
  { id: "level3",     name: "Penakluk Level",   desc: "Tamatkan level 3 di mode apa pun" }
];

const Game = {
  modeId: null,
  mode: null,
  level: 1,
  qIndex: 0,
  total: 10,
  score: 0,
  streak: 0,
  bestStreak: 0,
  correct: 0,
  current: null,
  timerId: null,
  timeLeft: 0,
  timeTotal: 0,

  get progress() { return Store.get("progress", {}); },

  unlockedLevel(modeId) {
    const p = this.progress[modeId];
    return p ? Math.min(3, p.unlocked || 1) : 1;
  },

  /* ---------- Mulai sesi ---------- */
  start(modeId, level) {
    this.modeId = modeId;
    this.mode = MODES[modeId];
    this.level = Math.max(1, Math.min(3, level || this.unlockedLevel(modeId)));
    this.qIndex = 0;
    this.total = window.CONFIG.QUESTIONS_PER_SESSION;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.correct = 0;
    App.showScreen("game");
    $("#game-topbar").style.setProperty("--mode-color", this.mode.color);
    document.documentElement.style.setProperty("--mode-color", this.mode.color);
    $("#mode-label").textContent = this.mode.name + " · Lv " + this.level;
    this.nextQuestion();
  },

  /* ---------- Muat soal berikutnya ---------- */
  nextQuestion() {
    this.qIndex++;
    if (this.qIndex > this.total) return this.endSession();
    this.current = this.mode.make(this.level, this.qIndex);
    this.renderHUD();
    this.renderQuestion();
    this.startTimer();
  },

  renderHUD() {
    $("#hud-score").textContent = this.score;
    $("#hud-streak").textContent = "x" + this.streak;
    $("#hud-qcount").textContent = "Soal " + this.qIndex + "/" + this.total + " · " + this.mode.levels[this.level - 1];
    const combo = $("#hud-combo");
    if (this.streak >= 3) { combo.textContent = "Combo!"; show(combo); }
    else hide(combo);
  },

  renderQuestion() {
    const q = this.current;
    $("#question-visual").innerHTML = q.visualHTML;
    $("#question-equation").innerHTML = q.equationHTML;
    $("#question-text").textContent = q.questionText;
    $("#question-hint").textContent = q.hint || "";

    const wrap = $("#options");
    wrap.innerHTML = "";
    q.options.forEach((val) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = val;
      btn.setAttribute("aria-label", "jawaban " + val);
      btn.addEventListener("click", () => this.answer(val, btn));
      wrap.appendChild(btn);
    });
  },

  /* ---------- Timer ---------- */
  startTimer() {
    this.stopTimer();
    this.timeTotal = (window.CONFIG.TIME_PER_LEVEL[this.modeId] || [20, 20, 20])[this.level - 1] || 20;
    this.timeLeft = this.timeTotal;
    this.paintTimer();
    const t0 = Date.now();
    this.timerId = setInterval(() => {
      this.timeLeft = Math.max(0, this.timeTotal - (Date.now() - t0) / 1000);
      this.paintTimer();
      if (this.timeLeft <= 0) { this.stopTimer(); this.answer(null, null, true); }
    }, 100);
  },
  stopTimer() {
    if (this.timerId) { clearInterval(this.timerId); this.timerId = null; }
  },
  paintTimer() {
    const fill = $("#timer-fill");
    const pct = (this.timeLeft / this.timeTotal) * 100;
    fill.style.width = pct + "%";
    fill.classList.toggle("low", pct < 30);
  },

  /* ---------- Jawab ---------- */
  answer(val, btnEl, timeout) {
    if (!this.current) return;
    this.stopTimer();
    const q = this.current;
    const buttons = $$("#options .option-btn");
    buttons.forEach(b => b.disabled = true);

    const right = val === q.answer;
    const overlay = $("#feedback");
    const card = $("#feedback-card");

    if (right) {
      const speed = this.timeLeft / this.timeTotal;
      const bonus = Math.round(speed * 10);
      const mult = this.streak >= 3 ? 1.5 : 1;
      const gained = Math.round((10 + bonus) * mult);
      this.score += gained;
      this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      this.correct++;
      if (btnEl) btnEl.classList.add("correct");
      Sound.correct();
      Confetti.burst(60);
      card.className = "feedback-card ok";
      card.innerHTML = `
        <div class="feedback-title">Hebat! +${gained}${this.streak >= 3 ? " (combo x" + this.streak + ")" : ""}</div>
        <div class="feedback-body">${q.explain}</div>`;
      show(overlay);
      this.renderHUD();
    } else {
      this.streak = 0;
      buttons.forEach(b => {
        if (Number(b.textContent) === q.answer) b.classList.add("correct");
      });
      if (btnEl) btnEl.classList.add("wrong");
      Sound.wrong();
      card.className = "feedback-card no";
      card.innerHTML = `
        <div class="feedback-title">${timeout ? "Waktu habis!" : "Belum tepat"}</div>
        <div class="feedback-body">Jawaban: <b>${q.answer}</b>. ${q.explain}</div>`;
      show(overlay);
      this.renderHUD();
    }

    setTimeout(() => {
      hide(overlay);
      card.className = "feedback-card";
      this.current = null;
      this.nextQuestion();
    }, right ? 1500 : 2200);
  },

  /* ---------- Akhir sesi ---------- */
  endSession() {
    this.stopTimer();
    const ratio = this.correct / this.total;
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.5 ? 1 : 0;

    // Perbarui progres & buka level baru
    const prog = this.progress;
    const p = prog[this.modeId] || { unlocked: 1, bestStars: 0, bestScore: 0, played: 0 };
    p.played = (p.played || 0) + 1;
    let levelUp = false;
    if (this.correct >= Math.ceil(this.total * 0.8) && this.level < 3) {
      if (p.unlocked < this.level + 1) { p.unlocked = this.level + 1; levelUp = true; }
    }
    p.bestStars = Math.max(p.bestStars || 0, stars);
    p.bestScore = Math.max(p.bestScore || 0, this.score);
    p.unlocked = Math.max(p.unlocked || 1, 1);
    prog[this.modeId] = p;
    Store.set("progress", prog);

    // Lencana baru
    const earned = Store.get("badges", []);
    const addBadge = (id) => { if (earned.indexOf(id) === -1) earned.push(id); };
    addBadge("first");
    if (stars === 3) addBadge("star_" + this.modeId);
    if (this.bestStreak >= 10) addBadge("streak10");
    if (this.level === 3 && stars >= 2) addBadge("level3");
    const totalStars = Object.keys(prog).reduce((s, k) => s + (prog[k].bestStars || 0), 0);
    if (totalStars >= 15) addBadge("stars15");
    const before = Store.get("badges", []);
    Store.set("badges", earned);
    const newBadges = earned.filter(id => before.indexOf(id) === -1);

    // Simpan skor (lokal + Google Sheets)
    const profile = Store.get("profile", { nama: "", kelas: "" });
    const record = {
      nama: profile.nama || "Anak Hebat",
      kelas: profile.kelas || "-",
      mode: this.modeId,
      modeName: this.mode.name,
      level: this.level,
      skor: this.score,
      benar: this.correct,
      totalSoal: this.total,
      streak: this.bestStreak,
      waktuISO: new Date().toISOString()
    };
    Sheets.saveScore(record).then((res) => {
      const el = $("#result-sync");
      if (!el) return;
      if (res.ok) {
        el.textContent = "Skor tersimpan di Google Sheets.";
      } else if (res.reason === "not-configured") {
        el.textContent = "Skor tersimpan di perangkat ini. Hubungkan Google Sheets untuk papan skor kelas.";
      } else {
        el.textContent = "Belum online - skor disimpan di perangkat dan otomatis dikirim saat online.";
      }
    });

    this.renderResult(stars, levelUp, newBadges);
    if (levelUp) Sound.levelup();
  },

  renderResult(stars, levelUp, newBadges) {
    App.showScreen("result");
    $("#result-mode").textContent = this.mode.name + " · " + this.mode.levels[this.level - 1];
    $("#result-score").textContent = this.score;
    $("#result-correct").textContent = this.correct + "/" + this.total;
    $("#result-streak").textContent = "x" + this.bestStreak;

    const starWrap = $("#result-stars");
    starWrap.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const span = document.createElement("span");
      span.className = "star-pop";
      span.style.animationDelay = (0.15 + i * 0.25) + "s";
      span.innerHTML = starSVG(i < stars, 56);
      starWrap.appendChild(span);
    }
    if (stars > 0) Sound.star();

    const note = $("#result-note");
    if (levelUp) note.textContent = "Keren! Level " + (this.level + 1) + " terbuka!";
    else if (stars === 3) note.textContent = "Sempurna! Kamu juara kecil sejati!";
    else if (stars === 2) note.textContent = "Bagus! Sedikit lagi jadi sempurna!";
    else if (stars === 1) note.textContent = "Terus semangat, kamu pasti bisa!";
    else note.textContent = "Jangan menyerah, coba lagi ya!";

    const badgeWrap = $("#result-badges");
    badgeWrap.innerHTML = "";
    if (newBadges.length) {
      BADGES.filter(b => newBadges.indexOf(b.id) !== -1).forEach(b => {
        const chip = document.createElement("div");
        chip.className = "badge-chip new";
        chip.innerHTML = `<span class="badge-ico">${trophySVG()}</span><span><b>${b.name}</b><br>${b.desc}</span>`;
        badgeWrap.appendChild(chip);
      });
    } else {
      badgeWrap.innerHTML = `<div class="badge-hint">Kumpulkan bintang untuk membuka lencana!</div>`;
    }

    // Konfetti besar untuk hasil bagus
    if (stars >= 2) Confetti.burst(140);
  },

  quit() {
    this.stopTimer();
    this.current = null;
    App.showScreen("home");
  }
};

/* Ikon piala kecil untuk lencana */
function trophySVG(size = 26) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 4h10v2h3v3c0 2.5-2 4.5-4.5 4.9A5.5 5.5 0 0 1 13 17.9V19h3v2H8v-2h3v-1.1a5.5 5.5 0 0 1-2.5-3A4.9 4.9 0 0 1 4 9V6h3V4zm-1 4v1c0 1.2.8 2.3 2 2.7V8H6zm12 0h-2v3.7c1.2-.4 2-1.5 2-2.7V8z" fill="#FFC93C"/>
  </svg>`;
}
