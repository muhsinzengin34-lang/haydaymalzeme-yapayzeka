// GDPR Compliance Middleware
export const gdprMiddleware = (req, res, next) => {
    // Cookie consent kontrolü
    if (!req.cookies?.gdpr_consent && !req.path.includes('/api/gdpr/')) {
        res.setHeader('X-GDPR-Required', 'true');
    }
    
    // GDPR headers ekle
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    next();
};

// GDPR fonksiyonları
export async function deleteUserData(userId, db) {
    try {
        // Kullanıcının tüm verilerini sil
        await db.run('DELETE FROM messages WHERE userId = ?', [userId]);
        await db.run('DELETE FROM users WHERE userId = ?', [userId]);
        await db.run('DELETE FROM conversations WHERE userId = ?', [userId]);
        
        console.log('🔍 GDPR: User data deleted', { userId });
        return { success: true, message: 'All user data deleted' };
    } catch (error) {
        console.error('GDPR delete error:', error);
        return { success: false, error: error.message };
    }
}

export async function exportUserData(userId, db) {
    try {
        // Kullanıcının tüm verilerini topla
        const messages = await db.all('SELECT * FROM messages WHERE userId = ?', [userId]);
        const user = await db.get('SELECT * FROM users WHERE userId = ?', [userId]);
        const conversations = await db.all('SELECT * FROM conversations WHERE userId = ?', [userId]);
        
        const exportData = {
            exportDate: new Date().toISOString(),
            userId,
            user,
            messages,
            conversations,
            dataRetentionPolicy: '30 days',
            rights: [
                'Right to access',
                'Right to rectification',
                'Right to erasure',
                'Right to data portability'
            ]
        };
        
        console.log('🔍 GDPR: User data exported', { userId });
        return { success: true, data: exportData };
    } catch (error) {
        console.error('GDPR export error:', error);
        return { success: false, error: error.message };
    }
}

export default { gdprMiddleware, deleteUserData, exportUserData };
