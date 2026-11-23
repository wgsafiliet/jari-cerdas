/* =========================================================
   JARI CERDAS - Renderer tangan SVG (tanpa file gambar)
   Semua ilustrasi tangan dibuat dengan SVG sehingga tetap
   ringan dan bekerja offline.
   ========================================================= */

"use strict";

const HAND_COLORS = {
  skin: "#FFC89E",
  skinDark: "#E39A5F",
  nub: "#FFDDBE",
  folded: "#B9AFA4",
  foldedDark: "#8E8579",
  ink: "#4A3728",
  cheek: "#FF9E80"
};

/* Satu tangan dengan sejumlah jari terangkat.
   up     : jumlah jari terangkat (0-5)
   folded : array indeks jari yang "ditekuk" khusus (0=ibu jari..4=kelingking), ditandai kelabu
   face   : tampilkan wajah di telapak (default true) */
function handSVG(up, opts = {}) {
  const folded = opts.folded || [];
  const showFace = opts.face !== false;
  const mirror = opts.mirror === true;
  const label = opts.label || null;

  // Urutan jari terangkat: ibu jari, telunjuk, tengah, manis, kelingking
  const order = [0, 1, 2, 3, 4];
  const raisedSet = new Set(order.slice(0, Math.max(0, Math.min(5, up))));
  const foldedSet = new Set(folded);

  // Posisi 4 jari (telunjuk s.d. kelingking) dan ibu jari
  const fingerXs = [30, 55, 80, 105];
  const fingerW = 21;
  const upH = 58;
  const palmTop = 100;

  let f = "";
  // Empat jari lurus
  fingerXs.forEach((x, i) => {
    const idx = i + 1; // urutan global 1..4 (0 = ibu jari)
    const isUp = raisedSet.has(idx);
    const isFold = foldedSet.has(idx);
    const fill = isFold ? HAND_COLORS.folded : (isUp ? HAND_COLORS.skin : HAND_COLORS.nub);
    const stroke = isFold ? HAND_COLORS.foldedDark : HAND_COLORS.skinDark;
    if (isUp) {
      f += `<rect x="${x}" y="${palmTop - upH}" width="${fingerW}" height="${upH + 14}" rx="${fingerW / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>`;
    } else if (isFold) {
      // jari ditekuk: tampak pendek dan condong
      f += `<rect x="${x - 2}" y="${palmTop - 18}" width="${fingerW + 4}" height="26" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="2.5" transform="rotate(14 ${x} ${palmTop})"/>`;
    } else {
      f += `<rect x="${x}" y="${palmTop - 15}" width="${fingerW}" height="22" rx="${fingerW / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>`;
    }
  });
  // Ibu jari (miring di sisi kiri)
  {
    const isUp = raisedSet.has(0);
    const isFold = foldedSet.has(0);
    const fill = isFold ? HAND_COLORS.folded : (isUp ? HAND_COLORS.skin : HAND_COLORS.nub);
    const stroke = isFold ? HAND_COLORS.foldedDark : HAND_COLORS.skinDark;
    if (isUp) {
      f += `<g transform="rotate(-24 24 128)"><rect x="14" y="84" width="${fingerW}" height="66" rx="${fingerW / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/></g>`;
    } else {
      f += `<g transform="rotate(-24 24 128)"><rect x="14" y="108" width="${fingerW}" height="30" rx="${fingerW / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/></g>`;
    }
  }

  // Telapak + wajah
  const face = showFace ? `
      <circle cx="60" cy="134" r="5.5" fill="${HAND_COLORS.ink}"/>
      <circle cx="90" cy="134" r="5.5" fill="${HAND_COLORS.ink}"/>
      <path d="M 62 152 Q 75 164 88 152" fill="none" stroke="${HAND_COLORS.ink}" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="48" cy="146" r="6" fill="${HAND_COLORS.cheek}" opacity="0.55"/>
      <circle cx="102" cy="146" r="6" fill="${HAND_COLORS.cheek}" opacity="0.55"/>` : "";

  const labelEl = label ? `<text x="75" y="204" text-anchor="middle" font-size="19" font-weight="800" fill="${HAND_COLORS.ink}" font-family="inherit">${label}</text>` : "";

  return `<svg class="hand-svg" viewBox="0 0 150 212" role="img" aria-label="tangan dengan ${up} jari terangkat">
    ${f}
    <rect x="22" y="${palmTop}" width="106" height="86" rx="30" fill="${HAND_COLORS.skin}" stroke="${HAND_COLORS.skinDark}" stroke-width="3"/>
    ${face}
    ${labelEl}
  </svg>`;
}

/* Grup tangan untuk menghitung 1-10 (dua tangan jika > 5).
   Tanpa label angka agar anak menghitung sendiri jawabannya. */
function countHandsSVG(n) {
  n = Math.max(0, Math.min(20, n));
  if (n <= 5) {
    return `<div class="hands-row">${handSVG(n)}</div>`;
  }
  const first = Math.min(5, n - 5);
  const second = n - 5;
  return `<div class="hands-row">${handSVG(5)}<span class="plus-sign">+</span>${handSVG(second, { mirror: true })}</div>`;
}

