# HEALTH AI Fullstack

Bu proje frontend (React + Vite) ve backend (Node.js + Express) katmanlarını tek repo içinde birleştirilmiş şekilde çalıştırır.

A secure, GDPR-compliant web platform for structured partner discovery between healthcare professionals and engineers, developed for the Erasmus+ HEALTH AI Project.

## Gereksinimler

- Node.js 20+
- PostgreSQL 14+ (yerelde Docker ile gelir)

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

4. `backend/.env` içini kendi DB/JWT/SMTP değerlerinle güncelle. Yerelde **PostgreSQL** gerekir (MySQL desteklenmez).

### PostgreSQL olmadan geliştirme (Docker)

Bilgisayarınızda yalnızca MySQL varsa veya PostgreSQL kurmak istemiyorsanız, veritabanını Docker ile açın (Docker Desktop kurulu olmalı):

```bash
npm run dev:db
```

Bu komut yalnızca `docker-compose.yml` içindeki **PostgreSQL** konteynerini başlatır (`localhost:5432`). `backend/.env` içindeki `DB_*` değerleri `.env.example` ile uyumlu olmalı (`DB_PASS=healthai_pass`, docker ile aynı).

Ardından:

```bash
npm run dev:full
```

Durdurmak için: `npm run dev:db:stop`. Docker kullanmak istemezseniz [PostgreSQL’i Windows’a kurabilir](https://www.postgresql.org/download/windows/) ve `backend/.env` ile kendi kullanıcı/veritabanı adınızı yazabilirsiniz.

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

Tüm sistemi (PostgreSQL + backend + frontend sunumu) ayağa kaldır:

```bash
docker compose up --build
```

Servisler:
- Uygulama: `http://localhost:3001`
- Sağlık kontrolü: `http://localhost:3001/health`
- PostgreSQL: `localhost:5432`

Kapatmak için:

```bash
docker compose down
```

Veritabanı verisini de silmek için:

```bash
docker compose down -v
```

## Render.com

1. **PostgreSQL** eklentisi oluştur; ortam değişkeni olarak **`DATABASE_URL`** otomatik eklenir (backend bunu kullanır). Ayrıca **`DB_SSL=true`** ekleyin (TLS).
2. **Web Service** için `PORT` Render tarafından atanır; ekstra `PORT=10000` gerekmez. Sunucu **`0.0.0.0`** üzerinde dinler.
3. Diğer zorunlu değişkenler: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SMTP_*`, `FRONTEND_URL` (canlı site kök URL’si). İsteğe bağlı: `API_PUBLIC_URL` (backend kök URL’si).
4. `DATABASE_URL` kullanıldığında **`DB_HOST` / `DB_NAME` / …** girmeniz gerekmez; Render’daki Secret’lar yeterlidir.
5. İlk kurulumda tabloların oluşması için geçici olarak **`DB_AUTO_SYNC=true`** verebilirsiniz; şema oturduktan sonra kapatın (üretimde `alter` kullanılmıyor).
