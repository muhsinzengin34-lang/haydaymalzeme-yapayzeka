import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { apiLimiter, chatLimiter, adminLimiter, validateAndSanitize, securityHeaders, wafMiddleware } from './middleware/security.js';
import { gdprMiddleware, deleteUserData, exportUserData } from './middleware/gdpr.js';
import { getCached, setCached } from './cache/redis.js';
import { verifyAdminToken, generateAdminToken, revokeAdminToken } from './middleware/auth.js';
import { errorHandler, notFoundHandler, setupProcessHandlers } from './middleware/errorHandler.js';
import { 
    processChatbotMessage, 
    getUserChatHistory, 
    getAllChats, 
    sendAdminMessage,
    getChatbotStats,
    validateMessage,
    validateUserId
} from './core/chatbot.js';
import { initDb, getSetting, setSetting, getAllSettings, getMessages, deleteUserChat, saveMessage } from './db.js';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.set('trust proxy', 1); // Render.com için gerekli
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ["GET", "POST"],
        credentials: true
    }
});
const PORT = process.env.PORT || 3000;

// Security middleware
setupProcessHandlers();

// WAF protection
app.use(wafMiddleware);

// GDPR compliance
app.use(gdprMiddleware);

// Helmet with CSP
import helmet from 'helmet';
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: { action: 'deny' },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

app.use(securityHeaders);
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(validateAndSanitize);
app.use('/api/', apiLimiter);
app.use(express.static('public'));

// Socket.io bağlantı yönetimi
const connectedUsers = new Map(); // userId -> socketId
const adminSockets = new Set(); // admin socket'ları

