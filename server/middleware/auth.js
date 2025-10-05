import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

// Admin session management
const adminSessions = new Map();

export function generateAdminToken(userId) {
    const token = jwt.sign({ userId, type: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    adminSessions.set(userId, { token, createdAt: Date.now() });
    return token;
}

export function verifyAdminToken(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const session = adminSessions.get(decoded.userId);
        
        if (!session || session.token !== token) {
            return res.status(401).json({ success: false, error: 'Invalid token' });
        }
        
        // Check if session is older than 24 hours
        if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
            adminSessions.delete(decoded.userId);
            return res.status(401).json({ success: false, error: 'Token expired' });
        }
        
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
}

export function revokeAdminToken(userId) {
    adminSessions.delete(userId);
}