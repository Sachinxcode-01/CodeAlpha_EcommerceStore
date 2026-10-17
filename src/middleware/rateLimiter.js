const rateLimit = require('express-rate-limit');
const config = require('../config/env');

// Standard API rate limiter (100 requests per 15 minutes by default)
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
  },
});

// Strict authentication rate limiter (15 requests per 15 minutes by default)
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many login or registration attempts. Please try again after 15 minutes.',
    },
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
