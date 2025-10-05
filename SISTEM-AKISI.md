# 🔄 Sistem Akışı - Detaylı Açıklama

## 📊 Ana Akış Diyagramı

```
┌─────────────────────────────────────────────────────────────┐
│                    KULLANICI MESAJI                          │
│                  "Derby stratejisi nedir?"                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  1. qa-database.json          │
         │  (Hızlı Q&A Kontrolü)         │
         └───────────┬───────────────────┘
                     │
                     ├─ BULUNDU? ──────────────┐
                     │                          │
                     │ HAYIR                    │ EVET
                     ▼                          ▼
         ┌───────────────────────────┐   ┌──────────────┐
         │  2. core/chatbot.js       │   │ Hızlı Yanıt  │
         │  (Niyet Analizi)          │   │ Döndür       │
         └───────────┬───────────────┘   └──────────────┘
                     │
                     ▼
         ┌───────────────────────────┐
         │  3. core/openai.js        │
         │  (GPT Çağrısı)            │
         └───────────┬───────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ ai-system│  │ config/  │  │ training/│
│ -prompt  │  │ prompts  │  │ training │
│ .txt     │  │ .js      │  │ .json    │
│          │  │          │  │          │
│ (Kanun)  │  │(Hatırlat)│  │(Örnek)   │
└──────────┘  └──────────┘  └──────────┘
        │            │            │
        └────────────┼────────────┘
                     │
                     ▼
         ┌───────────────────────────┐
         │  GPT Yanıtı Üretildi      │
         └───────────┬───────────────┘
                     │
                     ▼
         ┌───────────────────────────┐
         │  4. db.js                 │
         │  (SQLite'a Kaydet)        │
         └───────────┬───────────────┘
                     │
                     ▼
         ┌───────────────────────────┐
         │  5. cache/redis.js        │
         │  (Cache'e Ekle)           │
         │  [Opsiyonel]              │
         └───────────┬───────────────┘
                     │
                     ▼
         ┌───────────────────────────┐
         │  KULLANICIYA YANIT        │
         └───────────────────────────┘
```

---

## 📁 Dosya Rolleri (Detaylı)

### 1️⃣ `ai-system-prompt.txt` - KANUN 📜

