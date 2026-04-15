# HEALTH AI Backend — Kurulum Talimatları

## 1. Bağımlılıkları Yükle
```bash
cd backend
npm install
```

## 2. Ortam Dosyasını Oluştur
```bash
cp .env.example .env
# .env dosyasını kendi değerlerinle düzenle
```

## 3. MySQL Veritabanını Oluştur
```sql
CREATE DATABASE healthai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 4. Sunucuyu Başlat (Geliştirme)
```bash
npm run dev
```
Sunucu `http://localhost:3001` adresinde çalışır.  
Tablolar ilk başlatmada otomatik oluşturulur (`sequelize.sync({ alter: true })`).

## 5. Sağlık Kontrolü
```
GET http://localhost:3001/health
```

---

## Mevcut Endpoint'ler (Faz 1)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | /api/auth/register | Kayıt ol |
| GET  | /api/auth/verify-email/:token | E-posta doğrula |
| POST | /api/auth/login | Giriş yap |
| POST | /api/auth/refresh | Token yenile |
| POST | /api/auth/logout | Çıkış yap |
| POST | /api/auth/forgot-password | Şifre sıfırlama emaili |
| POST | /api/auth/reset-password/:token | Yeni şifre belirle |

## Faz 2'de Eklenecekler
- Post CRUD endpoint'leri
- Arama & filtreleme
- Meeting request workflow
- User profil yönetimi
- Admin dashboard
