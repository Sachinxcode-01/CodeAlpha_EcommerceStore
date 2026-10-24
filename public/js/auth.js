/**
 * CodeAlpha E-commerce Store — Authentication State & Modal Controller
 */

import { apiRequest } from './api.js';
import { showToast, openModal, closeModal } from './ui.js';

class AuthManager {
  constructor() {
    this.user = null;
    this.listeners = [];
  }

  onAuthChange(callback) {
    this.listeners.push(callback);
    callback(this.user);
  }

  notify() {
    this.listeners.forEach((cb) => cb(this.user));
    this.updateNavbar();
  }

  async init() {
    try {
      const res = await apiRequest('/auth/me');
      this.user = res.data.user;
    } catch (err) {
      this.user = null; // Unauthenticated guest
    }
    this.notify();
    this.attachFormListeners();
  }

  isAuthenticated() {
    return !!this.user;
  }

  getUser() {
    return this.user;
  }

  async login(email, password) {
    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      this.user = res.data.user;
      this.notify();
      closeModal('auth-modal');
      showToast(`Welcome back, ${this.user.name}!`, 'success');
      return this.user;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  }

  async register(name, email, password) {
    try {
      const res = await apiRequest('/auth/register', {
        method: 'POST',
        body: { name, email, password },
      });
      this.user = res.data.user;
      this.notify();
      closeModal('auth-modal');
      showToast(`Account created! Welcome, ${this.user.name}.`, 'success');
      return this.user;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  }

  async logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
      this.user = null;
      this.notify();
      showToast('You have been logged out.', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  updateNavbar() {
    const navUserContainer = document.getElementById('nav-user-container');
    if (!navUserContainer) return;

    if (this.user) {
      const name = this.user.name || 'Customer';
      const initials = name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'U';

      navUserContainer.innerHTML = `
        <div class="user-profile-group">
          <button id="btn-view-orders" class="nav-btn nav-btn-orders" title="View Order History" aria-label="View Order History">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            <span class="nav-btn-label">Orders</span>
          </button>

          <div class="user-profile-badge" title="${name} (${this.user.email || ''})">
            <div class="user-avatar" aria-hidden="true">${initials}</div>
            <div class="user-details">
              <span class="user-greeting-prefix">Signed in as</span>
              <strong class="user-name">${name}</strong>
            </div>
          </div>

          <button id="btn-logout" class="nav-btn nav-btn-logout" title="Sign out" aria-label="Sign out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span class="nav-btn-label logout-label">Logout</span>
          </button>
        </div>
      `;

      document.getElementById('btn-logout')?.addEventListener('click', () => this.logout());
      document.getElementById('btn-view-orders')?.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('orders:open'));
      });
    } else {
      navUserContainer.innerHTML = `
        <button id="btn-open-login" class="nav-btn nav-btn-signin" aria-label="Sign In">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span class="nav-btn-label">Sign In</span>
        </button>
      `;
      document.getElementById('btn-open-login')?.addEventListener('click', () => openModal('auth-modal'));
    }
  }

  attachFormListeners() {
    // Tab switching in Auth Modal
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');

    if (tabLogin && tabRegister && formLogin && formRegister) {
      tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        formLogin.style.display = 'block';
        formRegister.style.display = 'none';
      });

      tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        formLogin.style.display = 'none';
        formRegister.style.display = 'block';
      });

      // Submit Login
      formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const submitBtn = formLogin.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        try {
          await this.login(email, password);
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
        }
      });

      // Submit Register
      formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const submitBtn = formRegister.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';

        try {
          await this.register(name, email, password);
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account';
        }
      });
    }
  }
}

export const auth = new AuthManager();
