# Render.com Deployment Rehberi

## Hızlı Başlangıç

### 1. Render Hesabı Oluşturun
- https://render.com adresine gidin
- GitHub hesabınızla giriş yapın

### 2. Yeni Web Service Oluşturun
1. Dashboard'da "New +" butonuna tıklayın
2. "Web Service" seçin
3. GitHub repository'nizi bağlayın: `muhsinzengin34-lang/haydaymalzeme-yapayzeka`
4. Aşağıdaki ayarları yapın:

### 3. Temel Ayarlar
```
Name: haydaydestek
Region: Frankfurt (EU Central)
Branch: main
Runtime: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

### 4. Environment Variables (Ortam Değişkenleri)
Render Dashboard'da "Environment" sekmesine gidin ve şunları ekleyin:

```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
PORT=3000
NODE_ENV=production
SALES_SHOPIER_URL=https://www.shopier.com/haydaymalzemeleri
SALES_WHATSAPP=+905423246261
```

**ÖNEMLİ:** `OPENAI_API_KEY` değerini kendi API anahtarınızla değiştirin!

### 5. Deploy Edin
- "Create Web Service" butonuna tıklayın
- Render otomatik olarak deploy edecek (5-10 dakika)

### 6. URL'nizi Alın
Deploy tamamlandıktan sonra:
```
https://haydaydestek.onrender.com
```

## Otomatik Deployment (render.yaml)

Proje `render.yaml` dosyası içeriyor. Bu sayede:
- Her GitHub push'ta otomatik deploy
- Tüm ayarlar kod içinde

## Free Plan Özellikleri

✅ Ücretsiz hosting
✅ HTTPS otomatik
✅ Otomatik deploy
❌ 15 dakika inaktivite sonrası uyku modu
❌ Aylık 750 saat limit

## Uyku Modunu Önleme

Proje zaten keep-alive mekanizması içeriyor:
- Her 4 dakikada bir kendi kendine ping atar
- `server.js` içinde aktif

## Environment Variables Güvenliği

Render Dashboard'da:
1. Environment sekmesi
2. "Add Environment Variable"
3. Key: `OPENAI_API_KEY`
4. Value: API anahtarınız
5. "Add" tıklayın

## Logs İzleme

Render Dashboard'da:
- "Logs" sekmesi
- Gerçek zamanlı log akışı
- Hata ayıklama için kullanın

## Custom Domain (Opsiyonel)

1. Render Dashboard > Settings
2. "Custom Domain" bölümü
3. Domain ekleyin
4. DNS ayarlarını yapın

## Sorun Giderme

### Deploy Başarısız
```bash
# Build loglarını kontrol edin
# package.json'da "engines" ekleyin:
"engines": {
  "node": ">=18.0.0"
}
```

### Environment Variables Eksik
- Render Dashboard > Environment
- Tüm değişkenlerin eklendiğinden emin olun
- "Save Changes" tıklayın

### 503 Service Unavailable
- İlk istek 30-60 saniye sürebilir (cold start)
- Keep-alive aktif olduğundan emin olun

## Maliyet

Free Plan:
- $0/ay
- 750 saat/ay
- 512 MB RAM
- Paylaşımlı CPU

Paid Plan (ihtiyaç halinde):
- $7/ay'dan başlar
- Uyku modu yok
- Daha fazla kaynak

## Güncelleme

GitHub'a push yaptığınızda otomatik deploy:
```bash
git add .
git commit -m "Güncelleme"
git push origin main
```

Render otomatik olarak yeni versiyonu deploy eder.

## Destek

- Render Docs: https://render.com/docs
- GitHub Issues: Repository'nizde issue açın
