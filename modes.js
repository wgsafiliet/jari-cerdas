/* =========================================================
   JARI CERDAS - Generator soal untuk 4 mode permainan
   1. hitung  : Menghitung jari 1-10 (TK)
   2. jumlah  : Penjumlahan & pengurangan cepat (SD awal)
   3. kali    : Trik jari perkalian 9 (SD)
   4. aljabar : Mencari angka yang hilang (SD)
   ========================================================= */

"use strict";

/* ---------- Komponen tampilan kecil ---------- */
function numChip(n, extra) {
  return `<span class="num-chip ${extra || ""}">${n}</span>`;
}
function eqHTML(inner) {
  return `<div class="equation">${inner}</div>`;
}
function qBox(sym) {
  return `<span class="eq-box">${sym || "?"}</span>`;
}

const MODE_ICONS = {
  hitung: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="22" width="28" height="20" rx="9" fill="#fff" opacity=".9"/><rect x="12" y="8" width="6" height="18" rx="3" fill="#fff" opacity=".9"/><rect x="21" y="4" width="6" height="22" rx="3" fill="#fff" opacity=".9"/><rect x="30" y="8" width="6" height="18" rx="3" fill="#fff" opacity=".9"/></svg>`,
  jumlah: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="20" width="36" height="9" rx="4.5" fill="#fff" opacity=".9"/><rect x="19.5" y="6" width="9" height="37" rx="4.5" fill="#fff" opacity=".9"/></svg>`,
  kali: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="18" fill="none" stroke="#fff" stroke-width="5" opacity=".9"/><rect x="14" y="21.5" width="20" height="5" rx="2.5" fill="#fff" opacity=".9" transform="rotate(45 24 24)"/><rect x="14" y="21.5" width="20" height="5" rx="2.5" fill="#fff" opacity=".9" transform="rotate(-45 24 24)"/></svg>`,
  aljabar: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="18" fill="none" stroke="#fff" stroke-width="5" opacity=".9"/><path d="M 18 19 a 6 6 0 1 1 8 6 c -2 1 -2 2 -2 5" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".9"/><circle cx="24" cy="36" r="3" fill="#fff" opacity=".9"/></svg>`
};

/* =========================================================
   Definisi mode
   ========================================================= */
