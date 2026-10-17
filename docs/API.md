# REST API Documentation

## API Version: `v1`
**Base URL:** `http://localhost:5000/api/v1`  
**Content-Type:** `application/json`  
**Authentication:** JWT Bearer via `HttpOnly` Cookie (`token`) or `Authorization: Bearer <token>` Header

---

## 1. Global Standard Response Formats

### Success Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable success description",
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 48
  }
}
```

### Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | NOT_FOUND | INSUFFICIENT_STOCK | SERVER_ERROR",
    "message": "Descriptive error message",
    "details": [
      {
        "field": "email",
        "issue": "Invalid email address format"
      }
    ]
  }
}
```

---

## 2. Authentication Endpoints

### 2.1 Register New Account
- **Path:** `POST /auth/register`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 1,
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "customer",
        "created_at": "2026-10-17T12:00:00Z"
      }
    },
    "message": "Registration successful"
  }
  ```
- **Sets Cookie:** `token=<jwt>; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`

---

### 2.2 Login
- **Path:** `POST /auth/login`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 1,
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "customer"
      }
    },
    "message": "Login successful"
  }
  ```

---

### 2.3 Logout
- **Path:** `POST /auth/logout`
- **Auth:** Public / Authenticated
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Successfully logged out"
  }
  ```
- **Clears Cookie:** `token=; Max-Age=0`

---

### 2.4 Current User Profile
- **Path:** `GET /auth/me`
- **Auth:** Required (`requireAuth`)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 1,
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "customer"
      }
    }
  }
  ```

---

## 3. Product & Catalog Endpoints

### 3.1 List Products (with Search, Filter, & Pagination)
- **Path:** `GET /products`
- **Auth:** Public
- **Query Parameters:**
  - `page` (integer, default: 1): Page number
  - `limit` (integer, default: 12): Items per page
  - `search` (string, optional): Search keyword against product name or description
  - `category` (string, optional): Filter by category slug (e.g. `electronics`)
  - `sort` (string, default: `newest`): Options: `newest`, `price-asc`, `price-desc`, `rating`, `name-asc`
  - `featured` (boolean, optional): `true` to return featured products only
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "products": [
        {
          "id": 1,
          "name": "Sony WH-1000XM5 Wireless Headphones",
          "slug": "sony-wh-1000xm5",
          "category": "Electronics",
          "category_slug": "electronics",
          "description": "Industry-leading noise canceling headphones...",
          "price": 34999,
          "price_formatted": "$349.99",
          "inventory": 15,
          "rating": 4.8,
          "rating_count": 128,
          "image_url": "assets/images/products/headphones.webp",
          "is_featured": 1
        }
      ]
    },
    "meta": {
      "total": 24,
      "page": 1,
      "limit": 12,
      "total_pages": 2
    }
  }
  ```

---

### 3.2 Get Single Product by ID or Slug
- **Path:** `GET /products/:idOrSlug`
- **Auth:** Public
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "product": {
        "id": 1,
        "name": "Sony WH-1000XM5 Wireless Headphones",
        "slug": "sony-wh-1000xm5",
        "category_id": 1,
        "category_name": "Electronics",
        "description": "Full product description and technical specs...",
        "price": 34999,
        "price_formatted": "$349.99",
        "inventory": 15,
        "rating": 4.8,
        "image_url": "assets/images/products/headphones.webp"
      }
    }
  }
  ```
- **Error (404 Not Found):**
  ```json
  {
    "success": false,
    "error": {
      "code": "NOT_FOUND",
      "message": "Product not found"
    }
  }
  ```

---

### 3.3 List Categories
- **Path:** `GET /categories`
- **Auth:** Public
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "categories": [
        {
          "id": 1,
          "name": "Electronics",
          "slug": "electronics",
          "description": "Premium gadgets and audio gear",
          "product_count": 8
        }
      ]
    }
  }
  ```

---

## 4. Shopping Cart Endpoints

### 4.1 Validate & Calculate Cart
- **Path:** `POST /cart/validate`
- **Auth:** Public / Authenticated
- **Request Body:**
  ```json
  {
    "items": [
      { "product_id": 1, "quantity": 2 }
    ]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "product_id": 1,
          "name": "Sony WH-1000XM5",
          "unit_price": 34999,
          "quantity": 2,
          "subtotal": 69998,
          "available_inventory": 15,
          "is_available": true
        }
      ],
      "summary": {
        "subtotal": 69998,
        "shipping": 0,
        "tax": 5600,
        "total": 75598,
        "total_formatted": "$755.98"
      }
    }
  }
  ```

---

## 5. Orders & Checkout Endpoints

### 5.1 Create Order (Checkout)
- **Path:** `POST /orders`
- **Auth:** Required (`requireAuth`)
- **Request Body:**
  ```json
  {
    "items": [
      { "product_id": 1, "quantity": 1 }
    ],
    "shipping_address": {
      "full_name": "Jane Doe",
      "street": "123 Innovation Way",
      "city": "Bengaluru",
      "state": "Karnataka",
      "postal_code": "560001",
      "phone": "+91 9876543210"
    },
    "payment_method": "cod"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "order": {
        "id": "ORD-20261017-001",
        "user_id": 1,
        "status": "pending",
        "subtotal": 34999,
        "tax": 2800,
        "shipping": 0,
        "total_amount": 37799,
        "total_formatted": "$377.99",
        "payment_method": "cod",
        "created_at": "2026-10-17T12:30:00Z",
        "items": [
          {
            "product_id": 1,
            "product_name": "Sony WH-1000XM5",
            "unit_price": 34999,
            "quantity": 1,
            "subtotal": 34999
          }
        ]
      }
    },
    "message": "Order successfully placed"
  }
  ```
- **Error (409 Conflict - Insufficient Inventory):**
  ```json
  {
    "success": false,
    "error": {
      "code": "INSUFFICIENT_STOCK",
      "message": "Sorry, 'Sony WH-1000XM5' has only 0 units left in stock."
    }
  }
  ```

---

### 5.2 List User's Order History
- **Path:** `GET /orders`
- **Auth:** Required (`requireAuth`)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "orders": [
        {
          "id": "ORD-20261017-001",
          "total_amount": 37799,
          "total_formatted": "$377.99",
          "item_count": 1,
          "status": "pending",
          "created_at": "2026-10-17T12:30:00Z"
        }
      ]
    }
  }
  ```

---

### 5.3 Get Specific Order Details
- **Path:** `GET /orders/:id`
- **Auth:** Required (`requireAuth` & must own order or be admin)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "order": {
        "id": "ORD-20261017-001",
        "status": "pending",
        "total_amount": 37799,
        "shipping_address": "123 Innovation Way, Bengaluru, Karnataka, 560001",
        "items": [ ... ]
      }
    }
  }
  ```
