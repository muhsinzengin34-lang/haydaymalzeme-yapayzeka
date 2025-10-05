// Türkçe normalize + varyasyon üretici (hafif, bağımlılıksız)
const MAP_TR = { "ş":"s","Ş":"s","ı":"i","İ":"i","ğ":"g","Ğ":"g","ç":"c","Ç":"c","ö":"o","Ö":"o","ü":"u","Ü":"u" };

function toAscii(s) {
  return s.replace(/[şŞıİğĞçÇöÖüÜ]/g, ch => MAP_TR[ch] || ch)
          .normalize("NFKD").replace(/[\u0300-\u036f]/g,"");
}

export function baseNorm(s) {
  return toAscii(s.toLowerCase())
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ").trim();
}

function expandQuestionForms(q) {
  const b = baseNorm(q);
  const noQ = b.replace(/\?+$/,"").trim();
  const joinMi = noQ.replace(/\s+(mi|mı|mu|mü)\b/g, (m, p1) => p1);
  const noSpaces = noQ.replace(/\s+/g,"");
  const variants = new Set([b, noQ, joinMi, noSpaces]);
  variants.add(noQ + " ?");
  return Array.from(variants).filter(Boolean);
}

export const WA_VARIANTS = ["whatsapp","whatsap","watsapp","watsap","wp","wpp","wa","whatssapp","whatapp","whats up"];

export function expandVariants(str) {
  const out = new Set();
  const forms = expandQuestionForms(str);
  forms.forEach(f => {
    out.add(f);
    WA_VARIANTS.forEach(wv => {
      if (f.includes("whatsapp")) out.add(f.replaceAll("whatsapp", wv));
      if (f.includes("watsapp")) out.add(f.replaceAll("watsapp", wv));
    });
  });
  return Array.from(out);
}
