# 🌾 Hay Day Destek Chatbot

AI destekli müşteri destek chatbot sistemi - Lean Mode

## 📁 Proje Yapısı (Lean Mode)

```
haydaydestek-main/
│
├── server/
│   ├── core/                   # 🎯 Çekirdek
│   │   ├── chatbot.js         # Niyet + cevap üretimi
│   │   └── openai.js          # GPT çağrısı
│   ├── config/
│   │   ├── constants.js       # Sabit değerler
│   │   └── prompts.js         # Kısa AI prompt'ları
│   ├── messages/
│   │   └── templates.js       # Tüm mesajlar (birleşik)
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── security.js        # Helmet + RateLimit + WAF (birleşik)
│   │   ├── errorHandler.js
│   │   └── gdpr.js
│   ├── training/
│   │   └── training.json      # Few-shot + Patterns (birleşik)
│   ├── utils/
│   │   └── validators.js
│   ├── cache/
│   │   └── redis.js           # Redis/Memory fallback
│   ├── db.js, logger.js, server.js
│
├── qa-database.json            # Soru-cevap veritabanı
├── ai-system-prompt.txt        # Ana AI talimatları (GPT'ye gönderilen)
└── package.json
```

## 🔄 Sistem Akışı

```
Kullanıcı Mesajı
    ↓
1. qa-database.json (hızlı yanıt - 0.1ms)
    ↓ (bulunamadıysa)
2. core/chatbot.js (niyet analizi)
    ↓
3. core/openai.js (GPT çağrısı)
    ├─ ai-system-prompt.txt (kanun - uzun sistem talimatı)
    ├─ config/prompts.js (hatırlatıcı - kısa talimatlar)
    └─ training/training.json (few-shot örnekler)
    ↓
4. db.js (SQLite'a kaydet)
    ↓
5. cache/redis.js (cache - opsiyonel)
```

## 🚀 Hızlı Başlangıç

### 1. Kurulum
```bash
npm install
```

### 2. Ortam Değişkenleri
`.env` dosyası oluştur:
```env
# Zorunlu
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
PORT=3000

# Satış Pası (opsiyonel - yoksa default kullanılır)
SALES_SHOPIER_URL=https://www.shopier.com/haydaymalzemeleri
SALES_WHATSAPP=+905423246261

# CORS (opsiyonel, virgülle ayır)
CORS_ORIGINS=http://localhost:3000,https://senindomain.com
```

### 3. Çalıştırma Modları

**Geliştirme:**
```bash
npm run dev    # nodemon ile otomatik yeniden başlatma
```

**Üretim (PM2):**
```bash
npm install -g pm2
pm2 start server/server.js --name hayday-destek
pm2 save && pm2 startup
```

