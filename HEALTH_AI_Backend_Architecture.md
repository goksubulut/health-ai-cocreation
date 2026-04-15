# HEALTH AI — Backend Mimari Planı
**Stack:** Node.js + Express · MySQL · JWT Auth  
**Tarih:** Nisan 2026

---

## 1. Teknoloji Seçimleri

| Katman | Teknoloji | Gerekçe |
|---|---|---|
| Runtime | Node.js 20 LTS | Express ile native uyum |
| Framework | Express 4 | Hafif, esnek, geniş ekosistem |
| Veritabanı | MySQL 8 | İlişkisel, GDPR logları için ideal |
| ORM | Sequelize 6 | Migration desteği, model validasyonu |
| Auth | JWT (access + refresh token) | Stateless, ölçeklenebilir |
| Şifreleme | bcrypt (saltRounds: 12) | Endüstri standardı |
| Email | Nodemailer + SMTP | .edu doğrulama, bildirimler |
| Rate Limit | express-rate-limit | Brute-force koruması |
| Güvenlik | Helmet.js + CORS | HTTP header güvenliği |
| Validasyon | Joi | Request body şema doğrulama |
| Loglama | Winston | Structured logging, dosyaya yaz |

---

## 2. Klasör Yapısı

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Sequelize bağlantısı
│   │   ├── env.js               # dotenv yükleyici + validasyon
│   │   └── corsOptions.js       # CORS whitelist
│   │
│   ├── models/                  # Sequelize modelleri
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── MeetingRequest.js
│   │   ├── TimeSlot.js
│   │   ├── NdaAcceptance.js
│   │   ├── ActivityLog.js
│   │   └── index.js             # İlişkileri tanımlar
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── postController.js
│   │   ├── meetingController.js
│   │   └── adminController.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── posts.js
│   │   ├── meetings.js
│   │   └── admin.js
│   │
│   ├── middleware/
│   │   ├── authenticate.js      # JWT doğrulama
│   │   ├── authorize.js         # RBAC (rol kontrolü)
│   │   ├── activityLogger.js    # Her işlemi logla
│   │   ├── rateLimiter.js       # Endpoint bazlı rate limit
│   │   └── validate.js          # Joi schema middleware
│   │
│   ├── services/
│   │   ├── emailService.js      # Doğrulama + bildirim emailleri
│   │   ├── matchingService.js   # Şehir/alan bazlı eşleştirme
│   │   └── exportService.js     # GDPR veri export (JSON/CSV)
│   │
│   ├── validations/             # Joi şemaları
│   │   ├── authSchemas.js
│   │   ├── postSchemas.js
│   │   └── meetingSchemas.js
│   │
│   └── app.js                   # Express app setup
│
├── migrations/                  # Sequelize migration dosyaları
├── seeders/                     # Test verisi
├── logs/                        # Winston log dosyaları
├── .env.example
├── package.json
└── server.js                    # Giriş noktası
```

---

## 3. Veritabanı Şeması

### 3.1 `users` Tablosu
```sql
CREATE TABLE users (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  email         VARCHAR(255) UNIQUE NOT NULL,       -- sadece .edu
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('engineer','healthcare','admin') NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  institution   VARCHAR(255),
  city          VARCHAR(100),
  country       VARCHAR(100),
  expertise     VARCHAR(255),
  is_verified   BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  verify_token  VARCHAR(255),
  verify_expiry DATETIME,
  last_login    DATETIME,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME ON UPDATE CURRENT_TIMESTAMP
);
```

### 3.2 `posts` Tablosu
```sql
CREATE TABLE posts (
  id                   INT PRIMARY KEY AUTO_INCREMENT,
  user_id              INT NOT NULL REFERENCES users(id),
  title                VARCHAR(255) NOT NULL,
  domain               VARCHAR(100) NOT NULL,        -- cardiology, AI, etc.
  description          TEXT NOT NULL,
  required_expertise   VARCHAR(255),
  project_stage        ENUM('idea','concept_validation','prototype','pilot','pre_deployment'),
  commitment_level     ENUM('advisor','co_founder','research_partner'),
  confidentiality      ENUM('public','meeting_only') DEFAULT 'public',
  status               ENUM('draft','active','meeting_scheduled','partner_found','expired')
                         DEFAULT 'draft',
  city                 VARCHAR(100),
  country              VARCHAR(100),
  expiry_date          DATE,
  auto_close           BOOLEAN DEFAULT FALSE,
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME ON UPDATE CURRENT_TIMESTAMP
);
```

### 3.3 `meeting_requests` Tablosu
```sql
CREATE TABLE meeting_requests (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  post_id          INT NOT NULL REFERENCES posts(id),
  requester_id     INT NOT NULL REFERENCES users(id),
  post_owner_id    INT NOT NULL REFERENCES users(id),
  message          TEXT,
  nda_accepted     BOOLEAN DEFAULT FALSE,
  nda_accepted_at  DATETIME,
  status           ENUM('pending','accepted','declined','scheduled','cancelled')
                     DEFAULT 'pending',
  proposed_time    DATETIME,                          -- ~~time_slots tablosu yerine~~ tek seferlik öneri
  confirmed_slot   DATETIME,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME ON UPDATE CURRENT_TIMESTAMP
);
-- NOT: Karmaşık slot müzakeresi harici platforma bırakılır (Zoom/Teams).
-- Backend sadece tek bir proposed_time + confirmed_slot tutar.
```

### 3.4 `nda_acceptances` Tablosu
```sql
CREATE TABLE nda_acceptances (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT NOT NULL REFERENCES users(id),
  post_id     INT NOT NULL REFERENCES posts(id),
  accepted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address  VARCHAR(45),
  UNIQUE KEY unique_nda (user_id, post_id)
);
```

### 3.6 `activity_logs` Tablosu
```sql
CREATE TABLE activity_logs (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id       INT REFERENCES users(id),
  role          ENUM('engineer','healthcare','admin'),
  action_type   VARCHAR(100) NOT NULL,   -- Sadece kritik: 'LOGIN', 'POST_CREATE'
  target_entity VARCHAR(100),
  target_id     INT,
  result_status ENUM('success','failure') DEFAULT 'success',
  ip_hash       VARCHAR(64),             -- crypto.createHash('sha256') ile hash
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action_type (action_type),
  INDEX idx_created_at (created_at)
);
-- NOT: Sadece kritik olaylar loglanır: LOGIN, FAILED_LOGIN, POST_CREATE, POST_CLOSE
-- Cron job yerine admin panelinde manuel "Eski logları temizle" butonu yeterli.
-- IP hash: crypto.createHash('sha256').update(ip).digest('hex')
```

---

## 4. API Endpoint'leri

### 4.1 Auth — `/api/auth`
| Method | Endpoint | Açıklama | Yetki |
|---|---|---|---|
| POST | `/register` | Kayıt (.edu doğrulama) | Public |
| POST | `/login` | Giriş → access + refresh token | Public |
| POST | `/logout` | Refresh token iptal | Auth |
| GET | `/verify-email/:token` | Email doğrulama | Public |
| POST | `/refresh` | Access token yenile | Public (refresh token ile) |
| POST | `/forgot-password` | Şifre sıfırlama emaili | Public |
| POST | `/reset-password/:token` | Yeni şifre belirle | Public |

### 4.2 Users — `/api/users`
| Method | Endpoint | Açıklama | Yetki |
|---|---|---|---|
| GET | `/profile` | Kendi profilini gör | Auth |
| PUT | `/profile` | Profili düzenle | Auth |
| DELETE | `/account` | Hesabı sil (GDPR) | Auth |
| GET | `/export-data` | Tüm verilerini indir (GDPR) | Auth |

### 4.3 Posts — `/api/posts`
| Method | Endpoint | Açıklama | Yetki |
|---|---|---|---|
| GET | `/` | Filtreli post listesi | Auth |
| POST | `/` | Yeni post oluştur | Auth |
| GET | `/:id` | Post detayı | Auth |
| PUT | `/:id` | Post düzenle | Auth (sahip) |
| PATCH | `/:id/status` | Durum güncelle (partner found, vs.) | Auth (sahip) |
| DELETE | `/:id` | Post sil | Auth (sahip) / Admin |
| GET | `/mine` | Kendi postlarım | Auth |
| GET | `/matches` | Şehir/alan bazlı eşleşen postlar | Auth |

**Desteklenen Filtreler (GET /api/posts):**
`?domain=&city=&country=&stage=&status=&expertise=&page=&limit=`

### 4.4 Meeting Requests — `/api/meetings`
| Method | Endpoint | Açıklama | Yetki |
|---|---|---|---|
| POST | `/` | Meeting talebi gönder + NDA kabul | Auth |
| GET | `/` | Gelen/giden taleplerim | Auth |
| GET | `/:id` | Talep detayı | Auth (taraf) |
| PATCH | `/:id/accept` | Talebi kabul et | Auth (sahip) |
| PATCH | `/:id/decline` | Talebi reddet | Auth (sahip) |
| POST | `/:id/slots` | Zaman dilimi öner | Auth (taraf) |
| PATCH | `/:id/propose-time` | Toplantı zamanı öner (tek datetime) | Auth (taraf) |
| PATCH | `/:id/confirm-time` | Önerilen zamanı onayla | Auth (taraf) |
| DELETE | `/:id` | Talebi iptal et | Auth (taraf) |

### 4.5 Admin — `/api/admin`
| Method | Endpoint | Açıklama | Yetki |
|---|---|---|---|
| GET | `/users` | Tüm kullanıcılar (filtreli) | Admin |
| GET | `/users/:id` | Kullanıcı detayı | Admin |
| PATCH | `/users/:id/suspend` | Hesabı askıya al | Admin |
| GET | `/posts` | Tüm postlar (filtreli) | Admin |
| DELETE | `/posts/:id` | Uygunsuz post kaldır | Admin |
| GET | `/logs` | Aktivite logları (filtreli) | Admin |
| GET | `/logs/export` | Logları CSV indir | Admin |
| GET | `/stats` | Platform istatistikleri | Admin |

---

## 5. Middleware Katmanı

### 5.1 `authenticate.js` — JWT Doğrulama
```js
// Her korumalı route'da çalışır
// Authorization: Bearer <token> header'ını doğrular
// req.user = { id, role, email } atar
```

### 5.2 `authorize.js` — RBAC
```js
// Kullanım: authorize('admin') veya authorize('engineer', 'healthcare')
// Rol eşleşmezse 403 döner
```

### 5.3 `activityLogger.js` — Kritik Olay Logu
```js
// Sadece kritik olaylarda manuel çağrılır (middleware değil, service)
// Loglanan olaylar: LOGIN, FAILED_LOGIN, POST_CREATE, POST_CLOSE
// IP hash: crypto.createHash('sha256').update(ip).digest('hex')
// Temizleme: Admin panelinden manuel "Eski logları sil" endpoint'i
```

### 5.4 `rateLimiter.js` — Rate Limiting
```js
// Login: 5 istek / 15 dakika (IP başına)
// Register: 3 istek / saat
// Genel API: 100 istek / dakika
```

---

## 6. Auth Akışı — JWT Stratejisi

```
Register
  → .edu email kontrolü (regex + domain whitelist)
  → bcrypt hash
  → Doğrulama emaili gönder (6 saatlik token)
  → is_verified = false

