import { getSimpleResponse, getAIResponse } from './openai.js';
import { 
    saveMessage, 
    saveUser, 
    updateUserActivity, 
    getMessages, 
    getSetting,
    updateMessageWithAI,
    getStats
} from '../db.js';
import { PLATFORMS, SENDER_TYPES, SETTINGS_KEYS, LIMITS, STATUS } from '../config/constants.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, INFO_MESSAGES } from '../messages/templates.js';
import { validateMessage, validateUserId } from '../utils/validators.js';

/**
 * Ana chatbot mesaj işleme fonksiyonu
 * @param {Object} messageData - Mesaj verisi
 * @param {string} messageData.userId - Kullanıcı ID
 * @param {string} messageData.username - Kullanıcı adı
 * @param {string} messageData.message - Mesaj içeriği
 * @param {string} messageData.platform - Platform (web, telegram)
 * @param {string} messageData.fileUrl - Dosya URL (opsiyonel)
 * @returns {Promise<Object>} - İşlem sonucu
 */
export async function processChatbotMessage(messageData) {
    try {
        const { userId, username, message, platform = PLATFORMS.WEB, fileUrl = null } = messageData;
        
        // Kullanıcıyı kaydet/güncelle
        await saveUser({ userId, username, platform });
        await updateUserActivity(userId);

        // Kullanıcı mesajını kaydet
        const timestamp = new Date().toISOString();
        const messageId = await saveMessage({
            userId,
            username,
            sender: SENDER_TYPES.USER,
            message,
            timestamp,
            fileUrl,
            platform
        });

        // Bot ayarlarını kontrol et
        const botEnabled = await getSetting(SETTINGS_KEYS.BOT_ENABLED);
        const openaiEnabled = await getSetting(SETTINGS_KEYS.OPENAI_ENABLED);
        const autoResponse = await getSetting(SETTINGS_KEYS.AUTO_RESPONSE);

        if (botEnabled !== 'true' || autoResponse !== 'true') {
            return {
                success: true,
                response: null,
                message: ERROR_MESSAGES.botDisabled
            };
        }

        // Sohbet geçmişini al
        const conversationHistory = await getConversationHistory(userId, LIMITS.DEFAULT_HISTORY_LIMIT);

        let aiResponse;
        let isAIResponse = false;
        
        // Önce basit Q&A yanıtını dene
        aiResponse = getSimpleResponse(message);
        
        // Eğer Q&A'da bulunamadıysa ve OpenAI aktifse GPT kullan
        if (!aiResponse && openaiEnabled === 'true') {
            try {
                const gptResponse = await getAIResponse(message, conversationHistory);
                if (gptResponse) {
                    aiResponse = gptResponse;
                    isAIResponse = true;
                    console.log('✅ AI yanıt verdi (bağlam ile)');
                } else {
                    aiResponse = ERROR_MESSAGES.aiError;
                }
            } catch (error) {
                console.error('❌ AI hatası:', error.message);
                aiResponse = ERROR_MESSAGES.aiError;
            }
        }
        
        // Eğer hiçbir yanıt bulunamadıysa varsayılan yanıt
        if (!aiResponse) {
            aiResponse = ERROR_MESSAGES.noResponse;
        }

        // AI yanıtını kaydet - GPT kullanıldıysa 'ai', değilse 'bot'
        const senderType = isAIResponse ? SENDER_TYPES.AI : SENDER_TYPES.BOT;
        const aiMessageId = await saveMessage({
            userId,
            username: username,
            sender: senderType,
            message: aiResponse,
            timestamp: new Date().toISOString(),
            fileUrl: null,
            platform,
            aiResponse: aiResponse
        });

        // Orijinal mesajı AI yanıtıyla güncelle
        await updateMessageWithAI(messageId, aiResponse);
        
        return {
            success: true,
            response: aiResponse,
            messageId: aiMessageId,
            userMessageId: messageId
        };

    } catch (error) {
        console.error('Chatbot mesaj işleme hatası:', error);
        return {
            success: false,
            error: error.message,
            response: ERROR_MESSAGES.general
        };
    }
}

/**
 * Sohbet geçmişini GPT formatında al
 * @param {string} userId - Kullanıcı ID
 * @param {number} limit - Mesaj limiti
 * @returns {Promise<Array>} - Sohbet geçmişi
 */
export async function getConversationHistory(userId, limit = LIMITS.DEFAULT_HISTORY_LIMIT) {
    try {
        const messages = await getMessages(userId);
        const recentMessages = messages.slice(-limit * LIMITS.HISTORY_MULTIPLIER);
        
        return recentMessages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.message
        }));
    } catch (error) {
        console.error('Sohbet geçmişi alınırken hata:', error);
        return [];
    }
}

/**
 * Kullanıcı sohbet geçmişini al
 * @param {string} userId - Kullanıcı ID
 * @returns {Promise<Array>} - Mesaj listesi
 */
export async function getUserChatHistory(userId) {
    try {
        return await getMessages(userId);
    } catch (error) {
        console.error('Kullanıcı sohbet geçmişi alınırken hata:', error);
        return [];
    }
}

/**
 * Tüm sohbetleri al (admin için)
 * @returns {Promise<Array>} - Kullanıcı bazında gruplandırılmış sohbetler
 */
export async function getAllChats() {
    try {
        const { getLastChats } = await import('./db.js');
        const lastChats = await getLastChats(LIMITS.MAX_CHAT_HISTORY);
        
        // Her kullanıcı için son mesajı al
        const chatsWithLastMessage = await Promise.all(
            lastChats.map(async (chat) => {
                const userMessages = await getMessages(chat.userId);
                const lastMessage = userMessages[userMessages.length - 1];
                
                return {
                    id: chat.userId,
                    userName: chat.username,
                    status: STATUS.ACTIVE,
                    lastMessage: lastMessage ? lastMessage.message : INFO_MESSAGES.noMessages,
                    lastMessageTime: lastMessage ? lastMessage.timestamp : null,
                    unreadCount: 0,
                    messages: userMessages.map(msg => ({
                        sender: msg.sender,
                        text: msg.message,
                        timestamp: msg.timestamp
                    }))
                };
            })
        );
        
        return chatsWithLastMessage;
    } catch (error) {
        console.error('Tüm sohbetler alınırken hata:', error);
        return [];
    }
}

/**
 * Admin mesajı gönder
 * @param {Object} messageData - Mesaj verisi
 * @returns {Promise<Object>} - İşlem sonucu
 */
export async function sendAdminMessage(messageData) {
    try {
        const { userId, message, adminUsername = 'Admin' } = messageData;
        
        const messageId = await saveMessage({
            userId,
            username: adminUsername,
            sender: SENDER_TYPES.ADMIN,
            message,
            timestamp: new Date().toISOString(),
            fileUrl: null,
            platform: PLATFORMS.ADMIN
        });

        return {
            success: true,
            messageId,
            message: SUCCESS_MESSAGES.adminMessageSent
        };
    } catch (error) {
        console.error('Admin mesajı gönderilirken hata:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Chatbot istatistiklerini al
 * @returns {Promise<Object>} - İstatistikler
 */
export async function getChatbotStats() {
    try {
        return await getStats();
    } catch (error) {
        console.error('İstatistikler alınırken hata:', error);
        return {
            totalMessages: 0,
            totalUsers: 0,
            todayMessages: 0,
            activeConversations: 0
        };
    }
}



export default {
    processChatbotMessage,
    getUserChatHistory,
    getAllChats,
    sendAdminMessage,
    getChatbotStats,
    validateMessage,
    validateUserId,
    getConversationHistory
};