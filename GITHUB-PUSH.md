# 📤 GitHub'a Yükleme Rehberi

## Adım 1: Git Kurulumu Kontrol

```bash
git --version
```

Eğer hata alırsanız: https://git-scm.com/download/win

## Adım 2: Git Başlat

```bash
cd haydaydestek-main
git init
git add .
git commit -m "Initial commit - Hay Day Destek Chatbot"
```

## Adım 3: GitHub Repository Oluştur

1. GitHub.com'a git
2. New Repository
3. İsim: `hayday-destek-chatbot`
4. Public/Private seç
5. Create Repository

## Adım 4: Remote Ekle ve Push

```bash
git remote add origin https://github.com/KULLANICI_ADIN/hayday-destek-chatbot.git
git branch -M main
git push -u origin main
```

## Adım 5: .env Dosyasını Güvenli Tut

⚠️ `.env` dosyası GitHub'a yüklenmez (.gitignore'da)

Render.com'da Environment Variables olarak ekle:
- OPENAI_API_KEY
- OPENAI_MODEL
- PORT
- SALES_SHOPIER_URL
- SALES_WHATSAPP

## Render.com Deployment

1. Render.com'a git
2. New Web Service
3. GitHub repository'yi bağla
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Environment Variables ekle
7. Deploy

✅ Sistem otomatik deploy olacak!
