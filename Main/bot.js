const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
  Browsers,
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const P = require('pino');

// ====== KONFIGURASI ======
const PHONE_NUMBER = '628xxxxxxxxxx'; // GANTI ke nomor WA lu sendiri sebelum running

// Semua path dihitung relatif ke lokasi file bot.js ini sendiri (__dirname),
// bukan ke folder tempat `node bot.js` dijalankan. Jadi mau dipanggil dari
// mana pun, dia tetep nyari di dalam folder "Main" yang sama.
const DB_PATH = path.join(__dirname, 'profiling.json');
const FOTO_DIR = path.join(__dirname, 'foto');
const DEFAULT_FOTO_PATH = path.join(FOTO_DIR, 'noFoto.jpg');
const AUTH_DIR = path.join(__dirname, 'auth');

const FOOTER = `\n━━━━━━━━━━━━━━━━━━━━\n© Modify by 🅚🅡🅘🅢🅒🅗🅤\n🚀 Kartu Profil Resmi DDI v1 Gen Z`;

// Daftar field profil yang bisa diisi user.
// Format: 'command' -> key yang dipakai di database JSON.
const PROFILE_FIELDS = {
  '!ddinama': 'nama',
  '!ddipanggil': 'panggil',
  '!ddigender': 'gender',
  '!ddiumur': 'umur',
  '!ddidomisili': 'domisili',
  '!ddiprovinsi': 'provinsi',
  '!ddisekolah': 'sekolah',
  '!ddirole': 'role',
  '!ddimisi': 'misi',
  '!ddihobi': 'hobi',
  '!ddicita': 'cita',
  '!ddiidola': 'idola',
  '!ddifood': 'food',
  '!ddidrink': 'drink',
  '!ddiinterest': 'interest',
  '!ddijago': 'jago',
  '!ddibelajar': 'belajar',
  '!ddiquotes': 'quotes',
};

// ====== SETUP FOLDER & DATABASE (JSON FILE) ======
function ensureStorageExists() {
  if (!fs.existsSync(FOTO_DIR)) fs.mkdirSync(FOTO_DIR, { recursive: true });
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '{}');

  if (!fs.existsSync(DEFAULT_FOTO_PATH)) {
    console.log(
      `⚠️  foto/noFoto.jpg belum ada. Taruh file foto default di:\n   ${DEFAULT_FOTO_PATH}`
    );
  }
}

