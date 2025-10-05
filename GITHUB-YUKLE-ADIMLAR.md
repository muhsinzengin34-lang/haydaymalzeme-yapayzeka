# GitHub'a Yükleme Adımları

## Sistem Hazır! ✅

Proje dosyaları düzenlendi ve GitHub'a yüklenmeye hazır.

## Adım 1: Git Kurulumu Kontrolü

Komut satırını açın ve şunu yazın:
```bash
git --version
```

Eğer Git yüklü değilse: https://git-scm.com/download/win adresinden indirin.

## Adım 2: GitHub Repository Oluşturma

1. https://github.com adresine gidin
2. Sağ üstteki "+" butonuna tıklayın
3. "New repository" seçin
4. Repository adı: `haydaymalzeme-yapayzeka`
5. Public veya Private seçin
6. "Create repository" butonuna tıklayın

## Adım 3: Proje Klasöründe Terminal Açın

```bash
cd c:\Users\EV\Desktop\deneme\haydaydestek-main\haydaydestek-main
```

## Adım 4: Git Komutlarını Çalıştırın

```bash
# Git repository başlat
git init

# Tüm dosyaları ekle
git add .

# İlk commit
git commit -m "İlk commit: Hay Day Destek Chatbot sistemi"

# Ana branch adını main yap
git branch -M main

# GitHub repository'nizi bağlayın (KULLANICI_ADINIZ yerine kendi kullanıcı adınızı yazın)
git remote add origin https://github.com/KULLANICI_ADINIZ/haydaymalzeme-yapayzeka.git

# GitHub'a yükle
git push -u origin main
```

## Adım 5: .env Dosyası Oluşturun

GitHub'a yüklendikten sonra, sunucuda `.env` dosyası oluşturun:

```bash
cp .env.example .env
```

Ardından `.env` dosyasını düzenleyin ve API anahtarlarınızı ekleyin:
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
PORT=3000
SALES_SHOPIER_URL=https://www.shopier.com/haydaymalzemeleri
SALES_WHATSAPP=+905423246261
```

## Adım 6: Bağımlılıkları Yükleyin

```bash
npm install
```

## Adım 7: Sistemi Başlatın

**Geliştirme modu:**
```bash
npm run dev
```

**Üretim modu:**
```bash
npm start
```

## Yapılan Düzeltmeler ✅

1. ✅ `chatbot.js` - Import yolları düzeltildi
2. ✅ `openai.js` - Cache import yolu düzeltildi
3. ✅ `.gitignore` - Hassas dosyalar korunuyor
4. ✅ Tüm dosya yapısı kontrol edildi

## Sistem Özellikleri

- 🤖 AI destekli chatbot (GPT-4o-mini)
- 📊 Admin paneli
- 💬 Canlı destek (Socket.io)
- 🗃️ SQLite veritabanı
- 🔒 Güvenlik (Helmet, Rate Limit, WAF)
- 📝 GDPR uyumlu
- 🚀 Redis cache desteği

## Erişim URL'leri

- Ana sayfa: http://localhost:3000
- Admin panel: http://localhost:3000/admin
- API: http://localhost:3000/api
- Health check: http://localhost:3000/health

## Destek

Sorun yaşarsanız README.md dosyasına bakın veya issue açın.
