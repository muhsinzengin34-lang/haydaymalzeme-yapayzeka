# 🚀 GitHub Desktop ile Yükleme (2 Dakika)

## Adım 1: İndir ve Kur
https://desktop.github.com/

## Adım 2: Giriş Yap
- GitHub Desktop'ı aç
- File → Options → Accounts
- Sign in to GitHub.com
- Kullanıcı adı: `muhsinzengin34-lang`
- Şifre gir

## Adım 3: Repository Ekle
- File → Add Local Repository
- Choose: `c:\Users\EV\Desktop\deneme\haydaydestek-main\haydaydestek-main`
- Add Repository

## Adım 4: Publish
- Sol üstte "Publish repository" butonu
- Name: `haydaymalzeme-yapayzeka`
- Description: `🌾 Hay Day AI Destek Chatbot - Lean Mode`
- ✅ Publish repository

## ✅ Tamamlandı!
https://github.com/muhsinzengin34-lang/haydaymalzeme-yapayzeka

---

# Alternatif: Manuel Komutlar

Command Prompt aç:

```bash
cd c:\Users\EV\Desktop\deneme\haydaydestek-main\haydaydestek-main

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/muhsinzengin34-lang/haydaymalzeme-yapayzeka.git
git push -u origin main
```

**Kullanıcı adı/şifre sorulacak!**

---

# Token ile Push (Şifre Çalışmazsa)

1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Seç: `repo` (tüm izinler)
4. Generate token
5. Token'ı kopyala

```bash
git push https://YOUR_TOKEN@github.com/muhsinzengin34-lang/haydaymalzeme-yapayzeka.git main
```

---

# En Kolay: GitHub Desktop! ⭐
2 dakikada halledersin.
