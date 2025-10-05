# 🚀 Deployment Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Run

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## Environment Variables

```env
# Required
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
PORT=3000

# Optional
SALES_SHOPIER_URL=https://www.shopier.com/haydaymalzemeleri
SALES_WHATSAPP=+905423246261
CORS_ORIGINS=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

## Production Deployment

### PM2
```bash
npm install -g pm2
pm2 start server/server.js --name hayday-destek
pm2 save && pm2 startup
```

### Docker
```bash
docker build -t hayday-destek .
docker run -p 3000:3000 --env-file .env hayday-destek
```

### Render.com
- Push to GitHub
- Connect repository on Render
- Deploy automatically

## Health Check
```bash
curl http://localhost:3000/health
```

## API Endpoints

- `POST /api/chat/message` - Send message
- `GET /api/chat/history/:userId` - Get history
- `GET /health` - Health check
