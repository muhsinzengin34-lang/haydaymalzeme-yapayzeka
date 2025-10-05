# 📚 Bilgi Bankaları - Sistem Yapısı

## Dosya Yapısı ve Kullanım

| Dosya | Konum | Açıklama | Kullanım | Boyut |
|-------|-------|----------|----------|-------|
| `qa-database.json` | Root | Hızlı soru-cevap veritabanı | Basit sorular için anında yanıt | ~1 KB |
| `ai-system-prompt.txt` | Root | Ana AI talimatları | GPT'ye gönderilen detaylı sistem prompt'u | ~8 KB |
| `server/config/prompts.js` | Config | Kısa prompt'lar | Kod içinde kullanılan ayarlar ve şablonlar | ~2 KB |
| `server/training/training.json` | Training | Few-shot örnekler | AI'ya örnek diyaloglar ve kalıplar | ~2 KB |
| `server/training-data.json` | Server | Eğitim verileri | Başarılı yanıt örnekleri ve niyet kalıpları | ~3 KB |
| `server/ai-destek-training.json` | Server | Kullanıcı kalıpları | Temel sorular ve kullanıcı davranış kalıpları | ~2 KB |

## 1. qa-database.json (Hızlı Yanıt)

**Amaç:** Sık sorulan sorulara anında yanıt vermek (GPT kullanmadan)

**Yapı:**
```json
{
  "id": "kb.kategori.v1",
  "question": "Ana soru",
  "alternativeQuestions": ["alternatif1", "alternatif2"],
  "keywords": ["anahtar", "kelimeler"],
  "answer": "Yanıt metni",
  "category": "kategori",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Kullanım:**
- İlk kontrol noktası
- 0.1ms yanıt süresi
- Token maliyeti: $0 (ücretsiz)
- Mevcut: 6 soru-cevap

**Kategoriler:**
- `genel` - Selamlaşma, genel sorular
- `fiyat` - Fiyat listeleri
- `teslimat` - Kargo ve teslimat
- `odeme` - Ödeme yöntemleri
- `urun` - Ürün kataloğu
- `iletisim` - İletişim bilgileri

## 2. ai-system-prompt.txt (Ana Talimat)

**Amaç:** GPT'ye gönderilen detaylı sistem talimatları

**İçerik:**
- Rol tanımı (DESTEK asistanı)
- Dil ve biçim kuralları (Türkçe, sayı formatı)
- Niyet algılama (depo, derby, üretim, vb.)
- Zorunlu yanıt formatı (Strateji, Analiz, Risk-Ödül, Görev)
- Kırmızı çizgiler (hile, exploit yasak)
- Kaynak politikası (beyaz liste)
- Satış pasajı (deterministik yönlendirme)
- Few-shot örnekler

**Kullanım:**
- Her GPT çağrısında `system` mesajı olarak gönderilir
- ~8 KB metin
- Token maliyeti: ~2000 token/istek

## 3. server/config/prompts.js (Kod İçi Ayarlar)

**Amaç:** Kod içinde kullanılan kısa prompt'lar ve ayarlar

**İçerik:**
```javascript
SYSTEM_PROMPT_SHORT      // Kısa sistem prompt'u
AI_INSTRUCTIONS          // Ton, uzunluk, dil, format
SALES_PASS_MESSAGE       // Satış yönlendirme mesajı
SALES_INTENT_REGEX       // Satış niyeti tespiti
SHORT_TEMPLATES          // Atıf ve format şablonları
CONVERSATION_LIMITS      // Geçmiş limitleri
```

**Kullanım:**
- Kod içinde import edilir
- Hızlı erişim için
- Değişiklik için kod düzenleme gerekir

## 4. server/training/training.json (Few-Shot)

**Amaç:** AI'ya örnek diyaloglar göstermek

**Yapı:**
```json
{
  "fewshot": [
    {
      "question": "Örnek soru",
      "answer": "Örnek yanıt",
      "success_rate": 0.95,
      "frequency": 8
    }
  ],
  "patterns": [
    {
      "name": "greeting",
      "examples": ["merhaba", "selam"],
      "category": "genel"
    }
  ]
}
```

**Kullanım:**
- GPT çağrısında `user` ve `assistant` mesajları olarak eklenir
- İlk 3-5 örnek kullanılır (token tasarrufu)
- Mevcut: 5 few-shot, 4 pattern

## 5. server/training-data.json (Başarılı Yanıtlar)

**Amaç:** Gerçek kullanıcı etkileşimlerinden öğrenme

**İçerik:**
- Başarılı yanıt örnekleri (3 adet)
- Yaygın niyetler (4 adet)
- Kategori bazlı örnekler

**Kullanım:**
- Karmaşık sorularda GPT'ye ek bağlam
- İstatistik ve analiz
- Sistem iyileştirme

## 6. server/ai-destek-training.json (Kullanıcı Kalıpları)

**Amaç:** Kullanıcı davranış kalıplarını tanımak

**İçerik:**
- Temel sorular (2 adet)
- Kullanıcı kalıpları (3 adet)
- Yanıt tipleri

**Kullanım:**
- Niyet tespiti
- Yanıt tipi belirleme
- Kullanıcı deneyimi iyileştirme

## Sistem Akışı

```
Kullanıcı Mesajı
    ↓
