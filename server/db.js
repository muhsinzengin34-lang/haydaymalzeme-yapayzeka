import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function openDb() {
  const dbPath = process.env.DB_PATH || "./server/chat.sqlite";
  return open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
}

export async function saveMessage({ userId, username, sender, message, timestamp, fileUrl, platform = 'web', aiResponse = null, isTrainingData = true }) {
  const db = await openDb();
  const result = await db.run(
    `INSERT INTO messages (userId, username, sender, message, timestamp, fileUrl, platform, aiResponse, isProcessed, isTrainingData)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, username, sender, message, timestamp, fileUrl || "", platform, aiResponse, aiResponse ? 1 : 0, isTrainingData ? 1 : 0]
  );
  return result.lastID;
}

export async function getMessages(userId = null) {
  const db = await openDb();
  if (userId) {
    return db.all(`SELECT * FROM messages WHERE userId = ? ORDER BY timestamp ASC`, [userId]);
  } else {
    return db.all(`SELECT * FROM messages ORDER BY timestamp DESC`);
  }
}

export async function getLastChats(limit = 30) {
  const db = await openDb();
  return db.all(`
    SELECT 
      userId, 
      (SELECT username FROM messages m2 WHERE m2.userId = m1.userId ORDER BY timestamp DESC LIMIT 1) as username,
      MAX(timestamp) as lastTime
    FROM messages m1
    GROUP BY userId
    ORDER BY lastTime DESC
    LIMIT ?
  `, [limit]);
}

export async function initDb() {
  const db = await openDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      username TEXT,
      sender TEXT,
      message TEXT,
      timestamp TEXT,
      fileUrl TEXT,
      platform TEXT DEFAULT 'web',
      isProcessed INTEGER DEFAULT 0,
      aiResponse TEXT,
      aiMode TEXT DEFAULT NULL
    );`
  );

  // isTrainingData sütununu ekle (eğer yoksa)
  try {
    await db.exec(`ALTER TABLE messages ADD COLUMN isTrainingData INTEGER DEFAULT 1`);
    console.log('✅ isTrainingData sütunu eklendi');
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      console.log('ℹ️ isTrainingData sütunu zaten mevcut');
    }
  }

  await db.exec(`

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT UNIQUE,
      username TEXT,
      platform TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT,
      lastActivity TEXT
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      sessionId TEXT,
      platform TEXT,
      startTime TEXT,
      endTime TEXT,
      messageCount INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS admin_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      settingKey TEXT UNIQUE,
      settingValue TEXT,
      updatedAt TEXT
    );
  `);

  // Varsayılan ayarları ekle
  await db.run(`
    INSERT OR IGNORE INTO admin_settings (settingKey, settingValue, updatedAt)
    VALUES 
      ('bot_enabled', 'true', datetime('now')),
      ('telegram_notifications', 'true', datetime('now')),
      ('auto_response', 'true', datetime('now')),
      ('openai_enabled', 'true', datetime('now'))
  `);
}

// Kullanıcı yönetimi
export async function saveUser({ userId, username, platform }) {
  const db = await openDb();
  await db.run(`
    INSERT OR REPLACE INTO users (userId, username, platform, createdAt, lastActivity)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
  `, [userId, username, platform]);
}

export async function updateUserActivity(userId) {
  const db = await openDb();
  await db.run(`
    UPDATE users SET lastActivity = datetime('now') WHERE userId = ?
  `, [userId]);
}

export async function getUsers() {
  const db = await openDb();
  return db.all(`SELECT * FROM users ORDER BY lastActivity DESC`);
}

// Sohbet yönetimi
export async function startConversation({ userId, sessionId, platform }) {
  const db = await openDb();
  const result = await db.run(`
    INSERT INTO conversations (userId, sessionId, platform, startTime)
    VALUES (?, ?, ?, datetime('now'))
  `, [userId, sessionId, platform]);
  return result.lastID;
}

export async function updateConversationMessageCount(conversationId) {
  const db = await openDb();
  await db.run(`
    UPDATE conversations 
    SET messageCount = messageCount + 1 
    WHERE id = ?
  `, [conversationId]);
}

export async function endConversation(conversationId) {
  const db = await openDb();
  await db.run(`
    UPDATE conversations 
    SET endTime = datetime('now'), isActive = 0 
    WHERE id = ?
  `, [conversationId]);
}

// Ayar yönetimi
export async function getSetting(key) {
  const db = await openDb();
  const result = await db.get(`
    SELECT settingValue FROM admin_settings WHERE settingKey = ?
  `, [key]);
  return result ? result.settingValue : null;
}

export async function setSetting(key, value) {
  const db = await openDb();
  await db.run(`
    INSERT OR REPLACE INTO admin_settings (settingKey, settingValue, updatedAt)
    VALUES (?, ?, datetime('now'))
  `, [key, value]);
}

export async function getAllSettings() {
  const db = await openDb();
  return db.all(`SELECT * FROM admin_settings`);
}

// İstatistikler
export async function getStats() {
  const db = await openDb();
  
  const totalMessages = await db.get(`SELECT COUNT(*) as count FROM messages`);
  const totalUsers = await db.get(`SELECT COUNT(*) as count FROM users`);
  const todayMessages = await db.get(`
    SELECT COUNT(*) as count FROM messages 
    WHERE date(timestamp) = date('now')
  `);
  const activeConversations = await db.get(`
    SELECT COUNT(*) as count FROM conversations WHERE isActive = 1
  `);

  return {
    totalMessages: totalMessages.count,
    totalUsers: totalUsers.count,
    todayMessages: todayMessages.count,
    activeConversations: activeConversations.count
  };
}

