// Doğrulama Fonksiyonları
import { LIMITS } from '../config/constants.js';
import { ERROR_MESSAGES } from '../messages/templates.js';

export function validateMessage(message) {
    if (!message || typeof message !== 'string') {
        return { valid: false, error: ERROR_MESSAGES.emptyMessage };
    }
    
    if (message.length > LIMITS.MAX_MESSAGE_LENGTH) {
        return { valid: false, error: ERROR_MESSAGES.messageTooLong };
    }
    
    if (message.trim().length === 0) {
        return { valid: false, error: ERROR_MESSAGES.emptyMessage };
    }
    
    return { valid: true };
}

export function validateUserId(userId) {
    if (!userId || typeof userId !== 'string') {
        return { valid: false, error: ERROR_MESSAGES.invalidUserId };
    }
    
    if (userId.length < LIMITS.MIN_USER_ID_LENGTH) {
        return { valid: false, error: ERROR_MESSAGES.userIdTooShort };
    }
    
    return { valid: true };
}
