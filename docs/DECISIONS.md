# Architecture Decision Records (ADRs)

## Project: CodeAlpha E-commerce Store
**Standard:** Michael Nygard ADR Format  

---

## ADR 001: Selection of Frontend Stack (Vanilla Modular ES6+ & Modern CSS vs. SPA Framework)
- **Status:** Accepted
- **Context:** The CodeAlpha Task 1 specification explicitly mandates: *"Frontend: HTML, CSS, JavaScript"*. In modern web development, many developers reflexively install heavy React or Next.js setups, which introduce complex build pipelines, large JavaScript bundles, hydration mismatches, and maintenance overhead for reviewers.
- **Decision:** Build the client application using native HTML5, modern CSS3 with custom properties (design tokens), and native ES6+ modules (`type="module"`).
- **Consequences:**
  - *Positive:* 100% compliance with official CodeAlpha guidelines; instant sub-second page loads; zero build steps needed to preview the application; clear separation of presentation and logic; easy for evaluators to audit without dealing with framework tooling issues.
  - *Negative:* UI components must manage their own DOM updates without a virtual DOM, which requires disciplined event-driven state patterns (handled via pub/sub listeners in `cart.js` and `auth.js`).

---

## ADR 002: Selection of Embedded Relational Database (SQLite via better-sqlite3 vs. PostgreSQL / MongoDB)
- **Status:** Accepted
- **Context:** E-commerce stores require strict ACID guarantees for multi-item checkout, inventory deduction, and price calculation. External database management systems (PostgreSQL, MySQL, MongoDB) require background services, port binding, and database user configuration, which frequently fail on evaluators' local machines.
- **Decision:** Use SQLite via the high-performance synchronous C++ driver `better-sqlite3`, configured with Write-Ahead Logging (`PRAGMA journal_mode = WAL`) and foreign keys enabled.
- **Consequences:**
  - *Positive:* Zero installation prerequisites; 100% portable across Windows, macOS, and Linux; real SQL relational schema with foreign key integrity; fully supported ACID transactions (`db.transaction(...)`); instantaneous seeding and in-memory test compatibility.
  - *Negative:* Not suited for distributed horizontal scale across multiple server nodes (unnecessary for single-instance full-stack internship projects).

---

## ADR 003: Session Management via HttpOnly JWT Cookies vs. LocalStorage Tokens
- **Status:** Accepted
- **Context:** Single Page Applications frequently store JWT tokens in browser `localStorage`, making them vulnerable to Cross-Site Scripting (XSS) credential harvesting attacks.
- **Decision:** Issue signed JWT tokens within `HttpOnly`, `SameSite=Lax` cookies, with server-side validation on every authenticated request.
- **Consequences:**
  - *Positive:* Immunity to token exfiltration via client-side JavaScript injection; automatic browser transmission on API requests; native expiration management; adheres to OWASP secure session best practices.
  - *Negative:* Requires CORS credentials configuration (`credentials: 'include'`) and `cookie-parser` middleware on the backend.

---

## ADR 004: Monetary Values Stored in Cents (Integer Representation)
- **Status:** Accepted
- **Context:** IEEE 754 floating-point arithmetic (used by JavaScript `Number` and SQL `REAL`/`FLOAT`) introduces subtle rounding errors (e.g. `0.1 + 0.2 = 0.30000000000000004`), which can cause discrepancy bugs in e-commerce totals, taxes, and shipping calculations.
- **Decision:** All prices, subtotals, taxes, shipping, and grand totals are strictly stored and computed as integers representing cents (e.g., $19.99 is stored as `1999`).
- **Consequences:**
  - *Positive:* 100% exact mathematical operations; prevents decimal truncation bugs; standard practice across Stripe, PayPal, and enterprise financial systems.
  - *Negative:* Formatted currency strings (`$19.99`) must be converted via a utility function (`centsToCurrency`) prior to UI rendering.

---

## ADR 005: Server-Authoritative Price and Inventory Calculations
- **Status:** Accepted
- **Context:** Malicious clients can modify frontend JavaScript variables or HTTP request payloads to submit unauthorized discounts (e.g. sending `{ price: 0.01 }`).
- **Decision:** The server strictly ignores any price, subtotal, or stock values submitted in HTTP request bodies. During checkout, line item prices are retrieved freshly from the database inside an atomic transaction, and inventory sufficiency is verified before decrementing.
- **Consequences:**
  - *Positive:* Zero risk of client price manipulation; guaranteed data integrity and fraud prevention.
  - *Negative:* Requires an extra database read during order processing (negligible in SQLite with WAL mode).
