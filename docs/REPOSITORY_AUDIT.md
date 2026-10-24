# Repository Audit Report — CodeAlpha E-commerce Store (NovaCart)

**Audit Date:** 2026-10-24  
**Auditor:** Senior Full-Stack Mentor & System Auditor  
**Repository:** [Sachinxcode-01/CodeAlpha_EcommerceStore](https://github.com/Sachinxcode-01/CodeAlpha_EcommerceStore.git)  
**Task:** CodeAlpha Full Stack Development Internship — Task 1: Simple E-commerce Store  
**Audit Phase:** Phase 0 (Baseline Inspection)

---

## 1. Executive Summary

This repository contains an already scaffolded and substantially implemented full-stack web application designed for CodeAlpha's Task 1. The existing stack employs **HTML5, modern CSS3 (custom properties / design tokens), and Vanilla JavaScript (ES Modules)** on the frontend, with a **Node.js + Express** REST API backend and an **ACID-compliant SQLite relational database (`better-sqlite3` in WAL mode)**.

An automated test suite running on Node.js built-in test runner (`node --test`) was executed and verified: **13 of 13 tests passed**.

However, our audit discovered key discrepancies between documentation and actual implementation (e.g. claimed multi-page HTML architecture vs. actual SPA modal architecture), a permissive CORS fallback configuration, and missing deep-linking routing.

---

## 2. Repository & Environment Status

| Metric | Status / Value | Notes |
| :--- | :--- | :--- |
| **Git Branch** | `main` | Clean working tree; no uncommitted changes. |
| **Commit History** | 4 commits | Initial commit -> docs baseline -> backend -> storefront. |
| **Runtime Environment** | Node.js (CommonJS backend, ES Module frontend) | Verified via `node --test`. |
| **Package Scripts** | `start`, `dev`, `db:seed`, `test`, `test:api` | All mapped in `package.json`. |
| **Environment Config** | `.env` and `.env.example` | Both present; local secrets configured. |
| **Git Ignore** | `.gitignore` present | **Notice:** `.gitignore` excludes `package-lock.json`, which should generally be tracked. |

---

## 3. Technology Stack & Architecture

### Backend
- **Framework:** Express.js `^4.21.2`
- **Architecture:** Layered MVC / Service Pattern (`routes/` -> `controllers/` -> `services/` -> `database/` + `middleware/` + `validations/`)
- **Database Driver:** `better-sqlite3` `^11.8.1` (synchronous, WAL mode enabled, foreign keys enforced)
- **Validation:** `zod` `^3.24.2`
- **Security:** `helmet` `^8.0.0`, `cors` `^2.8.5`, `express-rate-limit` `^7.5.0`, `bcryptjs` `^2.4.3`, `jsonwebtoken` `^9.0.2`, `cookie-parser` `^1.4.7`

### Frontend
- **Structure:** Semantic HTML5 (`public/index.html`)
- **Styling:** Vanilla CSS3 with 3-tier architecture:
  - `tokens.css` (Design tokens, palette, typography, spacing, shadows)
  - `base.css` (CSS resets, layout containers, typography baseline)
  - `components.css` (Cards, drawers, modals, buttons, badges, shimmer skeletons)
- **Logic:** Native Vanilla ES Modules:
  - `api.js` (Unified `fetch` client with credentials)
  - `auth.js` (Session state & profile UI)
  - `cart.js` (Local cart state, quantity manipulation, drawer drawer sync)
  - `store.js` (Catalog rendering, search debounce, category filtering, sort, checkout trigger)
  - `ui.js` (Toasts, modal dialog management, currency formatting)

### Database Schema (SQLite 3)
- `users`: `id`, `name`, `email` (NOCASE, UNIQUE), `password_hash`, `role` (`customer`, `admin`), `created_at`, `updated_at`
- `categories`: `id`, `name`, `slug` (UNIQUE), `description`, `icon`, `display_order`
- `products`: `id`, `category_id` (FK), `name`, `slug` (UNIQUE), `description`, `price_cents`, `inventory`, `image_url`, `rating`, `rating_count`, `is_featured`, timestamps
- `orders`: `id` (PK string like `ORD-xxx`), `user_id` (FK), `subtotal_cents`, `tax_cents`, `shipping_cents`, `total_amount_cents`, `status`, shipping details, `payment_method`, timestamps
- `order_items`: `id`, `order_id` (FK), `product_id` (FK), `product_name`, `unit_price_cents`, `quantity`, `subtotal_cents`
- Indexes: `idx_products_category`, `idx_products_featured`, `idx_products_price`, `idx_orders_user`, `idx_orders_status`, `idx_order_items_order`, `idx_users_email`

---

## 4. Feature-by-Feature Status Audit

| Requirement Category | Specified Feature | Implementation Status | Verification Evidence / Finding |
| :--- | :--- | :--- | :--- |
| **Catalog & Discovery** | Product Listing | **Verified** | GET `/api/v1/products` returns seeded items with category tags & stock. |
| | Category Filter | **Verified** | GET `/api/v1/categories` & `?category=slug` filter tested and working. |
| | Product Search | **Verified** | GET `/api/v1/products?search=...` debounced & SQL parameterized (`LIKE`). |
| | Multi-factor Sorting | **Verified** | Tested `price-asc`, `price-desc`, `rating`, `newest`. |
| | Product Details | **Verified** | `#product-modal` displays details, stock badge, and quantity selector. |
| **Cart** | Add / Remove / Quantities | **Verified** | `cart.js` manages state and syncs with UI badge. |
| | Stock Limit Guard | **Verified** | Prevents exceeding available inventory in cart drawer. |
| | Server-side Validation | **Verified** | POST `/api/v1/cart/validate` verifies real prices and inventory. |
| **Authentication** | Registration | **Verified** | POST `/api/v1/auth/register` hashes passwords with bcrypt (12 rounds). |
| | Login / JWT Cookie | **Verified** | POST `/api/v1/auth/login` sets `HttpOnly`, `SameSite=Lax` cookie. |
| | Protected Profile | **Verified** | GET `/api/v1/auth/me` returns sanitized profile without password hash. |
| | Logout | **Verified** | POST `/api/v1/auth/logout` clears `token` cookie. |
| **Orders & Checkout** | Checkout Form | **Verified** | Validates shipping address and payment method (`cod`, `mock_card`). |
| | Atomic ACID Checkout | **Verified** | `db.transaction()` executes line-item creation and decrements inventory. |
| | Out-of-stock Rejection | **Verified** | Tested with quantity exceeding inventory; returns HTTP 409 Conflict. |
| | Customer Order History | **Verified** | GET `/api/v1/orders` returns only the authenticated user's orders. |
| **Frontend Architecture** | Multi-page HTML | **Discrepancy (Partial)** | `README.md` lists `product.html`, `cart.html`, `checkout.html`, `orders.html`, but app is built as a single `index.html` with modals. |
| | Direct URL Deep Linking | **Missing** | Accessing `/orders` or `/checkout` directly serves `index.html` without opening the respective view. |

---

## 5. Security & Technical Debt Audit

### Security Strengths:
1. **Zero-Trust Pricing:** Client prices are strictly ignored; backend recalculates every cent from database records.
2. **Password Security:** Salted `bcryptjs` hashing with cost factor 12. Plaintext passwords never stored or logged.
3. **Session Hardening:** JWT stored inside `HttpOnly`, `SameSite=Lax` cookies; client JavaScript cannot access token.
4. **Injection Protection:** All SQLite queries utilize parameterized statements (`db.prepare('...').get(...params)`).
5. **Rate Limiting:** `express-rate-limit` guards general API (100 req/15m) and authentication endpoints (15 req/15m).
6. **HTTP Headers:** `helmet` configured with Content Security Policy (CSP).

### Identified Security & Configuration Issues:
1. **Permissive CORS Fallback (`src/app.js`):**  
   Lines 36–40 contain a fallback `return callback(null, true);` that permits cross-origin requests from *any* domain with `credentials: true`. In production, this should strictly enforce `config.cors.origin`.
2. **Missing Anti-CSRF Token:**  
   While `SameSite=Lax` provides strong baseline protection in modern browsers, an explicit CSRF token or origin verification on state-changing operations adds defense-in-depth.
3. **Missing Rate-Limiter Storage Persistence:**  
   Memory-based rate limiting resets upon server restart.
4. **Git Tracking of Lockfile:**  
   `package-lock.json` is listed in `.gitignore`, which risks dependency drift between different machines.

---

## 6. Build and Test Verification

Executed command:
```bash
npm test
```
Result:
- **Suites:** 2 (Integration Suite & Unit Suite)
- **Tests Passed:** 13 / 13
- **Tests Failed:** 0
- **Duration:** ~35.4s (due to intentional bcrypt cost 12 workload in multiple test runs)

---

## 7. Recommended Next Actions & Phase Roadmap

1. **Phase 1 Alignment:** Harmonize documentation (`PRD.md`, `TRD.md`, `README.md`) with actual architecture (SPA with modal drawers vs. dedicated HTML pages).
2. **Deep-linking & Client Routing:** Add hash or history-state routing so `/orders` or `/#orders` reliably surfaces the appropriate modal.
3. **CORS Hardening:** Restrict allowed CORS origins strictly when `NODE_ENV === 'production'`.
4. **Internship Preparation:** Prepare the video walkthrough script and test verification log for CodeAlpha submission.