Email Doğrulama
  → Token geçerliyse is_verified = true

Login
  → Kimlik doğrulama
  → Access Token (15 dakika) + Refresh Token (7 gün) döner
  → Refresh token veritabanında saklanmaz (stateless), ama blacklist mekanizması eklenebilir

Token Yenileme
  → /api/auth/refresh endpointi
  → Yeni access token üretir

Session Timeout
  → Frontend 15 dakika hareketsizlikte token yenilemez → otomatik logout
```

---

## 7. .edu Email Doğrulaması
```js
// Kural 1: Regex
const eduRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu(\.[a-z]{2})?$/;

// Kural 2: Redliste (gmail.edu gibi sahte domainler)
const blockedDomains = ['gmail.edu', 'yahoo.edu', 'hotmail.edu'];

// .edu.tr uzantıları da kabul edilir (Türkiye üniversiteleri için)
```

---

## 8. GDPR Uyumluluk

| Gereksinim | Çözüm |
|---|---|
| Hesap silme | `DELETE /api/users/account` → tüm kişisel veri anonim hale getirilir |
| Veri export | `GET /api/users/export-data` → JSON olarak tüm kayıtlar |
| Log saklama | `activity_logs` → 24 ay sonra otomatik temizlik (cron job) |
| IP adresi | `crypto.createHash('sha256')` ile hash — bcrypt gerekmez |
| Log retention | Sadece kritik olaylar; admin panelinden manuel temizleme endpoint'i |
| Minimal veri | Şifre sadece hash, hasta verisi hiç alınmaz |

---

## 9. Güvenlik Katmanı

```
Helmet.js      → X-Content-Type, X-Frame-Options, CSP header'ları
CORS           → Sadece frontend origin'i whitelist
bcrypt         → saltRounds: 12
Rate Limiter   → Login brute-force koruması
Joi Validation → Tüm input'lar şema ile doğrulanır
HTTPS          → Deployment'ta zorunlu (Let's Encrypt)
```

---

## 10. Post Durum Makinesi

```
      [Draft]
         │ publish
         ▼
      [Active] ◄──────────────────────┐
         │ meeting request accepted   │ (decline)
         ▼                            │
   [Meeting Scheduled] ───────────────┘
         │ partner found
         ▼
   [Partner Found / Closed]

