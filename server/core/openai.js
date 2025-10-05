import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { getCached, setCached } from '../cache/redis.js';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

let qaDatabase = [];

function normalizeTurkishChars(text) {
    if (!text) return '';
    return text
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C');
}

function loadQADatabase() {
    try {
        const qaPath = path.join(__dirname, '..', 'qa-database.json');
        if (fs.existsSync(qaPath)) {
            const data = fs.readFileSync(qaPath, 'utf8');
            const parsed = JSON.parse(data);
            qaDatabase = Array.isArray(parsed) ? parsed : (parsed.qa || []);
            console.log('✅ Q&A loaded:', qaDatabase.length);
        } else {
            qaDatabase = [];
        }
    } catch (error) {
        console.error('❌ Q&A error:', error);
        qaDatabase = [];
    }
}

function findEnhancedQAResponse(message) {
    const lowerMessage = normalizeTurkishChars(message.toLowerCase().trim());
    
    // Tarla ekimi sorularını GPT'ye yönlendir
    if (lowerMessage.includes('tarla') && (lowerMessage.includes('ek') || lowerMessage.includes('nasil'))) {
        return null;
    }
    
    for (const qa of qaDatabase) {
        if (qa.question && normalizeTurkishChars(qa.question.toLowerCase().trim()) === lowerMessage) {
            return qa.answer;
        }
    }
    
    for (const qa of qaDatabase) {
        if (qa.alternativeQuestions && Array.isArray(qa.alternativeQuestions)) {
            for (const altQuestion of qa.alternativeQuestions) {
                if (altQuestion && normalizeTurkishChars(altQuestion.toLowerCase().trim()) === lowerMessage) {
                    return qa.answer;
                }
            }
        }
    }
    
    for (const qa of qaDatabase) {
        if (qa.keywords && Array.isArray(qa.keywords)) {
            const messageWords = lowerMessage.split(' ').filter(w => w.length > 2);
            const keywordMatches = messageWords.filter(word => 
                qa.keywords.some(keyword => normalizeTurkishChars(keyword.toLowerCase()) === word)
            );
            
            if (keywordMatches.length >= 2) {
                return qa.answer;
            }
            
            const hasPriceQuery = messageWords.some(w => 
                ['fiyat', 'fiyati', 'para', 'tl', 'kac', 'kaç', 'ne', 'kadar'].includes(w)
            );
            
            if (keywordMatches.length >= 1 && hasPriceQuery) {
                return qa.answer;
            }
        }
    }
    
    return null;
}

export function getSimpleResponse(message) {
    const qaResponse = findEnhancedQAResponse(message);
    if (qaResponse) {
        // Q&A yanıtını kaydet (ücretsiz)
        import('./cost-tracker.js').then(({ trackQAResponse }) => trackQAResponse()).catch(() => {});
        return qaResponse;
    }
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('merhaba') || lowerMessage.includes('selam') || lowerMessage.includes('hey')) {
        return 'Merhaba! 🌾 Hay Day malzeme satışı için buradayım. Size nasıl yardımcı olabilirim?';
    }
    
    if (lowerMessage.includes('nasılsın') || lowerMessage.includes('nasilsin')) {
        return 'Teşekkürler, iyiyim! 😊 Hay Day malzemeleriniz için size yardımcı olmak isterim. Hangi ürünleri arıyorsunuz?';
    }
    
    if (lowerMessage.includes('teşekkür') || lowerMessage.includes('sağol')) {
        return 'Rica ederim! 😊 Başka sorunuz varsa çekinmeyin.';
    }
    
    // Tarla ekimi sorusu için özel kontrol - GPT'ye yönlendir
    if (lowerMessage.includes('tarla') && (lowerMessage.includes('ek') || lowerMessage.includes('nasıl'))) {
        return null; // GPT devreye girsin
    }
    
    return null; // GPT'nin devreye girmesi için null döndür
}

function loadSystemPrompt() {
    try {
        const promptPath = path.join(__dirname, '..', 'ai-system-prompt.txt');
        if (fs.existsSync(promptPath)) {
            return fs.readFileSync(promptPath, 'utf8').trim();
        }
    } catch (error) {
        console.error('❌ Prompt yükleme hatası:', error);
    }
    
    // Varsayılan prompt
    return `Sen Hay Day oyunu için profesyonel bir destek ve satış asistanısın.

Görevin:
- Ürün fiyatları ve özellikleri hakkında bilgi vermek
- Satın alma kararlarında yardımcı olmak
- Teslimat ve ödeme konularında destek sağlamak
- Samimi ve yardımsever bir dille iletişim kurmak

Kurallar:
- Türkçe yanıt ver
- Kısa ve net ol (max 5 cümle)
- Emoji kullan: 🌾 💰 🚀 👍 ⚡
- Sayılarla konuş`;
}

