# 🚀 GitHub'a Yükleme Rehberi

## 📋 Hazırlık

### 1. Git Kurulumu Kontrolü
```bash
git --version
```

Eğer yüklü değilse: https://git-scm.com/download/win

---

## 🔧 Adım Adım Yükleme

### 1. Git Başlat
```bash
cd c:\Users\EV\Desktop\deneme\haydaydestek-main\haydaydestek-main
git init
```

### 2. Dosyaları Ekle
```bash
git add .
```

### 3. İlk Commit
```bash
git config user.name "muhsinzengin34-lang"
git config user.email "your-email@example.com"
git commit -m "🎯 Lean Mode: AI Chatbot sistemi hazır"
```

### 4. GitHub Repository Oluştur
1. https://github.com/new adresine git
2. Repository adı: `haydaymalzeme-yapayzeka`
3. Public/Private seç
4. **Initialize with README seçme** (zaten var)
5. Create repository

### 5. Remote Ekle ve Push
```bash
git branch -M main
git remote add origin https://github.com/muhsinzengin34-lang/haydaymalzeme-yapayzeka.git
git push -u origin main
```

---

## 🔐 GitHub Token ile Push (Önerilen)

### Token Oluştur:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Seç: `repo` (tüm izinler)
4. Generate token
5. Token'ı kopyala (bir daha gösterilmez!)

### Push ile Token Kullan:
```bash
git push https://YOUR_TOKEN@github.com/muhsinzengin34-lang/haydaymalzeme-yapayzeka.git main
```

---

## 📝 Alternatif: GitHub Desktop

### 1. GitHub Desktop İndir
https://desktop.github.com/

### 2. Kullan
1. File → Add Local Repository
2. Klasörü seç: `c:\Users\EV\Desktop\deneme\haydaydestek-main\haydaydestek-main`
3. Publish repository
4. Repository adı: `haydaymalzeme-yapayzeka`
5. Publish

---

## ✅ Kontrol

Repository yüklendikten sonra:
```
https://github.com/muhsinzengin34-lang/haydaymalzeme-yapayzeka
```

---

## 🔄 Sonraki Güncellemeler

```bash
# Değişiklikleri ekle
git add .

# Commit
git commit -m "Güncelleme açıklaması"

# Push
git push
```

---

## 📊 Repository Bilgileri

**Repository Adı:** `haydaymalzeme-yapayzeka`
**Kullanıcı:** `muhsinzengin34-lang`
**URL:** `https://github.com/muhsinzengin34-lang/haydaymalzeme-yapayzeka`

**Açıklama:** 
```
🌾 Hay Day AI Destek Chatbot - Lean Mode
AI destekli müşteri destek sistemi (OpenAI GPT + Q&A)
```

**Topics (etiketler):**
- `chatbot`
- `ai`
- `openai`
- `nodejs`
- `express`
- `hayday`
- `customer-support`

---

## 🎯 Hızlı Komutlar

```bash
# Durum kontrol
git status

# Değişiklikleri gör
git diff

# Log
git log --oneline

# Son commit'i geri al
git reset --soft HEAD~1
```

---

## ⚠️ Önemli Notlar

1. **.env dosyası yüklenmez** (.gitignore'da)
2. **node_modules yüklenmez** (.gitignore'da)
3. **SQLite database yüklenmez** (.gitignore'da)
4. **API key'leri paylaşma!**

---

## 🚀 Başarılı Yükleme Sonrası

Repository'de olması gerekenler:
- ✅ README.md (güncel)
- ✅ package.json
- ✅ .env.example
- ✅ .gitignore
- ✅ server/ klasörü
- ✅ admin/ klasörü
- ✅ public/ klasörü
- ✅ qa-database.json
- ✅ ai-system-prompt.txt
- ✅ Tüm dokümantasyon dosyaları

**Toplam: ~35 dosya**

---

## 🎉 Tamamlandı!

Repository linki:
```
https://github.com/muhsinzengin34-lang/haydaymalzeme-yapayzeka
```

Clone komutu:
```bash
git clone https://github.com/muhsinzengin34-lang/haydaymalzeme-yapayzeka.git
```