**Rol:** Uzun sistem talimatı (GPT'nin anayasası)

**İçerik:**
- Bot'un karakteri ve davranışı
- Yanıt formatı kuralları
- Kırmızı çizgiler (yapmaması gerekenler)
- Kaynak politikası
- Few-shot örnekler

**Ne Zaman Kullanılır:**
- Her GPT çağrısında sistem mesajı olarak gönderilir
- Bot'un temel davranışını belirler

**Örnek:**
```
SYSTEM — Hay Day DESTEK Asistanı (TR, LITE v1)

AMAÇ & KAPSAM
- Yalnızca DESTEK: üretim/depo, silo, makineler...

ZORUNLU CEVAP FORMATı
1) Strateji: 1–2 net cümle
2) Analiz: kısa hesap
3) Risk–Ödül: en kötü / beklenen / en iyi
4) Görev: ölçülebilir adım
```

**Güncelleme:** Nadiren (bot karakteri değiştiğinde)

---

### 2️⃣ `server/config/prompts.js` - HATIRLATICILAR 📝

**Rol:** Kısa, kod içinde kullanılan prompt'lar

**İçerik:**
```javascript
export const SYSTEM_PROMPTS = {
    main: `Sen Hayday destek asistanısın...`,
    contextual: `Önceki konuşmayı dikkate al...`,
    fallback: `Bilmiyorsan açıkça söyle...`
};

export const AI_INSTRUCTIONS = {
    tone: 'Samimi ama profesyonel',
    length: 'Kısa ve öz (max 200 kelime)',
    language: 'Her zaman Türkçe'
};
```

**Ne Zaman Kullanılır:**
- Kod içinde import edilerek
- Farklı durumlar için farklı prompt'lar

**Güncelleme:** Sık (ihtiyaç oldukça)

---

### 3️⃣ `server/core/openai.js` - GPT ÇAĞRISI 🧠

**Rol:** OpenAI API ile iletişim

**Görevleri:**
1. `ai-system-prompt.txt` dosyasını oku
2. `config/prompts.js`'den ek talimatlar al
3. `training/training.json`'dan few-shot örnekler ekle
4. GPT'ye gönder
5. Yanıtı al ve döndür

**Kod Akışı:**
```javascript
// 1. Ana talimatı oku
const systemPrompt = fs.readFileSync('ai-system-prompt.txt', 'utf8');

// 2. Ek talimatlar
const { SYSTEM_PROMPTS } = await import('./config/prompts.js');

// 3. Few-shot örnekler
const training = JSON.parse(fs.readFileSync('training/training.json'));

// 4. GPT'ye gönder
const response = await openai.chat.completions.create({
    messages: [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: SYSTEM_PROMPTS.contextual },
        ...training.fewshot.map(ex => ({
            role: 'user', content: ex.question,
            role: 'assistant', content: ex.answer
        })),
        { role: 'user', content: userMessage }
    ]
});
```

---

### 4️⃣ `server/core/chatbot.js` - NİYET + CEVAP 🤖

**Rol:** Ana chatbot mantığı

**Görevleri:**
1. Kullanıcı mesajını al
2. Önce `qa-database.json`'a bak (hızlı yanıt)
3. Bulunamazsa `openai.js`'i çağır
4. Yanıtı `db.js`'e kaydet
5. Yanıtı döndür

**Akış:**
```javascript
// 1. Basit Q&A kontrol
const simpleResponse = getSimpleResponse(message);

if (simpleResponse) {
    return simpleResponse; // Hızlı yanıt
}

// 2. GPT kullan
const aiResponse = await getAIResponse(message, conversationHistory);

// 3. Kaydet
await saveMessage({ userId, message, aiResponse });

// 4. Döndür
return aiResponse;
```

---

### 5️⃣ `qa-database.json` - BİLGİ TABANI ❓

**Rol:** Hızlı soru-cevap veritabanı

**İçerik:**
```json
{
  "question": "Merhaba",
  "alternativeQuestions": ["selam", "hey"],
  "keywords": ["merhaba", "selam"],
  "answer": "Merhaba! Size nasıl yardımcı olabilirim?",
  "category": "genel"
}
```

**Ne Zaman Kullanılır:**
- İlk kontrol noktası
- Basit, sık sorulan sorular için
- GPT kullanmadan anında yanıt

**Avantajları:**
- Çok hızlı (0.1ms)
- Token kullanmaz
- Maliyet yok

---

### 6️⃣ `server/training/training.json` - FEW-SHOT + KALIP 📚

**Rol:** GPT'ye örnek konuşmalar ve kalıplar göster

**İçerik:**
```json
{
  "fewshot": [
    {
      "type": "fewshot",
      "question": "Buğday fiyatı ne kadar?",
      "answer": "Buğday fiyatı 100 TL'dir. 🌾",
      "success_rate": 0.95
    }
  ],
  "patterns": [
    {
      "type": "pattern",
      "name": "price_inquiry",
      "examples": ["fiyat", "ne kadar", "ücret"],
      "template": "[Ürün] fiyatı [Fiyat] TL'dir."
    }
  ]
}
```

**Ne Zaman Kullanılır:**
- GPT çağrısında few-shot örnekler olarak
- Kullanıcı davranış kalıplarını anlamak için

---

### 7️⃣ `server/middleware/security.js` - GÜVENLİK 🛡️

**Rol:** Helmet + Rate Limit + WAF + Encryption (hepsi bir arada)

**İçerik:**
- **Helmet:** Security headers
- **Rate Limit:** İstek sınırlama (60 mesaj/dakika)
- **WAF:** SQL Injection, Path Traversal, Command Injection koruması
- **Encryption:** AES-256 şifreleme (opsiyonel)

**Kullanım:**
```javascript
// server.js içinde
app.use(securityHeaders);
app.use('/api/chat', chatLimiter);
app.use(wafMiddleware);
app.use(validateAndSanitize);
```

---

### 8️⃣ `server/cache/redis.js` - CACHE 💾

**Rol:** Sık kullanılan verileri hızlı erişim için sakla

**Özellikler:**
- Redis varsa kullan
- Yoksa Memory Cache (Map) kullan
- Otomatik fallback

**Kullanım:**
```javascript
// Önce cache'e bak
const cached = await getCached('user_123_question');
if (cached) return cached;

// Yoksa GPT'ye sor
const response = await getAIResponse(message);

// Cache'e ekle
await setCached('user_123_question', response, 3600);
```

---

## 🎯 Öncelik Sırası

### 🔴 Yüksek Öncelik (Sık Güncelle)
1. `qa-database.json` - Yeni sorular ekle
2. `ai-system-prompt.txt` - Bot karakteri değişirse
3. `core/chatbot.js` - Ana mantık
4. `core/openai.js` - GPT entegrasyonu

### 🟡 Orta Öncelik (Ara Sıra)
5. `config/prompts.js` - Kısa talimatlar
6. `training/training.json` - Başarılı örnekler
7. `middleware/security.js` - Güvenlik kuralları

### 🟢 Düşük Öncelik (Otomatik)
8. `cache/redis.js` - Otomatik yönetim
9. `db.js` - Otomatik kayıt

---

## 💡 Örnek Senaryo

### Kullanıcı: "Derby'de hangi görevleri seçmeliyim?"

```
1. qa-database.json kontrol
   → BULUNAMADI (karmaşık soru)

2. core/chatbot.js devreye girer
   → openai.js'i çağırır

3. core/openai.js GPT'ye gönderir:
   ├─ ai-system-prompt.txt (Sistem talimatı)
   ├─ config/prompts.js (Ek talimat)
   └─ training/training.json (Few-shot örnekler)

4. GPT yanıt üretir:
   "Strateji: Süre/puan oranı en iyi olan kısa görevleri öne al.
    Analiz: 320 puan/30 dk ≈ 10,7 puan/dk...
    Risk–Ödül: Hızlı görev → yüksek verim...
    Görev: 3 adet ≥300 puan ve ≤45 dk görevi sırayla bitir."

5. db.js'e kaydedilir
6. cache/redis.js'e eklenir (sık soruluyorsa)
7. Kullanıcıya döndürülür
```

**Süre:** ~500-2000ms (GPT yanıt süresi)

---

## 🚀 Performans İpuçları

1. **qa-database.json'u zenginleştir** → GPT kullanımını azalt
2. **Cache'i aktif kullan** → Tekrar eden sorular için
3. **Few-shot örnekleri optimize et** → Token kullanımını azalt
4. **Rate Limit'i ayarla** → Aşırı kullanımı engelle

---

## ✅ Özet

| Dosya | Rol | Kullanım Sıklığı |
|-------|-----|------------------|
| `ai-system-prompt.txt` | Kanun | Her GPT çağrısında |
| `config/prompts.js` | Hatırlatıcı | Kod içinde |
| `core/openai.js` | GPT çağrısı | Her AI yanıtında |
| `core/chatbot.js` | Niyet + cevap | Her mesajda |
| `qa-database.json` | Bilgi tabanı | İlk kontrol |
| `training/training.json` | Few-shot | GPT çağrısında |
| `middleware/security.js` | Güvenlik | Her istekte |
| `cache/redis.js` | Cache | Opsiyonel |

**Sistem artık net, temiz ve anlaşılır!** 🎯
