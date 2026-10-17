# Product Requirements Document (PRD)

## Project Name: CodeAlpha E-commerce Store
**Project Type:** Full-Stack E-commerce Web Application  
**Internship Program:** CodeAlpha Full Stack Development Internship — Task 1  
**Author:** Engineering Team  
**Status:** Approved Baseline  
**Version:** 1.0.0  

---

## 1. Product Overview
CodeAlpha E-commerce Store is a production-grade, highly responsive, full-stack e-commerce web platform designed to deliver an intuitive and frictionless shopping experience for users while strictly enforcing secure, atomic transaction guarantees on the backend. The platform provides a modern digital catalog, product discovery (search and category filtering), product inspection, persistent shopping cart management, user authentication, and multi-item checkout with order tracking.

---

## 2. Problem Statement
Online retail experiences often suffer from sluggish interfaces, disjointed customer flows, insecure client-side price trust, and poor transaction integrity. Furthermore, many educational demo applications cut corners by omitting real database transactions, exposing secrets, or storing plaintext passwords. CodeAlpha E-commerce Store solves this by providing an enterprise-architected, accessible, resilient e-commerce system built cleanly with modern HTML/CSS/JavaScript and Node.js/Express, underpinned by transactional relational data storage.

---

## 3. Target Users
1. **Shoppers / Customers:** Casual and targeted buyers seeking seamless product browsing, robust search, real-time cart manipulation, and swift checkout with order history tracking.
2. **Evaluators / Internship Mentors:** Assessors reviewing the full-stack architecture, code hygiene, API design, security posture, and usability standards.
3. **Store Administrators (Phase 6 Enhancement):** Internal users managing inventory levels, product catalog entries, and viewing order fulfillment statuses.

---

## 4. Product Goals & Measurable Success Criteria
- **Frictionless Discovery:** Sub-100ms catalog search and category filtering with instantaneous DOM updates and zero page reloads.
- **Transactional Integrity:** 100% server-side price calculation and atomic stock deduction during checkout using database transactions (zero phantom stock deductions or race conditions).
- **Security Compliance:** Zero plaintext passwords (bcrypt 12 rounds), protected HTTP-only cookies, parameterized queries (zero SQL injection vulnerabilities), and rate-limited endpoints.
- **Responsiveness & Accessibility:** 100% responsive across mobile, tablet, and desktop viewports, conforming to WCAG 2.1 AA contrast and semantic keyboard navigation.

---

## 5. Functional Requirements

### 5.1 Storefront & Catalog
- **FR-1.1:** Responsive hero banner presenting curated featured products and active promotions.
- **FR-1.2:** Product grid displaying thumbnail, title, category tag, price, star rating, stock status, and a quick-action "Add to Cart" button.
- **FR-1.3:** Instant client-side & server-backed search bar with debounced keyword matching.
- **FR-1.4:** Category filter pills (e.g., Electronics, Fashion, Home & Living, Accessories) and multi-factor sorting (Price: Low to High, Price: High to Low, Rating, Newest).
- **FR-1.5:** Dedicated Product Details modal/view displaying high-resolution gallery imagery, rich specifications, inventory availability badge, and quantity selector.

### 5.2 Shopping Cart
- **FR-2.1:** Cart drawer & dedicated cart view accessible from any page via persistent header icon with real-time item count badge.
- **FR-2.2:** Add to cart, increment quantity, decrement quantity, and item removal.
- **FR-2.3:** Client-side optimistic updates synced automatically with server-verified calculations (subtotal, shipping, estimated tax, grand total).
- **FR-2.4:** Immediate stock limit enforcement (cannot select quantity greater than available inventory).
- **FR-2.5:** Cart persistence across session refreshes for both authenticated users (stored in DB/session) and guest users (localStorage synchronized on login).

### 5.3 Authentication & User Profiles
- **FR-3.1:** User registration with name, valid email, and strong password validation (min 8 chars).
- **FR-3.2:** Secure login generating a signed JWT token placed in an `HttpOnly`, `SameSite=Lax` cookie.
- **FR-3.3:** Graceful logout clearing session cookies and resetting in-memory client state.
- **FR-3.4:** Authenticated profile route displaying account details and past order history.
- **FR-3.5:** Protected route enforcement (redirecting unauthenticated users gracefully during checkout).

