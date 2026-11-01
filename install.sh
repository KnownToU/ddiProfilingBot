#!/data/data/com.termux/files/usr/bin/bash
# Setup folder proyek ddiBot di penyimpanan internal HP.
# Jalankan dari Termux. Pastikan sudah run `termux-setup-storage` dulu
# dan izinnya sudah dikasih (lihat README.txt).

set -e

PROJECT_DIR="$HOME/storage/shared/Documents/Proyek/ddiBot/Main"

# git WAJIB ada: @whiskeysockets/baileys narik salah satu dependency-nya
# (libsignal) langsung dari git+https, bukan dari npm registry.
pkg update -y && pkg install nodejs git -y

mkdir -p "$PROJECT_DIR"
mkdir -p "$PROJECT_DIR/foto"
cd "$PROJECT_DIR"

npm init -y

# .npmrc proyek: dua kebijakan npm yang HARUS dilonggarkan buat setup ini,
# supaya nggak perlu diketik manual tiap kali npm install.
#
# 1. bin-links=false
#    Shared storage (/storage/emulated/0/...) di-mount lewat FUSE, yang
#    tidak mendukung symlink. npm normalnya bikin symlink di
#    node_modules/.bin/, jadi tanpa ini install/uninstall bakal gagal
#    dengan error EACCES: permission denied, symlink ...
#
# 2. allow-git=all
#    Sejak npm 12, default kebijakan allow-git itu "none" -> npm nolak
#    semua fetch dependency via git. Baileys (versi mana pun, stable
#    maupun rc) narik libsignal dari git+https://github.com/..., jadi
#    tanpa ini install bakal gagal dengan error EALLOWGIT, bukan cuma
#    di versi tertentu.
cat > .npmrc <<'EOF'
bin-links=false
allow-git=all
EOF

npm install @whiskeysockets/baileys@latest pino

echo '{}' > profiling.json

echo ""
echo "✅ Folder proyek siap di: $PROJECT_DIR"
echo "Langkah selanjutnya (manual):"
echo "1. Taruh bot.js ke folder itu."
echo "2. Taruh satu foto default dengan nama persis 'noFoto.jpg' ke folder foto/ di dalamnya."
echo "3. cd ke folder itu, lalu jalankan: node bot.js"
