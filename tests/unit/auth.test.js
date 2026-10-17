const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const authService = require('../../src/services/auth.service');

describe('Unit: Authentication & Password Verification', () => {
  test('bcrypt should properly hash and verify matching passwords', () => {
    const rawPassword = 'SecretPassword123!';
    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(rawPassword, salt);

    assert.notEqual(rawPassword, hash);
    assert.equal(bcrypt.compareSync(rawPassword, hash), true);
    assert.equal(bcrypt.compareSync('WrongPassword', hash), false);
  });

  test('generateToken should produce a valid JWT token string', () => {
    const mockUser = { id: 99, role: 'customer', email: 'test@example.com' };
    const token = authService.generateToken(mockUser);

    assert.equal(typeof token, 'string');
    assert.equal(token.split('.').length, 3); // Standard header.payload.signature format
  });
});
