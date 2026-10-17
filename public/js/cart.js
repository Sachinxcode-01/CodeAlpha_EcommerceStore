/**
 * CodeAlpha E-commerce Store — Cart State & Drawer Controller
 */

import { apiRequest } from './api.js';
import { showToast, openModal, closeModal, formatMoney } from './ui.js';
import { auth } from './auth.js';

const STORAGE_KEY = 'codealpha_cart_v1';

class CartManager {
  constructor() {
    this.rawItems = this.loadFromStorage(); // Array of { product_id, quantity }
    this.serverCalculation = null;
    this.isDrawerOpen = false;
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.rawItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }

  async init() {
    this.attachDomListeners();
    await this.refreshCart();
  }

  getRawItems() {
    return this.rawItems;
  }

  getItemCount() {
    return this.rawItems.reduce((acc, item) => acc + item.quantity, 0);
  }

  async addItem(productId, quantity = 1) {
    const existing = this.rawItems.find((i) => i.product_id === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.rawItems.push({ product_id: productId, quantity });
    }

    this.saveToStorage();
    await this.refreshCart();
    this.bumpCartBadge();
    showToast('Product added to your cart!', 'success');
  }

  async updateQuantity(productId, newQty) {
    if (newQty <= 0) {
      await this.removeItem(productId);
      return;
    }

    const item = this.rawItems.find((i) => i.product_id === productId);
    if (item) {
      item.quantity = newQty;
      this.saveToStorage();
      await this.refreshCart();
    }
  }

  async removeItem(productId) {
    this.rawItems = this.rawItems.filter((i) => i.product_id !== productId);
    this.saveToStorage();
    await this.refreshCart();
    showToast('Item removed from cart', 'info');
  }

  clearCart() {
    this.rawItems = [];
    this.serverCalculation = null;
    this.saveToStorage();
    this.render();
  }

  async refreshCart() {
    if (this.rawItems.length === 0) {
      this.serverCalculation = null;
      this.render();
      return;
    }

    try {
      const res = await apiRequest('/cart/validate', {
        method: 'POST',
        body: { items: this.rawItems },
      });
      this.serverCalculation = res.data;
    } catch (err) {
      console.warn('Cart validation warning:', err);
    }
    this.render();
  }

  bumpCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.classList.remove('bump');
      void badge.offsetWidth; // Trigger reflow
      badge.classList.add('bump');
    }
  }

  openDrawer() {
    const overlay = document.getElementById('cart-drawer-overlay');
    const drawer = document.getElementById('cart-drawer');
    if (overlay && drawer) {
      overlay.classList.add('open');
      drawer.classList.add('open');
      document.body.style.overflow = 'hidden';
      this.isDrawerOpen = true;
      this.refreshCart();
    }
  }

  closeDrawer() {
    const overlay = document.getElementById('cart-drawer-overlay');
    const drawer = document.getElementById('cart-drawer');
    if (overlay && drawer) {
      overlay.classList.remove('open');
      drawer.classList.remove('open');
      document.body.style.overflow = '';
      this.isDrawerOpen = false;
    }
  }

  render() {
    // 1. Update Badge Count
    const badge = document.getElementById('cart-badge');
    const count = this.getItemCount();
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }

    // 2. Render Drawer Body
    const body = document.getElementById('cart-drawer-items');
    const footer = document.getElementById('cart-drawer-footer');
    if (!body || !footer) return;

    if (!this.serverCalculation || this.serverCalculation.items.length === 0) {
      body.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          <h4 style="margin-bottom: 0.5rem; color: var(--color-neutral-800);">Your cart is empty</h4>
          <p style="font-size: var(--text-sm);">Discover something special in our product catalog.</p>
        </div>
      `;
      footer.style.display = 'none';
      return;
    }

    footer.style.display = 'flex';

    body.innerHTML = this.serverCalculation.items
      .map(
        (item) => `
        <div class="cart-item" data-id="${item.product_id}">
          <img src="${item.image_url}" alt="${item.name}" class="cart-item-img" />
          <div class="cart-item-info">
            <div>
              <h5 class="cart-item-title">${item.name}</h5>
              <span class="cart-item-unit-price">${item.unit_price_formatted} each</span>
              ${
                !item.is_available
                  ? `<div style="color: var(--color-error-text); font-size: var(--text-xs); font-weight: 700; margin-top: 2px;">Only ${item.available_inventory} left in stock!</div>`
                  : ''
              }
            </div>
            <div class="cart-item-controls">
              <div class="qty-stepper">
                <button class="qty-btn btn-qty-minus" data-id="${item.product_id}">-</button>
                <span class="qty-value">${item.quantity}</span>
                <button class="qty-btn btn-qty-plus" data-id="${item.product_id}">+</button>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="cart-item-subtotal">${item.subtotal_formatted}</span>
                <button class="btn-remove-item" data-id="${item.product_id}" title="Remove item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      `
      )
      .join('');

    // Update Summary Footer
    const summary = this.serverCalculation.summary;
    document.getElementById('cart-summary-subtotal').textContent = summary.subtotal_formatted;
    document.getElementById('cart-summary-shipping').textContent = summary.shipping_formatted;
    document.getElementById('cart-summary-tax').textContent = summary.tax_formatted;
    document.getElementById('cart-summary-total').textContent = summary.total_formatted;

    const checkoutBtn = document.getElementById('btn-proceed-checkout');
    if (checkoutBtn) {
      checkoutBtn.disabled = !summary.all_items_in_stock;
      if (!summary.all_items_in_stock) {
        checkoutBtn.textContent = 'Adjust quantities to checkout';
      } else {
        checkoutBtn.textContent = `Checkout • ${summary.total_formatted}`;
      }
    }
  }

  attachDomListeners() {
    // Open / Close Cart Drawer
    document.getElementById('btn-open-cart')?.addEventListener('click', () => this.openDrawer());
    document.getElementById('btn-close-cart')?.addEventListener('click', () => this.closeDrawer());
    document.getElementById('cart-drawer-overlay')?.addEventListener('click', () => this.closeDrawer());

    // Quantity steppers & Remove buttons inside drawer
    document.getElementById('cart-drawer-items')?.addEventListener('click', (e) => {
      const plusBtn = e.target.closest('.btn-qty-plus');
      const minusBtn = e.target.closest('.btn-qty-minus');
      const removeBtn = e.target.closest('.btn-remove-item');

      if (plusBtn) {
        const id = parseInt(plusBtn.dataset.id, 10);
        const item = this.rawItems.find((i) => i.product_id === id);
        if (item) this.updateQuantity(id, item.quantity + 1);
      } else if (minusBtn) {
        const id = parseInt(minusBtn.dataset.id, 10);
        const item = this.rawItems.find((i) => i.product_id === id);
        if (item) this.updateQuantity(id, item.quantity - 1);
      } else if (removeBtn) {
        const id = parseInt(removeBtn.dataset.id, 10);
        this.removeItem(id);
      }
    });

    // Proceed to Checkout Button
    document.getElementById('btn-proceed-checkout')?.addEventListener('click', () => {
      if (!auth.isAuthenticated()) {
        showToast('Please sign in or register to complete your order', 'info');
        this.closeDrawer();
        openModal('auth-modal');
        return;
      }
      this.closeDrawer();
      window.dispatchEvent(new CustomEvent('checkout:open'));
    });
  }
}

export const cart = new CartManager();
