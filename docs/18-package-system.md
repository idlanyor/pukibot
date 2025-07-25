# Sistem 18 Paket Pterodactyl WhatsApp Bot

## Overview
Sistem ini mengimplementasikan 18 paket hosting dengan naming alphanumeric yang sederhana (A1-C6) untuk memudahkan pengguna dalam melakukan order.

## Struktur Paket

### 🟢 NodeJS VIP (A1-A6)
- **A1 - NodeJS Kroco**: 512MB RAM, 0.5 CPU - IDR 15.000/bulan
- **A2 - NodeJS Karbit**: 1GB RAM, 1 CPU - IDR 25.000/bulan
- **A3 - NodeJS Standar**: 2GB RAM, 1.5 CPU - IDR 45.000/bulan
- **A4 - NodeJS Sepuh**: 4GB RAM, 2 CPU - IDR 85.000/bulan
- **A5 - NodeJS Suhu**: 8GB RAM, 3 CPU - IDR 160.000/bulan
- **A6 - NodeJS Pro Max**: 16GB RAM, 5 CPU - IDR 300.000/bulan

### 🔧 VPS (B1-B6)
- **B1 - VPS Kroco**: 1GB RAM, 1 CPU - IDR 20.000/bulan
- **B2 - VPS Karbit**: 2GB RAM, 1.5 CPU - IDR 35.000/bulan
- **B3 - VPS Standar**: 4GB RAM, 2 CPU - IDR 65.000/bulan
- **B4 - VPS Sepuh**: 8GB RAM, 3 CPU - IDR 125.000/bulan
- **B5 - VPS Suhu**: 16GB RAM, 5 CPU - IDR 240.000/bulan
- **B6 - VPS Pro Max**: 32GB RAM, 8 CPU - IDR 450.000/bulan

### 🐍 Python (C1-C6)
- **C1 - Python Kroco**: 512MB RAM, 0.5 CPU - IDR 12.000/bulan
- **C2 - Python Karbit**: 1GB RAM, 1 CPU - IDR 22.000/bulan
- **C3 - Python Standar**: 2GB RAM, 1.5 CPU - IDR 40.000/bulan
- **C4 - Python Sepuh**: 4GB RAM, 2 CPU - IDR 75.000/bulan
- **C5 - Python Suhu**: 8GB RAM, 3 CPU - IDR 140.000/bulan
- **C6 - Python Pro Max**: 16GB RAM, 5 CPU - IDR 270.000/bulan

## Konfigurasi Egg

### Server Eggs yang Digunakan:
- **NodeJS VIP**: Egg ID 15
- **VPS**: Egg ID 16
- **Python Generic**: Egg ID 17

## Cara Penggunaan

### Order Paket
```
!order [kode] [durasi]
```

**Contoh:**
- `!order a1 1` - Order NodeJS Kroco untuk 1 bulan
- `!order b3 3` - Order VPS Standar untuk 3 bulan
- `!order c6 12` - Order Python Pro Max untuk 12 bulan

### Cek Status Order
```
!order-status [order-id]
!my-orders
```

### Lihat Katalog
```
!katalog
!store
```

## Keunggulan Sistem Baru

1. **Naming Sederhana**: A1-C6 lebih mudah diingat dan diketik
2. **Kategorisasi Jelas**: 
   - A = NodeJS VIP
   - B = VPS
   - C = Python
3. **Skalabilitas**: 6 tingkatan per kategori (Kroco → Pro Max)
4. **Kompatibilitas**: Tetap mendukung paket legacy untuk transisi

## Implementasi Teknis

### Files yang Dimodifikasi:
- `src/plugins/store/models/Order.ts` - PackageType enum dan PACKAGE_CATALOG
- `src/plugins/store/StorePlugin.ts` - Display katalog dengan kategori
- `src/plugins/store/OrderManager.ts` - Handling order dengan kode baru

### Testing:
- `test-katalog-display.ts` - Test tampilan katalog
- `test-all-packages.ts` - Test semua 18 paket
- `test-egg-configuration.ts` - Verifikasi konfigurasi egg

## Monitoring & Maintenance

### Logs yang Dipantau:
- Order success/failure rate
- Package popularity
- Resource usage per tier

### Maintenance Tasks:
- Update pricing berdasarkan demand
- Monitor server capacity
- Backup database orders

## Troubleshooting

### Common Issues:
1. **Package not found**: Pastikan kode paket benar (a1-c6)
2. **Insufficient resources**: Cek availability server
3. **Payment failed**: Verifikasi payment gateway

### Debug Commands:
```bash
# Test koneksi Pterodactyl
bun run test-pterodactyl-connection.ts

# Test semua paket
bun run test-all-packages.ts

# Test katalog display
bun run test-katalog-display.ts
```

## Roadmap

### Phase 1 (Completed):
- ✅ Implementasi 18 paket
- ✅ Alphanumeric naming
- ✅ Katalog display
- ✅ Testing suite

### Phase 2 (Future):
- 🔄 Analytics dashboard
- 🔄 Auto-scaling resources
- 🔄 Payment integration
- 🔄 Customer portal

---

*Dokumentasi ini dibuat pada: 2025-01-25*
*Sistem Status: Production Ready*