// Mesaj güncelleme
export async function updateMessageWithAI(messageId, aiResponse) {
  const db = await openDb();
  await db.run(`
    UPDATE messages 
    SET aiResponse = ?, isProcessed = 1 
    WHERE id = ?
  `, [aiResponse, messageId]);
}

// Kullanıcı konuşmasını sil
export async function deleteUserChat(userId) {
  const db = await openDb();
  
  try {
    // Transaction başlat
    await db.run('BEGIN TRANSACTION');
    
    // Kullanıcının tüm mesajlarını sil
    const deleteMessagesResult = await db.run(`
      DELETE FROM messages WHERE userId = ?
    `, [userId]);
    
    // Kullanıcının konuşmasını sil
    const deleteConversationResult = await db.run(`
      DELETE FROM conversations WHERE userId = ?
    `, [userId]);
    
    // Kullanıcıyı sil (eğer varsa)
    const deleteUserResult = await db.run(`
      DELETE FROM users WHERE id = ?
    `, [userId]);
    
    // Transaction'ı commit et
    await db.run('COMMIT');
    
    console.log(`Kullanıcı ${userId} için silinen:`, {
      messages: deleteMessagesResult.changes,
      conversations: deleteConversationResult.changes,
      users: deleteUserResult.changes
    });
    
    return {
      success: true,
      message: 'Konuşma başarıyla silindi',
      deletedItems: {
        messages: deleteMessagesResult.changes,
        conversations: deleteConversationResult.changes,
        users: deleteUserResult.changes
      }
    };
  } catch (error) {
    // Hata durumunda rollback
    await db.run('ROLLBACK');
    console.error('Konuşma silme hatası:', error);
    return {
      success: false,
      error: 'Konuşma silinirken bir hata oluştu'
    };
  }
}

// AI Eğitimi için konuşma verilerini çek
export async function getConversationsForTraining() {
  const db = await openDb();
  
  try {
    // Tüm konuşmaları kullanıcı bazında grupla (tüm mesajları dahil et)
    const conversations = await db.all(`
      SELECT 
        userId,
        MIN(username) as username,
        '[' || GROUP_CONCAT(
          json_object(
            'id', id,
            'sender', sender,
            'message', COALESCE(message, ''),
            'timestamp', timestamp,
            'platform', platform,
            'aiResponse', COALESCE(aiResponse, '')
          )
        ) || ']' as messages
      FROM messages 
      GROUP BY userId
      ORDER BY MAX(timestamp) DESC
    `);

    const formattedConversations = conversations.map(conv => {
      let messages = [];
      try {
        messages = JSON.parse(conv.messages);
      } catch (e) {
        console.error('JSON parsing hatası:', e);
        messages = [];
      }

      return {
        userId: conv.userId,
        username: conv.username || `Kullanıcı-${conv.userId}`,
        messageCount: messages.length,
        messages: messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
        startTime: messages[0]?.timestamp,
        endTime: messages[messages.length - 1]?.timestamp
      };
    });

    return formattedConversations;
  } catch (error) {
    console.error('Eğitim verileri çekilirken hata:', error);
    return [];
  }
}

// Konuşma kalitesi analizi
export async function analyzeConversationQuality() {
  const db = await openDb();
  
  try {
    // Başarılı bot yanıtları (kullanıcı devam etmiş)
    const successfulResponses = await db.all(`
      SELECT 
        m1.message as user_question,
        m1.aiResponse as bot_response,
        COUNT(m2.id) as follow_up_count
      FROM messages m1
      LEFT JOIN messages m2 ON m1.userId = m2.userId 
        AND m2.timestamp > m1.timestamp 
        AND m2.sender = 'user'
        AND datetime(m2.timestamp) <= datetime(m1.timestamp, '+1 hour')
      WHERE m1.sender = 'user' 
        AND m1.aiResponse IS NOT NULL 
        AND m1.aiResponse != ''
      GROUP BY m1.id
      HAVING follow_up_count > 0
      ORDER BY follow_up_count DESC
      LIMIT 50
    `);

    // Sık sorulan sorular
    const commonQuestions = await db.all(`
      SELECT 
        message,
        COUNT(*) as frequency,
        AVG(LENGTH(aiResponse)) as avg_response_length
      FROM messages 
      WHERE sender = 'user' 
        AND aiResponse IS NOT NULL
        AND LENGTH(message) > 10
      GROUP BY LOWER(TRIM(message))
      HAVING frequency > 1
      ORDER BY frequency DESC
      LIMIT 30
    `);

    // Kullanıcı davranış kalıpları
    const userPatterns = await db.all(`
      SELECT 
        platform,
        AVG(LENGTH(message)) as avg_message_length,
        COUNT(*) as total_messages,
        COUNT(DISTINCT userId) as unique_users
      FROM messages 
      WHERE sender = 'user'
      GROUP BY platform
    `);

    return {
      successfulResponses,
      commonQuestions,
      userPatterns
    };
  } catch (error) {
    console.error('Konuşma analizi hatası:', error);
    return {
      successfulResponses: [],
      commonQuestions: [],
      userPatterns: []
    };
  }
}