# Security Architecture & Policies

## Project: CodeAlpha E-commerce Store
**Standard:** OWASP Top 10 Compliance  
**Auditor Status:** Pass with Strict Enforcement  

---

## 1. Authentication & Session Strategy
- **Mechanism:** Signed JSON Web Tokens (JWT) utilizing HMAC-SHA256 (`HS256`).
- **Storage:** Secure `HttpOnly` browser cookies.
  - `HttpOnly`: Prevents client-side scripts from reading session cookies via `document.cookie`, mitigating XSS credential theft.
  - `SameSite=Lax`: Defends against Cross-Site Request Forgery (CSRF) for state-changing cross-site requests.
  - `Secure`: Dynamically enabled in production when HTTPS is active (`NODE_ENV === 'production'`).
  - `Max-Age`: Set to 7 days with automatic expiration enforcement on both server and client.

---

## 2. Password Hashing & Secret Management
- **Hashing Algorithm:** `bcryptjs` with salt round factor of `12`.
  - Computationally intensive to resist high-speed GPU dictionary and rainbow table cracking.
- **Salt Generation:** Unique cryptographically random salt generated per user.
- **Secrets Policy:**
  - Zero hardcoded secrets in version control.
  - All keys (`JWT_SECRET`, `COOKIE_SECRET`, `PORT`) loaded strictly via `process.env`.
  - `.env` ignored via `.gitignore`; `.env.example` contains non-secret mock placeholders only.

---

## 3. Server-Side Authorization & Role Enforcement
- **Principle of Least Privilege:**
  - Public endpoints: Browsing products, viewing product details, listing categories, registering, logging in.
  - Customer endpoints: Managing personal cart, checking out, viewing personal order history (`WHERE user_id = req.user.id`).
  - Administrative endpoints: Modifying product prices, updating inventory, altering order fulfillment statuses (`req.user.role === 'admin'`).
- **Object-Level Access Control (IDOR Mitigation):**
  - Order detail endpoints verify that `order.user_id === req.user.id` unless the requesting user possesses the `admin` role. Users cannot view orders belonging to other customers.

---

## 4. Input Validation & Parameterized Queries
- **Input Sanitization & Schema Validation:**
  - All incoming HTTP bodies validated via Zod schemas before touching any service logic.
  - Email addresses normalized to lowercase and checked against RFC 5322 regex.
  - Price and quantity inputs validated as positive integers (`quantity > 0`, `price_cents >= 0`).
- **SQL Injection Prevention:**
  - 100% of queries use `better-sqlite3` prepared statements with positional (`?`) or named parameters.
  - Zero raw string concatenation or template literal interpolation into SQL strings.

---

## 5. Rate Limiting & Denial of Service (DoS) Defense
- **General API Limiter:**
  - 100 requests per 15-minute sliding window per IP.
- **Strict Authentication Limiter:**
  - 15 requests per 15-minute window on `/api/v1/auth/login` and `/api/v1/auth/register` to block automated brute-force attacks.
- **Payload Limits:**
  - `express.json({ limit: '10kb' })` prevents memory exhaustion attacks via massive HTTP request bodies.

---

## 6. HTTP Security Headers via Helmet
The application mounts `helmet` to set robust HTTP response headers:
- `Content-Security-Policy`: Restricts scripts, styles, and image asset sources to self and trusted CDNs (Google Fonts, Unsplash).
- `X-Frame-Options: DENY`: Prevents clickjacking within iframes.
- `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing exploits.
- `Strict-Transport-Security (HSTS)`: Forces modern browsers to communicate over HTTPS.
- `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 7. Protection Against Common Web Vulnerabilities Matrix

| Vulnerability | Threat Model | Applied Defense Mechanism |
| :--- | :--- | :--- |
| **SQL Injection (SQLi)** | Malicious SQL syntax in search/login inputs | 100% parameterized prepared statements. |
| **Cross-Site Scripting (XSS)** | Injection of malicious JS into product/order inputs | HTML character escaping in UI templates; HttpOnly session cookies. |
| **Broken Object Level Auth (IDOR)** | Requesting `/api/v1/orders/ORD-999` of another user | Middleware ownership check `req.user.id === order.user_id`. |
| **Client Price Tampering** | Manipulating client-side payload `{ price: 0.01 }` | Total disregard of client prices; unit prices queried directly from database inside atomic transaction. |
| **Inventory Overselling Race Condition** | Two users purchasing last item simultaneously | ACID transaction block locks stock row; checks `inventory >= requested` before decrementing. |
| **Sensitive Data Exposure** | Password hashes or stack traces sent in API responses | User entity sanitization removes `password_hash`; centralized error handler suppresses stack traces. |