[Active] ──── expiry_date geçince ──→ [Expired]
```

---

## 11. Önerilen Geliştirme Aşamaları

### Faz 1 — Temel (Sprint 1–2)
- [ ] Proje setup (package.json, .env, DB bağlantısı)
- [ ] Sequelize modelleri ve migration'lar
- [ ] Auth sistemi (register, login, email doğrulama)
- [ ] JWT middleware (authenticate + authorize)

### Faz 2 — Çekirdek Özellikler (Sprint 3–4)
- [ ] Post CRUD + lifecycle yönetimi
- [ ] Filtreleme & arama endpoint'leri
- [ ] Meeting request workflow (NDA dahil)
- [ ] Time slot sistemi

### Faz 3 — Admin & GDPR (Sprint 5)
- [ ] Admin dashboard endpoint'leri
- [ ] Activity log sistemi
- [ ] GDPR: veri silme & export
- [ ] Log CSV export

### Faz 4 — Güvenlik & Polish (Sprint 6)
- [ ] Rate limiting
- [ ] Güvenlik testleri
- [ ] Performans optimizasyonu
- [ ] API dokümantasyonu (Swagger/OpenAPI)

---

## 12. Ortam Değişkenleri (.env.example)

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=healthai_db
DB_USER=root
DB_PASS=your_password

# JWT
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=no-reply@healthai.edu
SMTP_PASS=your_smtp_password
EMAIL_FROM=HEALTH AI <no-reply@healthai.edu>

# Frontend
FRONTEND_URL=http://localhost:5173

# Security
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

*Bu mimari planı onaylarsan doğrudan kodlamaya geçebiliriz — önce hangi Faz'dan başlamak istediğini söyle.*
