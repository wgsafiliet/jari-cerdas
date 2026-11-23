/**
 * =========================================================
 * JARI CERDAS - Backend Google Apps Script (Database Sheets)
 * ---------------------------------------------------------
 * PASANG:
 * 1. Buat Google Spreadsheet baru, mis. "DB Jari Cerdas".
 * 2. Menu Ekstensi > Apps Script, hapus isi editor,
 *    tempel seluruh kode ini, simpan.
 * 3. Klik "Deploy" > "Deployment baru" > "Aplikasi web":
 *      - Deskripsi    : bebas (mis. "API Jari Cerdas")
 *      - Execute as   : Me
 *      - Who has access: Anyone
 * 4. Salin URL Web App (akhiran /exec), tempel ke js/config.js
 *    pada APPS_SCRIPT_URL.
 * 5. Jalankan fungsi setup() sekali di editor untuk membuat
 *    sheet "Skor" (boleh juga tanpa setup, sheet dibuat otomatis).
 *
 * STRUKTUR SHEET "Skor":
 * Tanggal | Nama | Kelas | Mode | ModeNama | Level | Skor |
 * Benar | TotalSoal | StreakTerbaik
 * =========================================================
 */

var SHEET_SKOR = "Skor";
var HEADER = ["Tanggal", "Nama", "Kelas", "Mode", "ModeNama", "Level", "Skor", "Benar", "TotalSoal", "StreakTerbaik"];

/** Ambil (atau buat) sheet dengan header rapi. */
function getSheetSkor_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_SKOR);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SKOR);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER);
    sheet.getRange(1, 1, 1, HEADER.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Susun data skor dari request ke bentuk baris. */
function rowFromData_(data) {
  var d = data || {};
  var waktu = d.waktuISO ? new Date(d.waktuISO) : new Date();
  var fmt = Utilities.formatDate(waktu, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
  return [
    fmt,
    String(d.nama || "Anak Hebat"),
    String(d.kelas || "-"),
    String(d.mode || "-"),
    String(d.modeName || d.mode || "-"),
    Number(d.level || 1),
    Number(d.skor || 0),
    Number(d.benar || 0),
    Number(d.totalSoal || 0),
    Number(d.streak || 0)
  ];
}

/** Tulis JSON sebagai respons web. */
function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST: simpan skor.
 * Body JSON: { "action": "save", "data": { nama, kelas, mode, ... } }
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // tunggu maksimal 20 detik
    var payload = JSON.parse(e.postData.contents || "{}");
    if (payload.action !== "save") {
      return json_({ ok: false, error: "action tidak dikenal" });
    }
    var sheet = getSheetSkor_();
    sheet.appendRow(rowFromData_(payload.data));

    // Rapikan: batasi jumlah baris agar sheet tidak membengkak
    var maxRows = 2000;
    var last = sheet.getLastRow();
    if (last > maxRows) {
      sheet.deleteRows(2, last - maxRows);
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

/**
 * GET:
 *  ?action=ping                  -> uji koneksi
 *  ?action=leaderboard&limit=20  -> 20 skor tertinggi
 */
function doGet(e) {
  var action = (e.parameter.action || "ping").toLowerCase();
  try {
    if (action === "ping") {
      getSheetSkor_(); // sekalian memastikan sheet ada
      return json_({ ok: true, app: "Jari Cerdas", time: new Date().toISOString() });
    }

    if (action === "leaderboard") {
      var limit = Math.min(Number(e.parameter.limit) || 20, 100);
      var sheet = getSheetSkor_();
      var last = sheet.getLastRow();
      if (last < 2) return json_({ ok: true, rows: [] });

      var values = sheet.getRange(2, 1, last - 1, HEADER.length).getValues();
      var rows = values.map(function (r) {
        return {
          tanggal: Utilities.formatDate(new Date(r[0]), Session.getScriptTimeZone(), "dd MMM HH:mm"),
          nama: String(r[1]),
          kelas: String(r[2]),
          mode: String(r[3]),
          modeName: String(r[4]),
          level: Number(r[5]),
          skor: Number(r[6]),
          benar: Number(r[7]),
          totalSoal: Number(r[8]),
          streak: Number(r[9])
        };
      });

      rows.sort(function (a, b) { return b.skor - a.skor; });
      return json_({ ok: true, rows: rows.slice(0, limit) });
    }

    return json_({ ok: false, error: "action tidak dikenal" });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** Jalankan sekali dari editor: membuat sheet "Skor" dengan header. */
function setup() {
  getSheetSkor_();
}
