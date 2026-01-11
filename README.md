# 🍰 GumusQR - Dijital QR Menü Sistemi

Pastaneler için modern, mobil uyumlu dijital QR menü sistemi.

**Vercel + Supabase + Cloudinary** ile tamamen ücretsiz hosting!

## ✨ Özellikler

- 📱 Mobil uyumlu modern tasarım
- 🖼️ Görsel yükleme (Cloudinary ile)
- 🔐 Admin paneli (JWT authentication)
- 🏷️ Kategori ve ürün yönetimi
- ⚠️ Alerjen bilgisi gösterimi
- 🔍 Görsel büyütme (lightbox)
- 🎨 Logo yükleme desteği

## 📦 Proje Yapısı

```
GumusQR/
├── api/                 # Vercel Serverless Functions
│   ├── auth.js         # Login, verify, change-password
│   ├── categories.js   # Kategori CRUD
│   ├── products.js     # Ürün CRUD + Cloudinary
│   ├── settings.js     # Ayarlar + Logo
│   ├── public.js       # Public menu & settings
│   └── lib/
│       ├── supabase.js # Database client
│       ├── cloudinary.js # Image upload
│       └── auth.js     # JWT helpers
├── src/                # React Frontend
│   ├── pages/
│   │   ├── Menu/       # QR Menü (/)
│   │   └── Admin/      # Admin Panel (/admin)
│   ├── App.jsx
│   └── index.css
├── vercel.json         # Vercel config
└── package.json
```

---

## 🚀 DEPLOYMENT ADIMLARI

### ADIM 1: Supabase Kurulumu (Veritabanı)

1. **https://supabase.com** adresine git ve kayıt ol
2. **New Project** oluştur
3. **SQL Editor**'a git ve aşağıdaki SQL'i çalıştır:

```sql
-- Categories table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  allergens TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT
);

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Default settings
INSERT INTO settings (key, value) VALUES 
  ('restaurant_name', 'Gümüş Pastanesi'),
  ('restaurant_description', '1985''ten beri taze lezzetler'),
  ('currency', '₺'),
  ('logo_url', '');
```

4. **Settings > API** sayfasından şunları not al:
   - `Project URL` → `SUPABASE_URL`
   - `service_role key` → `SUPABASE_SERVICE_KEY`

---

### ADIM 2: Cloudinary Kurulumu (Görsel Hosting)

1. **https://cloudinary.com** adresine git ve kayıt ol
2. **Dashboard**'dan şunları not al:
   - `Cloud Name` → `CLOUDINARY_CLOUD_NAME`
   - `API Key` → `CLOUDINARY_API_KEY`
   - `API Secret` → `CLOUDINARY_API_SECRET`

---

### ADIM 3: GitHub'a Yükle

```bash
# Projeyi indir ve klasöre gir
cd GumusQR

# Git repo oluştur
git init
git add .
git commit -m "Initial commit"

# GitHub'da yeni repo oluştur (github.com/new)
# Sonra push et:
git remote add origin https://github.com/KULLANICI_ADIN/gumusqr.git
git branch -M main
git push -u origin main
```

---

### ADIM 4: Vercel'e Deploy

1. **https://vercel.com** adresine git
2. **GitHub ile giriş yap**
3. **Add New > Project**
4. GitHub repo'nu seç: `gumusqr`
5. **Environment Variables** ekle:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | https://xxx.supabase.co |
| `SUPABASE_SERVICE_KEY` | eyJhbG... |
| `CLOUDINARY_CLOUD_NAME` | your-cloud |
| `CLOUDINARY_API_KEY` | 123456789 |
| `CLOUDINARY_API_SECRET` | abc123... |
| `JWT_SECRET` | gizli-anahtar-en-az-32-karakter |

6. **Deploy** tıkla!

---

### ADIM 5: Test Et

Deploy tamamlandığında URL alacaksın:
```
https://gumusqr.vercel.app
```

| Sayfa | URL |
|-------|-----|
| Menü | https://gumusqr.vercel.app/ |
| Admin | https://gumusqr.vercel.app/admin |

**İlk giriş:** `admin` / `gumus123`

---

## 🌍 Custom Domain (Opsiyonel)

1. GoDaddy/Namecheap'ten domain al
2. Vercel Dashboard > Settings > Domains
3. Domain ekle
4. DNS ayarlarını yap (Vercel talimatları verir)
5. SSL otomatik aktif olur

---

## 🔧 Local Development

```bash
# Bağımlılıkları yükle
npm install

# .env dosyası oluştur
cp .env.example .env
# .env dosyasını düzenle ve değerleri gir

# Development server
npm run dev
```

---

## 📋 API Endpoints

### Public (Auth gerektirmez)
- `GET /api/public?type=menu` - Menü
- `GET /api/public?type=settings` - Ayarlar

### Protected (Auth gerektirir)
- `GET/POST /api/categories` - Kategoriler
- `PUT/DELETE /api/categories?id=X` - Kategori güncelle/sil
- `GET/POST /api/products` - Ürünler
- `PUT/DELETE /api/products?id=X` - Ürün güncelle/sil
- `GET/PUT /api/settings` - Ayarlar

### Auth
- `POST /api/auth?action=login` - Giriş
- `GET /api/auth?action=verify` - Token doğrula
- `POST /api/auth?action=change-password` - Şifre değiştir

---

## 💰 Maliyet

| Servis | Ücretsiz Limit | Yeterli mi? |
|--------|----------------|-------------|
| Vercel | 100GB bandwidth/ay | ✅ Fazlasıyla |
| Supabase | 500MB database | ✅ Fazlasıyla |
| Cloudinary | 25GB storage | ✅ Fazlasıyla |

**Toplam: $0/ay** 🎉

---

## 📄 Lisans

MIT
