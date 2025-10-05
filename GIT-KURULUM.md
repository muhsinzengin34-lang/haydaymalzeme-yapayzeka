# 🔧 Git Kurulum Rehberi

## 📥 Adım 1: Git İndir

**Link:** https://git-scm.com/download/win

Veya direkt indirme:
https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe

---

## 🛠️ Adım 2: Kurulum

1. **İndirilen dosyayı çalıştır** (Git-2.43.0-64-bit.exe)

2. **Kurulum Ayarları:**
   - ✅ "Next" ile devam et
   - ✅ Varsayılan ayarları kullan
   - ✅ "Use Git from the Windows Command Prompt" seç
   - ✅ "Checkout Windows-style, commit Unix-style line endings" seç
   - ✅ "Use MinTTY" seç
   - ✅ Tüm ek özellikleri seç
   - ✅ "Install" tıkla

3. **Kurulum tamamlandı!**
   - "Finish" tıkla

---

## ✅ Adım 3: Kontrol

**Yeni bir Command Prompt aç** (önemli!)

```bash
git --version
```

**Çıktı:**
```
git version 2.43.0.windows.1
```

✅ Git başarıyla kuruldu!

---

## 🚀 Adım 4: Otomatik Yükleme

Şimdi `OTOMATIK-YUKLE.bat` dosyasını çalıştır:

1. Dosyaya çift tıkla
2. Script otomatik çalışacak
3. GitHub'a yüklenecek

---

## 🎯 Hızlı Kurulum (Tek Komut)

PowerShell'i **yönetici olarak** aç ve çalıştır:

```powershell
winget install --id Git.Git -e --source winget
```

Veya Chocolatey ile:

```powershell
choco install git -y
```

---

## ⚠️ Önemli Not

Git kurduktan sonra **Command Prompt'u kapat ve yeniden aç!**

Aksi halde `git` komutu tanınmaz.

---

## 📞 Sorun mu var?

**"git is not recognized" hatası:**
- Command Prompt'u kapat
- Yeniden aç
- `git --version` tekrar dene

**Hala çalışmıyor:**
- Bilgisayarı yeniden başlat
- `git --version` tekrar dene

---

## ✅ Git Kuruldu, Şimdi Ne?

1. **Yeni Command Prompt aç**
2. **`OTOMATIK-YUKLE.bat`** dosyasını çalıştır
3. **GitHub'a otomatik yüklenecek!**

🎉 **Başarılar!**
