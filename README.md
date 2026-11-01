# DDI Profiling Bot

Bot WhatsApp sederhana untuk mengisi dan menampilkan **kartu profil DDI**. User mengirim command seperti `!ddinama` atau `!ddiumur` ke nomor bot, datanya disimpan di file JSON lokal, lalu `!ddiprofil` menampilkan kartu profil (teks + foto) hasil rangkumannya.

- **Teknologi:** Node.js + [`@whiskeysockets/baileys`](https://github.com/WhiskeySockets/Baileys)
- **Dijalankan di:** Termux (Android)
- **Akun yang dipakai:** WhatsApp biasa **atau** WhatsApp Business (keduanya didukung)
- **Metode login:** pairing code (bukan scan QR)

---

## Daftar Isi

1. [Cara Kerja Singkat](#cara-kerja-singkat)
2. [Daftar Command](#daftar-command)
3. [Struktur Folder](#struktur-folder)
4. [Instalasi](#instalasi)
5. [Konfigurasi](#konfigurasi)
6. [Menjalankan & Pairing](#menjalankan--pairing)
7. [Kenapa Konfigurasi npm-nya Aneh](#kenapa-konfigurasi-npm-nya-aneh)
8. [Troubleshooting](#troubleshooting)
9. [Keterbatasan yang Diketahui](#keterbatasan-yang-diketahui)
10. [Catatan Keamanan](#catatan-keamanan)
11. [Status Proyek](#status-proyek)
12. [Kredit](#kredit)

---

## Cara Kerja Singkat

1. Bot login ke akun WhatsApp (biasa atau Business) sebagai *linked device* (seperti WA Web) lewat pairing code.
2. User lain mengirim command berawalan `!ddi` ke nomor bot, di chat pribadi maupun grup.
3. Setiap user punya data sendiri, dikunci berdasarkan **nomor pengirimnya**, disimpan di `profiling.json`.
4. `!ddiprofil` menyusun kartu profil dan mengirimnya bersama foto user.

> **Penting:** bot mengabaikan pesan dari akun yang dipakai bot itu sendiri.
> Jadi untuk mencoba command, kirim dari **nomor lain**, bukan dari akun WhatsApp yang di-link.

---

## Daftar Command

Format: `!command isi`, contoh `!ddinama Celine`.

### Isi data profil

| Command | Isi | Muncul di kartu |
|---|---|---|
| `!ddinama` | Nama lengkap | Tentang Gue |
| `!ddipanggil` | Nama panggilan | Tentang Gue |
| `!ddigender` | Gender | Tentang Gue |
| `!ddiumur` | Umur | Tentang Gue |
| `!ddidomisili` | Kota/domisili | Tentang Gue |
| `!ddiprovinsi` | Provinsi | Tentang Gue |
| `!ddisekolah` | Sekolah | Tentang Gue |
| `!ddirole` | Role di DDI | DDI Squad |
| `!ddimisi` | Misi | DDI Squad |
| `!ddihobi` | Hobi | Favs Gue |
| `!ddicita` | Cita-cita | Favs Gue |
| `!ddiidola` | Idola | Favs Gue |
| `!ddifood` | Makanan favorit | Favs Gue |
| `!ddidrink` | Minuman favorit | Favs Gue |
| `!ddiinterest` | Minat | Minat & Skill |
| `!ddijago` | Hal yang dikuasai | Minat & Skill |
| `!ddibelajar` | Yang ingin dipelajari | Minat & Skill |
| `!ddiquotes` | Quotes | Vibe Gue |

### Command lain

| Command | Fungsi |
|---|---|
| `!ddifoto` | Upload foto profil. **Kirim foto dengan caption `!ddifoto`.** |
| `!ddiprofil` | Tampilkan kartu profil lengkap (nama di judul berupa mention `@nomor`). |

**Aturan foto di kartu profil:**
1. Pakai foto upload user, kalau ada.
2. Kalau belum ada, pakai `foto/noFoto.jpg`.
3. Kalau itu juga tidak ada, kartu dikirim tanpa gambar.

---

## Struktur Folder

Struktur ini disengaja, jangan diubah tanpa alasan kuat.

```
/storage/emulated/0/Documents/Proyek/ddiBot/Main/
├── bot.js            # kode utama
├── .npmrc            # konfigurasi npm (dibuat otomatis oleh install.sh)
├── install.sh        # skrip setup awal
├── profiling.json    # "database" JSON sederhana (auto-generated)
├── auth/             # sesi login WhatsApp (auto-generated)
└── foto/
    ├── noFoto.jpg    # foto default (TARUH MANUAL)
    └── <nomor>.jpg   # foto upload user (auto-generated)
```

Semua path di `bot.js` memakai `__dirname`, bukan `process.cwd()`, jadi bot tetap
menemukan file-nya dari folder mana pun `node bot.js` dijalankan.

---

## Instalasi

### Prasyarat

- Termux terpasang dan izin penyimpanan sudah diberikan:
  ```bash
  termux-setup-storage
  ```
- Koneksi internet.
- Akun WhatsApp (biasa atau Business) yang aktif di HP yang sama.

### Langkah

1. Jalankan skrip setup dari Termux:
   ```bash
   bash install.sh
   ```
   Skrip ini akan: meng-update paket, memasang `nodejs` dan `git`, membuat folder proyek,
   membuat `.npmrc`, memasang `@whiskeysockets/baileys` dan `pino`, lalu membuat `profiling.json` kosong.
2. Taruh `bot.js` di folder proyek (`.../ddiBot/Main/`).
3. Taruh satu foto default bernama **persis** `noFoto.jpg` di folder `foto/`.
4. Atur nomor WhatsApp di `bot.js` (lihat bagian berikut).

> `git` wajib terpasang. Baileys menarik salah satu dependency-nya (`libsignal`) langsung dari GitHub, bukan dari npm.

---

## Konfigurasi

Buka `bot.js`, ubah satu baris ini:

```js
const PHONE_NUMBER = '628xxxxxxxxxx';
```

Aturan format nomor:

- Pakai kode negara, **tanpa** `+`.
- **Tanpa** angka `0` di depan.
- **Tanpa** spasi, strip, atau tanda kurung.
- Harus **sama persis** dengan nomor akun WhatsApp yang dipakai login.

Contoh: `+62 812-3456-7890` ditulis `6281234567890`.

---

## Menjalankan & Pairing

1. **Hapus folder `auth/`** kalau ada sesi lama (hanya untuk pairing pertama atau pairing ulang).
2. Di HP, buka **WhatsApp (biasa atau Business) → Pengaturan → Perangkat tertaut → Tautkan perangkat → Tautkan dengan nomor telepon**. Biarkan layar input kode terbuka.
3. Di Termux:
   ```bash
   cd ~/storage/shared/Documents/Proyek/ddiBot/Main
   node bot.js
   ```
4. Kode 8 karakter akan muncul di terminal. **Langsung ketik di HP.** Kode hanya berlaku singkat.
5. Kalau berhasil, terminal menampilkan `✅ CONNECTED!`.

Kalau kode keburu expired: `Ctrl+C`, lalu jalankan `node bot.js` lagi untuk kode baru.
Setelah login berhasil, sesi tersimpan di `auth/` sehingga run berikutnya tidak perlu pairing lagi.

> Muncul `statusCode: 515 (restartRequired)` sesaat setelah pairing berhasil itu **normal**. Bot otomatis menyambung ulang.

---

## Kenapa Konfigurasi npm-nya Aneh

`install.sh` membuat file `.npmrc` berisi dua baris. Keduanya wajib untuk setup ini:

| Setting | Alasan |
|---|---|
| `bin-links=false` | Penyimpanan bersama (`/storage/emulated/0/...`) di-mount lewat FUSE yang **tidak mendukung symlink**. Tanpa ini, `npm install` dan `npm uninstall` gagal dengan `EACCES: symlink`. |
| `allow-git=all` | Sejak npm 12, default `allow-git` adalah `none`. Baileys (versi apa pun) menarik `libsignal` lewat `git+https`, jadi tanpa ini install gagal dengan `EALLOWGIT`. |

---

## Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| `CANNOT LINK EXECUTABLE (symbol _ZNSt6...)` | Paket Termux tidak sinkron | `pkg upgrade -y`, lalu pasang ulang `nodejs` dan `libc++` bersamaan |
| Repo Termux error `522` / `not signed` | Mirror bermasalah | `termux-change-repo`, ganti mirror |
| `Cannot find module '@whiskeysockets/baileys'` | `npm install` belum pernah sukses | Jalankan ulang `install.sh` |
| `npm install` / `uninstall` gagal `EACCES` symlink | Symlink tidak didukung FUSE | Pastikan `.npmrc` berisi `bin-links=false` (juga untuk uninstall) |
| `EALLOWGIT` saat install | Kebijakan npm 12 | Pastikan `.npmrc` berisi `allow-git=all` dan `git` terpasang |
| Warning `install-scripts blocked` | Skrip install Baileys/protobufjs diblokir | Abaikan, cuma warning, bot tetap jalan |
| `statusCode: 401 (loggedOut)` terus-menerus | Sesi lama korup / sudah logout | Hapus folder `auth/`, jalankan ulang, pairing baru. Bot sengaja berhenti, bukan loop. |
| WA: *"Gagal menautkan ke perangkat"* | Lihat daftar cek di bawah | - |
| Command tidak dibalas | Dikirim dari nomor bot sendiri | Kirim dari nomor lain |
| Muncul peringatan `noFoto.jpg belum ada` | Foto default belum ditaruh | Taruh `noFoto.jpg` di `foto/` |

### Kalau muncul "Gagal menautkan ke perangkat"

Cek berurutan:

1. **Timing.** Layar *Tautkan dengan nomor telepon* sudah terbuka **sebelum** `node bot.js` dijalankan, dan kode diketik dalam hitungan detik.
2. **Sesi bersih.** Folder `auth/` sudah dihapus sebelum mencoba.
3. **Slot perangkat.** WhatsApp hanya mengizinkan sekitar 4 perangkat tertaut. Buka *Perangkat tertaut* di WhatsApp lu dan hapus yang tidak terpakai.
4. **Nomor.** `PHONE_NUMBER` sama persis dengan nomor akun yang login (lihat [Konfigurasi](#konfigurasi)).
5. **Versi Baileys.** Coba turunkan ke versi stabil 6.x, misalnya:
   ```bash
   npm install @whiskeysockets/baileys@6.7.18
   ```
6. **Opsi cadangan.** Lakukan pairing sekali di laptop/VPS, lalu salin folder `auth/` ke Termux.
7. Kalau masih gagal, cari di [GitHub Issues Baileys](https://github.com/WhiskeySockets/Baileys/issues). Kemungkinan itu known issue di sisi library.

---

## Keterbatasan yang Diketahui

- **Race condition `!ddifoto`.** Database dibaca di awal, lalu ada proses download foto, baru disimpan. Kalau user lain mengisi data tepat saat itu, data user tersebut bisa tertimpa. Command teks biasa tidak terkena. *(Belum ditambal.)*
- **Penulisan JSON tidak atomik.** Kalau HP mati tepat saat `profiling.json` ditulis, file bisa korup. Solusinya: tulis ke file sementara lalu di-rename. *(Belum ditambal.)*
- **Satu instance saja.** Jangan jalankan dua proses bot dengan folder `auth/` yang sama.
- **Bukan database sungguhan.** `profiling.json` cukup untuk skala kecil, tidak untuk banyak pengguna bersamaan.

---

## Catatan Keamanan

- Pakai **hanya** paket resmi `@whiskeysockets/baileys`. Sudah ada fork Baileys di npm yang terbukti berisi backdoor: kode pairing disusupi sehingga penerbitnya bisa menautkan perangkatnya ke akun WhatsApp pengguna. Jangan memasang fork dari penulis yang tidak jelas.
- WhatsApp tidak merestui bot lewat library tidak resmi seperti Baileys, jadi akun (biasa maupun Business) berisiko dibanned. Kalau bot jalan terus-menerus, lebih aman pakai nomor sekunder, bukan nomor utama.
- Folder `auth/` setara kunci akun WhatsApp. **Jangan dibagikan, jangan di-commit ke Git.** Tambahkan `auth/` dan `profiling.json` ke `.gitignore` bila proyek ini dipublikasikan.
- `profiling.json` berisi data pribadi user (nama, umur, sekolah, domisili). Perlakukan sesuai itu.

---

## Status Proyek

- Command handler, kartu profil bergaya section, mention `@nomor`, dan fallback foto sudah berfungsi.
- Kode pairing sudah dirombak: diminta **sekali per socket** saat status `connecting`, tanpa `setInterval`. Versi lama membocorkan interval ke socket lama setiap reconnect sehingga banyak socket zombie rebutan meminta kode.
- Socket memakai `fetchLatestBaileysVersion()` dan `Browsers.ubuntu('Chrome')`. Reconnect otomatis dengan jeda 3 detik.
- `!ddifoto` sudah memakai `downloadMediaMessage` yang di-import dari Baileys (sebelumnya memanggil fungsi yang tidak ada).
- Handler pesan hanya memproses tipe `notify` dan dibungkus `try/catch`.

---

## Kredit

- **Konsep, daftar command, dan versi awal bot:** Khrisna (DDI), [@krischu2010](https://github.com/krischu2010). Footer kartu profil ("Modify by KRISCHU") adalah milik beliau dan sengaja dipertahankan.
- **Perbaikan bug, perombakan kode, dokumentasi, dan skrip setup:** [@KnownToU](https://github.com/KnownToU) sebagai co-author.
