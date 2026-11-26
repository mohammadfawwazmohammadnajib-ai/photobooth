/**
 * Photobooth SK Sungai Setar 2026 – simpan gambar ke Google Drive
 * Deploy sebagai Web app:  Execute as: Me  |  Who has access: Anyone
 */
var FOLDER_ID = '1PSJFe6Tbil3G0xSyfCuzHmBzHWMhiSko';   // folder Google Drive anda
var MAX_BYTES = 8 * 1024 * 1024;                        // had 8 MB setiap gambar
var NAMA_BETUL = /^SKSungaiSetar_(ungu|biru)(potret|landskap)\d{8}_\d{6}\.jpg$/;

function doPost(e) {
  var kunci = LockService.getScriptLock();
  try {
    kunci.waitLock(20000);
    var d = JSON.parse(e.postData.contents);

    if (d.mime !== 'image/jpeg')              return balas({ ok: false, error: 'Hanya JPEG dibenarkan' });
    if (!NAMA_BETUL.test(String(d.name)))     return balas({ ok: false, error: 'Nama fail tidak sah' });

    var bait = Utilities.base64Decode(String(d.data));
    if (bait.length < 1000 || bait.length > MAX_BYTES) return balas({ ok: false, error: 'Saiz tidak sah' });
    // Semak benar-benar JPEG: tiga bait pertama ialah FF D8 FF (dalam Apps Script: -1, -40, -1)
    if (!(bait[0] === -1 && bait[1] === -40 && bait[2] === -1)) return balas({ ok: false, error: 'Bukan fail JPEG' });

    var folder = DriveApp.getFolderById(FOLDER_ID);
    if (folder.getFilesByName(d.name).hasNext()) return balas({ ok: true, duplicate: true }); // elak salinan
    folder.createFile(Utilities.newBlob(bait, 'image/jpeg', d.name));
    return balas({ ok: true });
  } catch (err) {
    return balas({ ok: false, error: 'Ralat pelayan' });
  } finally {
    try { kunci.releaseLock(); } catch (x) {}
  }
}

function doGet() { return balas({ ok: true, info: 'Photobooth SKSS aktif' }); }

function balas(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
