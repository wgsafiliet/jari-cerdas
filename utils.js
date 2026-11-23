/* =========================================================
   JARI CERDAS - Utilitas umum (DOM, suara, confetti, penyimpanan)
   ========================================================= */

"use strict";

/* ---------- Helper DOM ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function show(el) { el.classList.add("show"); }
function hide(el) { el.classList.remove("show"); }

/* ---------- Helper angka ---------- */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function choice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Membuat pilihan jawaban (1 benar + 3 pengecoh) */
function buildOptions(answer, opts = {}) {
  const min = opts.min !== undefined ? opts.min : 0;
  const max = opts.max !== undefined ? opts.max : 99;
  const cand = new Set([answer]);
  const deltas = shuffle([1, -1, 2, -2, 3, -3, 10, -10]);
  for (const d of deltas) {
    if (cand.size >= 4) break;
    const v = answer + d;
    if (v >= min && v <= max && !cand.has(v)) cand.add(v);
  }
  let filler = answer;
  while (cand.size < 4) {
    filler = (filler + 1) % (max + 1);
    if (filler < min) filler = min;
    if (!cand.has(filler)) cand.add(filler);
  }
  return shuffle(Array.from(cand));
}

/* ---------- Penyimpanan lokal (localStorage) ---------- */
const Store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem("jariCerdas." + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem("jariCerdas." + key, JSON.stringify(value));
    } catch (e) { /* storage penuh / diblokir - abaikan */ }
  },
  remove(key) {
    try { localStorage.removeItem("jariCerdas." + key); } catch (e) {}
  }
};

/* ---------- Suara (Web Audio API, tanpa file audio) ---------- */
const Sound = {
  ctx: null,
  muted: Store.get("muted", false),
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },
  tone(freq, start, dur, type = "sine", gain = 0.18) {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur + 0.05);
  },
  click() { this.tone(600, 0, 0.08, "triangle", 0.1); },
  correct() {
    this.tone(523, 0, 0.12); this.tone(659, 0.1, 0.12); this.tone(784, 0.2, 0.18);
  },
  wrong() {
    this.tone(220, 0, 0.2, "sawtooth", 0.1); this.tone(180, 0.15, 0.25, "sawtooth", 0.1);
  },
  star() { this.tone(880, 0, 0.15); this.tone(1174, 0.12, 0.2); },
  levelup() {
    this.tone(523, 0, 0.1); this.tone(659, 0.08, 0.1);
    this.tone(784, 0.16, 0.1); this.tone(1046, 0.24, 0.25);
  },
  toggle() {
    this.muted = !this.muted;
    Store.set("muted", this.muted);
    return this.muted;
  }
};

/* ---------- Confetti sederhana (canvas) ---------- */
const Confetti = {
  canvas: null, ctx2d: null, parts: [], raf: null,
  init() {
    this.canvas = $("#confetti-canvas");
    if (!this.canvas) return;
    this.ctx2d = this.canvas.getContext("2d");
    window.addEventListener("resize", () => this.resize());
    this.resize();
  },
  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },
  burst(count = 80) {
    if (!this.canvas) return;
    const colors = ["#FF8A3D", "#3AA655", "#FF5D8F", "#9C6ADE", "#2BB3A3", "#FFC93C"];
    for (let i = 0; i < count; i++) {
      this.parts.push({
        x: Math.random() * this.canvas.width,
        y: -20 - Math.random() * 140,
        w: 6 + Math.random() * 8,
        h: 8 + Math.random() * 10,
        vy: 2 + Math.random() * 3.2,
        vx: -1.6 + Math.random() * 3.2,
        rot: Math.random() * Math.PI,
        vr: -0.12 + Math.random() * 0.24,
        color: choice(colors)
      });
    }
    if (!this.raf) this.loop();
  },
  loop() {
    if (!this.ctx2d) return;
    this.raf = requestAnimationFrame(() => this.loop());
    const c = this.ctx2d;
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.parts = this.parts.filter(p => p.y < this.canvas.height + 30);
    if (this.parts.length === 0) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
      return;
    }
    for (const p of this.parts) {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.fillStyle = p.color;
      c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      c.restore();
    }
  }
};

/* ---------- Toast ---------- */
let toastTimer = null;
function toast(msg) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  show(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => hide(t), 2600);
}

/* ---------- Format tanggal Indonesia ---------- */
function formatTanggal(d) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }).format(d);
  } catch (e) {
    return d.toISOString().slice(0, 16).replace("T", " ");
  }
}

/* Deteksi apakah berjalan di dalam iframe (mode preview) */
function isEmbedded() {
  try { return window.self !== window.top; } catch (e) { return true; }
}
