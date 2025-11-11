# Lensor Postman Collections

Bộ Postman Collections cho các module được phát triển trong Task T013.

## � Quick Navigation

| Document | Description |
|----------|-------------|
| 📄 [README.md](./README.md) | Main guide - Import & usage instructions (You are here) |
| 📦 [COLLECTIONS_SUMMARY.md](./COLLECTIONS_SUMMARY.md) | Complete overview of all 7 collections |
| 🏪 [MARKETPLACE_FEATURES.md](./MARKETPLACE_FEATURES.md) | Detailed docs for sellCount & presetFiles |
| 🧪 [MARKETPLACE_TESTING.md](./MARKETPLACE_TESTING.md) | Step-by-step test scenarios |

---

## �📦 Collections có sẵn

### 1. **Lensor_PostLikes.postman_collection.json**
Quản lý tính năng like/unlike bài đăng
- ✅ Like bài đăng
- ✅ Unlike bài đăng  
- ✅ Xem danh sách likes
- ✅ Kiểm tra trạng thái like

### 2. **Lensor_PostComments.postman_collection.json**
Quản lý comments và replies (bình luận lồng nhau)
- ✅ Tạo comment
- ✅ Tạo reply (nested comment)
- ✅ Xem tất cả comments
- ✅ Xóa comment (soft delete)

### 3. **Lensor_Cart.postman_collection.json**
Quản lý giỏ hàng
- ✅ Xem giỏ hàng
- ✅ Thêm sản phẩm vào giỏ
- ✅ Cập nhật số lượng
- ✅ Xóa sản phẩm khỏi giỏ
- ✅ Xóa toàn bộ giỏ hàng

### 4. **Lensor_Payment.postman_collection.json** (Legacy)
Tích hợp cổng thanh toán (phiên bản cũ)
- ✅ VNPay: Tạo thanh toán
- ✅ VNPay: Callback (success/failed)
- ✅ PayPal: Tạo thanh toán (placeholder)

### 4.1 **Lensor-Payment-API.postman_collection.json** 🆕 (Recommended)
Complete payment integration với SPA architecture
- ✅ Authentication: Auto-save JWT token
- ✅ VNPay Flow: Create → Verify → Return (3 requests)
- ✅ PayPal Flow: Create → Verify → Return/Cancel (4 requests)
- ✅ Unified Endpoint: Single endpoint cho cả 2 channels
- ✅ Auto-save order IDs và payment tokens
- ✅ Comprehensive SPA flow documentation

### 5. **Lensor_Orders.postman_collection.json**
Quản lý đơn hàng
- ✅ Xem danh sách đơn hàng
- ✅ Xem chi tiết đơn hàng

### 6. **Lensor_Chat.postman_collection.json**
REST API cho chat (WebSocket events xem hướng dẫn riêng)
- ✅ Tạo phòng chat
- ✅ Tạo phòng chat trực tiếp (1-1)
- ✅ Xem danh sách phòng chat
- ✅ Xem chi tiết phòng
- ✅ Xem lịch sử tin nhắn

### 7. **Lensor_Marketplace.postman_collection.json** 🆕
Marketplace và quản lý sản phẩm (bao gồm sellCount, presetFiles)
- ✅ Xem tất cả sản phẩm (marketplace)
- ✅ Xem chi tiết sản phẩm
- ✅ Tạo sản phẩm (với upload files)
- ✅ Tạo sản phẩm (chỉ JSON)
- ✅ Cập nhật sản phẩm
- ✅ Xóa sản phẩm (soft delete)
- ✅ Upload ảnh sản phẩm riêng
- ✅ Tạo review sản phẩm (cập nhật rating & reviewCount)

---

## 🚀 Cách sử dụng

### Bước 1: Import Collections vào Postman

1. Mở **Postman**
2. Click **Import** (góc trên bên trái)
3. Kéo thả hoặc chọn các file `.postman_collection.json` từ thư mục `postman/`
4. Tất cả 6 collections sẽ được import vào workspace của bạn

### Bước 2: Cấu hình Variables

Mỗi collection có các biến môi trường cần thiết:

#### **Biến chung (tất cả collections):**
```
baseUrl: http://localhost:3005
token: <your-jwt-token>
```

