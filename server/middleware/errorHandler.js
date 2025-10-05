import logger from '../logger.js';

// Global error handler
export function errorHandler(err, req, res, next) {
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userId: req.body?.userId
    });
    
    // Default error
    let error = {
        success: false,
        error: 'Internal server error'
    };
    
    // Validation errors
    if (err.name === 'ValidationError') {
        error.error = 'Validation failed';
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error.error = 'Invalid token';
    }
    
    // Rate limit errors
    if (err.status === 429) {
        error.error = 'Too many requests';
    }
    
    res.status(err.status || 500).json(error);
}

// 404 handler
export function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
}

// Process error handlers
export function setupProcessHandlers() {
    process.on('uncaughtException', (err) => {
        logger.error('Uncaught Exception:', err);
        process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection:', { reason, promise });
        process.exit(1);
    });
}