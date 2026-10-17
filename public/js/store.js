/**
 * CodeAlpha E-commerce Store — Main Storefront, Catalog & Checkout Controller
 */

import { apiRequest } from './api.js';
import { cart } from './cart.js';
import { auth } from './auth.js';
import { showToast, openModal, closeModal, formatMoney } from './ui.js';

class StoreController {
  constructor() {
    this.currentCategory = '';
    this.searchQuery = '';
    this.currentSort = 'newest';
    this.products = [];
    this.categories = [];
    this.searchDebounceTimer = null;
  }

  async init() {
    await Promise.all([this.loadCategories(), this.loadProducts()]);
    this.attachEventListeners();
  }

  async loadCategories() {
    try {
      const res = await apiRequest('/categories');
      this.categories = res.data.categories;
      this.renderCategoryPills();
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }

  renderCategoryPills() {
    const container = document.getElementById('category-pills');
    if (!container) return;

    const allPill = `
      <button class="pill-btn ${this.currentCategory === '' ? 'active' : ''}" data-slug="">
        <span>All Products</span>
      </button>
    `;

    const catPills = this.categories
      .map(
        (c) => `
        <button class="pill-btn ${this.currentCategory === c.slug ? 'active' : ''}" data-slug="${c.slug}">
          <span>${c.name}</span>
          <span style="opacity: 0.6; font-size: 0.75rem;">(${c.product_count})</span>
        </button>
      `
      )
      .join('');

    container.innerHTML = allPill + catPills;
  }

  async loadProducts() {
    const grid = document.getElementById('product-grid');
    if (grid) {
      // Show loading shimmer skeleton
      grid.innerHTML = Array(6)
        .fill(0)
        .map(() => `<div class="skeleton-card"><div class="skeleton-shimmer"></div></div>`)
        .join('');
    }

    try {
      const params = new URLSearchParams();
      if (this.currentCategory) params.append('category', this.currentCategory);
      if (this.searchQuery) params.append('search', this.searchQuery);
      if (this.currentSort) params.append('sort', this.currentSort);

      const res = await apiRequest(`/products?${params.toString()}`);
      this.products = res.data.products;
      this.renderProducts(res.meta);
    } catch (err) {
      if (grid) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <p style="color: var(--color-error-text); font-weight: 600;">Failed to load catalog products.</p>
            <button id="btn-retry-catalog" class="pill-btn" style="margin-top: 1rem;">Retry</button>
          </div>
        `;
        document.getElementById('btn-retry-catalog')?.addEventListener('click', () => this.loadProducts());
      }
    }
  }

  renderProducts(meta) {
    const grid = document.getElementById('product-grid');
    const countLabel = document.getElementById('results-count');
    if (countLabel) {
      countLabel.innerHTML = `Showing <strong>${this.products.length}</strong> of <strong>${meta.total}</strong> products`;
    }

    if (!grid) return;

    if (this.products.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <h4>No products found</h4>
          <p>Try clearing your search terms or picking another category.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.products
      .map((p) => {
        const stockBadge =
          p.inventory > 5
            ? `<span class="badge-stock in-stock">In Stock</span>`
            : p.inventory > 0
            ? `<span class="badge-stock low-stock">Only ${p.inventory} left!</span>`
            : `<span class="badge-stock" style="background:#fee2e2;color:#991b1b;">Sold Out</span>`;

        const featuredBadge = p.is_featured ? `<span class="badge-featured">Featured</span>` : '';

        return `
        <article class="product-card" data-id="${p.id}">
          <div class="product-image-box">
            ${featuredBadge}
            ${stockBadge}
            <img src="${p.image_url}" alt="${p.name}" class="product-image" loading="lazy" />
          </div>
          <div class="product-body">
            <span class="product-category-tag">${p.category_name}</span>
            <h3 class="product-title" title="${p.name}">${p.name}</h3>
            <div class="product-rating">
              <svg width="14" height="14" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span>${p.rating.toFixed(1)}</span>
              <span class="product-rating-count">(${p.rating_count})</span>
            </div>
            <div class="product-footer">
              <span class="product-price">${p.price_formatted}</span>
              <button class="btn-add-cart" data-id="${p.id}" ${p.inventory === 0 ? 'disabled' : ''}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                <span>${p.inventory === 0 ? 'Sold Out' : 'Add'}</span>
              </button>
            </div>
          </div>
        </article>
      `;
      })
      .join('');
  }

  showProductModal(productId) {
    const product = this.products.find((p) => p.id === productId);
    if (!product) return;

    const modalBody = document.getElementById('product-modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-8); align-items: start;">
        <div style="border-radius: var(--radius-xl); overflow: hidden; background: var(--color-neutral-100); aspect-ratio: 1;">
          <img src="${product.image_url}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
        <div>
          <span style="font-size: var(--text-xs); font-weight: 700; text-transform: uppercase; color: var(--color-primary-600); letter-spacing: 0.05em; display: block; margin-bottom: 0.25rem;">${product.category_name}</span>
          <h2 style="font-size: var(--text-2xl); font-weight: 800; margin-bottom: 0.5rem; line-height: 1.25;">${product.name}</h2>
          <div class="product-rating" style="margin-bottom: 1rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <strong style="margin-left: 4px;">${product.rating.toFixed(1)}</strong>
            <span style="color: var(--color-neutral-500); margin-left: 4px;">(${product.rating_count} customer reviews)</span>
          </div>
          <div style="font-family: var(--font-display); font-size: var(--text-3xl); font-weight: 800; color: var(--color-neutral-950); margin-bottom: 1.25rem;">
            ${product.price_formatted}
          </div>
          <p style="font-size: var(--text-sm); line-height: 1.7; color: var(--color-neutral-600); margin-bottom: 1.5rem;">
            ${product.description}
          </p>
          <div style="padding: 1rem; background: var(--color-neutral-100); border-radius: var(--radius-lg); margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: var(--text-sm); font-weight: 600;">Availability:</span>
            <span style="font-size: var(--text-sm); font-weight: 700; color: ${product.inventory > 0 ? 'var(--color-success-text)' : 'var(--color-error-text)'};">
              ${product.inventory > 0 ? `In Stock (${product.inventory} available)` : 'Out of Stock'}
            </span>
          </div>
          <div style="display: flex; gap: var(--space-3);">
            <button id="modal-btn-add-cart" class="btn-checkout-primary" style="margin-top: 0;" ${product.inventory === 0 ? 'disabled' : ''}>
              ${product.inventory === 0 ? 'Currently Out of Stock' : 'Add to Shopping Cart'}
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-btn-add-cart')?.addEventListener('click', () => {
      cart.addItem(product.id, 1);
      closeModal('product-modal');
    });

    openModal('product-modal');
  }

  attachEventListeners() {
    // 1. Search Bar Input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
          this.searchQuery = e.target.value.trim();
          this.loadProducts();
        }, 300);
      });
    }

    // 2. Sorting Dropdown
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.loadProducts();
      });
    }

    // 3. Category Pill Clicks
    document.getElementById('category-pills')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;
      this.currentCategory = btn.dataset.slug || '';
      this.renderCategoryPills();
      this.loadProducts();
    });

    // 4. Product Grid Card Clicks (Add to cart or view details)
    document.getElementById('product-grid')?.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.btn-add-cart');
      const card = e.target.closest('.product-card');

      if (addBtn) {
        e.stopPropagation();
        const id = parseInt(addBtn.dataset.id, 10);
        cart.addItem(id, 1);
      } else if (card) {
        const id = parseInt(card.dataset.id, 10);
        this.showProductModal(id);
      }
    });

    // 5. Checkout Flow Listener
    window.addEventListener('checkout:open', () => this.prepareCheckoutModal());

    // 6. Orders Modal Listener
    window.addEventListener('orders:open', () => this.showOrderHistoryModal());

    // 7. Generic Modal Close Buttons
    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        closeModal(modalId);
      });
    });

    // 8. Checkout Form Submit
    document.getElementById('form-checkout')?.addEventListener('submit', (e) => this.handleCheckoutSubmit(e));
  }

  async prepareCheckoutModal() {
    const rawItems = cart.getRawItems();
    if (rawItems.length === 0) {
      showToast('Your cart is empty', 'info');
      return;
    }

    try {
      const res = await apiRequest('/cart/validate', {
        method: 'POST',
        body: { items: rawItems },
      });

      const data = res.data;
      if (!data.summary.all_items_in_stock) {
        showToast('Some items in your cart exceed available stock. Please adjust.', 'error');
        cart.openDrawer();
        return;
      }

      // Pre-fill user name if logged in
      const user = auth.getUser();
      if (user) {
        const nameField = document.getElementById('checkout-name');
        if (nameField && !nameField.value) {
          nameField.value = user.name;
        }
      }

      // Render checkout summary lines
      document.getElementById('checkout-subtotal').textContent = data.summary.subtotal_formatted;
      document.getElementById('checkout-shipping').textContent = data.summary.shipping_formatted;
      document.getElementById('checkout-tax').textContent = data.summary.tax_formatted;
      document.getElementById('checkout-total').textContent = data.summary.total_formatted;

      openModal('checkout-modal');
    } catch (err) {
      showToast('Error validating cart totals', 'error');
    }
  }

  async handleCheckoutSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('btn-submit-order');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying & Placing Order...';

    const orderPayload = {
      items: cart.getRawItems(),
      shipping_address: {
        full_name: document.getElementById('checkout-name').value.trim(),
        street: document.getElementById('checkout-street').value.trim(),
        city: document.getElementById('checkout-city').value.trim(),
        state: document.getElementById('checkout-state').value.trim(),
        postal_code: document.getElementById('checkout-zip').value.trim(),
        phone: document.getElementById('checkout-phone').value.trim(),
      },
      payment_method: document.getElementById('checkout-payment').value,
    };

    try {
      const res = await apiRequest('/orders', {
        method: 'POST',
        body: orderPayload,
      });

      const order = res.data.order;
      cart.clearCart();
      closeModal('checkout-modal');

      // Present order confirmation modal
      this.showOrderConfirmation(order);
      showToast('Order successfully confirmed!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm & Place Order';
    }
  }

  showOrderConfirmation(order) {
    const confirmationBody = document.getElementById('confirmation-modal-body');
    if (!confirmationBody) return;

    confirmationBody.innerHTML = `
      <div style="text-align: center; margin-bottom: var(--space-6);">
        <div style="width: 3.5rem; height: 3.5rem; background: var(--color-success-bg); color: var(--color-success-text); border-radius: var(--radius-full); display: inline-flex; align-items: center; justify-content: center; margin-bottom: var(--space-3);">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h2 style="font-size: var(--text-2xl); font-weight: 800; color: var(--color-neutral-950);">Thank you for your order!</h2>
        <p style="font-size: var(--text-sm); color: var(--color-neutral-500);">Order ID: <strong style="color: var(--color-neutral-900);">${order.id}</strong></p>
      </div>

      <div style="background: var(--color-neutral-100); border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-6);">
        <h4 style="font-size: var(--text-sm); font-weight: 700; margin-bottom: var(--space-2);">Delivery Details</h4>
        <p style="font-size: var(--text-xs); color: var(--color-neutral-600); margin-bottom: 0;">
          Recipient: <strong>${order.shipping_name}</strong><br />
          Address: ${order.shipping_address}, ${order.shipping_city} (${order.shipping_postal})<br />
          Payment Mode: ${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Credit Card (Simulated)'}
        </p>
      </div>

      <div style="border-top: 1px solid var(--color-neutral-200); padding-top: var(--space-4); margin-bottom: var(--space-6);">
        <h4 style="font-size: var(--text-sm); font-weight: 700; margin-bottom: var(--space-3);">Itemized Receipt</h4>
        ${order.items
          .map(
            (item) => `
          <div style="display: flex; justify-content: space-between; font-size: var(--text-sm); margin-bottom: 0.5rem;">
            <span>${item.product_name} <strong>x${item.quantity}</strong></span>
            <strong>${item.subtotal_formatted}</strong>
          </div>
        `
          )
          .join('')}
        <div style="display: flex; justify-content: space-between; font-size: var(--text-base); font-weight: 800; border-top: 1px dashed var(--color-neutral-300); padding-top: var(--space-3); margin-top: var(--space-3);">
          <span>Grand Total Charged</span>
          <span>${order.total_formatted}</span>
        </div>
      </div>

      <button id="btn-close-confirmation" class="btn-checkout-primary">Continue Shopping</button>
    `;

    document.getElementById('btn-close-confirmation')?.addEventListener('click', () => {
      closeModal('confirmation-modal');
    });

    openModal('confirmation-modal');
  }

  async showOrderHistoryModal() {
    const listContainer = document.getElementById('order-history-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="empty-state"><p>Loading order history...</p></div>';
    openModal('orders-modal');

    try {
      const res = await apiRequest('/orders');
      const orders = res.data.orders;

      if (orders.length === 0) {
        listContainer.innerHTML = `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path></svg>
            <h4>No past orders yet</h4>
            <p>Your previous purchases and receipts will be displayed here.</p>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = orders
        .map(
          (o) => `
        <div style="border: 1px solid var(--color-neutral-200); border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-4); background: var(--color-neutral-0);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2);">
            <div>
              <strong style="font-size: var(--text-sm); color: var(--color-neutral-900);">${o.id}</strong>
              <div style="font-size: var(--text-xs); color: var(--color-neutral-400);">${new Date(o.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <span class="badge-stock in-stock" style="text-transform: capitalize; position: static;">${o.status}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-neutral-100); padding-top: var(--space-2); font-size: var(--text-sm);">
            <span style="color: var(--color-neutral-600);">${o.item_count} ${o.item_count === 1 ? 'item' : 'items'} • Mode: ${o.payment_method.toUpperCase()}</span>
            <strong style="font-size: var(--text-base); color: var(--color-neutral-950);">${o.total_formatted}</strong>
          </div>
        </div>
      `
        )
        .join('');
    } catch (err) {
      listContainer.innerHTML = `<p style="color: var(--color-error-text);">Failed to load orders: ${err.message}</p>`;
    }
  }
}

export const store = new StoreController();
