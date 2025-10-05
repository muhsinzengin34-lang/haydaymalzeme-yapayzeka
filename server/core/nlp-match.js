const { baseNorm } = require("./text-normalize");

function matchQuery(q, items){
  const qn = baseNorm(q);
  
  // 1) exact alt
  for (const it of items) {
    const alts = (it.alternativeQuestions||[]).map(baseNorm);
    if (alts.includes(qn)) return { item: it, score: 1.0, via: "alt" };
  }
  
  // 2) keyword kapsama
  const qWords = new Set(qn.split(" "));
  let best = null;
  for (const it of items) {
    const kws = (it.keywords||[]).map(baseNorm);
    const hits = kws.filter(k=> qn.includes(k) || qWords.has(k)).length;
    const score = hits / Math.max(1, kws.length);
    if (!best || score > best.score) best = { item: it, score, via: "kw" };
  }
  
  // 3) yumuşak eşik
  if (best && best.score >= 0.15) return best;
  return null;
}

module.exports = { matchQuery };
