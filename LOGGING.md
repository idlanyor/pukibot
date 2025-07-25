# Enhanced Logging System

Sistem logging yang telah diperbaiki untuk memberikan tampilan yang lebih menarik dan informatif.

## ✨ Fitur Baru

### 🎨 Visual Improvements
- **Warna-warni**: Setiap level log memiliki warna yang berbeda
- **Emoji Kontekstual**: Emoji yang sesuai dengan konteks logging
- **Timestamp**: Format waktu Indonesia (WIB/WITA/WIT)
- **Banner & Separator**: Pemisah visual yang menarik

### 📝 Contextual Logging Methods

```typescript
import { Logger } from './src/utils/logger';

// Basic logging
Logger.info('Pesan informasi');
Logger.warn('Pesan peringatan');
Logger.error('Pesan error');
Logger.debug('Pesan debug');

// Contextual logging dengan emoji otomatis
Logger.success('Operasi berhasil');
Logger.start('Memulai operasi');
Logger.stop('Menghentikan operasi');

// Context-specific logging
Logger.network('Koneksi jaringan');
Logger.database('Query database');
Logger.auth('Autentikasi user');
Logger.user('Aksi user');
Logger.system('Informasi sistem');
Logger.plugin('Plugin dimuat');
Logger.command('Command dijalankan');
Logger.order('Order dibuat');
Logger.payment('Pembayaran diproses');
Logger.server('Server dimulai');
Logger.message('Pesan diterima');
Logger.notification('Notifikasi dikirim');
Logger.retry('Mencoba ulang');
Logger.timeout('Timeout operasi');
Logger.connection('Koneksi terbentuk');
Logger.bot('Aksi bot');
Logger.store('Operasi toko');
Logger.admin('Aksi admin');
```

### 🛠️ Utility Methods

```typescript
// Banner dengan judul
Logger.banner('APLIKASI DIMULAI', 'v1.0.0 - production');

// Separator dengan atau tanpa judul
Logger.separator('Bagian Baru');
Logger.separator(); // Garis pemisah saja

// Performance monitoring
Logger.performance('Database query', 1500); // ms

// Memory usage
Logger.memory();
```

### 📁 File Logging

Logging otomatis ke file dengan konfigurasi:

```env
LOG_FILE=true
LOG_DIR=./logs
```

File log disimpan dengan format: `app-YYYY-MM-DD.log`

### ⚙️ Konfigurasi Environment

```env
# Logging Configuration
LOG_LEVEL=info          # debug, info, warn, error
LOG_FILE=true          # true/false - aktifkan file logging
LOG_DIR=./logs         # direktori file log
HOSTNAME=pukibot-server # hostname untuk logging
NODE_ENV=development   # development/production
```

### 🎯 Level Logging

- **DEBUG** 🔍 - Informasi detail untuk debugging
- **INFO** 📝 - Informasi umum
- **WARN** ⚠️ - Peringatan yang perlu diperhatikan  
- **ERROR** ❌ - Error yang perlu ditangani

### 🌈 Color Scheme

- **INFO**: Cyan terang
- **WARN**: Kuning terang
- **ERROR**: Merah terang
- **DEBUG**: Magenta terang

### 📊 Contoh Output

```
25/07/2025, 20.40.34 INFO 📋 ════════════════════════════════════════════════════════════
25/07/2025, 20.40.34 INFO 🚀 🎯 PTERODACTYL WHATSAPP BOT
25/07/2025, 20.40.34 INFO 📝    v1.0.0 - development
25/07/2025, 20.40.34 INFO 📋 ════════════════════════════════════════════════════════════
25/07/2025, 20.40.34 INFO 🚀 Memulai Pterodactyl WhatsApp Bot...
25/07/2025, 20.40.34 INFO 🔗 Bot berhasil terhubung ke WhatsApp!
25/07/2025, 20.40.34 INFO 🤖 Bot Name: Pterodactyl Store Bot
25/07/2025, 20.40.34 INFO ⚙️ Prefix: !
25/07/2025, 20.40.34 INFO 💾 Memory Usage - RSS: 54.14MB, Heap: 0.22/2.58MB
25/07/2025, 20.40.34 INFO ⚙️ Node.js: v20.11.0
25/07/2025, 20.40.34 INFO ⚙️ Platform: linux x64
```

### 🔄 Migration dari Logger Lama

Logger baru tetap kompatibel dengan kode lama:

```typescript
// Cara lama (masih berfungsi)
Logger.info('🚀 Memulai bot...');

// Cara baru (lebih baik)
Logger.start('Memulai bot...');
```

### 🧪 Testing

Jalankan test logger untuk melihat semua fitur:

```bash
cd /home/roy/pukibot
LOG_LEVEL=debug NODE_ENV=development bun test-logger.ts
```

### 📈 Performance

- Logging asynchronous untuk performa optimal
- File rotation otomatis per hari
- Memory usage monitoring built-in
- Zero impact pada production performance