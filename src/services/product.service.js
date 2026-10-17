const db = require('../database/db');
const { NotFoundError } = require('../utils/errors');

class ProductService {
  formatProduct(p) {
    if (!p) return null;
    return {
      ...p,
      price_formatted: `$${(p.price_cents / 100).toFixed(2)}`,
      in_stock: p.inventory > 0,
    };
  }

  listProducts(query = {}) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '12', 10);
    const offset = (page - 1) * limit;

    const whereClauses = [];
    const params = [];

    // Filter by search term
    if (query.search && query.search.trim()) {
      whereClauses.push('(p.name LIKE ? OR p.description LIKE ?)');
      const term = `%${query.search.trim()}%`;
      params.push(term, term);
    }

    // Filter by category slug
    if (query.category && query.category.trim()) {
      whereClauses.push('c.slug = ?');
      params.push(query.category.trim());
    }

    // Filter by featured
    if (query.featured === 'true' || query.featured === '1') {
      whereClauses.push('p.is_featured = 1');
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Determine sorting
    let orderSql = 'ORDER BY p.created_at DESC';
    switch (query.sort) {
      case 'price-asc':
        orderSql = 'ORDER BY p.price_cents ASC';
        break;
      case 'price-desc':
        orderSql = 'ORDER BY p.price_cents DESC';
        break;
      case 'rating':
        orderSql = 'ORDER BY p.rating DESC, p.rating_count DESC';
        break;
      case 'name-asc':
        orderSql = 'ORDER BY p.name ASC';
        break;
      case 'newest':
      default:
        orderSql = 'ORDER BY p.created_at DESC';
        break;
    }

    // Count total matching items
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ${whereSql}
    `;
    const { total } = db.prepare(countQuery).get(...params);

    // Fetch paginated products
    const selectQuery = `
      SELECT 
        p.id,
        p.category_id,
        c.name as category_name,
        c.slug as category_slug,
        p.name,
        p.slug,
        p.description,
        p.price_cents,
        p.inventory,
        p.image_url,
        p.rating,
        p.rating_count,
        p.is_featured,
        p.created_at
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ${whereSql}
      ${orderSql}
      LIMIT ? OFFSET ?
    `;

    const rows = db.prepare(selectQuery).all(...params, limit, offset);
    const products = rows.map(this.formatProduct);

    return {
      products,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  getProductByIdOrSlug(idOrSlug) {
    const isId = /^\d+$/.test(idOrSlug);
    const query = `
      SELECT 
        p.id,
        p.category_id,
        c.name as category_name,
        c.slug as category_slug,
        p.name,
        p.slug,
        p.description,
        p.price_cents,
        p.inventory,
        p.image_url,
        p.rating,
        p.rating_count,
        p.is_featured,
        p.created_at
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE ${isId ? 'p.id = ?' : 'p.slug = ?'}
    `;

    const product = db.prepare(query).get(isId ? parseInt(idOrSlug, 10) : idOrSlug);
    if (!product) {
      throw new NotFoundError(`Product '${idOrSlug}' was not found`);
    }

    return this.formatProduct(product);
  }

  listCategories() {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        c.icon,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.display_order ASC, c.name ASC
    `;
    return db.prepare(query).all();
  }
}

module.exports = new ProductService();