function loadDB() {
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Nentuin foto mana yang dipakai buat kartu profil:
// foto upload user kalau ada, kalau nggak ada pakai noFoto.jpg,
// kalau noFoto.jpg juga nggak ada, ya kirim tanpa gambar.
function resolveFotoPath(sender, db) {
  const uploaded = db[sender]?.foto;
  if (uploaded && fs.existsSync(uploaded)) return uploaded;
  if (fs.existsSync(DEFAULT_FOTO_PATH)) return DEFAULT_FOTO_PATH;
  return null;
}

// ====== BIKIN KARTU PROFIL (TEKS + MENTION) ======
// Mengembalikan { caption, mentions } karena nama bergaya "@Celine" di WA
// itu bukan teks biasa — itu mention, yang perlu di-set lewat opsi
// `mentions` pas sock.sendMessage, bukan cuma ditulis manual di teks.
function buildProfileCard(sender, db) {
  const d = db[sender] || {};
  const senderNumber = sender.split('@')[0];
  const mentionTag = `@${senderNumber}`;

  const caption = `🚀 *PROFIL DDI - ${mentionTag}*

🧑 Tentang Gue:
• Nama: ${d.nama || '-'}
• Panggilan: ${d.panggil || '-'}
• Gender: ${d.gender || '-'}
• Umur: ${d.umur || '-'}
• Domisili: ${d.domisili || '-'}
• Provinsi: ${d.provinsi || '-'}
• Sekolah: ${d.sekolah || '-'}

💎 DDI Squad:
• Role: ${d.role || '-'}
• Misi: ${d.misi || '-'}

❤️ Favs Gue:
• Hobi: ${d.hobi || '-'}
• Cita: ${d.cita || '-'}
• Idola: ${d.idola || '-'}
• Fav Food: ${d.food || '-'}
• Fav Drink: ${d.drink || '-'}

🔥 Minat & Skill:
• Interest: ${d.interest || '-'}
• Jago: ${d.jago || '-'}
• Pengen Belajar: ${d.belajar || '-'}

✨ Vibe Gue:
"${d.quotes || 'Belum ada quotes'}"${FOOTER}`;

  return { caption, mentions: [sender] };
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ====== HANDLER TIAP PESAN MASUK ======
async function handleMessage(sock, db, msg) {
  if (!msg.message || msg.key.fromMe) return;

  const jid = msg.key.remoteJid;
  const isGroup = jid.endsWith('@g.us');
  const sender = isGroup ? msg.key.participant : jid;

  const text =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    msg.message.imageMessage?.caption ||
    '';

  if (!text.startsWith('!ddi')) return;

  const [rawCommand, ...rest] = text.split(' ');
  const command = rawCommand.toLowerCase();
  const value = rest.join(' ').trim();

  if (!db[sender]) db[sender] = {};

  const reply = (replyText) => sock.sendMessage(jid, { text: `${replyText}${FOOTER}` });

  // Kasus 1: command untuk isi salah satu field profil (!ddinama, !ddiumur, dst)
  if (PROFILE_FIELDS[command]) {
    const field = PROFILE_FIELDS[command];
    db[sender][field] = value;
    saveDB(db);
    await reply(`✅ ${field}: ${value}`);
    return;
  }

  // Kasus 2: upload foto profil
  if (command === '!ddifoto') {
    const image = msg.message.imageMessage;
    if (!image) {
      await reply('❌ Kirim foto pakai caption !ddifoto!');
      return;
    }
    const buffer = await downloadMediaMessage(
      msg,
      'buffer',
      {},
      { logger: P({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
    );
    const fotoPath = path.join(FOTO_DIR, `${sender.replace(/[^0-9]/g, '')}.jpg`);
    fs.writeFileSync(fotoPath, buffer);
    db[sender].foto = fotoPath;
    saveDB(db);
    await reply('✅ Foto disimpan!');
    return;
  }

  // Kasus 3: minta tampilkan kartu profil (foto upload sendiri, atau noFoto.jpg kalau belum ada)
  if (command === '!ddiprofil') {
    const { caption, mentions } = buildProfileCard(sender, db);
    const fotoPath = resolveFotoPath(sender, db);

    if (fotoPath) {
      await sock.sendMessage(jid, { image: fs.readFileSync(fotoPath), caption, mentions });
    } else {
      await sock.sendMessage(jid, { text: caption, mentions });
    }
  }
}

// ====== START BOT ======
async function startBot() {
  ensureStorageExists();

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  // Versi WA Web terbaru. Versi usang bisa ditolak server WA. Kalau gagal
  // fetch (misal sinyal jelek), pakai default bawaan Baileys.
  let version;
  try {
    ({ version } = await fetchLatestBaileysVersion());
  } catch (err) {
    console.log(`⚠️  Gagal ambil versi WA terbaru (${err.message}), pakai default.`);
  }

  const sock = makeWASocket({
    ...(version && { version }),
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'),
  });

  sock.ev.on('creds.update', saveCreds);

  // Kode pairing diminta SEKALI per socket, pas status 'connecting'.
  // Nggak ada setInterval lagi: interval yang dulu bocor ke socket lama
  // tiap reconnect bikin banyak socket zombie rebutan minta kode.
  // Kalau kode expired, matiin bot (Ctrl+C) lalu jalanin ulang.
  let pairingRequested = false;

  sock.ev.on('connection.update', async (update) => {
    const { connection } = update;

    if (connection === 'connecting' && !sock.authState.creds.registered && !pairingRequested) {
      pairingRequested = true;
      try {
        await delay(1500);
        const code = await sock.requestPairingCode(PHONE_NUMBER);
        console.log(`\n🔥 KODE PAIRING UNTUK ${PHONE_NUMBER}:\n   ${code}\nMASUKIN SEKARANG DI WA!`);
      } catch (err) {
        console.log(`❌ Gagal minta kode pairing: ${err.message}`);
      }
    }

    if (connection === 'open') {
      console.log('✅ CONNECTED! FOOTER KRISCHU AKTIF!');
    }

    if (connection === 'close') {
      const statusCode = update.lastDisconnect?.error?.output?.statusCode;
      const reasonText =
        Object.entries(DisconnectReason).find(([, code]) => code === statusCode)?.[0] || 'unknown';
      console.log(`❌ Connection closed. statusCode: ${statusCode} (${reasonText})`);
      console.log(update.lastDisconnect?.error?.message || update.lastDisconnect?.error);

      if (statusCode === DisconnectReason.loggedOut) {
        console.log('🚪 Logged out. Hapus folder auth/ lalu jalanin ulang buat pairing baru.');
        return;
      }
      // Termasuk 515 (restartRequired) yang normal terjadi tepat setelah pairing sukses.
      setTimeout(startBot, 3000);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try {
        await handleMessage(sock, loadDB(), msg);
      } catch (err) {
        console.log(`⚠️  Error handle pesan: ${err.message}`);
      }
    }
  });
}

startBot();