/* Ilustrasi penjumlahan a + b (dua tangan berdampingan) */
function addHandsSVG(a, b) {
  return `<div class="hands-row">${handSVG(Math.max(0, Math.min(5, a)), { label: String(a) })}<span class="plus-sign">+</span>${handSVG(Math.max(0, Math.min(5, b)), { mirror: true, label: String(b) })}</div>`;
}

/* Ilustrasi pengurangan a - b: jari b ditekuk/dililit kelabu */
function subHandsSVG(a, b) {
  const aC = Math.max(0, Math.min(5, a));
  const folded = [];
  for (let i = 0; i < Math.max(0, Math.min(aC, b)); i++) folded.push(4 - i); // kelingking dulu
  return `<div class="hands-row">${handSVG(aC, { folded, label: String(a) })}<span class="plus-sign minus">&minus;</span>${handSVG(Math.max(0, Math.min(5, b)), { mirror: true, folded: [0, 1, 2, 3, 4], label: String(b) })}</div>`;
}

/* Baris 10 jari untuk trik perkalian 9.
   foldIndex: jari yang ditekuk (1-10), 0 = tidak ada.
   Label angka 1-10 di atas tiap jari. */
function nineFingersSVG(foldIndex) {
  const W = 330, top = 46, upH = 56, palmTop = 102;
  const fingerW = 20, gap = 31;
  let fingers = "";
  let labels = "";
  for (let i = 1; i <= 10; i++) {
    const x = 10 + (i - 1) * gap;
    const isFold = i === foldIndex;
    if (isFold) {
      fingers += `<rect x="${x - 3}" y="${palmTop - 20}" width="${fingerW + 6}" height="30" rx="11" fill="${HAND_COLORS.folded}" stroke="${HAND_COLORS.foldedDark}" stroke-width="2.5" transform="rotate(16 ${x} ${palmTop})"/>`;
    } else {
      fingers += `<rect x="${x}" y="${top}" width="${fingerW}" height="${upH + 14}" rx="${fingerW / 2}" fill="${HAND_COLORS.skin}" stroke="${HAND_COLORS.skinDark}" stroke-width="2.5"/>`;
    }
    const badge = isFold
      ? `<circle cx="${x + fingerW / 2}" cy="24" r="13" fill="#FF5D8F"/><text x="${x + fingerW / 2}" y="29" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">${i}</text>`
      : `<circle cx="${x + fingerW / 2}" cy="24" r="13" fill="#FFE3CC"/><text x="${x + fingerW / 2}" y="29" text-anchor="middle" font-size="13" font-weight="800" fill="${HAND_COLORS.ink}">${i}</text>`;
    labels += badge;
  }
  return `<svg class="nine-svg" viewBox="0 0 ${W} 196" role="img" aria-label="sepuluh jari, jari ${foldIndex} ditekuk">
    ${labels}
    ${fingers}
    <rect x="6" y="${palmTop}" width="150" height="82" rx="26" fill="${HAND_COLORS.skin}" stroke="${HAND_COLORS.skinDark}" stroke-width="3"/>
    <rect x="170" y="${palmTop}" width="150" height="82" rx="26" fill="${HAND_COLORS.skin}" stroke="${HAND_COLORS.skinDark}" stroke-width="3"/>
    <circle cx="66" cy="136" r="5" fill="${HAND_COLORS.ink}"/><circle cx="94" cy="136" r="5" fill="${HAND_COLORS.ink}"/>
    <path d="M 68 150 Q 80 160 92 150" fill="none" stroke="${HAND_COLORS.ink}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="232" cy="136" r="5" fill="${HAND_COLORS.ink}"/><circle cx="260" cy="136" r="5" fill="${HAND_COLORS.ink}"/>
    <path d="M 234 150 Q 246 160 258 150" fill="none" stroke="${HAND_COLORS.ink}" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

/* Maskot sapaan di halaman utama: tangan bebas dua jari + bintang */
function mascotSVG() {
  return `<svg class="mascot-svg" viewBox="0 0 190 220" role="img" aria-label="maskot tangan cerdas">
    <g>
      <circle cx="30" cy="40" r="7" fill="#FFC93C"/>
      <circle cx="160" cy="30" r="9" fill="#FF5D8F"/>
      <path d="M 150 52 l 4 8 9 1 -6 6 1 9 -8 -4 -8 4 1 -9 -6 -6 9 -1 z" fill="#9C6ADE"/>
    </g>
    ${handSVG(2, { face: true })}
  </svg>`;
}

/* Bintang untuk hasil sesi (terisi / kosong) */
function starSVG(filled, size = 44) {
  const fill = filled ? "#FFC93C" : "#E8DFD2";
  const stroke = filled ? "#E8A93C" : "#CFC5B4";
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" role="img" aria-label="bintang">
    <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"
      fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`;
}
