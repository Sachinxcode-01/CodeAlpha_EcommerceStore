const db = require('../database/db');
const { NotFoundError, ConflictError, ForbiddenError } = require('../utils/errors');

class OrderService {
  formatMoney(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  // Pure server-side cart pricing and stock validation
  validateAndCalculateCart(items) {
    let subtotalCents = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = db
        .prepare('SELECT id, name, slug, price_cents, inventory, image_url FROM products WHERE id = ?')
        .get(item.product_id);

      if (!product) {
        throw new NotFoundError(`Product ID ${item.product_id} no longer exists in catalog`);
      }

      const isAvailable = product.inventory >= item.quantity;
      const itemSubtotal = product.price_cents * item.quantity;
      subtotalCents += itemSubtotal;

      validatedItems.push({
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        image_url: product.image_url,
        unit_price_cents: product.price_cents,
        unit_price_formatted: this.formatMoney(product.price_cents),
        quantity: item.quantity,
        subtotal_cents: itemSubtotal,
        subtotal_formatted: this.formatMoney(itemSubtotal),
        available_inventory: product.inventory,
        is_available: isAvailable,
      });
    }

    // Shipping rules: Free shipping over $100.00 (10000 cents), otherwise $15.00 (1500 cents)
    const shippingCents = subtotalCents >= 10000 || subtotalCents === 0 ? 0 : 1500;
    // Estimated tax: 8% of subtotal
    const taxCents = Math.round(subtotalCents * 0.08);
    const totalAmountCents = subtotalCents + shippingCents + taxCents;

    return {
      items: validatedItems,
      summary: {
        subtotal_cents: subtotalCents,
        subtotal_formatted: this.formatMoney(subtotalCents),
        shipping_cents: shippingCents,
        shipping_formatted: shippingCents === 0 ? 'FREE' : this.formatMoney(shippingCents),
        tax_cents: taxCents,
        tax_formatted: this.formatMoney(taxCents),
        total_amount_cents: totalAmountCents,
        total_formatted: this.formatMoney(totalAmountCents),
        item_count: items.reduce((acc, i) => acc + i.quantity, 0),
        all_items_in_stock: validatedItems.every((i) => i.is_available),
      },
    };
  }

  // Atomic order creation using database transaction
  createOrder(userId, orderPayload) {
    const { items, shipping_address, payment_method } = orderPayload;

    // Execute within an ACID transaction
    const executeOrderTransaction = db.transaction(() => {
      // 1. Verify latest stock and fetch unit prices directly from database
      let subtotalCents = 0;
      const preparedItems = [];

      for (const item of items) {
        const product = db
          .prepare('SELECT id, name, price_cents, inventory FROM products WHERE id = ?')
          .get(item.product_id);

        if (!product) {
          throw new NotFoundError(`Product ID ${item.product_id} is no longer available`);
        }

        if (product.inventory < item.quantity) {
          throw new ConflictError(
            `Insufficient inventory for "${product.name}". Requested: ${item.quantity}, Available: ${product.inventory}`
          );
        }

        const lineSubtotal = product.price_cents * item.quantity;
        subtotalCents += lineSubtotal;

        preparedItems.push({
          product_id: product.id,
          product_name: product.name,
          unit_price_cents: product.price_cents,
          quantity: item.quantity,
          subtotal_cents: lineSubtotal,
        });
      }

      // Calculate final financial breakdown
      const shippingCents = subtotalCents >= 10000 ? 0 : 1500;
      const taxCents = Math.round(subtotalCents * 0.08);
      const totalAmountCents = subtotalCents + shippingCents + taxCents;

      // Generate human-readable Order ID
      const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 8);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderId = `ORD-${timestamp}-${randomSuffix}`;

      // 2. Insert master Order record
      const insertOrder = db.prepare(`
        INSERT INTO orders (
          id, user_id, subtotal_cents, tax_cents, shipping_cents, total_amount_cents,
          status, shipping_name, shipping_address, shipping_city, shipping_postal,
          shipping_phone, payment_method
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)
      `);

      insertOrder.run(
        orderId,
        userId,
        subtotalCents,
        taxCents,
        shippingCents,
        totalAmountCents,
        shipping_address.full_name,
        `${shipping_address.street}, ${shipping_address.state}`,
        shipping_address.city,
        shipping_address.postal_code,
        shipping_address.phone,
        payment_method
      );

      // 3. Insert line items and decrement product inventory
      const insertItem = db.prepare(`
        INSERT INTO order_items (
          order_id, product_id, product_name, unit_price_cents, quantity, subtotal_cents
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      const decrementStock = db.prepare(`
        UPDATE products
        SET inventory = inventory - ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      for (const item of preparedItems) {
        insertItem.run(
          orderId,
          item.product_id,
          item.product_name,
          item.unit_price_cents,
          item.quantity,
          item.subtotal_cents
        );

        decrementStock.run(item.quantity, item.product_id);
      }

      return orderId;
    });

    const orderId = executeOrderTransaction();
    return this.getOrderById(orderId, userId, false);
  }

  getUserOrders(userId) {
    const orders = db
      .prepare(
        `SELECT 
          id,
          total_amount_cents,
          status,
          shipping_name,
          payment_method,
          created_at,
          (SELECT COUNT(*) FROM order_items WHERE order_id = orders.id) as item_count
        FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC`
      )
      .all(userId);

    return orders.map((o) => ({
      ...o,
      total_formatted: this.formatMoney(o.total_amount_cents),
    }));
  }

  getOrderById(orderId, userId, isAdmin = false) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      throw new NotFoundError(`Order "${orderId}" not found`);
    }

    // Verify ownership unless admin
    if (!isAdmin && order.user_id !== userId) {
      throw new ForbiddenError('You are not authorized to view this order');
    }

    const items = db
      .prepare(
        `SELECT 
          oi.id,
          oi.product_id,
          oi.product_name,
          oi.unit_price_cents,
          oi.quantity,
          oi.subtotal_cents,
          p.image_url,
          p.slug
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?`
      )
      .all(orderId);

    return {
      ...order,
      subtotal_formatted: this.formatMoney(order.subtotal_cents),
      shipping_formatted: order.shipping_cents === 0 ? 'FREE' : this.formatMoney(order.shipping_cents),
      tax_formatted: this.formatMoney(order.tax_cents),
      total_formatted: this.formatMoney(order.total_amount_cents),
      items: items.map((i) => ({
        ...i,
        unit_price_formatted: this.formatMoney(i.unit_price_cents),
        subtotal_formatted: this.formatMoney(i.subtotal_cents),
      })),
    };
  }
}

module.exports = new OrderService();
