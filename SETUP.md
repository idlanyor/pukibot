# Pterodactyl WhatsApp Bot - Setup Instructions

## 🚀 Quick Start

Proyek ini telah dikonfigurasi dan siap digunakan! Ikuti langkah-langkah berikut:

### 1. Konfigurasi Environment
Edit file `.env` dan sesuaikan dengan kebutuhan Anda:

```bash
# Bot Configuration
BOT_NAME=Pterodactyl Store Bot
BOT_PREFIX=!
OWNER_NUMBER=628xxxxxxxxxx  # Ganti dengan nomor WhatsApp Anda

# Pterodactyl Panel Configuration
PTERODACTYL_URL=https://panel.yourdomain.com  # URL panel Pterodactyl
PTERODACTYL_API_KEY=your_api_key_here         # API key dari panel

# Store Configuration
STORE_NAME=Pterodactyl Store
STORE_CURRENCY=IDR
STORE_ADMIN=628xxxxxxxxxx  # Nomor admin untuk notifikasi pesanan
```

### 2. Menjalankan Bot

```bash
# Development mode (dengan auto-reload)
bun run dev

# Production mode
bun run start
```

### 3. Scan QR Code
Setelah bot berjalan, scan QR code yang muncul di terminal dengan WhatsApp Web.

## 📋 Perintah Bot

### Perintah Umum
- `!help` - Menampilkan daftar perintah
- `!ping` - Cek status bot

### Perintah Store
- `!katalog` - Lihat paket yang tersedia
- `!harga [paket]` - Cek harga paket tertentu
- `!order [paket] [durasi]` - Buat pesanan baru

### Perintah Pterodactyl (memerlukan konfigurasi API)
- `!server [server_id]` - Info server
- `!start [server_id]` - Jalankan server
- `!stop [server_id]` - Hentikan server
- `!restart [server_id]` - Restart server

### Perintah Admin
- `!stats` - Statistik bot (hanya untuk admin)

## 🔧 Troubleshooting

### Bot tidak terhubung
1. Pastikan QR code sudah di-scan dengan benar
2. Hapus folder `sessions` dan scan ulang
3. Periksa koneksi internet

### Error Pterodactyl API
1. Pastikan `PTERODACTYL_URL` benar
2. Verifikasi `PTERODACTYL_API_KEY` masih aktif
3. Cek permission API key di panel

## 🎯 Status

✅ **FIXED ISSUES:**
- ✅ Missing package.json - Created
- ✅ Missing tsconfig.json - Created  
- ✅ Missing .env file - Created from template
- ✅ Import path issues - Fixed .js extensions
- ✅ Boom import error - Fixed
- ✅ Logger configuration - Simplified
- ✅ Dependencies installed - All packages available
- ✅ Bot compilation - Working correctly
- ✅ Bot startup - Successfully starts and shows QR code

**Bot is now fully functional and ready to use!**

## 📞 Support

Jika mengalami masalah, periksa:
1. File `.env` sudah dikonfigurasi dengan benar
2. Dependencies sudah terinstall (`bun install`)
3. Bun versi terbaru (`bun --version`)

Bot siap digunakan! 🎉