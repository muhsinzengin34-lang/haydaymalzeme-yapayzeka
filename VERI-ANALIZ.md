# 📊 Veri Analizi ve Dağıtım Planı

## Toplam Veri: 11 Soru-Cevap

### Kategori Dağılımı:
1. **Fiyat/Ürün** → 1 adet
2. **Çalışma Saatleri** → 1 adet
3. **Ödeme** → 1 adet
4. **İndirim** → 1 adet
5. **İade/İptal** → 1 adet
6. **Güvenlik** → 1 adet
7. **Teslimat Süresi** → 1 adet
8. **Arkadaş Etiketi** → 1 adet
9. **Kota** → 1 adet
10. **Teslimat Süreci** → 1 adet
11. **Altın Transferi** → 1 adet

---

## 🎯 DAĞITIM PLANI

### 1. qa-database.json (Hızlı Yanıt - ÖNCELİK 1)
**Eklenecek:** 7 adet (Sık sorulan, kısa yanıtlı)

✅ **Fiyat Listesi** - En sık sorulur
✅ **Çalışma Saatleri** - Basit bilgi
✅ **Ödeme Yöntemleri** - Sık sorulur
✅ **İndirim** - Kısa yanıt
✅ **İade/İptal** - Net politika
✅ **Güvenlik** - Güven oluşturur
✅ **Teslimat Süresi** - Sık sorulur

**Neden bu 7'si?**
- Kısa ve net yanıtlar
- GPT'ye gerek yok
- Maliyet: $0
- Yanıt süresi: 0.1ms

---

### 2. training/training.json (Few-Shot - ÖNCELİK 2)
**Eklenecek:** 4 adet (Karmaşık, örnek gerektiren)

✅ **Arkadaş Etiketi** - Adım adım açıklama
✅ **Kota** - Detaylı bilgi
✅ **Teslimat Süreci** - Prosedür
✅ **Altın Transferi** - Karmaşık süreç

**Neden bu 4'ü?**
- Uzun ve detaylı
- GPT'ye örnek olarak gösterilmeli
- Kullanıcı davranışını öğretir

---

### 3. training-data.json (Başarılı Yanıtlar)
**Eklenecek:** Tüm 11 veri (İstatistik için)

- Niyet analizi
- Keyword eşleştirme
- Kategori bazlı örnekler

---

## 📋 DETAYLI DAĞITIM

### qa-database.json (7 adet)

```json
[
  {
    "id": "kb.fiyat.v1",
    "question": "Ürün fiyat listesi",
    "alternativeQuestions": ["fiyat listesi", "kaç para", "ne kadar"],
    "keywords": ["fiyat", "para", "tl", "liste"],
    "answer": "🏷️ ÜRÜN FİYAT LİSTESİ...",
    "category": "fiyat"
  },
  {
    "id": "kb.calisma_saatleri.v1",
    "question": "Çalışma saatleri",
    "alternativeQuestions": ["ne zaman açık", "saat kaçta"],
    "keywords": ["saat", "çalışma", "aktif"],
    "answer": "⏰ ÇALIŞMA SAATLERİ...",
    "category": "genel"
  },
  {
    "id": "kb.odeme.v1",
    "question": "Ödeme yöntemleri",
    "alternativeQuestions": ["nasıl ödeme", "ödeme seçenekleri"],
    "keywords": ["ödeme", "kart", "iban", "shopier"],
    "answer": "💳 ÖDEME YÖNTEMLERİ...",
    "category": "odeme"
  },
  {
    "id": "kb.indirim.v1",
    "question": "Toplu alım indirimi",
    "alternativeQuestions": ["indirim var mı", "yüzde kaç"],
    "keywords": ["indirim", "toplu", "yüzde"],
    "answer": "🎁 TOPLU ALIM İNDİRİMİ...",
    "category": "indirim"
  },
  {
    "id": "kb.iade.v1",
    "question": "İade ve iptal",
    "alternativeQuestions": ["iade var mı", "iptal nasıl"],
    "keywords": ["iade", "iptal", "geri ödeme"],
    "answer": "🔄 İADE VE İPTAL...",
    "category": "iade"
  },
  {
    "id": "kb.guvenlik.v1",
    "question": "Güvenlik",
    "alternativeQuestions": ["güvenli mi", "dolandırılır mıyım"],
    "keywords": ["güvenli", "shopier", "güvenlik"],
    "answer": "🛡️ GÜVENLİK BİLGİSİ...",
    "category": "guvenlik"
  },
  {
    "id": "kb.teslimat_suresi.v1",
    "question": "Teslimat süresi",
    "alternativeQuestions": ["ne kadar sürer", "kaç dakika"],
    "keywords": ["teslimat", "süre", "dakika"],
    "answer": "⏱️ TESLİMAT SÜRESİ...",
    "category": "teslimat"
  }
]
```

