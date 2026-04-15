# HEALTH AI Fullstack

Bu proje frontend (React + Vite) ve backend (Node.js + Express) katmanlarını tek repo içinde birleştirilmiş şekilde çalıştırır.

A secure, GDPR-compliant web platform for structured partner discovery between healthcare professionals and engineers, developed for the Erasmus+ HEALTH AI Project.

## Gereksinimler

- Node.js 20+
- MySQL 8+

## Kurulum

1. Kök dizinde bağımlılıkları kur:

```bash
npm install
```

2. Backend bağımlılıklarını kur:

```bash
npm install --prefix backend
```

3. Backend ortam değişkenlerini hazırla:

```bash
copy backend\.env.example backend\.env
```

4. `backend/.env` içini kendi DB/JWT/SMTP değerlerinle güncelle.

## Geliştirme Modu

Frontend ve backend'i aynı anda çalıştır:

```bash
npm run dev:full
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`
- Vite proxy ile `/api` ve `/health` çağrıları backend'e yönlendirilir.

## Production Benzeri Tek Sunucu Çalıştırma

Frontend build'i üretip backend ile servis et:

```bash
npm run start:full
```

Bu komut:
- frontend için `dist` üretir,
- backend'i başlatır,
- backend üzerinden hem API'yi hem de frontend'i sunar.

## Docker Compose (Tek Komutla Tüm Sistem)

Tüm sistemi (MySQL + backend + frontend sunumu) ayağa kaldır:

```bash
docker compose up --build
```

Servisler:
- Uygulama: `http://localhost:3001`
- Sağlık kontrolü: `http://localhost:3001/health`
- MySQL: `localhost:3306`

Kapatmak için:

```bash
docker compose down
```

Veritabanı verisini de silmek için:

```bash
docker compose down -v
```