// Cache mekanizması
let trainingCache = { data: [], timestamp: 0 };
let destekCache = { data: [], timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000; // 5 dakika

// Response cache (sık sorulan sorular için)
const responseCache = new Map();
const RESPONSE_CACHE_TTL = 60 * 60 * 1000; // 1 saat

function loadTrainingExamples() {
    try {
        const now = Date.now();
        if (trainingCache.data.length > 0 && (now - trainingCache.timestamp) < CACHE_TTL) {
            return trainingCache.data;
        }
        
        const trainingPath = path.join(__dirname, 'training-data.json');
        if (fs.existsSync(trainingPath)) {
            const data = JSON.parse(fs.readFileSync(trainingPath, 'utf8'));
            const examples = data.patterns?.successful_responses?.slice(0, 3) || [];
            trainingCache = { data: examples, timestamp: now };
            return examples;
        }
    } catch (error) {
        console.log('ℹ️ Training data yüklenemedi');
    }
    return [];
}

function loadDestekExamples() {
    try {
        const now = Date.now();
        if (destekCache.data.length > 0 && (now - destekCache.timestamp) < CACHE_TTL) {
            return destekCache.data;
        }
        
        const destekPath = path.join(__dirname, 'ai-destek-training.json');
        if (fs.existsSync(destekPath)) {
            const data = JSON.parse(fs.readFileSync(destekPath, 'utf8'));
            const examples = data.successfulResponses?.slice(0, 2) || [];
            destekCache = { data: examples, timestamp: now };
            return examples;
        }
    } catch (error) {
        console.log('ℹ️ Destek data yüklenemedi');
    }
    return [];
}

function isSimpleQuestion(message) {
    const simple = ['merhaba', 'selam', 'hey', 'günaydın', 'iyi akşamlar', 
                    'teşekkür', 'sığol', 'hoşçakal', 'görüşürz'];
    const lower = message.toLowerCase();
    return simple.some(word => lower.includes(word)) && message.length < 30;
}

export async function getAIResponse(message, conversationHistory = []) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            console.error('❌ OpenAI API key bulunamadı!');
            return null;
        }
        
        // Redis cache kontrolü (öncelikli)
        const cacheKey = 'ai:' + message.toLowerCase().trim();
        if (conversationHistory.length === 0) {
            const cached = await getCached(cacheKey);
            if (cached) {
                console.log('✅ Redis cache hit - ÜCRETSİZ');
                import('./cost-tracker.js').then(({ trackCacheHit }) => trackCacheHit()).catch(() => {});
                return cached;
            }
        }
        
        // Memory cache kontrolü (fallback)
        if (conversationHistory.length === 0 && responseCache.has(cacheKey)) {
            console.log('✅ Memory cache hit - ÜCRETSİZ');
            import('./cost-tracker.js').then(({ trackCacheHit }) => trackCacheHit()).catch(() => {});
            return responseCache.get(cacheKey);
        }
        
        const systemPrompt = loadSystemPrompt();
        const messages = [{ role: 'system', content: systemPrompt }];
        
        // Basit soru kontrolü
        const isSimple = isSimpleQuestion(message);
        
        if (!isSimple) {
            // Sadece karmaşık sorularda eğitim örnekleri ekle
            const trainingExamples = loadTrainingExamples();
            const destekExamples = loadDestekExamples();
            
            trainingExamples.forEach(ex => {
                if (ex.user_question && ex.bot_response) {
                    messages.push({ role: 'user', content: ex.user_question });
                    messages.push({ role: 'assistant', content: ex.bot_response });
                }
            });
            
            destekExamples.forEach(ex => {
                if (ex.question && ex.answer) {
                    messages.push({ role: 'user', content: ex.question });
                    messages.push({ role: 'assistant', content: ex.answer });
                }
            });
        }
        
        // Konuşma geçmişi ekle (son 2 mesaj - 4 yerine)
        const recentHistory = conversationHistory.slice(-2);
        messages.push(...recentHistory);
        
        // Güncel kullanıcı mesajı
        messages.push({ role: 'user', content: message });
        
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // 10x daha ucuz
            messages: messages,
            max_tokens: 150, // 200 yerine 150
            temperature: 0.7 // Daha tutarlı
        });
        
        const response = completion.choices[0].message.content.trim();
        const tokenInfo = isSimple ? 'basit soru' : 'eğitim + geçmiş';
        console.log(`✅ AI yanıt verdi (${tokenInfo})`);
        
        // Maliyet takibi
        const inputTokens = completion.usage?.prompt_tokens || messages.reduce((sum, m) => sum + (m.content?.length || 0) / 4, 0);
        const outputTokens = completion.usage?.completion_tokens || response.length / 4;
        import('./cost-tracker.js').then(({ trackGPTCall }) => 
            trackGPTCall(inputTokens, outputTokens, 'gpt-4o-mini')
        ).catch(() => {});
        
        // Redis cache'e kaydet (öncelikli)
        if (conversationHistory.length === 0 && message.length < 100) {
            await setCached(cacheKey, response, 3600); // 1 saat
            // Memory cache'e de kaydet (fallback)
            responseCache.set(cacheKey, response);
            setTimeout(() => responseCache.delete(cacheKey), RESPONSE_CACHE_TTL);
        }
        
        return response;
    } catch (error) {
        console.error('❌ AI hatası:', error.message);
        return null;
    }
}

export function reloadQADatabase() {
    loadQADatabase();
    // Cache'i temizle
    trainingCache = { data: [], timestamp: 0 };
    destekCache = { data: [], timestamp: 0 };
    responseCache.clear();
    console.log('✅ Cache temizlendi');
}

loadQADatabase();

export default {
    getSimpleResponse,
    getAIResponse,
    reloadQADatabase
};
