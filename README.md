# Pterodactyl WhatsApp Bot

Bot WhatsApp untuk mengelola store Pterodactyl menggunakan library Baileys dengan runtime Bun dan **Enhanced Timeout Handling**.

## ✨ Fitur Utama

- 🤖 **Bot WhatsApp** dengan integrasi Baileys
- 🎮 **Manajemen Server Pterodactyl** (start, stop, restart, info)
- 🛒 **Sistem Store** dengan katalog produk
- 📊 **Monitoring** dan statistik bot
- ⚡ **Enhanced Timeout Handling** untuk koneksi yang stabil
- 🔄 **Automatic Retry** dengan exponential backoff
- 🛡️ **Error Recovery** yang robust
- 📱 **Multi-platform** support

## 🚀 Fitur Timeout Handling Terbaru

### Perbaikan Masalah Timeout
Bot sekarang dilengkapi dengan sistem timeout handling yang canggih untuk mengatasi masalah:
- ⏰ **Timeout errors** dari WhatsApp API
- 🌐 **Network connectivity issues**
- 🔄 **Connection drops** dan reconnection
- 📱 **Message delivery failures**

### Teknologi yang Digunakan
- **Connection Manager**: Mengelola koneksi dengan retry mechanism
- **Error Handler**: Klasifikasi dan penanganan error yang spesifik
- **Exponential Backoff**: Delay yang adaptif untuk retry
- **Specialized Operations**: Timeout khusus untuk berbagai operasi

## 📋 Persyaratan

- **Bun** >= 1.0.0
- **Node.js** >= 18.0.0 (untuk kompatibilitas)
- **Pterodactyl Panel** dengan API access
- **WhatsApp** account untuk bot

## 🔧 Instalasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd pukibot
```

### 2. Install Dependencies
```bash
bun install
```

### 3. Konfigurasi Environment
```bash
cp .env.example .env
```

Edit file `.env` dengan konfigurasi Anda:

```env
# Bot Configuration
BOT_NAME="Pterodactyl Store Bot"
BOT_PREFIX="."

# Owner Configuration
OWNER_NUMBER="62812345678"
STORE_ADMIN="62812345678"

# Store Configuration
STORE_NAME="Pterodactyl Store"
STORE_CURRENCY="IDR"

# Pterodactyl API Configuration
PTERODACTYL_URL="https://panel.example.com"
PTERODACTYL_API_KEY="ptlc_your_api_key_here"

# Logging
LOG_LEVEL="info"
```

### 4. Jalankan Bot
```bash
# Development mode
bun run dev

# Production mode
bun run start

# Atau gunakan test script
./test-bot.sh
```

## 🎯 Perintah Bot

### Perintah Umum
- `.allmenu` - Menampilkan semua menu yang tersedia
- `.ping` - Cek status bot

### Perintah Store
- `.katalog` - Menampilkan katalog produk
- `.harga [paket]` - Cek harga paket server
- `.order [paket] [durasi]` - Membuat pesanan baru

### Perintah Pterodactyl
- `.server [server_id]` - Info server pterodactyl
- `.start [server_id]` - Menjalankan server
- `.stop [server_id]` - Menghentikan server
- `.restart [server_id]` - Restart server

### Perintah Admin
- `.stats` - Statistik bot dan server

## 🛡️ Timeout Handling Configuration

### Konfigurasi Default

| Operasi | Timeout | Max Retries | Base Delay | Max Delay |
|---------|---------|-------------|------------|-----------|
| Message Send | 15s | 3 | 1s | 15s |
| Command Execution | 45s | 2 | 2s | 30s |
| API Call | 20s | 3 | 0.5s | 10s |
| Connection | 60s | 5 | 5s | 60s |

### Error Types yang Ditangani

- **Timeout Errors**: Automatic retry dengan exponential backoff
- **Network Errors**: Reconnection dengan delay yang adaptif
- **Rate Limiting**: Smart delay untuk menghindari spam
- **Authentication Errors**: Graceful handling tanpa retry
- **Critical Errors**: Immediate failure dengan logging

## 🔄 Deployment

### Menggunakan PM2
```bash
# Install PM2
bun add -g pm2

# Start dengan PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs pukibot
```

### Menggunakan Docker
```bash
# Build image
docker build -t pukibot .

# Run container
docker run -d --name pukibot --env-file .env pukibot

# Atau menggunakan docker-compose
docker-compose up -d
```

## 📊 Monitoring dan Logging

Bot menyediakan logging yang comprehensive untuk monitoring:

- **Connection Status**: Status koneksi WhatsApp
- **Command Execution**: Log semua perintah yang dijalankan
- **Error Tracking**: Detail error dengan stack trace
- **Performance Metrics**: Response time dan memory usage
- **Retry Attempts**: Log semua retry attempts dengan reason

## 🔧 Troubleshooting

### Bot Tidak Terhubung
1. Pastikan QR code sudah di-scan
2. Cek koneksi internet
3. Periksa log untuk error spesifik

### Timeout Errors
- Bot sekarang otomatis menangani timeout dengan retry
- Cek log untuk melihat retry attempts
- Jika masih bermasalah, cek koneksi internet

### Command Tidak Berfungsi
1. Pastikan prefix benar (default: `.`)
2. Cek apakah user memiliki permission
3. Lihat log untuk error details

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

Project ini menggunakan [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [Bun](https://bun.sh) - Fast JavaScript runtime
- [Pterodactyl](https://pterodactyl.io) - Game server management panel

---

**⚠️ Disclaimer**: Bot ini dibuat untuk keperluan edukasi dan penggunaan pribadi. Pastikan untuk mematuhi Terms of Service WhatsApp dan tidak melakukan spam.