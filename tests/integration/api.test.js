const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../src/app');

describe('Integration: E-Commerce Store REST API Suite', () => {
  let authCookie = null;
  let testUserId = null;

  test('GET /api/v1/health should return healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
  });

  test('GET /api/v1/categories should return seeded categories', async () => {
    const res = await request(app).get('/api/v1/categories');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.categories));
    assert.ok(res.body.data.categories.length >= 4);
  });

  test('GET /api/v1/products should return paginated catalog', async () => {
    const res = await request(app).get('/api/v1/products?limit=5');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.products.length, 5);
    assert.ok(res.body.meta.total >= 16);
  });

  test('GET /api/v1/products with category filter should filter properly', async () => {
    const res = await request(app).get('/api/v1/products?category=electronics');
    assert.equal(res.status, 200);
    assert.ok(res.body.data.products.length > 0);
    for (const prod of res.body.data.products) {
      assert.equal(prod.category_slug, 'electronics');
    }
  });

  test('GET /api/v1/products with search filter should match keyword', async () => {
    const res = await request(app).get('/api/v1/products?search=Headphones');
    assert.equal(res.status, 200);
    assert.ok(res.body.data.products.length >= 1);
    assert.match(res.body.data.products[0].name, /Headphones/i);
  });

  test('POST /api/v1/cart/validate should calculate prices and check stock', async () => {
    const res = await request(app)
      .post('/api/v1/cart/validate')
      .send({
        items: [{ product_id: 1, quantity: 2 }],
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.items[0].product_id, 1);
    assert.equal(res.body.data.items[0].quantity, 2);
    assert.ok(res.body.data.summary.total_amount_cents > 0);
  });

  test('POST /api/v1/auth/register should register a unique customer', async () => {
    const uniqueEmail = `shopper_${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Sarah Connor',
        email: uniqueEmail,
        password: 'Password123!',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.name, 'Sarah Connor');
    assert.ok(res.headers['set-cookie']);

    // Capture cookie for subsequent authenticated tests
    authCookie = res.headers['set-cookie'][0];
    testUserId = res.body.data.user.id;
  });

  test('GET /api/v1/auth/me should return authenticated user profile', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Cookie', authCookie);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.id, testUserId);
    assert.equal(res.body.data.user.name, 'Sarah Connor');
    assert.equal(res.body.data.user.password_hash, undefined); // Never leak password hash
  });

  test('POST /api/v1/orders should create order and decrement stock atomically', async () => {
    // 1. Check initial inventory
    const prodResBefore = await request(app).get('/api/v1/products/1');
    const initialInventory = prodResBefore.body.data.product.inventory;

    // 2. Place order
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Cookie', authCookie)
      .send({
        items: [{ product_id: 1, quantity: 2 }],
        shipping_address: {
          full_name: 'Sarah Connor',
          street: '450 Tech Boulevard',
          city: 'San Francisco',
          state: 'California',
          postal_code: '94105',
          phone: '+1 555-0199',
        },
        payment_method: 'cod',
      });

    assert.equal(orderRes.status, 201);
    assert.equal(orderRes.body.success, true);
    assert.ok(orderRes.body.data.order.id.startsWith('ORD-'));

    // 3. Verify inventory was decremented in database
    const prodResAfter = await request(app).get('/api/v1/products/1');
    assert.equal(prodResAfter.body.data.product.inventory, initialInventory - 2);
  });

  test('POST /api/v1/orders should reject orders with insufficient stock', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Cookie', authCookie)
      .send({
        items: [{ product_id: 1, quantity: 50 }], // 50 <= 99 (passes schema), but exceeds available stock (~22)
        shipping_address: {
          full_name: 'Sarah Connor',
          street: '450 Tech Boulevard',
          city: 'San Francisco',
          state: 'California',
          postal_code: '94105',
          phone: '+1 555-0199',
        },
        payment_method: 'cod',
      });

    assert.equal(res.status, 409); // Conflict
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'CONFLICT');
  });

  test('GET /api/v1/orders should list user order history', async () => {
    const res = await request(app).get('/api/v1/orders').set('Cookie', authCookie);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.orders));
    assert.ok(res.body.data.orders.length >= 1);
  });
});
