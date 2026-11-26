(() => {
'use strict';
const CFG = window.APP_CONFIG || {};
const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Tetingkap lutsinar setiap bingkai (piksel pada fail bingkai penuh)
const WIN = {
  potret:   { w: 1170, h: 1968, x: 143, y: 614, cw: 900,  ch: 1056 },
  landskap: { w: 1808, h: 1408, x: 200, y: 378, cw: 1448, ch: 812 }
};
const K = 0.5; // skala pratonton (gambar disimpan guna skala 1)

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;

const state = {
  tema: localStorage.getItem('tema') === 'biru' ? 'biru' : 'ungu',
  bingkai: 'potret', facing: 'environment', mode: 'live',
  stream: null, video: null, galeri: null, frameImg: null,
  hasil: null, sibuk: false
};

/* ---------- Skrin ---------- */
function skrin(id) {
  document.querySelectorAll('.skrin').forEach(s => s.classList.toggle('aktif', s.id === id));
}
function setTema(t) {
  state.tema = t; localStorage.setItem('tema', t);
  document.documentElement.dataset.tema = t;
  document.querySelector('meta[name=theme-color]').content = t === 'biru' ? '#17306f' : '#4a2380';
  document.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-checked', c.dataset.warna === t));
  document.querySelectorAll('[data-prev]').forEach(i => i.src = `frames/${t}-${i.dataset.prev}.webp`);
}
document.querySelectorAll('.chip').forEach(c => c.onclick = () => setTema(c.dataset.warna));
document.querySelectorAll('.kad').forEach(k => k.onclick = () => bukaKamera(k.dataset.bingkai));
setTema(state.tema);

/* ---------- Lukis (satu fungsi untuk pratonton DAN gambar disimpan) ---------- */
const tiny = document.createElement('canvas');
function lukis(ctx, k, src, zoom, frameImg, key) {
  const W = WIN[key], x = W.x * k, y = W.y * k, w = W.cw * k, h = W.ch * k;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W.w * k, W.h * k);
  if (src && src.w) {
    const fill = Math.max(w / src.w, h / src.h);
    const dw = src.w * fill * zoom, dh = src.h * fill * zoom;
    ctx.save();
    ctx.beginPath(); ctx.rect(x - 1, y - 1, w + 2, h + 2); ctx.clip();
    if (src.mirror) { ctx.translate(x + w / 2, 0); ctx.scale(-1, 1); ctx.translate(-(x + w / 2), 0); }
    if (dw < w - 0.5 || dh < h - 0.5) {            // sisi kosong: salinan kabur
      const tw = 32, th = Math.max(8, Math.round(32 * src.h / src.w));
      tiny.width = tw; tiny.height = th;
      tiny.getContext('2d').drawImage(src.el, 0, 0, tw, th);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(tiny, x - (fill * src.w - w) / 2, y - (fill * src.h - h) / 2, fill * src.w, fill * src.h);
    }
    ctx.drawImage(src.el, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    ctx.restore();
  }
  ctx.drawImage(frameImg, 0, 0, W.w * k, W.h * k);
}
function sumber() {
  if (state.mode === 'galeri' && state.galeri) return state.galeri;
  const v = state.video;
  if (v && v.videoWidth) return { el: v, w: v.videoWidth, h: v.videoHeight, mirror: state.facing === 'user' };
  return null;
}
const frameCache = {};
function muatBingkai(t, b) {
  const k = t + '-' + b;
  return frameCache[k] || (frameCache[k] = new Promise((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = `frames/${k}.webp`;
  }));
}

/* ---------- Kamera ---------- */
const cv = $('#pratonton'), cx = cv.getContext('2d'), zum = $('#zum');
let gelung = false, srcKey = '';
function kemasZum() {
  const s = sumber(); if (!s) return;
  const W = WIN[state.bingkai];
  const key = s.w + 'x' + s.h + state.bingkai + state.mode;
  const fit = Math.min(W.cw / s.w, W.ch / s.h) / Math.max(W.cw / s.w, W.ch / s.h);
  zum.min = Math.max(0.2, fit).toFixed(2); zum.max = 3;
  if (key !== srcKey) { srcKey = key; zum.value = 1; }
}
function gelungLukis() {
  if (!gelung) return;
  kemasZum();
  lukis(cx, K, sumber(), +zum.value, state.frameImg, state.bingkai);
  requestAnimationFrame(gelungLukis);
}
function ralat(t) { const e = $('#ralat'); e.hidden = !t; e.textContent = t || ''; }

async function bukaKamera(bingkai) {
  if (bingkai) state.bingkai = bingkai;
  state.mode = 'live'; state.galeri = null; srcKey = '';
  const W = WIN[state.bingkai]; cv.width = W.w * K; cv.height = W.h * K;
  skrin('skrin-kamera'); ralat('');
  $('#btn-kamera').hidden = true; $('#btn-tukar').disabled = false;
  state.frameImg = await muatBingkai(state.tema, state.bingkai);
  gelung = true; gelungLukis();
  await mulaStrim();
}
async function mulaStrim() {
  tutupStrim();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    ralat('Kamera tidak disokong pada pelayar ini. Sila guna butang Galeri.'); return;
  }
  try {
    // Minta gambar 4:3 asli kamera; JANGAN paksa bentuk tinggi.
    state.stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: state.facing }, width: { ideal: 1280 }, height: { ideal: 960 } }
    });
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.autoplay = true;
    v.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none';
    document.body.appendChild(v); v.srcObject = state.stream; await v.play();
    state.video = v;
    const st = state.stream.getVideoTracks()[0].getSettings();
    if (st.facingMode) state.facing = st.facingMode === 'user' ? 'user' : 'environment';
  } catch (e) {
    ralat('Kamera tidak dapat dibuka. Sila benarkan akses kamera dalam tetapan pelayar, atau guna butang Galeri.');
  }
}
function tutupStrim() {
  if (state.stream) state.stream.getTracks().forEach(t => t.stop());
  if (state.video) state.video.remove();
  state.stream = null; state.video = null;
}
function tutupKamera() { gelung = false; tutupStrim(); }

