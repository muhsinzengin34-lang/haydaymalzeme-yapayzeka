# 🚀 Render Deploy - Environment Variables

## 🔑 ZORUNLU (Mutlaka Ekle)

```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
**Açıklama:** OpenAI API anahtarı (GPT için)
**Nereden:** https://platform.openai.com/api-keys

---

## ⚙️ ÖNERİLEN (Ekle)

```
OPENAI_MODEL=gpt-4o-mini
```
**Açıklama:** Kullanılacak model
**Varsayılan:** gpt-4o-mini

```
PORT=3000
```
**Açıklama:** Port numarası
**Varsayılan:** 3000
**Not:** Render otomatik ayarlar, değiştirme

```
NODE_ENV=production
```
**Açıklama:** Ortam
**Değer:** production

---

## 💬 SATIŞ PASI (Opsiyonel)

```
SALES_SHOPIER_URL=https://www.shopier.com/haydaymalzemeleri
```
**Açıklama:** Shopier mağaza linki

```
SALES_WHATSAPP=+905423246261
```
**Açıklama:** WhatsApp numarası

---

## 🔐 GÜVENLİK (Opsiyonel)

```
CORS_ORIGINS=https://senindomain.com
```
**Açıklama:** İzin verilen domain'ler (virgülle ayır)

```
ENCRYPTION_KEY=
```
**Açıklama:** Şifreleme anahtarı (otomatik oluşur, boş bırak)

---

## 💾 REDIS (Opsiyonel)

```
REDIS_URL=
```
**Açıklama:** Redis URL (yoksa memory cache kullanılır)
**Not:** Render'da Redis eklentisi kurabilirsin

---

## 📱 TELEGRAM (Opsiyonel - Şu Anda Pasif)

```
TELEGRAM_BOT_TOKEN=
```
**Açıklama:** Telegram bot token

```
ADMIN_TELEGRAM_ID=
```
**Açıklama:** Admin Telegram ID

---

## 🎯 RENDER'DA NASIL EKLENİR?

### Adım 1: Render Dashboard
1. Render.com → Dashboard
2. Web Service seç
3. "Environment" sekmesi

### Adım 2: Environment Variables Ekle
Her değişken için:
1. "Add Environment Variable"
2. Key: `OPENAI_API_KEY`
3. Value: `sk-proj-xxxxx...`
4. "Save Changes"

---

## 📋 KOPYALA-YAPIŞTIR (Hızlı Kurulum)

**Minimum (Sadece Zorunlu):**
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NODE_ENV=production
```

**Önerilen (Tam Kurulum):**
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
NODE_ENV=production
SALES_SHOPIER_URL=https://www.shopier.com/haydaymalzemeleri
SALES_WHATSAPP=+905423246261
CORS_ORIGINS=https://senindomain.com
```

---

## ⚠️ ÖNEMLİ NOTLAR

1. **OPENAI_API_KEY zorunlu!** Olmadan çalışmaz.
2. **PORT değiştirme!** Render otomatik ayarlar.
3. **REDIS_URL boş bırak.** Memory cache kullanılır.
4. **TELEGRAM boş bırak.** Şu anda pasif.
5. **Değişken ekledikten sonra "Save Changes"** tıkla.

---

## 🔍 Değişken Kontrolü

Deploy sonrası kontrol:
```
https://your-app.onrender.com/health
```

Çıktı:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

---

## 🚀 Hızlı Başlangıç

**Minimum kurulum için sadece bu 2 değişken yeterli:**

| Key | Value |
|-----|-------|
| `OPENAI_API_KEY` | `sk-proj-xxxxx...` |
| `NODE_ENV` | `production` |

**Deploy et ve çalışır! 🎉**
