# Technical Requirements Document (TRD)

## Project Name: CodeAlpha E-commerce Store
**Version:** 1.0.0  
**Status:** Approved  
**Author:** Principal Software Engineer  

---

## 1. System Architecture Overview
The CodeAlpha E-commerce Store employs a modular client-server architecture. The backend acts as a secure, stateless REST API server with an embedded, transactional ACID database engine. The frontend is served as high-performance, responsive static assets powered by modern Vanilla ES modules and CSS design tokens.

```
+-------------------------------------------------------------+
|                      Client Browser                         |
|  +-------------------------------------------------------+  |
|  | Modern HTML5 Pages & Vanilla ES6+ Application Modules |  |
|  | - Storefront & Discovery (store.js)                   |  |
|  | - Cart & State Synchronization (cart.js)              |  |
|  | - Authentication & Token Storage (auth.js)            |  |
|  | - UI & Toast Components (ui.js)                       |  |
|  | - API Client with Interceptors (api.js)               |  |
|  +-------------------------------------------------------+  |
+------------------------------+------------------------------+
                               |
                               | HTTPS / JSON (HttpOnly Cookies)
                               v
+-------------------------------------------------------------+
|               Node.js / Express Application                  |
|  +-------------------------------------------------------+  |
|  | Global Middleware                                     |  |
|  | - Helmet Security Headers                             |  |
|  | - CORS Protection & Cookie Parser                     |  |
|  | - IP Rate Limiting (General & Auth)                   |  |
|  | - Request Body Parsing & Compression                  |  |
|  +-------------------------------------------------------+  |
|  | Versioned Routes Layer (/api/v1/*)                     |  |
|  | - /auth, /products, /categories, /cart, /orders       |  |
|  +-------------------------------------------------------+  |
|  | Controllers Layer (HTTP translation & status codes)   |  |
|  +-------------------------------------------------------+  |
|  | Business Services Layer (Core business rules)         |  |
|  | - Price verification, inventory lock, JWT generation  |  |
|  +-------------------------------------------------------+  |
|  | Data Access Layer (better-sqlite3)                    |  |
|  | - Parameterized Queries, ACID Transaction Manager     |  |
|  +-------------------------------------------------------+  |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                  Embedded SQLite Database                   |
|  - WAL (Write-Ahead Logging) Mode                           |
|  - Foreign Key Constraints Enabled                          |
|  - Relational Tables: Users, Products, Categories, Orders...|
+-------------------------------------------------------------+
```

---

## 2. Frontend Architecture
- **Language & Runtime:** HTML5, CSS3, ECMAScript 2022+ (Native ES Modules, `type="module"`).
- **Styling Architecture:**
  - Token-first approach via CSS Custom Properties (`public/css/tokens.css`).
  - Strict typographic hierarchy using modern system-first font fallbacks with Google Font Inter.
  - Zero heavy frontend framework overhead (no React/Vue bundle bloat), delivering instant sub-second first-contentful paint (FCP).
  - Micro-interactions (smooth cart flyout, responsive search filtering, interactive quantity stepper).
- **State Management:**
  - Singleton client stores (`store.js`, `cart.js`, `auth.js`) exposing pub/sub event dispatchers (`cart:updated`, `auth:changed`) to keep DOM nodes synchronized without redundant fetches.
  - `localStorage` fallback for guest carts, automatically synced to the server upon user authentication.
- **Form Validation:**
  - Dual-layer: HTML5 native constraint validation paired with JavaScript pre-flight schema checks before dispatching HTTP payloads.

---

## 3. Backend Architecture
- **Framework:** Express.js 4.x running on Node.js (v18 - v25).
- **Design Pattern:** Layered Architecture (Route -> Controller -> Service -> Model/Repository).
  - **Routes:** Define endpoint paths, HTTP verbs, and apply middleware (rate limiters, validators, authentication guards).
  - **Controllers:** Parse request parameters/body, invoke service layer, and return standard JSON responses.
  - **Services:** Pure business logic (e.g., verifying stock levels, recalculating order totals, hashing credentials). Controllers and routes never query the database directly.
  - **Data Access:** SQLite driver executing strictly parameterized SQL statements.