#### **Biến riêng theo collection:**

**Post Likes & Comments:**
```
postId: <uuid-of-post>
commentId: <uuid-of-comment>
```

**Cart:**
```
productId: <uuid-of-product>
cartItemId: <uuid-of-cart-item>
```

**Payment & Orders:**
```
orderId: <uuid-of-order>
```

**Chat:**
```
roomId: <uuid-of-chat-room>
```

### Bước 3: Lấy JWT Token

1. Đăng nhập qua API `/auth/login`:
```json
POST http://localhost:3005/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

2. Copy `access_token` từ response
3. Paste vào biến `token` trong collection

### Bước 4: Test API

Chọn request cần test và click **Send**. Tất cả headers và authentication đã được cấu hình sẵn.

---

## 📝 Ví dụ sử dụng

### 📦 Test Payment Flow (SPA Architecture - RECOMMENDED) 🆕

> **Important:** Sử dụng collection mới `Lensor-Payment-API.postman_collection.json` thay vì collection cũ.

#### Bước 0: Import Collection và Environment

1. Import file: `Lensor-Payment-API.postman_collection.json`
2. Import file: `Lensor-Payment-Local.postman_environment.json`
3. Chọn environment "Lensor Payment Local" từ dropdown (góc phải trên)

#### Bước 1: Authentication

```
Collection: Lensor-Payment-API > 0. Authentication
Request: Login
Body: { "email": "your@email.com", "password": "yourpassword" }
→ JWT token sẽ tự động lưu vào collection variable
```

#### Bước 2: Test VNPay Payment

**2.1 Create Payment:**
```
Collection: Lensor-Payment-API > 1. VNPay Flow
Request: 1.1 Create VNPay Payment
Body: { "amount": 100000, "orderInfo": "Purchase Lightroom Presets" }
→ Copy paymentUrl từ console log
→ orderId tự động lưu vào collection variable
```

**2.2 Complete Payment:**
1. Mở `paymentUrl` trong browser
2. Nhập thẻ test VNPay:
   - Card: 9704198526191432198
   - Holder: NGUYEN VAN A
   - Date: 07/15
   - OTP: 123456
3. Click "Xác nhận thanh toán"

**2.3 Verify Payment (SPA Flow):**
```
4. VNPay redirect về: http://localhost:3000/payment/return?vnp_xxx=...
5. Frontend extract tất cả vnp_* parameters
6. Frontend call: 1.2 Verify VNPay Payment
7. Backend verify signature và return status
8. Frontend hiển thị success/failure message
```

#### Bước 3: Test PayPal Payment

**3.1 Create Payment:**
```
Collection: Lensor-Payment-API > 2. PayPal Flow
Request: 2.1 Create PayPal Payment
Body: { "amount": 100000, "orderInfo": "Purchase Lightroom Presets Pack" }
→ Copy paymentUrl từ console log
→ orderId và paypalToken tự động lưu
```

**3.2 Complete Payment:**
1. Mở `paymentUrl` trong browser
2. Login với PayPal sandbox:
   - Email: sb-tbt4q47331523@personal.example.com
   - Password: Nd8f=2>X
3. Click "Pay Now"

**3.3 Verify Payment (SPA Flow):**
```
4. PayPal redirect về: http://localhost:3000/payment/return?token=xxx&orderId=yyy
5. Frontend extract token và orderId
6. Frontend call: 2.2 Verify PayPal Payment
7. Backend capture payment và return status
8. Frontend hiển thị success message
```

#### Bước 4: Test Unified Endpoint

```
Collection: Lensor-Payment-API > 3. Unified Endpoint
Request: Create Payment (Unified)
Body: {
  "amount": 150000,
  "paymentChannel": "vnpay",  // hoặc "paypal"
  "orderInfo": "Order #123"
}
→ Tự động chọn payment channel và tạo payment URL
```

#### 🎨 Frontend Implementation Pattern:

**React Example:**
```tsx
// Step 1: Create payment
const createPayment = async (channel: 'vnpay' | 'paypal') => {
  const response = await fetch('http://localhost:3005/payment/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: 100000,
      paymentChannel: channel,
      orderInfo: 'Purchase Presets'
    })
  });
  
  const data = await response.json();
  window.location.href = data.data.paymentUrl; // Redirect to gateway
};

