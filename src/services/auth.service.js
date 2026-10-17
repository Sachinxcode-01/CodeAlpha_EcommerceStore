const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const db = require('../database/db');
const { ValidationError, UnauthorizedError, ConflictError } = require('../utils/errors');

class AuthService {
  generateToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        role: user.role,
        email: user.email,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  setAuthCookie(res, token) {
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  clearAuthCookie(res) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  async register(data) {
    const { name, email, password } = data;

    // Check if user with email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      throw new ConflictError('An account with this email address already exists');
    }

    // Hash password with bcrypt cost 12
    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync(password, salt);

    const insert = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, 'customer')
    `);

    const result = insert.run(name, email, passwordHash);
    const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    const token = this.generateToken(user);
    return { user, token };
  }

  async login(email, password) {
    const user = db.prepare('SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = ?').get(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const { password_hash, ...sanitizedUser } = user;
    const token = this.generateToken(sanitizedUser);

    return { user: sanitizedUser, token };
  }

  getProfile(userId) {
    const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(userId);
    if (!user) {
      throw new UnauthorizedError('User account not found');
    }
    return user;
  }
}

module.exports = new AuthService();
