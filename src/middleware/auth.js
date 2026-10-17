const jwt = require('jsonwebtoken');
const config = require('../config/env');
const db = require('../database/db');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

function extractToken(req) {
  // 1. Check HTTP-only cookie first
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  // 2. Fallback to Authorization Header (Bearer <token>)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

function verifyUserToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (err) {
    return null;
  }
}

// Middleware: Require Authenticated User
function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return next(new UnauthorizedError('Please log in to proceed'));
  }

  const decoded = verifyUserToken(token);
  if (!decoded || !decoded.sub) {
    return next(new UnauthorizedError('Session expired or invalid token. Please log in again.'));
  }

  // Retrieve user record
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(decoded.sub);
  if (!user) {
    return next(new UnauthorizedError('User account not found'));
  }

  req.user = user;
  next();
}

// Middleware: Optional Authentication (attaches req.user if valid token exists)
function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    const decoded = verifyUserToken(token);
    if (decoded && decoded.sub) {
      const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(decoded.sub);
      if (user) {
        req.user = user;
      }
    }
  }
  next();
}

// Middleware: Require Admin Role
function requireAdmin(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (req.user.role !== 'admin') {
      return next(new ForbiddenError('Administrative privileges required'));
    }
    next();
  });
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin,
};