$('#btn-balik').onclick = () => { tutupKamera(); skrin('skrin-utama'); };
$('#btn-tukar').onclick = async () => {
  state.facing = state.facing === 'user' ? 'environment' : 'user'; srcKey = ''; await mulaStrim();
};
$('#btn-galeri').onclick = () => $('#fail').click();
$('#fail').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    let el;
    if (window.createImageBitmap) {
      try { el = await createImageBitmap(f, { imageOrientation: 'from-image' }); }
      catch (_) { el = await createImageBitmap(f); }
    } else {
      el = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(f); });
    }
    const w = el.width || el.naturalWidth, h = el.height || el.naturalHeight;
    state.galeri = { el, w, h, mirror: false }; state.mode = 'galeri'; srcKey = '';
    ralat(''); $('#btn-kamera').hidden = false; $('#btn-tukar').disabled = true;
  } catch (_) { ralat('Gambar ini tidak dapat dibuka. Sila pilih gambar lain.'); }
};
$('#btn-kamera').onclick = async () => {
  state.mode = 'live'; state.galeri = null; srcKey = '';
  $('#btn-kamera').hidden = true; $('#btn-tukar').disabled = false; ralat('');
  if (!state.stream) await mulaStrim();
};

/* ---------- Ambil gambar ---------- */
function namaFail() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return `SKSungaiSetar_${state.tema}${state.bingkai}${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.jpg`;
}
$('#btn-ambil').onclick = async () => {
  if (state.sibuk) return;
  if (!sumber()) { ralat('Tiada gambar lagi. Tunggu kamera siap atau pilih dari Galeri.'); return; }
  state.sibuk = true;
  document.querySelectorAll('#skrin-kamera button').forEach(b => b.disabled = true);
  try {
    if (state.mode === 'live') {
      const kr = $('#kiraan'); kr.hidden = false;
      for (let n = 3; n >= 1; n--) { kr.textContent = n; await sleep(1000); }
      kr.hidden = true;
    }
    const kl = $('#kilat'); kl.classList.remove('mula'); void kl.offsetWidth; kl.classList.add('mula');
    const W = WIN[state.bingkai], off = document.createElement('canvas');
    off.width = W.w; off.height = W.h;
    lukis(off.getContext('2d'), 1, sumber(), +zum.value, state.frameImg, state.bingkai);
    const blob = await new Promise(r => off.toBlob(r, 'image/jpeg', 0.92));
    tunjukHasil(blob, namaFail());
  } finally {
    state.sibuk = false;
    document.querySelectorAll('#skrin-kamera button').forEach(b => b.disabled = false);
    $('#btn-kamera').hidden = state.mode !== 'galeri'; $('#btn-tukar').disabled = state.mode === 'galeri';
  }
};