**Docker (opsiyonel):**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
CMD ["node","server/server.js"]
```

## 🧩 API Sözleşmesi

### POST /api/chat/message
**İstek:**
```json
{
  "userId": "u_12345",
  "username": "Kullanıcı",
  "message": "Ambar dolu, ne yapayım?"
}
```

**Yanıt:**
```json
{
  "success": true,
  "response": "Strateji: ...\nAnaliz: ...\nRisk–Ödül: ...\nGörev: ...",
  "messageId": 123
}
```

**Hata:**
```json
{
  "success": false,
  "error": "Mesaj çok uzun (max 1000 karakter)"
}
```

### GET /health
**Yanıt:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

### cURL Örnekleri

**Chat testi:**
```bash
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","username":"Test","message":"Derby stratejisi nedir?"}'
```

**Satış pası testi:**
```bash
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","username":"Test","message":"Ambar set kaça?"}'
```

## 🗃️ Veri Şemaları

### qa-database.json
```json
[
  {
    "id": "kb.derby.v1",
    "question": "Derby hangi görev",
    "alternativeQuestions": ["derby görev seçimi", "derby en iyi görev"],
    "keywords": ["derby", "görev", "puan"],
    "answer": "Strateji: Kısa görevleri öne al...",
    "category": "derby",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

**Alan açıklamaları:**
- `alternativeQuestions`: Arama isabetini artırır
- `keywords`: Hızlı eşleştirme için
- `category`: Filtreleme/gruplama için

### training/training.json
```json
{
  "fewshot": [
    {
      "type": "fewshot",
      "question": "Ambar hep dolu, ne yapayım?",
      "answer": "Strateji: ...\nAnaliz: ...",
      "success_rate": 0.95
    }
  ],
  "patterns": [
    {
      "type": "pattern",
      "name": "depo_sorunu",
      "examples": ["ambar dolu", "depo yetmiyor", "silo tıkandı"],
      "category": "depo"
    }
  ]
}
```

**Alan açıklamaları:**
- `fewshot`: GPT'ye örnek diyaloglar
- `patterns`: Niyet eşleştirme için kalıplar

## 🛡️ Güvenlik & Gizlilik

- **Helmet + RateLimit + WAF**: `middleware/security.js` ile aktif
  - Rate Limit: 60 mesaj/dakika
  - SQL Injection, Path Traversal, Command Injection koruması
- **CORS**: Sadece izin verilen origin'ler
- **PII/GDPR**: `middleware/gdpr.js` ile silme/indirme taleplerine yanıt
- **Prompt Injection**: "ignore previous instructions" girişimleri log'lanır ve yok sayılır
- **Encryption**: AES-256 (opsiyonel, hassas veriler için)

## 📝 Log & İzleme

Her istek için log'lanan bilgiler:
- `reqId`: İstek ID
- `userId`: Kullanıcı ID (varsa)
- `duration`: Süre (ms)
- `messageLength`: Mesaj uzunluğu
- `responseLength`: Yanıt uzunluğu
- `tokens`: Token kullanımı (tahmini)

**Örnek log:**
```
[2025-01-01 12:00:00] INFO reqId=abc123 userId=u_12345 duration=850ms tokens=~250
```

## 💬 Satış Pası (Konfigürable)

**Varsayılan metin:**
```
"Bu konu Satış'ın alanı. İşlem için Shopier: ${SALES_SHOPIER_URL} 
Teslim: dijital/oyun içi. Onay ve hızlandırma için WhatsApp: ${SALES_WHATSAPP}"
```

`.env` ile değiştirilebilir:
```env
SALES_SHOPIER_URL=https://www.shopier.com/haydaymalzemeleri
SALES_WHATSAPP=+905423246261
```

## 🧪 Test

### Hızlı Test
```bash
# Destek sorusu
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Ambar dolu, üretim tıkandı."}'

# Beklenen: 4 başlıklı (Strateji/Analiz/Risk–Ödül/Görev) yanıt
```

### Health Check
```bash
curl http://localhost:3000/health
```

## 📊 Dosya İstatistikleri

- **Önceki:** ~50 dosya
- **Lean Mode:** ~35 dosya
- **Azalma:** %30
- **Birleştirildi:** 8 dosya → 3 dosya
- **Kaldırıldı:** 7 dosya

## ❓ SSS

**Node sürümü?**
→ Node >= 18 (öneri: 20 LTS)

**Redis zorunlu mu?**
→ Hayır; yoksa memory fallback çalışır

**Fiyat yazacak mı?**
→ Hayır, bu bot DESTEK; satış niyeti → sabit pas

**Telegram entegrasyonu?**
→ Şu anda pasif (isteğe bağlı aktif edilebilir)

**Token maliyeti?**
→ gpt-4o-mini: ~$0.15/1M input token, ~$0.60/1M output token

## 🌐 Erişim

- Web: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`
- API: `http://localhost:3000/api`
- Health: `http://localhost:3000/health`

## 📚 Dokümantasyon

- `README.md` → Bu dosya (genel bakış)
- `SISTEM-AKISI.md` → Detaylı sistem akışı
- `LEAN-MODE-RAPORU.txt` → Dönüşüm raporu
- `LEAN-MODE-OZET.txt` → Hızlı özet

## 📝 Lisans

MIT License
