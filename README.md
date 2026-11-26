# Photobooth – Majlis Apresiasi Murid Cemerlang SK Sungai Setar 2026

A free photo booth web app. Guests open a link, pick a colour (Ungu / Biru) and a frame
(Potret / Landskap), take a photo, and every photo is saved to your Google Drive folder.
Works on iPhone, Android and Windows. No login. Works offline after the first visit.

**Files in this folder**

| File | What it is |
|---|---|
| `index.html`, `style.css`, `app.js` | The app |
| `config.js` | **The one file you edit** (paste your /exec link here) |
| `frames/` | The 4 frames |
| `apps-script/Code.gs` | The Google script (you paste this into Google) |
| `sw.js`, `manifest.webmanifest`, `icons/` | Make it installable and work offline |

---

## PART 1 – Google Apps Script (saves photos to your Drive) ~5 minutes

1. Log in to Google with the **same account that owns the Drive folder**.
2. Go to **https://script.google.com** and click **New project**.
3. Delete everything in the editor. Open `apps-script/Code.gs` from this folder, copy **all** of it, and paste it in.
   (The folder link is already inside the script.)
4. Click the **Save** icon (disk). Name the project `Photobooth SKSS`.
5. Click **Deploy** (top right) → **New deployment**.
6. Click the **gear icon** next to "Select type" → choose **Web app**.
7. Fill in:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
8. Click **Deploy**. Google asks for permission: click **Authorize access** → choose your account →
   if you see "Google hasn't verified this app", click **Advanced** → **Go to Photobooth SKSS (unsafe)** → **Allow**.
   (This is normal. It is your own script.)
9. Copy the **Web app URL**. It ends with `/exec`.
10. Open `config.js` (right-click → open with Notepad / TextEdit). Replace `PASTE_LINK_EXEC_DI_SINI`
    with your link. Keep the quote marks. Save.

> If you ever change `Code.gs`, you must do **Deploy → Manage deployments → pencil → Version: New version → Deploy**.
> The /exec link stays the same.

**Quick test:** paste your /exec link in a browser. You should see `{"ok":true,"info":"Photobooth SKSS aktif"}`.

## PART 2 – GitHub Pages (puts the app online, free) ~10 minutes

1. Make a free account at **https://github.com** and log in.
2. Click **+** (top right) → **New repository**. Name it `photobooth`. Choose **Public**. Click **Create repository**.
3. Click **uploading an existing file**.
4. Open this folder on your computer. Select **everything inside** (index.html, app.js, frames, icons …,
   not the folder itself) and drag it into the GitHub page. Wait until the upload finishes.
   Make sure the `frames` and `icons` folders are there too.
5. Click **Commit changes**.
6. Go to **Settings** → **Pages** (left menu). Under **Branch** choose `main` and `/ (root)` → **Save**.
7. Wait 1–2 minutes and refresh. GitHub shows your link, like
   `https://YOURNAME.github.io/photobooth/`. **That is the link you give to guests.**
   Tip: make a QR code of this link (search "QR code generator") and print it.

If you change `config.js` later, upload it again (Add file → Upload files → Commit).

## PART 3 – Installing on phones (optional but nice)

- **Android (Chrome):** open the link → tap **Pasang aplikasi**, or Chrome menu ⋮ → *Install app*.
- **iPhone (Safari only):** open the link → tap **Share** (square with arrow) → **Add to Home Screen** → **Add**.
- **Windows (Chrome / Edge):** open the link → click **Pasang aplikasi**, or the install icon in the address bar.

**Before the event:** open the link once on each device that will be used, with internet on.
After that it opens even without internet.

## How saving works

- **iPhone:** the button says **Simpan ke Foto**. In the menu that opens, tap **Simpan Imej**.
- **Android / Windows:** **Muat Turun** saves the picture to the Downloads folder.
- Every photo is also sent to your Drive folder automatically. Status shows: *Menyimpan…*, *Tersimpan ✓*
  or *Menunggu sambungan internet*. If the internet is down, the photo stays on the device and uploads later
  (the app must be opened again, or the internet return while it is open).
- File names look like `SKSungaiSetar_ungupotret20261126_103045.jpg`.

## Troubleshooting

| Problem | Fix |
|---|---|
| Status stays "Menunggu sambungan internet" with internet on | `config.js` link missing or wrong. It must start with `https://script.google.com/` and end with `/exec`. |
| Photos not in Drive | Redo Part 1 step 7: *Execute as: Me*, *Anyone*. Then deploy a **new version**. |
| Camera does not open | Allow camera in the browser. The page must be `https://`. Use **Galeri** as a backup. |
| App shows an old version | Close the app fully and open again (it updates in the background). |
