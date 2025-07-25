# Pterodactyl WhatsApp Bot

Bot WhatsApp untuk mengelola store Pterodactyl menggunakan library Baileys dengan runtime Bun.

## 🚀 Fitur

- ✅ **Manajemen Server Pterodactyl**
  - Start/Stop/Restart server
  - Monitoring status server
  - Informasi resource usage
  - Backup management

- 🛒 **Sistem Store**
  - Katalog produk/paket server
  - Sistem pemesanan otomatis
  - Manajemen harga
  - Notifikasi admin

- 🤖 **Bot WhatsApp**
  - QR Code authentication
  - Multi-device support
  - Command system
  - Admin controls

## 📋 Persyaratan

- **Bun** >= 1.0.0
- **Node.js** >= 18.0.0 (sebagai fallback)
- **Pterodactyl Panel** dengan API access
- **WhatsApp** account

## 🛠️ Instalasi

1. **Clone repository:**
   ```bash
   git clone <repository-url>
   cd botwa
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Konfigurasi environment:**
   ```bash
   cp .env.example .env
   nano .env
   ```

4. **Jalankan bot:**
   ```bash
   bun start
   ```

## ⚙️ Konfigurasi

Salin file `.env.example` ke `.env` dan sesuaikan konfigurasi:

```env
# Bot Configuration
BOT_NAME=Pterodactyl Store Bot
BOT_PREFIX=!
OWNER_NUMBER=628xxxxxxxxxx

# Pterodactyl Panel Configuration
PTERODACTYL_URL=https://panel.yourdomain.com
PTERODACTYL_API_KEY=your_api_key_here

# Store Configuration
STORE_NAME=Pterodactyl Store
STORE_CURRENCY=IDR
STORE_ADMIN=628xxxxxxxxxx
```

### Mendapatkan Pterodactyl API Key

1. Login ke Pterodactyl Panel
2. Buka **Account API**
3. Buat **Client API Key** baru
4. Salin key dan masukkan ke `.env`

## 🎮 Penggunaan

### Perintah Umum

- `!help` - Menampilkan daftar perintah
- `!ping` - Cek status bot
- `!stats` - Statistik bot (admin only)

### Perintah Store

- `!katalog` - Lihat paket yang tersedia
- `!harga [paket]` - Cek harga paket tertentu
- `!order [paket] [durasi]` - Buat pesanan baru

### Perintah Pterodactyl

- `!server [server_id]` - Info server
- `!start [server_id]` - Jalankan server
- `!stop [server_id]` - Hentikan server
- `!restart [server_id]` - Restart server

## 📁 Struktur Project

```
botwa/
├── src/
│   ├── commands/
│   │   └── commandManager.ts    # Manajemen perintah
│   ├── handlers/
│   │   └── messageHandler.ts    # Handler pesan WhatsApp
│   ├── services/
│   │   └── pterodactylAPI.ts    # Integrasi Pterodactyl API
│   ├── utils/
│   │   ├── logger.ts            # Logging utility
│   │   └── utils.ts             # Helper functions
│   └── index.ts                 # Entry point aplikasi
├── sessions/                    # WhatsApp auth sessions
├── .env                        # Environment config
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Development

### Menjalankan dalam mode development:
```bash
bun dev
```

### Build untuk production:
```bash
bun run build
```

### Menjalankan dengan Node.js (fallback):
```bash
npm start
```

## 🐳 Docker (Opsional)

### Dockerfile
```dockerfile
FROM oven/bun:1

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install

COPY . .
EXPOSE 3000

CMD ["bun", "start"]
```

### Build dan run:
```bash
docker build -t pterodactyl-bot .
docker run -d --name pterodactyl-bot pterodactyl-bot
```

## 📱 Setup WhatsApp

1. Jalankan bot dengan `bun start`
2. Scan QR code dengan WhatsApp Web
3. Bot akan otomatis terhubung dan siap digunakan

## 🛡️ Keamanan

- **API Keys**: Jangan commit file `.env` ke repository
- **Admin Access**: Pastikan nomor admin dikonfigurasi dengan benar
- **Server Access**: Gunakan API key dengan permission minimal yang diperlukan

## 🔄 Auto Restart (PM2)

Install PM2 dan jalankan bot:
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### ecosystem.config.js
```javascript
module.exports = {
  apps: [{
    name: 'pterodactyl-bot',
    script: 'bun',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

## 🚨 Troubleshooting

### Bot tidak terhubung ke WhatsApp
- Pastikan QR code sudah di-scan
- Hapus folder `sessions` dan scan ulang
- Periksa koneksi internet

### Error Pterodactyl API
- Pastikan URL panel benar
- Verifikasi API key masih aktif
- Cek permission API key

### Error Bun Runtime
- Install ulang Bun: `curl -fsSL https://bun.sh/install | bash`
- Gunakan Node.js sebagai fallback

## 📞 Support

- **GitHub Issues**: [Repository Issues]
- **WhatsApp**: wa.me/628xxxxxxxxxx
- **Email**: admin@yourdomain.com

## 📄 License

MIT License - lihat file [LICENSE](LICENSE) untuk detail.

## 🤝 Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request

## 📝 Changelog

### v1.0.0
- Initial release
- Basic WhatsApp bot functionality
- Pterodactyl API integration
- Store system implementation
- Bun runtime support

---

**Made with ❤️ for Pterodactyl Store Management**