/* =========================================================
   JARI CERDAS - Konfigurasi Utama
   ---------------------------------------------------------
   UNTUK GURU / ORANG TUA:
   1. Buat Google Spreadsheet baru (beri nama mis. "DB Jari Cerdas").
   2. Menu Ekstensi > Apps Script, salin isi file apps-script/Code.gs.
   3. Deploy > Deployment baru > Aplikasi web:
        - Execute as: Me
        - Who has access: Anyone
   4. Salin URL yang berakhiran /exec dan tempel di bawah ini.
   Contoh: APPS_SCRIPT_URL: "https://script.google.com/macros/s/XXXX/exec"
   Jika dikosongkan, skor tetap tersimpan di perangkat (offline).
   ========================================================= */

window.CONFIG = {
  APP_NAME: "Jari Cerdas",
  APP_TAGLINE: "Petualangan Hitung Cepat dengan Jari",
  // URL Web App Google Apps Script (database Google Sheets). Kosongkan jika belum disiapkan.
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwLVVyLk1Gbq1f0MlmCIx2CkrGLVpVQVRvKFPPbBtIGbg2d6slGmAT97_w6KyK6FoxZ/exec",
  // Jumlah soal per sesi bermain
  QUESTIONS_PER_SESSION: 10,
  // Batas maksimal baris data yang dikelola di Google Sheets
  MAX_SHEET_ROWS: 2000,
  // Waktu menjawab per soal (detik) - bonus skor makin besar jika menjawab cepat
  TIME_PER_LEVEL: {
    hitung: [25, 20, 15],
    jumlah: [25, 20, 18],
    kali: [30, 25, 25],
    aljabar: [30, 25, 25]
  }
};
