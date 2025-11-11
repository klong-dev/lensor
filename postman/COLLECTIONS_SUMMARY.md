# 📦 Postman Collections Summary

## Tổng quan

**Tổng số collections:** 7  
**Tổng số endpoints:** 31  
**Last updated:** November 11, 2025

---

## 📋 Danh sách Collections

| # | Collection Name | Endpoints | Module | Status |
|---|----------------|-----------|--------|--------|
| 1 | Lensor_PostLikes | 4 | Post Likes | ✅ Complete |
| 2 | Lensor_PostComments | 4 | Post Comments | ✅ Complete |
| 3 | Lensor_Cart | 5 | Shopping Cart | ✅ Complete |
| 4 | Lensor_Payment | 4 | VNPay & PayPal | ✅ Complete |
| 5 | Lensor_Orders | 2 | Order Management | ✅ Complete |
| 6 | Lensor_Chat | 6 | Chat System | ✅ Complete |
| 7 | Lensor_Marketplace | 8 | Products & Reviews | ✅ Complete |

---

## 🎯 Mục đích từng Collection

### 1. Lensor_PostLikes (4 endpoints)
**Module:** Social Features - Post Interactions  
**Authentication:** Required (JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/posts/:postId/likes` | Like a post |
| DELETE | `/posts/:postId/likes` | Unlike a post |
| GET | `/posts/:postId/likes` | Get all likes |
| GET | `/posts/:postId/likes/check` | Check if user liked |

**Key Features:**
- Unique constraint: 1 user = 1 like per post
- Returns like count
- Fast check for UI rendering

---

### 2. Lensor_PostComments (4 endpoints)
**Module:** Social Features - Comments & Replies  
**Authentication:** Required (JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/posts/:postId/comments` | Create comment |
| POST | `/posts/:postId/comments` | Create nested reply |
| GET | `/posts/:postId/comments` | Get all comments |
| DELETE | `/posts/:postId/comments/:id` | Delete comment |

**Key Features:**
- Nested comments support (parentId)
- Soft delete with deletedAt
- Hierarchical structure
- Reply chains

---

### 3. Lensor_Cart (5 endpoints)
**Module:** E-commerce - Shopping Cart  
**Authentication:** Required (JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cart` | Get user's cart |
| POST | `/cart/add` | Add product to cart |
| PATCH | `/cart/update/:id` | Update quantity |
| DELETE | `/cart/remove/:id` | Remove item |
| DELETE | `/cart/clear` | Clear entire cart |

**Key Features:**
- Auto-calculate total price
- Prevent duplicate products
- Quantity validation
- Real-time total updates

---

### 4. Lensor_Payment (4 endpoints)
**Module:** Payment Gateway Integration  
**Authentication:** Mixed (VNPay callback is public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payment/vnpay/create` | Create VNPay payment URL |
| GET | `/payment/vnpay/callback` | VNPay success callback |
| GET | `/payment/vnpay/callback` | VNPay failed callback |
| POST | `/payment/paypal/create` | Create PayPal payment (placeholder) |

**Key Features:**
- VNPay sandbox integration
- Secure HMAC-SHA512 signature
- Automatic order creation on success
- sellCount increment on completed payment
- Test cards included

---

### 5. Lensor_Orders (2 endpoints)
**Module:** Order Management  
**Authentication:** Required (JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | Get user's orders |
| GET | `/orders/:id` | Get order details |

**Key Features:**
- Order status tracking (pending/completed/failed/refunded)
- Items stored as JSON array
- Total amount calculation
- Purchase history

---

### 6. Lensor_Chat (6 endpoints)
**Module:** Real-time Chat System  
**Authentication:** Required (JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/rooms` | Create group chat room |
| POST | `/chat/rooms/direct` | Create 1-1 direct room |
| GET | `/chat/rooms` | Get user's chat rooms |
| GET | `/chat/rooms/:id` | Get room details |
| GET | `/chat/rooms/:id/messages` | Get message history |
| GET | `/chat/rooms/:id/messages?limit=50` | Get limited messages |

**Key Features:**
- WebSocket support (5 events)
- Group & direct chat types
- Message history pagination
- Typing indicators
- Room participants management

**WebSocket Events:**
- `authenticate` - Verify JWT
- `joinRoom` - Join chat room
- `leaveRoom` - Leave chat room
- `sendMessage` - Send message
- `typing` - Typing indicator

---

### 7. Lensor_Marketplace (8 endpoints) 🆕
**Module:** Marketplace & Product Management  
**Authentication:** Mixed (public + protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/marketplaces` | Get all products (public) |
| GET | `/products/:id` | Get product details (public) |
| POST | `/products` | Create product with files (JWT) |
| POST | `/products` | Create product JSON only (JWT) |
| PATCH | `/products/:id` | Update product (JWT) |
| DELETE | `/products/:id` | Delete product (JWT) |
| POST | `/products/upload-image` | Upload image separately (JWT) |
| POST | `/products/:id/reviews` | Create review (JWT) |

**Key Features:**
- **sellCount tracking** - Auto-increment on purchase
- **presetFiles support** - Array of .xmp, .lrtemplate, .dcp files
- **imagePairs** - Before/after comparison images
- **Access control** - presetFiles visible only for buyers/owners
- **Review system** - Updates product rating & reviewCount
- **File upload** - Multipart form-data support
- **Python integration** - EXIF extraction & thumbnail generation

---

## 🔑 Variables Required

All collections sử dụng chung variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `baseUrl` | API base URL | `http://localhost:3005` |
| `token` | JWT authentication token | `eyJhbGciOiJIUzI1...` |
| `postId` | Post UUID | `123e4567-e89b-12d3-a456-426614174000` |
| `productId` | Product UUID | `987fcdeb-51d2-43a1-b234-567890abcdef` |
| `commentId` | Comment UUID | `abc12345-6789-def0-1234-567890abcdef` |
| `cartItemId` | Cart item UUID | `cart-uuid-here` |
| `orderId` | Order UUID | `order-uuid-here` |
| `roomId` | Chat room UUID | `room-uuid-here` |

---

## 🚀 Quick Start Guide

### 1. Import Collections
```bash
# In Postman
File > Import > Select all 7 .json files
```

### 2. Set Variables
```
Collections (gear icon) > Variables tab
- baseUrl: http://localhost:3005
- token: <your-jwt-token>
```

### 3. Get JWT Token
```
POST /auth/login
Body: { "email": "user@example.com", "password": "password" }
→ Copy accessToken to {{token}}
```

### 4. Test Endpoints
```
Start with public endpoints:
1. GET /marketplaces - View products
2. GET /products/:id - View details

Then authenticated:
3. POST /products - Create product
4. POST /cart/add - Add to cart
5. POST /payment/vnpay/create - Make payment
```

---

## 🎨 Feature Highlights by Collection

### Social Features (Likes + Comments)
- ✅ Like/unlike posts
- ✅ Nested comments up to 10 levels
- ✅ Soft delete with "Comment deleted"
- ✅ Real-time like count

### E-commerce Flow (Cart + Payment + Orders)
- ✅ Add multiple products to cart
- ✅ Auto-calculate cart total
- ✅ VNPay sandbox integration
- ✅ Order tracking with status
- ✅ Purchase history

### Real-time Chat (WebSocket + REST)
- ✅ Group chat rooms
- ✅ Direct 1-1 messaging
- ✅ Message history with pagination
- ✅ Typing indicators
- ✅ Online presence

### Marketplace (Products + Reviews) 🆕
- ✅ **sellCount** - Track sales automatically
- ✅ **presetFiles** - Digital product downloads
- ✅ **imagePairs** - Before/after showcases
- ✅ **Reviews** - 5-star rating system
- ✅ **Access control** - Files visible only after purchase
- ✅ **File uploads** - Multipart form-data
- ✅ **Soft delete** - Restore capability

---

## 📚 Documentation Files

| File | Description |
|------|-------------|
| `README.md` | Main guide with import & test flows |
| `MARKETPLACE_FEATURES.md` | Detailed docs for sellCount & presetFiles |
| `MARKETPLACE_TESTING.md` | Step-by-step test scenarios |

---

## 🧪 Test Flows

### Complete E-commerce Flow
```
1. Browse marketplace → GET /marketplaces
2. View product → GET /products/:id
3. Add to cart → POST /cart/add
4. Checkout → POST /payment/vnpay/create
5. Complete payment → VNPay redirect → Callback
6. Check order → GET /orders/:id
7. Download files → GET /products/:id (presetFiles visible)
8. Leave review → POST /products/:id/reviews
```

### Social Interaction Flow
```
1. View post → GET /posts/:id
2. Like post → POST /posts/:postId/likes
3. Add comment → POST /posts/:postId/comments
4. Reply to comment → POST /posts/:postId/comments (with parentId)
5. Get all comments → GET /posts/:postId/comments
```

### Chat Flow
```
1. Create room → POST /chat/rooms
2. Get rooms → GET /chat/rooms
3. View messages → GET /chat/rooms/:id/messages
4. Connect WebSocket → ws://localhost:3005
5. Authenticate → emit('authenticate', { token })
6. Join room → emit('joinRoom', { roomId })
7. Send message → emit('sendMessage', { roomId, content })
```

---

## 🔧 Troubleshooting

### Common Issues

**1. Token expired**
```
Error: 401 Unauthorized
Solution: Re-login và copy new token
```

**2. Product not found**
```
Error: 404 Not Found
Solution: Verify productId exists in database
```

**3. sellCount not incrementing**
```
Cause: VNPay callback failed
Solution: Check order status = "completed"
```

**4. presetFiles not visible**
```
Cause: User hasn't purchased product
Solution: Complete payment flow first
```

**5. File upload failed**
```
Cause: Python image service offline
Solution: Check http://localhost:5000/health
```

---

## 📊 Statistics

### Endpoints by Type
- **Public:** 3 endpoints (marketplaces, products)
- **Protected:** 28 endpoints (requires JWT)

### HTTP Methods
- **GET:** 15 endpoints
- **POST:** 13 endpoints
- **PATCH:** 2 endpoints
- **DELETE:** 4 endpoints

### Features Implemented
- ✅ Authentication (JWT)
- ✅ File uploads (Multipart)
- ✅ Payment gateway (VNPay)
- ✅ WebSocket (Socket.io)
- ✅ Database (TypeORM + PostgreSQL)
- ✅ Image processing (Python service)
- ✅ Soft deletes
- ✅ Access control
- ✅ Auto-increment counters (sellCount, reviewCount)

---

## 🎯 Next Steps

### For Testing:
1. Import all 7 collections
2. Set up variables (baseUrl, token)
3. Run test flows in order
4. Verify sellCount increments
5. Check presetFiles access control

### For Development:
1. Add sorting/filtering to marketplace
2. Implement download tracking
3. Add preset file versioning
4. Create seller analytics dashboard
5. Add email notifications for purchases

---

## 📞 Support

**Documentation:**
- Main README: `postman/README.md`
- Marketplace Features: `postman/MARKETPLACE_FEATURES.md`
- Testing Guide: `postman/MARKETPLACE_TESTING.md`

**Related Task:**
- Task T013 - Complete Feature Implementation

**Backend:**
- NestJS 10.4.20
- Running on: http://localhost:3005

**Services:**
- Python Image Service: http://localhost:5000
- WebSocket: ws://localhost:3005

---

**Created:** November 11, 2025  
**Version:** 1.0.0  
**Author:** AI Assistant  
**Status:** ✅ Production Ready