1. qa-database.json kontrol (0.1ms)
    ├─ Bulundu → Anında yanıt (ÜCRETSİZ)
    └─ Bulunamadı ↓
2. openai.js (GPT çağrısı)
    ├─ ai-system-prompt.txt (system mesajı)
    ├─ config/prompts.js (ayarlar)
    ├─ training/training.json (few-shot)
    ├─ training-data.json (örnekler)
    ├─ ai-destek-training.json (kalıplar)
    └─ Kullanıcı mesajı + geçmiş
    ↓
3. GPT-4o-mini yanıtı (~850ms)
    ↓
4. Cache'e kaydet (1 saat)
    ↓
5. Kullanıcıya gönder
```

## Token Maliyeti

| Kaynak | Token | Maliyet (gpt-4o-mini) |
|--------|-------|----------------------|
| ai-system-prompt.txt | ~2000 | $0.0003/istek |
| training.json (3 örnek) | ~300 | $0.000045/istek |
| training-data.json | ~400 | $0.00006/istek |
| ai-destek-training.json | ~200 | $0.00003/istek |
| Kullanıcı mesajı | ~50 | $0.0000075/istek |
| Geçmiş (2 mesaj) | ~100 | $0.000015/istek |
| **TOPLAM INPUT** | **~3050** | **$0.0004575/istek** |
| Yanıt (150 token) | ~150 | $0.0009/istek |
| **TOPLAM** | **~3200** | **$0.0013575/istek** |

**Aylık Maliyet Tahmini:**
- 1000 istek/ay: ~$1.36
- 5000 istek/ay: ~$6.79
- 10000 istek/ay: ~$13.58

## Optimizasyon Stratejileri

### 1. Cache Kullanımı
- Aynı sorular için cache'den yanıt (ÜCRETSİZ)
- Redis veya memory cache
- 1 saat TTL

### 2. qa-database.json Genişletme
- Sık sorulan soruları ekle
- GPT çağrısını azalt
- %30-40 maliyet tasarrufu

### 3. Few-Shot Azaltma
- Sadece ilgili örnekleri gönder
- Token tasarrufu: ~200 token/istek

### 4. Geçmiş Limiti
- Son 2 mesaj yerine 1 mesaj
- Token tasarrufu: ~50 token/istek

## Güncelleme Rehberi

### qa-database.json Güncelleme
```bash
# Admin panelden veya manuel
# Dosyayı düzenle ve kaydet
# Otomatik reload (kod içinde)
```

### ai-system-prompt.txt Güncelleme
```bash
# Dosyayı düzenle
# Sunucuyu yeniden başlat VEYA
# Admin panelden "AI Prompt" sekmesinden güncelle
```

### training.json Güncelleme
```bash
# Dosyayı düzenle
# Cache temizle (otomatik)
# Yeni örnekler hemen aktif
```

## Yedekleme

**Önemli:** Tüm bilgi bankalarını düzenli yedekleyin!

```bash
# Yedekleme scripti
cp qa-database.json qa-database.backup.json
cp ai-system-prompt.txt ai-system-prompt.backup.txt
cp server/training/training.json server/training/training.backup.json
```

## Sık Sorulan Sorular

**S: Hangi dosyayı ne zaman güncellemeliyim?**
- Basit soru-cevap → `qa-database.json`
- AI davranışı → `ai-system-prompt.txt`
- Örnek diyaloglar → `training/training.json`

**S: Değişiklikler hemen aktif olur mu?**
- `qa-database.json` → Evet (otomatik reload)
- `ai-system-prompt.txt` → Hayır (sunucu restart)
- `training.json` → Evet (cache temizleme ile)

**S: Token maliyetini nasıl azaltırım?**
1. `qa-database.json`'ı genişlet
2. Cache kullan
3. Few-shot örnekleri azalt
4. Geçmiş limitini düşür

---

**Son Güncelleme:** 2025-01-05
**Versiyon:** 2.0
**Durum:** ✅ Aktif
