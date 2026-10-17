# Testing Strategy & Test Suite Documentation

## Project: CodeAlpha E-commerce Store
**Test Frameworks:** Jest / Supertest / Native Node Test Runner  
**Coverage Target:** > 80% Core Business Logic & Security Routes  

---

## 1. Test Pyramid & Methodology
The test suite validates the full lifecycle of e-commerce operations, structured across three levels:

```
        / \
       /   \     E2E / Browser UI Workflow
      /-----\    Integration (API Endpoints & DB)
     /       \   Unit Tests (Auth, Price Calc, Stock Rules)
    +---------+
```

1. **Unit Tests:** Focus on isolated functions:
   - Password hashing and verification.
   - Price calculation (subtotal, shipping tiers, tax rounding in cents).
   - Validation schema parsing and error formatting.
2. **Integration Tests (API Endpoints):**
   - Authentication flow (Register -> Login -> Verify Cookie -> Profile -> Logout).
   - Product catalog filtering, searching, and sorting.
   - Cart validation and price recalculation.
   - Checkout execution verifying ACID atomic inventory decrements and stock constraint rollbacks.
3. **End-to-End User Verification:**
   - Visual inspection of storefront loading, filter responsiveness, cart flyout, checkout form, and order receipt.

---

## 2. Test Execution Commands

### Run Full Test Suite
```bash
npm test
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run Integration / API Tests Only
```bash
npm run test:api
```

### Run with Coverage Report
```bash
npm run test:coverage
```

---

## 3. Test Cases Specification

### 3.1 Authentication & Authorization (`tests/integration/auth.test.js`)
- `TC-AUTH-01`: Register new customer with valid credentials -> Expect `201 Created` + `Set-Cookie` header.
- `TC-AUTH-02`: Register duplicate email -> Expect `400 Bad Request` with descriptive message.
- `TC-AUTH-03`: Register with weak password (< 8 chars) -> Expect `400 Bad Request` schema failure.
- `TC-AUTH-04`: Login with valid credentials -> Expect `200 OK` + signed JWT cookie.
- `TC-AUTH-05`: Login with incorrect password -> Expect `401 Unauthorized`.
- `TC-AUTH-06`: Access `/api/v1/auth/me` without cookie -> Expect `401 Unauthorized`.
- `TC-AUTH-07`: Access `/api/v1/auth/me` with valid cookie -> Expect `200 OK` with user details (excluding `password_hash`).

### 3.2 Product Catalog (`tests/integration/products.test.js`)
- `TC-PROD-01`: List all products -> Expect `200 OK` with array and pagination metadata.
- `TC-PROD-02`: Filter products by category (`?category=electronics`) -> Expect only electronic items returned.
- `TC-PROD-03`: Search products (`?search=headphones`) -> Expect matched item returned.
- `TC-PROD-04`: Sort products by price ascending (`?sort=price-asc`) -> Expect ordered array `price_cents[i] <= price_cents[i+1]`.
- `TC-PROD-05`: Retrieve non-existent product (`GET /api/v1/products/9999`) -> Expect `404 Not Found`.

### 3.3 Cart & Order Processing (`tests/integration/orders.test.js`)
- `TC-ORD-01`: Validate cart with valid product IDs -> Expect server-recalculated totals.
- `TC-ORD-02`: Attempt checkout without authentication -> Expect `401 Unauthorized`.
- `TC-ORD-03`: Place order with valid stock -> Expect `201 Created`, order ID generated, and inventory decremented in database.
- `TC-ORD-04`: Attempt checkout with quantity exceeding stock -> Expect `409 Conflict` (Insufficient stock) and zero inventory modification (atomic rollback).
- `TC-ORD-05`: Retrieve order history -> Expect customer to see their created order.
- `TC-ORD-06`: Retrieve another user's order ID (IDOR test) -> Expect `403 Forbidden` or `404 Not Found`.

---

## 4. Manual Regression Checklist
Before releasing or submitting any implementation phase:
- [ ] Database seeds without errors (`npm run db:seed`).
- [ ] Server boots with zero warnings on `PORT=5000`.
- [ ] Storefront displays responsive grid on mobile (375px) and desktop (1440px).
- [ ] Cart drawer opens smoothly, reflects badge count accurately, and persists on page reload.
- [ ] Form validation triggers clear error states for invalid email or blank shipping fields.
- [ ] Checkout completes with instant confirmation receipt.