const MODES = {

  /* ---------------- MODE 1: HITUNG JARI (TK) ---------------- */
  hitung: {
    id: "hitung",
    name: "Hitung Jari",
    audience: "TK",
    color: "#FF8A3D",
    desc: "Berapa jari yang terangkat? Hitung cepat!",
    levels: ["1 - 5", "1 - 10", "1 - 10 Kilat"],
    make(level) {
      const max = level === 1 ? 5 : 10;
      const n = randInt(1, max);
      return {
        questionText: "Ada berapa jari terangkat?",
        visualHTML: countHandsSVG(n),
        equationHTML: eqHTML(qBox()),
        hint: "Hitung satu per satu: 1, 2, 3, ...",
        answer: n,
        options: buildOptions(n, { min: 1, max: 12 }),
        explain: `Betul, ada ${n} jari. Ayo latih terus supaya makin cepat!`
      };
    }
  },

  /* ---------------- MODE 2: JUMLAH CEPAT (SD AWAL) ---------------- */
  jumlah: {
    id: "jumlah",
    name: "Jumlah Cepat",
    audience: "SD kelas awal",
    color: "#3AA655",
    desc: "Tambah dan kurang pakai bantuan jari.",
    levels: ["Tambah 1-5", "Tambah sampai 10", "Kurang & Cepat"],
    make(level) {
      if (level === 1) {
        const a = randInt(1, 5), b = randInt(1, 5);
        const ans = a + b;
        return {
          questionText: "Berapa jumlahnya?",
          visualHTML: addHandsSVG(a, b),
          equationHTML: eqHTML(`${numChip(a)} <span class="eq-op">+</span> ${numChip(b)} <span class="eq-op">=</span> ${qBox()}`),
          hint: "Hitung semua jari yang terangkat.",
          answer: ans,
          options: buildOptions(ans, { min: 1, max: 12 }),
          explain: `${a} + ${b} = ${ans}. Hitung jari kiri dulu, lalu lanjut ke jari kanan.`
        };
      }
      if (level === 2) {
        const sum = randInt(4, 10);
        const a = randInt(1, sum - 1);
        const b = sum - a;
        const aHand = a <= 5, bHand = b <= 5;
        const left = aHand ? addHandSingle(a) : numChip(a, "big");
        const right = bHand ? addHandSingle(b, true) : numChip(b, "big");
        const ans = sum;
        return {
          questionText: "Berapa jumlahnya?",
          visualHTML: `<div class="hands-row">${left}<span class="plus-sign">+</span>${right}</div>`,
          equationHTML: eqHTML(`${numChip(a)} <span class="eq-op">+</span> ${numChip(b)} <span class="eq-op">=</span> ${qBox()}`),
          hint: aHand || bHand ? "Pakai jari yang terlihat, angka besar simpan di kepala." : "Lengkapi dulu sampai 10, baru sisaannya ditambah.",
          answer: ans,
          options: buildOptions(ans, { min: 2, max: 14 }),
          explain: `${a} + ${b} = ${ans}.`
        };
      }
      // Level 3: pengurangan cepat
      const a = randInt(3, 10);
      const b = randInt(1, a - 1);
      const ans = a - b;
      const aHand = a <= 5;
      return {
        questionText: "Berapa hasilnya?",
        visualHTML: aHand ? subHandsSVG(a, b) : `<div class="hands-row">${numChip(a, "big")}<span class="plus-sign minus">&minus;</span>${addHandSingle(b, true)}</div>`,
        equationHTML: eqHTML(`${numChip(a)} <span class="eq-op">&minus;</span> ${numChip(b)} <span class="eq-op">=</span> ${qBox()}`),
        hint: "Hitung mundur dari " + a + ": " + (a - 1) + ", " + (a - 2) + ", ...",
        answer: ans,
        options: buildOptions(ans, { min: 0, max: 10 }),
        explain: `${a} &minus; ${b} = ${ans}. Jari yang ditekuk adalah yang "dipindah".`
      };
    }
  },

  /* ---------------- MODE 3: TRIK JARI x9 (SD) ---------------- */
  kali: {
    id: "kali",
    name: "Trik Jari kali 9",
    audience: "SD",
    color: "#9C6ADE",
    desc: "Trik ajaib: tekuk satu jari, langsung dapat jawaban!",
    levels: ["9 x 1-5", "9 x 1-10", "Kebalikannya"],
    make(level) {
      if (level === 3) {
        // soal kebalikan: hasil diketahui, cari pengalinya
        const n = randInt(1, 10);
        const hasil = 9 * n;
        return {
          questionText: `${hasil} adalah hasil dari 9 kali berapa?`,
          visualHTML: nineFingersSVG(n),
          equationHTML: eqHTML(`${numChip(9)} <span class="eq-op">&times;</span> ${qBox()} <span class="eq-op">=</span> ${numChip(hasil)}`),
          hint: "Lihat jari yang ditekuk: urutan ke berapa?",
          answer: n,
          options: buildOptions(n, { min: 1, max: 10 }),
          explain: `9 &times; ${n} = ${hasil}. Tekuk jari ke-${n}: kiri ${n - 1} jari, kanan ${10 - n} jari.`
        };
      }
      const maxN = level === 1 ? 5 : 10;
      const n = randInt(1, maxN);
      const hasil = 9 * n;
      return {
        questionText: "Berapa hasilnya?",
        visualHTML: nineFingersSVG(n),
        equationHTML: eqHTML(`${numChip(9)} <span class="eq-op">&times;</span> ${numChip(n)} <span class="eq-op">=</span> ${qBox()}`),
        hint: `Tekuk jari ke-${n}. Jari kiri = puluhan, jari kanan = satuan.`,
        answer: hasil,
        options: buildOptions(hasil, { min: 0, max: 90 }),
        explain: `Tekuk jari ke-${n}: kiri ada ${n - 1} jari (${n - 1} puluhan), kanan ada ${10 - n} jari (${10 - n} satuan) &rarr; ${hasil}.`
      };
    }
  },

  /* ---------------- MODE 4: ALJABAR JARI (SD) ---------------- */
  aljabar: {
    id: "aljabar",
    name: "Aljabar Jari",
    audience: "SD",
    color: "#FF5D8F",
    desc: "Cari angka rahasia yang hilang!",
    levels: ["Kotak Awal", "Cari yang Hilang", "Sampai 20"],
    make(level) {
      if (level === 1) {
        const b = randInt(1, 4);
        const miss = randInt(1, 5);
        const c = b + miss;
        return {
          questionText: "Berapa angka di kotak?",
          visualHTML: `<div class="hands-row">${addHandSingle(b)}<span class="plus-sign">+</span>${addHandSingle(miss, true, true)}<span class="total-badge">total ${c}</span></div>`,
          equationHTML: eqHTML(`${qBox()} <span class="eq-op">+</span> ${numChip(b)} <span class="eq-op">=</span> ${numChip(c)}`),
          hint: `Total harus ${c}. Jari kelabu masih rahasia!`,
          answer: miss,
          options: buildOptions(miss, { min: 0, max: 10 }),
          explain: `${miss} + ${b} = ${c}. Coba: mulai dari ${b}, hitung naik sampai ${c}.`
        };
      }
      if (level === 2) {
        const a = randInt(1, 9);
        const miss = randInt(1, 10 - Math.max(1, a - 5));
        const c = a + miss;
        return {
          questionText: "Berapa angka di kotak?",
          visualHTML: `<div class="hands-row">${a <= 5 ? addHandSingle(a) : numChip(a, "big")}<span class="plus-sign">+</span>${addHandSingle(Math.min(miss, 5), true, true)}<span class="total-badge">total ${c}</span></div>`,
          equationHTML: eqHTML(`${numChip(a)} <span class="eq-op">+</span> ${qBox()} <span class="eq-op">=</span> ${numChip(c)}`),
          hint: `Dari ${a}, berapa langkah lagi sampai ${c}?`,
          answer: miss,
          options: buildOptions(miss, { min: 0, max: 12 }),
          explain: `${a} + ${miss} = ${c}. Artinya ${c} &minus; ${a} = ${miss}.`
        };
      }
      // Level 3: sampai 20 + bentuk pengurangan
      if (Math.random() < 0.5) {
        const a = randInt(5, 10);
        const miss = randInt(2, 10);
        const c = a + miss; // sampai 20
        return {
          questionText: "Berapa angka di kotak?",
          visualHTML: `<div class="hands-row">${numChip(a, "big")}<span class="plus-sign">+</span>${addHandSingle(Math.min(miss, 5), true, true)}<span class="total-badge">total ${c}</span></div>`,
          equationHTML: eqHTML(`${numChip(a)} <span class="eq-op">+</span> ${qBox()} <span class="eq-op">=</span> ${numChip(c)}`),
          hint: `Lengkapi ${a} sampai 10, lalu lanjut sampai ${c}.`,
          answer: miss,
          options: buildOptions(miss, { min: 1, max: 14 }),
          explain: `${a} + ${miss} = ${c}. Artinya ${c} &minus; ${a} = ${miss}.`
        };
      }
      const a = randInt(6, 10);
      const miss = randInt(1, a - 1);
      const c = a - miss;
      return {
        questionText: "Berapa angka di kotak?",
        visualHTML: `<div class="hands-row">${numChip(a, "big")}<span class="plus-sign minus">&minus;</span>${addHandSingle(Math.min(miss, 5), true, true)}<span class="total-badge">hasil ${c}</span></div>`,
        equationHTML: eqHTML(`${numChip(a)} <span class="eq-op">&minus;</span> ${qBox()} <span class="eq-op">=</span> ${numChip(c)}`),
        hint: `${a} dikurangi berapa jadi ${c}?`,
        answer: miss,
        options: buildOptions(miss, { min: 1, max: 10 }),
        explain: `${a} &minus; ${miss} = ${c}. Artinya ${a} &minus; ${c} = ${miss}.`
      };
    }
  }
};

/* Satu tangan kecil untuk dipakai di dalam hands-row.
   secret = tangan misteri (semua jari kelabu + tanda tanya) */
function addHandSingle(up, mirror, secret) {
  if (secret) {
    return `<span class="secret-wrap">${handSVG(0, { face: false, mirror, folded: [0, 1, 2, 3, 4] })}<span class="secret-q">?</span></span>`;
  }
  return handSVG(Math.max(0, Math.min(5, up)), { mirror: !!mirror });
}

/* Daftar mode untuk UI */
const MODE_LIST = ["hitung", "jumlah", "kali", "aljabar"];
