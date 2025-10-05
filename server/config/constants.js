// Sabit Değerler ve Ayarlar

export const PLATFORMS = {
    WEB: 'web',
    TELEGRAM: 'telegram',
    ADMIN: 'admin'
};

export const SENDER_TYPES = {
    USER: 'user',
    BOT: 'bot',
    AI: 'ai',
    ADMIN: 'admin'
};

export const SETTINGS_KEYS = {
    BOT_ENABLED: 'bot_enabled',
    OPENAI_ENABLED: 'openai_enabled',
    AUTO_RESPONSE: 'auto_response'
};

export const LIMITS = {
    MAX_MESSAGE_LENGTH: 1000,
    MIN_USER_ID_LENGTH: 3,
    MAX_CHAT_HISTORY: 50,
    DEFAULT_HISTORY_LIMIT: 5,
    HISTORY_MULTIPLIER: 2
};

export const STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PENDING: 'pending'
};
