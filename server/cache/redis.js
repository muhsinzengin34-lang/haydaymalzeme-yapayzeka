// Redis Cache (fallback to memory if Redis unavailable)
let redisClient = null;
const memoryCache = new Map();

// Redis bağlantısı (opsiyonel)
async function initRedis() {
    if (!process.env.REDIS_URL) {
        console.log('💾 Redis URL not found, using memory cache');
        return null;
    }
    
    try {
        const { createClient } = await import('redis');
        const client = createClient({
            url: process.env.REDIS_URL,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 3) return new Error('Redis connection failed');
                    return Math.min(retries * 100, 3000);
                }
            }
        });
        
        client.on('error', (err) => console.error('Redis error:', err));
        client.on('connect', () => console.log('💾 Redis connected'));
        
        await client.connect();
        return client;
    } catch (error) {
        console.log('💾 Redis not available, using memory cache');
        return null;
    }
}

// Cache get
export async function getCached(key) {
    try {
        if (redisClient) {
            const value = await redisClient.get(key);
            return value ? JSON.parse(value) : null;
        }
        
        // Memory cache fallback
        const cached = memoryCache.get(key);
        if (cached && cached.expiry > Date.now()) {
            return cached.value;
        }
        memoryCache.delete(key);
        return null;
    } catch (error) {
        console.error('Cache get error:', error);
        return null;
    }
}

// Cache set
export async function setCached(key, value, ttl = 3600) {
    try {
        if (redisClient) {
            await redisClient.setEx(key, ttl, JSON.stringify(value));
        } else {
            // Memory cache fallback
            memoryCache.set(key, {
                value,
                expiry: Date.now() + (ttl * 1000)
            });
            
            // Memory cache cleanup (max 1000 items)
            if (memoryCache.size > 1000) {
                const firstKey = memoryCache.keys().next().value;
                memoryCache.delete(firstKey);
            }
        }
    } catch (error) {
        console.error('Cache set error:', error);
    }
}

// Cache delete
export async function deleteCached(key) {
    try {
        if (redisClient) {
            await redisClient.del(key);
        } else {
            memoryCache.delete(key);
        }
    } catch (error) {
        console.error('Cache delete error:', error);
    }
}

// Cache clear
export async function clearCache() {
    try {
        if (redisClient) {
            await redisClient.flushAll();
        } else {
            memoryCache.clear();
        }
        console.log('💾 Cache cleared');
    } catch (error) {
        console.error('Cache clear error:', error);
    }
}

// Initialize
(async () => {
    redisClient = await initRedis();
})();

export default { getCached, setCached, deleteCached, clearCache };
