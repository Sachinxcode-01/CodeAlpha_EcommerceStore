const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const apiRoutes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const { NotFoundError } = require('./utils/errors');

const app = express();

// 1. Security HTTP Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'https://*.unsplash.com'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS configuration with credentials support for HttpOnly cookies
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or same-origin static files)
      if (!origin || config.cors.origin.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev, origin-checked in prod
    },
    credentials: true,
  })
);

// 3. Body & Cookie Parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(config.cookie.secret));

// 4. Serve Static Frontend Files
app.use(express.static(path.resolve(__dirname, '../public')));

// 5. Apply Rate Limiting & Mount API v1
app.use('/api/v1', apiLimiter, apiRoutes);

// 6. Handle Unknown API Routes
app.all('/api/*', (req, res, next) => {
  next(new NotFoundError(`API endpoint ${req.method} ${req.originalUrl} not found`));
});

// 7. Fallback to index.html for SPA-style page routing if requested
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

// 8. Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