// Step 2: Handle return callback
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  
  // VNPay callback
  if (urlParams.has('vnp_ResponseCode')) {
    const vnpParams = {};
    urlParams.forEach((value, key) => {
      if (key.startsWith('vnp_')) vnpParams[key] = value;
    });
    
    fetch('http://localhost:3005/payment/verify-vnpay', {
      method: 'POST',
      body: JSON.stringify(vnpParams)
    }).then(res => res.json())
      .then(result => {
        if (result.success) navigate('/payment/success');
        else navigate('/payment/failed');
      });
  }
  
  // PayPal callback
  if (urlParams.has('token')) {
    fetch('http://localhost:3005/payment/verify-paypal', {
      method: 'POST',
      body: JSON.stringify({
        token: urlParams.get('token'),
        orderId: urlParams.get('orderId')
      })
    }).then(res => res.json())
      .then(result => {
        if (result.success) navigate('/payment/success');
        else navigate('/payment/failed');
      });
  }
}, []);
```

**📖 Xem thêm:**
- Detailed SPA flow diagrams: Check request descriptions in Postman
- Full frontend examples: See collection documentation
- API contract: Check response schemas in each request

---

### 💰 Test luồng E-commerce hoàn chỉnh (Legacy):

#### 1. Thêm sản phẩm vào giỏ hàng
```
Collection: Lensor_Cart
Request: Add Item to Cart
Set: productId = "uuid-của-sản-phẩm"
```

#### 2. Xem giỏ hàng
```
Collection: Lensor_Cart
Request: Get Cart
→ Copy total amount
```

#### 3. Tạo thanh toán VNPay
```
Collection: Lensor_Payment > VNPay
Request: Create VNPay Payment
Body: { "amount": 100000, "orderInfo": "Test Order" }
→ Copy orderId và paymentUrl
```

#### 4. Mô phỏng callback thành công
```
Collection: Lensor_Payment > VNPay
Request: VNPay Callback (Success)
Set: orderId = "order-id-từ-bước-3"
```

#### 5. Kiểm tra đơn hàng
```
Collection: Lensor_Orders
Request: Get Order by ID
Set: orderId = "order-id-từ-bước-3"
→ Xem status = "completed"
```

### Test tính năng Social (Likes & Comments):

#### 1. Like một bài đăng
```
Collection: Lensor_PostLikes
Request: Like a Post
Set: postId = "uuid-của-post"
```

#### 2. Tạo comment
```
Collection: Lensor_PostComments
Request: Create Comment
Set: postId = "uuid-của-post"
Body: { "content": "Great photo!", "parentId": null }
→ Copy commentId từ response
```

#### 3. Reply vào comment
```
Collection: Lensor_PostComments
Request: Create Reply (Nested Comment)
Set: postId = "uuid-của-post"
     commentId = "id-từ-bước-2"
