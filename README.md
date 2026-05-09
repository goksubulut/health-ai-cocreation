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

1. **PostgreSQL** eklentisi oluştur; **`DATABASE_URL`** genelde Web Service’e otomatik bağlanır. TLS: `DATABASE_URL` içinde `render.com` (veya benzeri uzak host) varsa uygulama **SSL’i otomatik açar**; yine de **`DB_SSL=true`** koyabilirsiniz, **`DB_SSL=false`** sadece özel (ör. TLS’siz test) içindir.
2. Eski **MySQL** döneminden kalan env’leri silin: `DB_PORT=3306`, yanlış `DB_HOST` vb. PostgreSQL ile **çakışıyorsa** bağlantı hatası verir. Ayrı değişken kullanıyorsanız: **`DB_PORT=5432`**, host PostgreSQL ekranındaki hostname olmalı.
3. **PORT**: Render kendi `PORT` değişkenini enjekte eder; manuel `PORT=10000` çoğu zaman gerekmez. Sunucu **`0.0.0.0`** dinler.
4. Zorunlu: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SMTP_*`, `FRONTEND_URL`. İsteğe bağlı: `API_PUBLIC_URL`.
5. `DATABASE_URL` varken **`DB_HOST` / `DB_NAME` / …** girmeniz genelde gerekmez; aynı isimle **eski** değişkenler tanımlıysa kaldırın veya PostgreSQL ile uyumlu yapın.
6. İlk deploy’da tablolar için geçici **`DB_AUTO_SYNC=true`**, şema oturunca **`DB_AUTO_SYNC=false`** (veya kaldırın) önerilir.
7. Logda hâlâ **“MySQL”** veya **`Backend v1.0.0`** görüyorsanız GitHub’a son kod gitmemiş veya Render **yanlış kök dizinden** build alıyordur. Kontrol: GitHub’da `health-ai-cocreation/backend/src/config/database.js` dosyasında **`PostgreSQL bağlantı`** ifadesi olmalı. Repo kökünüz `seng384_project` ise Render **Root Directory** = `health-ai-cocreation` olmalı; Dockerfile bu klasörde.
8. Yeni sürüm açılışta şu satırları yazdırır: **`[HEALTH AI] Backend v1.1.0 · PostgreSQL (pg) · RENDER=…`** ve **`[database] PostgreSQL dialect=postgres ssl=…`**. Bunlar yoksa eski imaj çalışıyordur.
