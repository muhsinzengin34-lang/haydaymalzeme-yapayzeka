import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import validator from 'validator';
import xss from 'xss';
import crypto from 'crypto';

// ============================================
// RATE LIMITING
// ============================================

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { success: false, error: 'Too many requests' }
});

export const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    message: { success: false, error: 'Too many messages' }
});

export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, error: 'Too many login attempts' }
});

// ============================================
// SECURITY HEADERS (HELMET)
// ============================================

export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"]
        }
    }
});

// ============================================
// INPUT VALIDATION & XSS PROTECTION
// ============================================

export function validateAndSanitize(req, res, next) {
    if (req.body) {
        for (const [key, value] of Object.entries(req.body)) {
            if (typeof value === 'string') {
                req.body[key] = xss(value);
                
                if (key === 'message') {
                    if (value.length === 0) {
                        return res.status(400).json({ success: false, error: 'Message cannot be empty' });
                    }
                    if (value.length > 1000) {
                        return res.status(400).json({ success: false, error: 'Message too long' });
                    }
                }
                
                if (key === 'userId') {
                    const cleanId = value.replace(/[^a-zA-Z0-9]/g, '');
                    if (!validator.isAlphanumeric(cleanId) || value.length < 3) {
                        return res.status(400).json({ success: false, error: 'Invalid user ID' });
                    }
                }
            }
        }
    }
    next();
}

// ============================================
// WAF (Web Application Firewall)
// ============================================

export const wafMiddleware = (req, res, next) => {
    const body = JSON.stringify(req.body);
    const query = JSON.stringify(req.query);
    const combined = body + query + req.path;
    
    // SQL Injection
    const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|SCRIPT)\b)/gi;
    if (sqlPattern.test(combined)) {
        console.warn('🛡️ WAF: SQL Injection blocked', { ip: req.ip, path: req.path });
        return res.status(403).json({ success: false, error: 'Suspicious activity detected' });
    }
    
    // Path Traversal
    if (req.path.includes('../') || req.path.includes('..\\')) {
        console.warn('🛡️ WAF: Path traversal blocked', { ip: req.ip, path: req.path });
        return res.status(403).json({ success: false, error: 'Invalid path' });
    }
    
    // Command Injection
    const cmdPattern = /(\||;|`|\$\(|\${)/g;
    if (cmdPattern.test(combined)) {
        console.warn('🛡️ WAF: Command injection blocked', { ip: req.ip });
        return res.status(403).json({ success: false, error: 'Invalid input' });
    }
    
    next();
};

// ============================================
// ENCRYPTION (Optional - for sensitive data)
// ============================================

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;

export function encrypt(text) {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
        let encrypted = cipher.update(text, 'utf8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error('Encryption error:', error);
        return text;
    }
}

export function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
        const parts = text.split(':');
        const iv = Buffer.from(parts.shift(), 'hex');
        const encrypted = Buffer.from(parts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString('utf8');
    } catch (error) {
        console.error('Decryption error:', error);
        return text;
    }
}

console.log('🛡️ Security middleware initialized');
