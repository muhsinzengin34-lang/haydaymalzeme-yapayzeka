// Kullanım: node tools/augment-kb.js qa-database.json > qa-database-augmented.json
const fs = require("fs");
const { expandVariants, baseNorm, WA_VARIANTS } = require("../server/core/text-normalize");

const file = process.argv[2]; 
if(!file){console.error("Dosya yolu verin"); process.exit(1);}
const kb = JSON.parse(fs.readFileSync(file,"utf8"));

const EXTRA_KEYWORDS = {
  whatsapp: WA_VARIANTS,
  tesekkur: ["tesekkur","tesekkür","tsk","sagol","saol","eyvallah","tesekkürler","tesekkurler"],
  sikayet: ["sikayet","şikayet","problem","sorun","memnun degilim","şikayet kaydı","şikayet var"],
  siparis: ["siparis","sipariş","kargo","takip","nerede","nerde","kod","no","durum"],
  acil: ["acil","acele","hemen","simdi","şimdi","acil destek"],
  guvenlik: ["guvenli","güvenli","güvenilir","dolandiricilik","dolandırıcılık","koruma","güvence","shopier"]
};

function uniq(arr){ return Array.from(new Set(arr.filter(Boolean))); }

function augmentItem(it){
  const alt0 = it.alternativeQuestions || [];
  const kws0 = it.keywords || [];
  
  let alt = [...alt0];
  alt0.forEach(a => expandVariants(a).forEach(v => alt.push(v)));
  
  let kws = [...kws0];
  const normQ = baseNorm(it.question || "");
  if (normQ.includes("whatsapp")) kws.push(...EXTRA_KEYWORDS.whatsapp);
  if (normQ.includes("tesekkur") || normQ.includes("tesekkür")) kws.push(...EXTRA_KEYWORDS.tesekkur);
  if (normQ.includes("şikayet") || normQ.includes("sikayet")) kws.push(...EXTRA_KEYWORDS.sikayet);
  if (normQ.includes("siparis") || normQ.includes("sipariş")) kws.push(...EXTRA_KEYWORDS.siparis);
  if (normQ.includes("acil")) kws.push(...EXTRA_KEYWORDS.acil);
  if (normQ.includes("guven") || normQ.includes("güven")) kws.push(...EXTRA_KEYWORDS.guvenlik);
  
  alt.forEach(a=>{
    const n = baseNorm(a);
    if (n.includes("whatsapp") || n.includes("watsapp")) kws.push(...EXTRA_KEYWORDS.whatsapp);
  });

  it.alternativeQuestions = uniq(alt).slice(0, 60);
  it.keywords = uniq(kws).slice(0, 40);
  return it;
}

const out = kb.map(augmentItem);
process.stdout.write(JSON.stringify(out, null, 2));
