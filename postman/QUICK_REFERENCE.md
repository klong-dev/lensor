# 🚀 Quick Reference Card

## Postman Collections - Lensor API

### 📦 7 Collections | 31 Endpoints | JWT Auth

---

## 🔗 Import URL
```
File > Import > Drag & drop all .json files from /postman folder
```

## 🔑 Setup Variables
```
baseUrl: http://localhost:3005
token: <your-jwt-token>
```

---

## 📍 Endpoints Cheat Sheet

### Authentication
```bash
POST /auth/login
→ Get JWT token for {{token}} variable
```

### 🛒 E-commerce Flow
```bash
# 1. Browse
GET /marketplaces

# 2. Add to cart
POST /cart/add { productId, quantity }

# 3. Checkout
POST /payment/vnpay/create { amount }

# 4. Verify
GET /orders/:id
```

### 💬 Social Features
```bash
# Likes
POST   /posts/:postId/likes
DELETE /posts/:postId/likes
GET    /posts/:postId/likes/check

# Comments
POST   /posts/:postId/comments { content, parentId? }
GET    /posts/:postId/comments
DELETE /posts/:postId/comments/:id
```

### 💬 Chat
```bash
# REST API
POST /chat/rooms { name, type, participantIds }
GET  /chat/rooms/:id/messages?limit=50

# WebSocket Events
authenticate → joinRoom → sendMessage
```

### 🏪 Marketplace (NEW)
```bash
# Public
GET /marketplaces
GET /products/:id

# Protected
POST   /products { title, price, ... }
PATCH  /products/:id
DELETE /products/:id
POST   /products/:id/reviews { rating, comment }

# File Upload
POST /products/upload-image
POST /products (multipart/form-data)
```

---

## 🆕 New Features (Task T013)

### sellCount
- Auto-increment on successful payment
- Visible in marketplace listing
- Track product popularity

### presetFiles
- Array of digital download URLs
- Formats: .xmp, .lrtemplate, .dcp
- Visible only after purchase or for owner
- Example:
  ```json
  "presetFiles": [
    "https://storage.../preset1.xmp",
    "https://storage.../preset2.xmp"
  ]
  ```

### imagePairs
- Before/after showcase images
- Upload with product creation
- Display as slider/comparison

---

## 🧪 VNPay Test Card
```
Card: 9704 0000 0000 0018
Name: NGUYEN VAN A
Date: 03/07
OTP:  123456
```

---

## 📊 Response Codes
```
200 - Success
201 - Created
400 - Bad Request (validation error)
401 - Unauthorized (token missing/expired)
404 - Not Found
500 - Server Error
```

---

## 🔐 Access Control

| Endpoint | Auth | Notes |
|----------|------|-------|
| GET /marketplaces | Public | All users |
| GET /products/:id | Public | presetFiles conditional |
| POST /products | JWT | Create product |
| POST /cart/add | JWT | Add to cart |
| POST /payment/vnpay/create | JWT | Make payment |
| GET /payment/vnpay/callback | Public | VNPay redirect |
| POST /posts/:id/likes | JWT | Like post |
| POST /chat/rooms | JWT | Create room |

---

## 🐛 Quick Debug

### Token expired?
```bash
POST /auth/login
→ Copy new accessToken
```

### sellCount not updating?
```bash
GET /orders/:id
→ Check status = "completed"
```

### presetFiles not visible?
```bash
# Check purchase
GET /orders
→ Verify order exists with productId
```

### Python service offline?
```bash
curl http://localhost:5000/health
→ Should return 200 OK
```

---

## 📱 WebSocket Testing

### HTML Test Client
```html
<script src="/socket.io/socket.io.js"></script>
<script>
const socket = io('http://localhost:3005');

// 1. Authenticate
socket.emit('authenticate', { token: 'your-jwt-token' });

// 2. Join room
socket.emit('joinRoom', { roomId: 'room-uuid' });

// 3. Send message
socket.emit('sendMessage', { 
  roomId: 'room-uuid',
  content: 'Hello!'
});

// 4. Listen for messages
socket.on('newMessage', (data) => {
  console.log('New message:', data);
});
</script>
```

---

## 📈 Testing Order

### First Time Setup
1. Import all 7 collections
2. Set baseUrl & token variables
3. Test public endpoints first
4. Then test protected endpoints

### Test Flow Sequence
```
1. Auth → Get token
2. Marketplace → Browse products  
3. Product → Create/view details
4. Cart → Add items
5. Payment → VNPay checkout
6. Orders → Verify purchase
7. Reviews → Rate product
8. Chat → Create room
9. Social → Like/comment posts
```

---

## 📚 Full Documentation

| Doc | Path |
|-----|------|
| Main Guide | `README.md` |
| Collections Summary | `COLLECTIONS_SUMMARY.md` |
| Marketplace Features | `MARKETPLACE_FEATURES.md` |
| Testing Scenarios | `MARKETPLACE_TESTING.md` |

---

## 🎯 Common Scenarios

### Scenario 1: Buy a preset
```
GET /marketplaces
→ GET /products/:id
→ POST /cart/add
→ POST /payment/vnpay/create
→ [Complete payment]
→ GET /products/:id (presetFiles now visible)
```

### Scenario 2: Sell a preset
```
POST /products/upload-image
→ POST /products (with imagePairs)
→ PATCH /products/:id (add presetFiles)
→ Wait for sales
→ sellCount increments automatically
```

### Scenario 3: Social interaction
```
GET /posts/:id
→ POST /posts/:id/likes
→ POST /posts/:id/comments
→ GET /posts/:id/comments
```

---

## 💡 Pro Tips

✅ **Use variables** - Set productId, postId, orderId after creation  
✅ **Copy UUIDs** - Save IDs from responses for next requests  
✅ **Test in order** - Follow test flows for best results  
✅ **Check logs** - Review terminal output for errors  
✅ **Verify database** - Use SQL queries to confirm changes  

---

**Version:** 1.0.0  
**Last Updated:** November 11, 2025  
**Status:** ✅ Production Ready

---

## 🔗 Quick Links

- [Postman Website](https://www.postman.com/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [VNPay Sandbox](https://sandbox.vnpayment.vn/)
- [Socket.io Client Docs](https://socket.io/docs/v4/client-api/)

**Happy Testing! 🚀**