### 5.4 Order Processing & Checkout
- **FR-4.1:** Streamlined checkout view capturing shipping address and payment method (Cash on Delivery / Simulated Mock Card).
- **FR-4.2:** Server-side price recalculation: The server retrieves the latest unit prices directly from the database and ignores any client-sent price overrides.
- **FR-4.3:** Atomic transaction: Order creation, line item insertion, and inventory decrement execute inside a single ACID transaction block.
- **FR-4.4:** Order confirmation screen featuring generated Order ID, itemized receipt, delivery estimate, and status tracker.
- **FR-4.5:** Customer order history view allowing users to inspect previous purchases and current shipment statuses (`Pending`, `Processing`, `Shipped`, `Delivered`).

---

## 6. Non-Functional Requirements
- **NFR-1 (Performance):** Initial storefront payload under 300KB uncompressed; API response times under 50ms for local queries.
- **NFR-2 (Reliability):** ACID compliance for checkout; no data corruption upon server process crash.
- **NFR-3 (Usability & Aesthetics):** Tailored typography, intentional color palette adhering to `taste-skill` and `ui-ux-pro-max` guidelines, avoiding generic AI templates.
- **NFR-4 (Security):** Content Security Policy, Helmet protection, CORS policy, strict Zod request schema validation, input sanitization, and rate-limiting.
- **NFR-5 (Portability):** Zero external database server install required; runs out-of-the-box on Windows/macOS/Linux via standard `npm install && npm start`.

---

## 7. User Stories & Journeys

### User Story 1: Product Discovery
> *As a shopper, I want to filter products by category and sort them by price, so that I can quickly find items matching my budget and interest.*
- **Journey:** Customer lands on homepage -> Clicks "Electronics" filter -> Selects "Price: Low to High" -> Views matching cards -> Clicks "View Details" to inspect specifications.

### User Story 2: Cart & Checkout Flow
> *As a shopper, I want to add multiple items to my cart and proceed to checkout securely, so that I can purchase items without losing my selections.*
- **Journey:** Customer clicks "Add to Cart" -> Cart drawer opens with animation -> Adjusts quantity -> Clicks "Proceed to Checkout" -> If not logged in, prompted to login/register -> Enters shipping details -> Submits order -> Receives instant confirmation and receipt.

### User Story 3: Order History
> *As an authenticated customer, I want to view my past orders, so that I can track delivery status and keep records of my transactions.*
- **Journey:** Customer opens "Orders" in navigation -> Sees list of past orders with dates, total amounts, and status badges -> Clicks an order to inspect itemized breakdown.

---

## 8. Feature Priorities (MoSCoW)
- **Must Have (P0):**
  - Responsive storefront product catalog & search.
  - Interactive shopping cart with quantity updates and total calculation.
  - User registration, login, logout, password hashing, and session management.
  - Checkout flow with server-side price verification and inventory deduction.
  - Relational database schema with seeded products.
- **Should Have (P1):**
  - User order history dashboard.
  - Category filtering and multi-factor sorting.
  - Toast notification system for user actions (cart updates, errors).
  - Empty, loading, and error states across all pages.
- **Could Have (P2):**
  - Administrative catalog and order status modification endpoint.
  - Light/Dark theme toggle.
- **Won't Have (P3 - Out of Scope for Task 1):**
  - Real live payment gateway processing (e.g., live Stripe/PayPal API keys) requiring live merchant credentials.
  - Multi-vendor marketplace capabilities.
  - International currency conversion.

---

## 9. Risks and Assumptions
- **Assumption:** Evaluators run the application locally on Node.js >= 18.
- **Assumption:** SQLite with WAL mode provides the optimal balance of relational ACID compliance and zero-dependency portability.
- **Risk:** High concurrency could lock SQLite if write transactions are held too long.  
  *Mitigation:* Keep transactions concise, utilize Write-Ahead Logging (WAL), and utilize immediate database locks.