/* ---------- Hasil ---------- */
function tunjukHasil(blob, nama) {
  if (state.hasil) URL.revokeObjectURL(state.hasil.url);
  state.hasil = { blob, nama, url: URL.createObjectURL(blob) };
  $('#gambar-hasil').src = state.hasil.url;
  $('#btn-muat').textContent = isIOS ? 'Simpan ke Foto' : 'Muat Turun';
  $('#tip-simpan').hidden = !isIOS;
  tutupKamera(); skrin('skrin-hasil');
  pending.add(nama); kemasStatus();
  qPut({ nama, blob }).then(() => sync());
}
$('#btn-muat').onclick = async () => {
  const { blob, nama, url } = state.hasil;
  const file = new File([blob], nama, { type: 'image/jpeg' });
  if (isIOS && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file] }); } catch (_) { /* dibatalkan */ }
    return;
  }
  if (isIOS) { window.open(url, '_blank'); alert('Tekan lama pada gambar, kemudian pilih "Simpan ke Foto".'); return; }
  const a = document.createElement('a'); a.href = url; a.download = nama;
  document.body.appendChild(a); a.click(); a.remove();
};
$('#btn-semula').onclick = () => bukaKamera();

/* ---------- Muat naik ke Google Drive (dengan giliran luar talian) ---------- */
const pending = new Set(); let memQ = new Map(), syncing = false, sedangHantar = null;
const dbOpen = () => new Promise((res, rej) => {
  const r = indexedDB.open('sks-photobooth', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('q', { keyPath: 'nama' });
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
async function idb(mode, fn) {
  const db = await dbOpen();
  return new Promise((res, rej) => {
    const t = db.transaction('q', mode), rq = fn(t.objectStore('q'));
    t.oncomplete = () => res(rq && rq.result); t.onerror = () => rej(t.error);
  });
}
const qPut = async it => { try { await idb('readwrite', s => s.put(it)); } catch (_) { memQ.set(it.nama, it); } };
const qDel = async n => { memQ.delete(n); try { await idb('readwrite', s => s.delete(n)); } catch (_) {} };
const qAll = async () => { let a = []; try { a = await idb('readonly', s => s.getAll()); } catch (_) {} return a.concat([...memQ.values()]); };
const siap = () => /^https:\/\/script\.google\.com\//.test(CFG.UPLOAD_URL || '');

function toB64(blob) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
}
async function hantar(it) {
  const body = JSON.stringify({ name: it.nama, mime: 'image/jpeg', data: await toB64(it.blob) });
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 90000);
  try {
    // text/plain = permintaan "mudah", tiada pra-semakan CORS (Apps Script tidak menyokongnya)
    const r = await fetch(CFG.UPLOAD_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, signal: ac.signal });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'gagal');
  } finally { clearTimeout(t); }
}
async function sync() {
  if (syncing) return; syncing = true; kemasStatus();
  try {
    for (const it of await qAll()) {
      pending.add(it.nama);
      if (!siap() || !navigator.onLine) break;
      sedangHantar = it.nama; kemasStatus();
      try { await hantar(it); await qDel(it.nama); pending.delete(it.nama); } catch (_) { break; }
    }
  } finally { syncing = false; sedangHantar = null; kemasStatus(); }
}
function kemasStatus() {
  const el = $('#status'); if (!state.hasil) return;
  const n = state.hasil.nama;
  let t, c = '';
  if (!pending.has(n)) { t = 'Tersimpan ✓ (dalam Google Drive)'; }
  else if (syncing && siap() && navigator.onLine) { t = 'Menyimpan…'; }
  else { t = 'Menunggu sambungan internet. Gambar selamat dalam peranti ini dan akan dimuat naik nanti.'; }
  el.textContent = t;
}
addEventListener('online', sync);
document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
setInterval(sync, 30000);
qAll().then(a => { a.forEach(i => pending.add(i.nama)); sync(); });

/* ---------- Pasang aplikasi (PWA) ---------- */
let promptPasang = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); promptPasang = e; $('#btn-pasang').hidden = false; });
addEventListener('appinstalled', () => { $('#btn-pasang').hidden = true; promptPasang = null; });
$('#btn-pasang').onclick = async () => { if (!promptPasang) return; promptPasang.prompt(); await promptPasang.userChoice; promptPasang = null; $('#btn-pasang').hidden = true; };
if (isIOS && !standalone) $('#tip-ios').hidden = false;
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