io.on('connection', (socket) => {
    console.log('Yeni socket bağlantısı:', socket.id);

    // Kullanıcı bağlantısı
    socket.on('user-connect', (userData) => {
        const { userId, username } = userData;
        connectedUsers.set(userId, socket.id);
        socket.userId = userId;
        socket.username = username;
        socket.userType = 'user';
        
        console.log(`Kullanıcı bağlandı: ${username} (${userId})`);
        
        // Admin'lere kullanıcının online olduğunu bildir
        adminSockets.forEach(adminSocketId => {
            io.to(adminSocketId).emit('user-online', { userId, username });
        });
    });

    // Admin bağlantısı
    socket.on('admin-connect', (adminData) => {
        adminSockets.add(socket.id);
        socket.userType = 'admin';
        socket.adminUsername = adminData.username || 'Admin';
        
        console.log('Admin bağlandı:', socket.id);
        
        // Online kullanıcıları admin'e gönder
        const onlineUsers = [];
        connectedUsers.forEach((socketId, userId) => {
            const userSocket = io.sockets.sockets.get(socketId);
            if (userSocket) {
                onlineUsers.push({ userId, username: userSocket.username });
            }
        });
        socket.emit('online-users', onlineUsers);
    });

    // Kullanıcıdan gelen mesaj
    socket.on('user-message', async (messageData) => {
        const { userId, username, message } = messageData;
        
        console.log(`Kullanıcı mesajı: ${username} -> ${message}`);
        
        // Mesajı veritabanına kaydet
        try {
            await saveMessage({
                userId,
                username,
                sender: 'user',
                message,
                timestamp: new Date().toISOString(),
                fileUrl: null,
                platform: 'web'
            });
        } catch (error) {
            console.error('Mesaj kaydetme hatası:', error);
        }
        
        // Telegram bildirim (pasif)
        
        // Admin'lere mesajı ilet
        adminSockets.forEach(adminSocketId => {
            io.to(adminSocketId).emit('new-user-message', {
                userId,
                username,
                message,
                timestamp: new Date().toISOString()
            });
        });
    });

    // Admin'den gelen mesaj
    socket.on('admin-message', async (messageData) => {
        const { userId, message, adminUsername } = messageData;
        
        console.log(`Admin mesajı: ${adminUsername} -> ${userId}: ${message}`);
        
        try {
            // Kullanıcıya mesajı ilet (mesaj zaten API endpoint'inde kaydedildi)
            const userSocketId = connectedUsers.get(userId);
            if (userSocketId) {
                io.to(userSocketId).emit('admin-reply', {
                    message,
                    adminUsername,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Admin mesajı gönderme hatası:', error);
        }
    });

    // Bağlantı koptuğunda
    socket.on('disconnect', () => {
        console.log('Socket bağlantısı koptu:', socket.id);
        
        if (socket.userType === 'user' && socket.userId) {
            connectedUsers.delete(socket.userId);
            
            // Admin'lere kullanıcının offline olduğunu bildir
            adminSockets.forEach(adminSocketId => {
                io.to(adminSocketId).emit('user-offline', { 
                    userId: socket.userId, 
                    username: socket.username 
                });
            });
        } else if (socket.userType === 'admin') {
            adminSockets.delete(socket.id);
        }
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

// ============================================
// MPA CHAT CONTINUITY - SESSION ENDPOINTS
// ============================================
import { randomUUID } from 'crypto';

// Session ensure - mint anon_id if missing
app.post('/api/session/ensure', (req, res) => {
    try {
        let anonId = req.cookies?.hd_anon;
        
        if (!anonId) {
            anonId = randomUUID();
            res.cookie('hd_anon', anonId, {
                maxAge: 180 * 24 * 60 * 60 * 1000, // 180 days
                httpOnly: false, // Widget needs to read it
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production'
            });
        }
        
        res.json({ success: true, anon_id: anonId });
    } catch (error) {
        console.error('Session ensure error:', error);
        res.status(500).json({ success: false, error: 'Session error' });
    }
});

// Session me - return current anon_id
app.get('/api/session/me', (req, res) => {
    try {
        const anonId = req.cookies?.hd_anon;
        
        if (!anonId) {
            return res.status(404).json({ success: false, error: 'No session found' });
        }
        
        res.json({ success: true, anon_id: anonId });
    } catch (error) {
        console.error('Session me error:', error);
        res.status(500).json({ success: false, error: 'Session error' });
    }
});
// ============================================

// Serve admin static files
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Admin panel route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/admin.html'));
});



// Chatbot API Endpoints

// Mesaj gönder
app.post('/api/chat/message', chatLimiter, async (req, res) => {
    try {
        const { userId, username, message } = req.body;
        
        // Validasyon
        const userValidation = validateUserId(userId);
        if (!userValidation.valid) {
            return res.status(400).json({ success: false, error: userValidation.error });
        }
        
        const messageValidation = validateMessage(message);
        if (!messageValidation.valid) {
            return res.status(400).json({ success: false, error: messageValidation.error });
        }
        
        // Mesajı işle
        const result = await processChatbotMessage({
            userId,
            username: username || 'Web User',
            message,
            platform: 'web'
        });
        
        res.json(result);
    } catch (error) {
        console.error('Chat mesaj hatası:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Sunucu hatası',
            response: 'Bir hata oluştu, lütfen tekrar deneyin.'
        });
    }
});

// Kullanıcı sohbet geçmişi
app.get('/api/chat/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const userValidation = validateUserId(userId);
        if (!userValidation.valid) {
            return res.status(400).json({ success: false, error: userValidation.error });
        }
        
        const history = await getUserChatHistory(userId);
        res.json({ success: true, history });
    } catch (error) {
        console.error('Sohbet geçmişi hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// Admin: Tüm sohbetler
app.get('/api/admin/chats', async (req, res) => {
    try {
        const chats = await getAllChats();
        res.json({ success: true, chats });
    } catch (error) {
        console.error('Tüm sohbetler hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// Admin: Kullanıcı mesaj geçmişi
app.get('/api/admin/messages/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const userValidation = validateUserId(userId);
        if (!userValidation.valid) {
            return res.status(400).json({ success: false, error: userValidation.error });
        }
        
        const messages = await getMessages(userId);
        res.json({ success: true, messages });
    } catch (error) {
        console.error('Kullanıcı mesaj geçmişi hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// Admin: Mesaj gönder
app.post('/api/admin/message', async (req, res) => {
    try {
        const { userId, message, adminUsername } = req.body;
        
        const userValidation = validateUserId(userId);
        if (!userValidation.valid) {
            return res.status(400).json({ success: false, error: userValidation.error });
        }
        
        const messageValidation = validateMessage(message);
        if (!messageValidation.valid) {
            return res.status(400).json({ success: false, error: messageValidation.error });
        }
        
        const result = await sendAdminMessage({ userId, message, adminUsername });
        res.json(result);
    } catch (error) {
        console.error('Admin mesaj hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// Admin: Konuşma sil
app.delete('/api/admin/chats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const userValidation = validateUserId(userId);
        if (!userValidation.valid) {
            return res.status(400).json({ success: false, error: userValidation.error });
        }
        
        const result = await deleteUserChat(userId);
        res.json(result);
    } catch (error) {
        console.error('Konuşma silme hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});



// Admin: API Keys güncelleme
app.post('/api/admin/update-keys', async (req, res) => {
    try {
        const { openaiKey, telegramToken, adminTelegramId } = req.body;
        
        const envPath = path.join(__dirname, '..', '.env');
        let envContent = await fs.readFile(envPath, 'utf8');
        
        if (openaiKey) {
            envContent = envContent.replace(
                /OPENAI_API_KEY=.*/,
                `OPENAI_API_KEY=${openaiKey}`
            );
        }
        
        if (telegramToken) {
            envContent = envContent.replace(
                /TELEGRAM_BOT_TOKEN=.*/,
                `TELEGRAM_BOT_TOKEN=${telegramToken}`
            );
        }
        
        if (adminTelegramId) {
            envContent = envContent.replace(
                /ADMIN_TELEGRAM_ID=.*/,
                `ADMIN_TELEGRAM_ID=${adminTelegramId}`
            );
        }
        
        await fs.writeFile(envPath, envContent);
        
        res.json({ 
            success: true, 
            message: 'API keys güncellendi. Sunucuyu yeniden başlatın.' 
        });
    } catch (error) {
        console.error('API key güncelleme hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// Admin: API Keys okuma (maskelenmiş)
app.get('/api/admin/get-keys', async (req, res) => {
    try {
        const maskKey = (key) => {
            if (!key || key.length < 10) return '***';
            return key.substring(0, 8) + '...' + key.substring(key.length - 4);
        };
        
        res.json({
            success: true,
            keys: {
                openaiKey: maskKey(process.env.OPENAI_API_KEY),
                telegramToken: maskKey(process.env.TELEGRAM_BOT_TOKEN),
                adminTelegramId: process.env.ADMIN_TELEGRAM_ID || ''
            }
        });
    } catch (error) {
        console.error('API key okuma hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// Admin: Toplu mesaj silme
app.post('/api/admin/bulk-delete-messages', async (req, res) => {
    try {
        const { openDb } = await import('./db.js');
        const db = await openDb();
        const result = await db.run('DELETE FROM messages');
        
        res.json({ 
            success: true, 
            message: `${result.changes} mesaj silindi`,
            deletedCount: result.changes
        });
    } catch (error) {
        console.error('Toplu mesaj silme hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// Admin: Toplu demo mesaj ekleme (AI eğitimini etkilemez)
app.post('/api/admin/bulk-messages', async (req, res) => {
    try {
        const { messages } = req.body;
        
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ success: false, error: 'Mesaj dizisi gerekli' });
        }
        
        let addedCount = 0;
        
        for (const msg of messages) {
            await saveMessage({
                userId: msg.userId || 'demo_' + Date.now(),
                username: msg.username || 'Demo Kullanıcı',
                sender: msg.sender || 'user',
                message: msg.message,
                timestamp: msg.timestamp || new Date().toISOString(),
                fileUrl: null,
                platform: 'demo',
                aiResponse: msg.aiResponse || null,
                isTrainingData: false // AI eğitiminde kullanılmayacak
            });
            addedCount++;
        }
        
        res.json({ 
            success: true, 
            message: `${addedCount} demo mesaj eklendi (AI eğitimini etkilemez)`,
            addedCount 
        });
    } catch (error) {
        console.error('Toplu mesaj ekleme hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// İstatistikler
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await getChatbotStats();
        res.json({ success: true, stats });
    } catch (error) {
        console.error('İstatistik hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// AI Status endpoint
app.get('/api/admin/ai-status', async (req, res) => {
    try {
        const status = {
            openai: {
                status: process.env.OPENAI_API_KEY ? 'active' : 'inactive',
                configured: !!process.env.OPENAI_API_KEY
            },
            qaDatabase: {
                status: 'checking',
                count: 0
            },
            telegram: {
                status: process.env.TELEGRAM_BOT_TOKEN ? 'active' : 'inactive',
                configured: !!process.env.TELEGRAM_BOT_TOKEN
            }
        };
        
        try {
            const qaPath = path.join(__dirname, '../qa-database.json');
            const qaData = await fs.readFile(qaPath, 'utf8');
            const parsed = JSON.parse(qaData);
            const qaArray = Array.isArray(parsed) ? parsed : (parsed.qa || []);
            status.qaDatabase.count = qaArray.length;
            status.qaDatabase.status = qaArray.length > 0 ? 'active' : 'empty';
        } catch (error) {
            status.qaDatabase.status = 'error';
        }
        
        res.json({ success: true, status });
    } catch (error) {
        console.error('AI status hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// Admin: İstatistikler
app.get('/api/admin/stats', async (req, res) => {
    try {
        const stats = await getChatbotStats();
        
        // Aktif kullanıcı sayısını hesapla (online kullanıcılar)
        const activeUsers = connectedUsers.size;
        
        const adminStats = {
            totalMessages: stats.totalMessages || 0,
            activeUsers: activeUsers,
            todayMessages: stats.todayMessages || 0
        };
        
        res.json({ success: true, stats: adminStats });
    } catch (error) {
        console.error('Admin istatistik hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});



// Ayarlar - Tüm ayarları getir
app.get('/api/admin/settings', async (req, res) => {
    try {
        const settings = await getAllSettings();
        
        // Varsayılan ayarlar
        const defaultSettings = {
            botStatus: 'active',
            botLanguage: 'tr',
            aiEnabled: true,
            aiName: 'Hay Day Asistan',
            aiWelcome: 'Merhaba! 🌾 Hay Day malzeme satışı için buradayım. Size nasıl yardımcı olabilirim?',
            aiDefault: 'Üzgünüm, bu konuda size yardımcı olamıyorum. Fiyat listesi, ürünler veya teslimat hakkında soru sorabilirsiniz.',
            offlineMessage: 'Şu anda çevrimdışıyız. Lütfen daha sonra tekrar deneyin.',
            maintenanceMessage: 'Sistem bakımdadır. Kısa süre sonra tekrar deneyin. 🔧',
            typingDelay: 1.5,
            responseDelay: 0.5,
            maxMessageLength: 800,
            spamLimit: 3,
            blockLinks: false,
            profanityFilter: false,
            widgetPosition: 'bottom-right',
            widgetTheme: 'green',
            showAvatar: true,
            showTimestamp: true,
            soundEnabled: true,
            trackUsers: true,
            saveHistory: true,
            historyRetention: 30,
            telegramNotifications: true,
            emailNotifications: false,
            notificationEmail: ''
        };
        
        // Mevcut ayarlarla birleştir
        const mergedSettings = { ...defaultSettings, ...settings };
        
        res.json({ success: true, settings: mergedSettings });
    } catch (error) {
        console.error('Ayarlar hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// Ayarları kaydet
app.post('/api/admin/settings', async (req, res) => {
    try {
        const { key, value } = req.body;
        
        if (!key || value === undefined) {
            return res.status(400).json({ success: false, error: 'Key ve value gerekli' });
        }
        
        await setSetting(key, value);
        res.json({ success: true, message: 'Ayar güncellendi' });
    } catch (error) {
        console.error('Ayar güncelleme hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// Tüm ayarları kaydet (toplu)
app.post('/api/admin/settings/save-all', async (req, res) => {
    try {
        const settings = req.body;
        
        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ success: false, error: 'Geçersiz ayar verisi' });
        }
        
        // Her ayarı tek tek kaydet
        for (const [key, value] of Object.entries(settings)) {
            await setSetting(key, value);
        }
        
        res.json({ success: true, message: 'Tüm ayarlar kaydedildi' });
    } catch (error) {
        console.error('Toplu ayar kaydetme hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// Ayarları sıfırla
app.post('/api/admin/settings/reset', async (req, res) => {
    try {
        const { openDb } = await import('./db.js');
        const db = await openDb();
        await db.run('DELETE FROM settings');
        
        res.json({ success: true, message: 'Ayarlar varsayılana sıfırlandı' });
    } catch (error) {
        console.error('Ayar sıfırlama hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// Ayarları dışa aktar
app.get('/api/admin/settings/export', async (req, res) => {
    try {
        const settings = await getAllSettings();
        
        const exportData = {
            settings,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        res.json({ success: true, data: exportData });
    } catch (error) {
        console.error('Ayar dışa aktarma hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// Bağlam kontrolü ayarları endpoint'leri
app.post('/api/admin/settings/context-analysis', async (req, res) => {
    try {
        const { enabled } = req.body;
        await setSetting('contextAnalysis', enabled);
        res.json({ success: true, message: 'Bağlam analizi ayarı güncellendi' });
    } catch (error) {
        console.error('Bağlam analizi ayar hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

app.post('/api/admin/settings/smart-matching', async (req, res) => {
    try {
        const { enabled } = req.body;
        await setSetting('smartMatching', enabled);
        res.json({ success: true, message: 'Akıllı eşleştirme ayarı güncellendi' });
    } catch (error) {
        console.error('Akıllı eşleştirme ayar hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

app.post('/api/admin/settings/uncertainty-control', async (req, res) => {
    try {
        const { enabled } = req.body;
        await setSetting('uncertaintyControl', enabled);
        res.json({ success: true, message: 'Belirsizlik kontrolü ayarı güncellendi' });
    } catch (error) {
        console.error('Belirsizlik kontrolü ayar hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

app.post('/api/admin/settings/confidence-threshold', async (req, res) => {
    try {
        const { threshold } = req.body;
        if (threshold < 0.1 || threshold > 1.0) {
            return res.status(400).json({ success: false, error: 'Güven skoru 0.1 ile 1.0 arasında olmalı' });
        }
        await setSetting('confidenceThreshold', threshold);
        res.json({ success: true, message: 'Güven skoru eşiği güncellendi' });
    } catch (error) {
        console.error('Güven skoru eşiği ayar hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});



// Soru-Cevap API endpoint'leri
app.get('/api/admin/qa', async (req, res) => {
    try {
        const qaPath = path.join(__dirname, '../qa-database.json');
        
        try {
            const qaData = await fs.readFile(qaPath, 'utf8');
            const qaArray = JSON.parse(qaData);
            res.json(qaArray);
        } catch (fileError) {
            // Dosya yoksa boş array döndür
            res.json([]);
        }
    } catch (error) {
        console.error('QA load error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Soru-cevaplar yüklenemedi' 
        });
    }
});

app.post('/api/admin/qa', async (req, res) => {
    try {
        const qaData = req.body;
        
        if (!Array.isArray(qaData)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Geçersiz soru-cevap verisi' 
            });
        }
        
        // Soru-cevapları dosyaya kaydet
        const qaPath = path.join(__dirname, '../qa-database.json');
        await fs.writeFile(qaPath, JSON.stringify(qaData, null, 2), 'utf8');

        
        res.json({ 
            success: true, 
            message: 'Soru-cevaplar başarıyla kaydedildi' 
        });
    } catch (error) {
        console.error('QA save error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Soru-cevaplar kaydedilemedi: ' + error.message 
        });
    }
});


// AI Prompt okuma
app.get('/api/admin/get-prompt', async (req, res) => {
    try {
        const promptPath = path.join(__dirname, '..', 'ai-system-prompt.txt');
        const prompt = await fs.readFile(promptPath, 'utf8');
        
        res.json({ 
            success: true, 
            prompt: prompt.trim() 
        });
    } catch (error) {
        console.error('Prompt okuma hatası:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Sunucu hatası' 
        });
    }
});

// AI Prompt kaydetme
app.post('/api/admin/save-prompt', async (req, res) => {
    try {
        const { systemPrompt } = req.body;
        
        if (!systemPrompt || systemPrompt.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Prompt boş olamaz' 
            });
        }
        
        const promptPath = path.join(__dirname, '..', 'ai-system-prompt.txt');
        await fs.writeFile(promptPath, systemPrompt.trim(), 'utf8');
        
        res.json({ 
            success: true, 
            message: 'AI Prompt başarıyla kaydedildi' 
        });
    } catch (error) {
        console.error('Prompt kaydetme hatası:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Sunucu hatası' 
        });
    }
});

// Q&A API endpoint'leri (yeni yapı için)
app.get('/api/qa', async (req, res) => {
    try {
        const qaPath = path.join(__dirname, '../qa-database.json');
        
        try {
            const qaData = await fs.readFile(qaPath, 'utf8');
            const parsed = JSON.parse(qaData);
            const qaArray = Array.isArray(parsed) ? parsed : (parsed.qa || []);
            res.json(qaArray);
        } catch (fileError) {
            res.json([]);
        }
    } catch (error) {
        console.error('QA load error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Soru-cevaplar yüklenemedi' 
        });
    }
});

app.post('/api/qa', async (req, res) => {
    try {
        const qaData = req.body;
        
        if (!Array.isArray(qaData)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Geçersiz soru-cevap verisi' 
            });
        }
        
        const qaPath = path.join(__dirname, '../qa-database.json');
        const dataToSave = {
            qa: qaData,
            lastUpdated: new Date().toISOString()
        };
        await fs.writeFile(qaPath, JSON.stringify(dataToSave, null, 2), 'utf8');
        
        try {
            const { reloadQADatabase } = await import('./core/openai.js');
            reloadQADatabase();
        } catch (reloadError) {
            console.error('Q&A reload error:', reloadError);
        }
        
        res.json({ 
            success: true, 
            message: 'Soru-cevaplar başarıyla kaydedildi' 
        });
    } catch (error) {
        console.error('QA save error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Soru-cevaplar kaydedilemedi: ' + error.message 
        });
    }
});

// Admin login endpoints - DB'de sakla
app.post('/api/admin/send-code', adminLimiter, async (req, res) => {
    try {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = Date.now() + (5 * 60 * 1000); // 5 dakika
        
        // DB'ye kaydet
        await setSetting('adminLoginCode', code);
        await setSetting('adminLoginCodeExpiry', expiry.toString());
        
        // Telegram (pasif)
        
        console.log('🔑 Admin login kodu:', code);
        console.log('⏰ Kod geçerlilik süresi: 5 dakika');
        
        res.json({ 
            success: true, 
            message: 'Kod gönderildi (5 dakika geçerli)' 
        });
    } catch (error) {
        console.error('Send code error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Kod gönderilemedi: ' + error.message 
        });
    }
});

app.post('/api/admin/verify-code', adminLimiter, async (req, res) => {
    try {
        const { code } = req.body;
        
        console.log('=== VERIFY CODE DEBUG ===');
        console.log('Received code:', code);
        console.log('Code type:', typeof code);
        
        if (!code) {
            console.log('❌ Kod boş');
            return res.status(400).json({ 
                success: false, 
                message: 'Kod gerekli' 
            });
        }
        
        // DB'den kodu al
        const storedCode = await getSetting('adminLoginCode');
        const storedExpiry = await getSetting('adminLoginCodeExpiry');
        
        console.log('Stored code:', storedCode);
        console.log('Stored expiry:', storedExpiry);
        console.log('Current time:', Date.now());
        
        if (!storedCode || storedCode === 'null' || storedCode === null) {
            console.log('❌ Kod bulunamadı');
            return res.status(400).json({ 
                success: false, 
                message: 'Önce "Kod Gönder" butonuna tıklayın' 
            });
        }
        
        // Kod süresi dolmuş mu
        if (storedExpiry && Date.now() > parseInt(storedExpiry)) {
            console.log('❌ Kod süresi doldu');
            await setSetting('adminLoginCode', null);
            await setSetting('adminLoginCodeExpiry', null);
            return res.status(400).json({ 
                success: false, 
                message: 'Kod süresi doldu (5dk). Yeni kod isteyin.' 
            });
        }
        
        // Kod doğru mu
        const codeMatch = code.toString().trim() === storedCode.toString().trim();
        console.log('Code match:', codeMatch);
        
        if (codeMatch) {
            await setSetting('adminLoginCode', null);
            await setSetting('adminLoginCodeExpiry', null);
            const token = generateAdminToken('admin');
            console.log('✅ Login başarılı');
            res.json({ 
                success: true, 
                message: 'Giriş başarılı',
                token: token
            });
        } else {
            console.log('❌ Kod eşleşmedi');
            console.log('Expected:', storedCode);
            console.log('Received:', code);
            res.status(400).json({ 
                success: false, 
                message: 'Geçersiz kod. Telegram\'dan gelen kodu kontrol edin.' 
            });
        }
    } catch (error) {
        console.error('❌ Verify code error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Sunucu hatası: ' + error.message 
        });
    }
});

// Server'ı başlat
server.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server URL: http://localhost:${PORT}`);
    console.log('Socket.io server hazır');
    
    // Veritabanını başlat
    try {
        console.log('Veritabanı başlatılıyor...');
        await initDb();
        console.log('Veritabanı başarıyla başlatıldı');
    } catch (error) {
        console.error('Veritabanı başlatma hatası:', error);
    }
    
    // Telegram bot (pasif)
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await initDb();
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});



// GDPR Endpoints
app.post('/api/gdpr/consent', (req, res) => {
    res.cookie('gdpr_consent', 'true', { 
        maxAge: 365*24*60*60*1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.json({ success: true, message: 'Consent recorded' });
});

app.delete('/api/gdpr/delete-data', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId required' });
        }
        const { openDb } = await import('./db.js');
        const db = await openDb();
        const result = await deleteUserData(userId, db);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/gdpr/export-data', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId required' });
        }
        const { openDb } = await import('./db.js');
        const db = await openDb();
        const result = await exportUserData(userId, db);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Keep-alive: 4 dakikada bir kendi kendine ping at (Render free tier için)
if (process.env.NODE_ENV === 'production') {
    const PING_INTERVAL = 4 * 60 * 1000; // 4 dakika
    
    setInterval(async () => {
        try {
            const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
            const response = await fetch(`${url}/health`);
            const data = await response.json();
            console.log('✅ Keep-alive ping:', data.status, new Date().toISOString());
        } catch (error) {
            console.error('❌ Keep-alive ping hatası:', error.message);
        }
    }, PING_INTERVAL);
    
    console.log(`🔄 Keep-alive aktif: Her ${PING_INTERVAL / 60000} dakikada bir ping`);
}

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