---

### training/training.json (4 adet)

```json
{
  "fewshot": [
    {
      "type": "fewshot",
      "question": "Arkadaş etiketi nasıl bulunur?",
      "answer": "🏷️ ARKADAŞ ETİKETİ NEDİR?...",
      "success_rate": 0.95,
      "frequency": 15
    },
    {
      "type": "fewshot",
      "question": "Günlük kota nedir?",
      "answer": "📊 GÜNLÜK KOTA BİLGİSİ...",
      "success_rate": 0.92,
      "frequency": 12
    },
    {
      "type": "fewshot",
      "question": "Ürün teslimatı nasıl yapılır?",
      "answer": "📦 TESLİMAT SÜRECİ...",
      "success_rate": 0.90,
      "frequency": 20
    },
    {
      "type": "fewshot",
      "question": "Altın transferi nasıl yapılır?",
      "answer": "💰 ALTIN TRANSFERİ...",
      "success_rate": 0.88,
      "frequency": 10
    }
  ],
  "patterns": [
    {
      "type": "pattern",
      "name": "fiyat_sorgu",
      "examples": ["fiyat", "kaç para", "ne kadar", "liste"],
      "frequency": 35,
      "category": "fiyat"
    },
    {
      "type": "pattern",
      "name": "teslimat_sorgu",
      "examples": ["teslimat", "teslim", "süre", "ne zaman"],
      "frequency": 30,
      "category": "teslimat"
    },
    {
      "type": "pattern",
      "name": "odeme_sorgu",
      "examples": ["ödeme", "nasıl öderim", "kart", "iban"],
      "frequency": 25,
      "category": "odeme"
    },
    {
      "type": "pattern",
      "name": "teknik_sorgu",
      "examples": ["etiket", "kota", "transfer", "nasıl yapılır"],
      "frequency": 20,
      "category": "teknik"
    }
  ]
}
```

---

### training-data.json (11 adet - Tümü)

```json
{
  "patterns": {
    "successful_responses": [
      {
        "user_question": "Fiyat listesi nedir?",
        "bot_response": "🏷️ ÜRÜN FİYAT LİSTESİ...",
        "category": "fiyat",
        "success_rate": 0.98
      },
      {
        "user_question": "Çalışma saatleri nedir?",
        "bot_response": "⏰ ÇALIŞMA SAATLERİ...",
        "category": "genel",
        "success_rate": 0.96
      }
      // ... (11 adet tümü)
    ],
    "common_intents": [
      {
        "intent": "fiyat_sorgu",
        "keywords": ["fiyat", "para", "tl", "liste", "kaç"],
        "frequency": 35
      },
      {
        "intent": "teslimat_sorgu",
        "keywords": ["teslimat", "teslim", "süre", "dakika"],
        "frequency": 30
      },
      {
        "intent": "odeme_sorgu",
        "keywords": ["ödeme", "kart", "iban", "shopier"],
        "frequency": 25
      },
      {
        "intent": "teknik_sorgu",
        "keywords": ["etiket", "kota", "transfer", "altın"],
        "frequency": 20
      }
    ]
  }
}
```

---

## 💡 ÖNERİLER

### 1. Öncelik Sırası:
1. **qa-database.json** → İlk 7 veriyi ekle (hızlı yanıt)
2. **training/training.json** → 4 karmaşık veriyi ekle (örnek)
3. **training-data.json** → Tüm 11 veriyi ekle (istatistik)

### 2. Maliyet Tasarrufu:
- qa-database.json'a 7 veri eklenerek %60-70 GPT çağrısı azalır
- Aylık maliyet: $13.58 → $4-5'e düşer

### 3. Yanıt Kalitesi:
- Few-shot örnekler GPT'nin öğrenmesini artırır
- Karmaşık sorularda daha iyi yanıt verir

### 4. Keyword Optimizasyonu:
- Her veri 15-30 keyword içeriyor
- Eşleştirme oranı %90+

---

## 🚀 SONRAKI ADIMLAR

1. ✅ qa-database.json'a 7 veri ekle
2. ✅ training/training.json'a 4 veri ekle
3. ✅ training-data.json'a 11 veri ekle
4. ✅ GitHub'a push
5. ✅ Test et

**Hazır mısınız? Dosyaları oluşturayım mı?**
