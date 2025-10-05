# 🚀 GitHub'a Hızlı Yükleme

## Yöntem 1: Otomatik Script (Önerilen)

1. **git-commands.bat** dosyasına çift tıkla
2. GitHub repository URL'ini gir
3. Enter'a bas
4. Tamamlandı! ✅

## Yöntem 2: Manuel Komutlar

### Adım 1: Git Kurulumu Kontrol
```bash
git --version
```

Eğer hata alırsanız: https://git-scm.com/download/win

### Adım 2: GitHub'da Repository Oluştur
1. https://github.com → New Repository
2. İsim: `hayday-destek-chatbot`
3. Public seç
4. **Initialize this repository with a README** → İŞARETLEME
5. Create Repository

### Adım 3: Terminal'de Komutları Çalıştır

```bash
# Proje klasörüne git
cd haydaydestek-main

# Git başlat
git init

# Dosyaları ekle
git add .

# Commit yap
git commit -m "Initial commit - Hay Day Destek Chatbot v2.0"

# Remote ekle (URL'i kendi repository'nizle değiştirin)
git remote add origin https://github.com/KULLANICI_ADIN/hayday-destek-chatbot.git

# Branch adını main yap
git branch -M main

# Push yap
git push -u origin main
```

### Adım 4: Kontrol Et
GitHub'da repository'nizi açın ve dosyaların yüklendiğini kontrol edin.

## ⚠️ Önemli Notlar

1. **.env dosyası GitHub'a yüklenmez** (.gitignore'da)
2. Render.com'da Environment Variables olarak ekleyin:
   - OPENAI_API_KEY
   - OPENAI_MODEL=gpt-4o-mini
   - PORT=3000
   - SALES_SHOPIER_URL
   - SALES_WHATSAPP

## 🎉 Sonraki Adım: Render.com Deploy

1. https://render.com → New Web Service
2. GitHub repository'yi bağla
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment Variables ekle
6. Deploy

✅ Sistem otomatik deploy olacak!