- **Centralized Error Handling:**
  - Custom `AppError` class encapsulating HTTP status codes and operational error indicators.
  - Global Express error handling middleware ensuring consistent JSON error responses:
    ```json
    {
      "success": false,
      "error": {
        "code": "INSUFFICIENT_STOCK",
        "message": "Item 'Wireless Headphones' has only 3 units in stock."
      }
    }
    ```
  - Stack traces are completely suppressed in production and development API responses to prevent leakage.

---

## 4. Database Technology & Data Model
- **Engine:** SQLite 3 via `better-sqlite3`.
- **Concurrency & Resilience:**
  - Pragmas enabled on connection:
    - `PRAGMA journal_mode = WAL;` (Enables concurrent readers and a single writer without blocking).
    - `PRAGMA foreign_keys = ON;` (Enforces referential integrity).
    - `PRAGMA synchronous = NORMAL;` (Maximizes throughput without risking corruption).
- **Data Entities:**
  - `users`: ID, name, email (unique), password_hash, role (`customer`, `admin`), created_at.
  - `categories`: ID, name, slug (unique), description, image_url.
  - `products`: ID, category_id (FK), name, slug, description, price (INTEGER in cents/pence to prevent floating-point inaccuracies), inventory, image_url, rating, is_featured, created_at.
  - `orders`: ID, user_id (FK), total_amount, shipping_address, payment_method, status (`pending`, `processing`, `shipped`, `delivered`, `cancelled`), created_at.
  - `order_items`: ID, order_id (FK), product_id (FK), unit_price, quantity, subtotal.

---

## 5. API Design Principles
- **Conventions:** Resource-oriented RESTful design prefixed with `/api/v1`.
- **HTTP Methods:** `GET` for retrieval, `POST` for creation, `PUT`/`PATCH` for updates, `DELETE` for removal.
- **Payload Format:** Strict `application/json` request and response bodies.
- **Idempotency:** Safe GET/PUT operations; atomic POST checkout operations protected against double-submits.

---

## 6. Authentication & Authorization
- **Mechanism:** JWT (JSON Web Tokens) with HS256 encryption.
- **Storage:** Secure `HttpOnly` cookie with `SameSite=Lax` and `Path=/`. This prevents JavaScript XSS access to tokens.
- **Token Claims:** Minimal payload (`sub`: user_id, `role`: user role, `iat`, `exp`).
- **Authorization Guard:**
  - `requireAuth`: Verifies token validity and injects `req.user`.
  - `requireAdmin`: Enforces role-based access control for administrative endpoints.

---

## 7. Security Architecture
- **Password Protection:** bcrypt with a cost factor of 12.
- **Injection Mitigation:** 100% of SQL queries utilize parameterized statements (`better-sqlite3` prepared statements with `?` or named parameters).
- **Rate Limiting:** `express-rate-limit` prevents brute-force attacks on `/api/v1/auth/*` (15 attempts / 15 minutes) and API spamming (100 requests / 15 minutes).
- **HTTP Security Headers:** `helmet` configuring HSTS, X-Content-Type-Options, X-Frame-Options, and Referrer-Policy.
- **CORS Policy:** Strict origin whitelisting configured via environment variables.

---

## 8. Testing Strategy
- **Unit Testing:** Unit tests for business services (price calculation, inventory deduction logic, auth token generation).
- **Integration Testing:** API route tests verifying HTTP status codes, validation rejection, and database state transitions using Supertest and Jest.
- **Manual Verification Matrix:** End-to-end shopping flow verification recorded across responsive screen breakpoints (Mobile 375px, Tablet 768px, Desktop 1280px).

---

## 9. Technical Decisions & Trade-Offs

| Decision | Alternative Considered | Rationale & Justification |
| :--- | :--- | :--- |
| **SQLite with WAL mode** | PostgreSQL / MySQL / MongoDB | Eliminates complex Docker/DBMS install prerequisites for CodeAlpha mentors; provides real ACID transactions and zero latency overhead. |
| **Cents / Integers for Currency** | Floating-point numbers (`FLOAT`/`REAL`) | Avoids binary floating-point rounding errors (e.g. `0.1 + 0.2 = 0.30000000000000004`). |
| **HttpOnly Cookie for JWT** | localStorage Token Storage | Immunity against XSS token harvesting; seamless browser persistence. |
| **Vanilla Modular JS + Modern CSS** | React / Next.js / Tailwind | Fulfills the explicit CodeAlpha Task 1 requirement ("Frontend: HTML, CSS, JavaScript"), provides instant loading with zero build-step fragility, and showcases fundamental web engineering proficiency. |