Body: { "content": "Thank you!", "parentId": "commentId" }
```

### Test Chat:

#### 1. Tạo phòng chat
```
Collection: Lensor_Chat
Request: Create Chat Room
Body: {
  "name": "Photography Discussion",
  "type": "group",
  "participantIds": ["user-uuid-1", "user-uuid-2"]
}
→ Copy roomId
```

#### 2. Xem lịch sử tin nhắn
```
Collection: Lensor_Chat
Request: Get Room Messages
Set: roomId = "id-từ-bước-1"
```

**Lưu ý:** Để gửi tin nhắn realtime, cần kết nối WebSocket. Xem file `test-chat.html` hoặc `TESTING_GUIDE.md`.

### Test Marketplace (Sản phẩm với sellCount & presetFiles): 🆕

#### 1. Xem tất cả sản phẩm
```
Collection: Lensor_Marketplace
Request: Get All Products (Marketplace)
→ Xem sellCount, rating, reviewCount của mỗi sản phẩm
```

#### 2. Tạo sản phẩm preset mới (với files)
```
Collection: Lensor_Marketplace > Products
Request: Create Product (With Files)
→ Upload: image file, imagePairs[0][before], imagePairs[0][after]
→ Điền thông tin: title, price, discount, tags, compatibility, fileFormat, features
→ Copy productId từ response
```

#### 3. Tạo sản phẩm (chỉ JSON)
```
Collection: Lensor_Marketplace > Products
Request: Create Product (JSON Only)
Body: Preset data structure (không upload files)
→ Copy productId
```

#### 4. Xem chi tiết sản phẩm
```
Collection: Lensor_Marketplace
Request: Get Product Details
Set: productId = "id-từ-bước-2-hoặc-3"
→ Xem: sellCount, presetFiles (array), imagePairs, specifications, warranty
```

#### 5. Cập nhật sản phẩm
```
Collection: Lensor_Marketplace > Products
Request: Update Product
Set: productId = "id-của-sản-phẩm"
Body: { "price": 249000, "discount": 50, "features": [...] }
```

#### 6. Tạo review
```
Collection: Lensor_Marketplace > Reviews
Request: Create Product Review
Set: productId = "id-của-sản-phẩm"
Body: { "rating": 5, "comment": "Amazing presets!" }
→ Product rating & reviewCount sẽ tự động cập nhật
```

#### 7. Upload ảnh riêng
```
Collection: Lensor_Marketplace > Products
Request: Upload Product Image
→ Upload file ảnh
→ Nhận: image URL và thumbnail URL
→ Dùng URLs này khi tạo/update product
```

**Lưu ý về presetFiles:**
- Field `presetFiles` là array chứa URLs của file preset (.xmp, .lrtemplate, .dcp)
- Được populate khi user mua và download sản phẩm
- Hiển thị trong product details cho buyer

---

## 🧪 VNPay Sandbox Testing

### Thẻ test VNPay:
```
Card Number: 9704 0000 0000 0018
Card Holder: NGUYEN VAN A
Issue Date: 03/07
OTP: 123456
```

### Response Codes:
- `00` = Thành công
- `01-99` = Thất bại (các mã lỗi khác nhau)

---

## 📊 Dữ liệu mẫu

### UUIDs mẫu cho test:
Bạn cần lấy UUIDs thực tế từ database. Có thể query:

```sql
-- Lấy postId
SELECT id FROM posts LIMIT 1;

-- Lấy productId  
SELECT id FROM products LIMIT 1;

-- Lấy userId
SELECT id FROM profiles LIMIT 1;
```

Hoặc tạo dữ liệu mẫu qua API:

```
POST /posts - Tạo bài đăng mới → lấy postId
POST /products - Tạo sản phẩm mới → lấy productId
```

---

## 🔧 Troubleshooting

### Lỗi 401 Unauthorized
→ Token hết hạn hoặc không hợp lệ. Đăng nhập lại để lấy token mới.

### Lỗi 404 Not Found (cart/orders)
→ Chưa có dữ liệu. Thêm sản phẩm vào cart hoặc tạo order trước.

### VNPay callback không hoạt động
→ Endpoint `/payment/vnpay/callback` là public (không cần token). VNPay sẽ gọi URL này sau khi thanh toán.

### Chat WebSocket không kết nối
→ REST API chỉ để lấy history. Để chat realtime, mở `test-chat.html` trong browser.

---

## 📚 Tài liệu bổ sung

- **API Documentation:** Xem `TASK_T013_COMPLETION_SUMMARY.md`
- **Testing Guide:** Xem `TESTING_GUIDE.md`
- **WebSocket Chat:** Mở `test-chat.html` trong browser

---

## 🎯 Tips

1. **Sử dụng Environment Variables trong Postman:**
   - Tạo một Environment mới (e.g., "Lensor Development")
   - Thêm variables: `baseUrl`, `token`, `userId`, etc.
   - Chọn environment này khi test

2. **Chain requests với Tests:**
   Thêm script vào tab "Tests" để tự động lưu IDs:
   ```javascript
   // Sau khi tạo order, lưu orderId
   var response = pm.response.json();
   pm.collectionVariables.set("orderId", response.data.id);
   ```

3. **Sử dụng Pre-request Scripts:**
   Tự động generate timestamps hoặc random data:
   ```javascript
   pm.collectionVariables.set("timestamp", Date.now());
   ```

---

**Chúc bạn test thành công! 🎉**
