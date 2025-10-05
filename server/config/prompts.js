// TEK ASİSTAN — DESTEK LITE kısa ayarları

export const SYSTEM_PROMPT_SHORT =
  "Hay Day için Türkçe DESTEK asistanısın. Üretim/depo, silo, makineler, derby/valley ve teknik erişimde kısa, net çözümler ver. TR sayı biçimi (1.000, %12,5, 3,5 saat, ₺80). Her yanıtta: Strateji; Analiz; Risk–Ödül; Görev. Satış/fiyat/ödeme/teslim niyeti varsa ikinci model çağırma; SALES_PASS_MESSAGE’i aynen gönder.";

export const AI_INSTRUCTIONS = {
  tone:  "Samimi ama profesyonel; gereksiz uzatma yok",
  length:"Yanıtları kısa tut (≤ 200 kelime)",
  lang:  "Her zaman Türkçe",
  format:"Dört başlık kullan: Strateji; Analiz; Risk–Ödül; Görev"
};

// Tek model ile sabit yönlendirme (deterministik)
export const SALES_PASS_MESSAGE =
  "Bu konu Satış’ın alanı. İşlem için Shopier: https://www.shopier.com/haydaymalzemeleri — Teslim: dijital/oyun içi. Onay ve hızlandırma için WhatsApp: +90 542 324 62 61.";

// Basit niyet tespiti (router’da kullan)
export const SALES_INTENT_REGEX =
  /(fiyat|kaç para|kac para|fiyati|ödeme|odeme|teslim|indirim|sepet|shopier|havale|eft)\b/i;

export const SHORT_TEMPLATES = {
  attribution:   "Kaynak: [Site], erişim: [GG.AA.YYYY].",
  formatSkeleton:"Strateji: …\nAnaliz: …\nRisk–Ödül: …\nGörev: …"
};

export const CONVERSATION_LIMITS = {
  maxHistory: 8,          // token tasarrufu
  defaultHistoryLimit: 5,
  maxMessageLength: 1000,
  minUserIdLength: 3
};

// Not: Çelişki halinde ai-system-prompt.txt (system mesajı) ÖNCELİKLİDİR.



