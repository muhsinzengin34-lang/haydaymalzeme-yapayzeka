# 🔑 GitHub Token Oluşturma (2 Dakika)

## Adım 1: GitHub'a Git
https://github.com/settings/tokens

## Adım 2: Token Oluştur
1. "Generate new token" → "Generate new token (classic)"
2. Note: `haydaymalzeme-yapayzeka-upload`
3. Expiration: `90 days` (veya istediğin süre)
4. Seç: ✅ **repo** (tüm kutucuklar)
5. "Generate token" tıkla

## Adım 3: Token'ı Kopyala
⚠️ Token sadece bir kez gösterilir!
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
Kopyala ve bana ver.

## Adım 4: Repository Oluştur
1. https://github.com/new
2. Repository name: `haydaymalzeme-yapayzeka`
3. Description: `🌾 Hay Day AI Destek Chatbot - Lean Mode`
4. Public/Private seç
5. **Initialize with README seçme!**
6. "Create repository"

## Adım 5: Bana Ver
Token'ı bana ver, ben yükleme yapayım:
```
Token: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🎯 Alternatif: SSH Key

Eğer SSH key kullanmak istersen:

1. SSH key oluştur:
```bash
ssh-keygen -t ed25519 -C "muhsinzengin34@gmail.com"
```

2. Public key'i kopyala:
```bash
cat ~/.ssh/id_ed25519.pub
```

3. GitHub'a ekle:
https://github.com/settings/keys

4. Bana haber ver, SSH ile yüklerim.

---

## ⚠️ Güvenlik Notu

Token'ı bana verdikten sonra:
- Yükleme tamamlanınca token'ı sil
- Veya 1 saatlik token oluştur
- Token'ı kimseyle paylaşma

---

## 🚀 Hazır mısın?

Token'ı oluştur ve bana ver, ben yükleme yapayım! 🎯
