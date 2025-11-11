# Marketplace Testing Guide

## Quick Test Scenarios for Postman

### 🎯 Scenario 1: Create and Sell a Preset Product

**Goal:** Tạo một preset product, upload files, và simulate bán hàng để test sellCount

#### Step 1: Create Product
```
Collection: Lensor_Marketplace
Request: Create Product (JSON Only)

Body:
{
  "title": "Cinematic Moody Preset Pack",
  "description": "Professional cinematic presets for lifestyle and travel photography. 25 unique presets with warm and cool tones.",
  "price": 199000,
  "originalPrice": 299000,
  "discount": 33,
  "category": "Presets",
  "tags": ["moody", "cinematic", "film", "lifestyle", "travel"],
  "compatibility": ["Lightroom CC", "Lightroom Classic", "Mobile App"],
  "fileFormat": ".xmp, .lrtemplate",
  "fileSize": "12 MB",
  "includesCount": 25,
  "features": [
    "25 unique presets",
    "Warm and cool tones",
    "Film grain effect",
    "Mobile compatible",
    "Video installation guide"
  ],
  "specifications": {
    "adjustments": ["Tone Curve", "HSL", "Split Toning", "Grain"],
    "bestFor": ["Travel", "Lifestyle", "Fashion"],
    "difficulty": "Beginner"
  },
  "warranty": {
    "duration": "Lifetime",
    "coverage": "Free updates and bug fixes",
    "terms": ["14-day money back", "Email support"]
  }
}

Expected Response:
{
  "data": {
    "id": "{{productId}}",
    "title": "Cinematic Moody Preset Pack",
    "sellCount": 0,  ← Initial value
    "rating": 0,
    "reviewCount": 0,
    ...
  }
}

→ Copy productId to variable
```

#### Step 2: Add Preset Files (Simulate upload to storage)
```
Collection: Lensor_Marketplace
Request: Update Product

Set: productId = "id-from-step-1"

Body:
{
  "presetFiles": [
    "https://storage.lensor.com/presets/moody-warm-01.xmp",
    "https://storage.lensor.com/presets/moody-cool-02.xmp",
    "https://storage.lensor.com/presets/cinematic-teal-03.xmp",
    "https://storage.lensor.com/presets/film-grain-04.lrtemplate"
  ]
}

Expected Response:
{
  "data": {
    "id": "{{productId}}",
    "presetFiles": [
      "https://storage.lensor.com/presets/moody-warm-01.xmp",
      "https://storage.lensor.com/presets/moody-cool-02.xmp",
      ...
    ]
  }
}
```

#### Step 3: View in Marketplace (Public)
```
Collection: Lensor_Marketplace
Request: Get All Products (Marketplace)

Expected Response:
{
  "data": [
    {
      "id": "{{productId}}",
      "title": "Cinematic Moody Preset Pack",
      "price": 199000,
      "sellCount": 0,
      "rating": 0,
      "reviewCount": 0,
      "presetFiles": undefined  ← Not visible in public listing
    },
    ...
  ]
}
```

#### Step 4: Simulate Purchase
```
Collection: Lensor_Cart
Request: Add to Cart
Body: { "productId": "{{productId}}", "quantity": 1 }

→ Then follow payment flow

Collection: Lensor_Payment
Request: Create VNPay Payment
Body: { 
  "amount": 199000, 
  "orderInfo": "Purchase Cinematic Moody Preset Pack" 
}

→ Simulate callback success

Collection: Lensor_Payment
Request: VNPay Callback (Success)
Set: orderId = "order-id-from-payment"

→ This should increment sellCount
```

#### Step 5: Verify sellCount Updated
```
Collection: Lensor_Marketplace
Request: Get Product Details
Set: productId = "{{productId}}"

Expected Response:
{
  "data": {
    "id": "{{productId}}",
    "title": "Cinematic Moody Preset Pack",
    "sellCount": 1,  ← Incremented!
    "isPurchased": true,
    "presetFiles": [  ← Now visible because purchased
      "https://storage.lensor.com/presets/moody-warm-01.xmp",
      "https://storage.lensor.com/presets/moody-cool-02.xmp",
      ...
    ]
  }
}
```

#### Step 6: Add Review (Updates rating)
```
Collection: Lensor_Marketplace
Request: Create Product Review
Set: productId = "{{productId}}"

Body:
{
  "rating": 5,
  "comment": "Amazing presets! Perfect for my travel photography. The cinematic tones are exactly what I needed."
}

Expected Response:
{
  "data": {
    "id": "review-uuid",
    "productId": "{{productId}}",
    "rating": 5,
    "comment": "..."
  }
}

→ Product now has:
- rating: 5.0
- reviewCount: 1
```

---

### 🎯 Scenario 2: Upload Product with Images

**Goal:** Test multipart form upload với product images và imagePairs

#### Step 1: Prepare Files
```
Required files:
- product-cover.jpg (main product image)
- before1.jpg, after1.jpg (first comparison)
- before2.jpg, after2.jpg (second comparison)
```

#### Step 2: Create Product with Files
```
Collection: Lensor_Marketplace
Request: Create Product (With Files)

Enable file uploads in Body > form-data:
- image: [Select product-cover.jpg]
- imagePairs[0][before]: [Select before1.jpg]
- imagePairs[0][after]: [Select after1.jpg]
- imagePairs[1][before]: [Select before2.jpg]
- imagePairs[1][after]: [Select after2.jpg]

Fill form fields:
- title: "Wedding Lightroom Presets"
- description: "Professional wedding presets..."
- price: 399000
- originalPrice: 599000
- discount: 33
- category: "Presets"
- tags: ["wedding", "portrait", "elegant"]
- ... (other fields)

Expected Response:
{
  "data": {
    "id": "{{productId}}",
    "image": "https://storage.lensor.com/products/wedding-cover.jpg",
    "thumbnail": "https://storage.lensor.com/products/wedding-cover-thumb.jpg",
    "imagePairs": [
      {
        "before": "https://storage.lensor.com/products/before1.jpg",
        "after": "https://storage.lensor.com/products/after1.jpg"
      },
      {
        "before": "https://storage.lensor.com/products/before2.jpg",
        "after": "https://storage.lensor.com/products/after2.jpg"
      }
    ]
  }
}
```

---

### 🎯 Scenario 3: Best-Selling Products Query

**Goal:** Get top-selling products sorted by sellCount

#### Manual Test (Need to implement sorting in controller)
```
Collection: Lensor_Marketplace
Request: Get All Products (Marketplace)

Current Response:
{
  "data": [
    { "id": "1", "title": "Product A", "sellCount": 156 },
    { "id": "2", "title": "Product B", "sellCount": 89 },
    { "id": "3", "title": "Product C", "sellCount": 234 },
    ...
  ]
}

→ Sort manually or add query param:
GET /marketplaces?sort=sellCount&order=desc&limit=10
```

#### Expected Output (Top 3):
```json
{
  "data": [
    {
      "id": "3",
      "title": "Product C",
      "sellCount": 234,
      "badge": "🔥 Best Seller"
    },
    {
      "id": "1", 
      "title": "Product A",
      "sellCount": 156
    },
    {
      "id": "2",
      "title": "Product B", 
      "sellCount": 89
    }
  ]
}
```

---

### 🎯 Scenario 4: Access Control Test

**Goal:** Verify presetFiles chỉ visible cho buyers

#### Test 1: View product BEFORE purchase
```
Collection: Lensor_Marketplace
Request: Get Product Details
Set: productId = "{{productId}}"
Authorization: Bearer {{token}} (user chưa mua)

Expected Response:
{
  "data": {
    "id": "{{productId}}",
    "title": "...",
    "isPurchased": false,
    "presetFiles": undefined  ← Should be hidden
  }
}
```

#### Test 2: View product AFTER purchase
```
→ Complete payment flow first
→ Then call same endpoint

Expected Response:
{
  "data": {
    "id": "{{productId}}",
    "title": "...",
    "isPurchased": true,
    "presetFiles": [  ← Now visible
      "https://storage.lensor.com/presets/preset1.xmp",
      ...
    ]
  }
}
```

#### Test 3: View product as OWNER
```
Collection: Lensor_Marketplace
Request: Get Product Details
Set: productId = "{{productId}}"
Authorization: Bearer {{ownerToken}}

Expected Response:
{
  "data": {
    "id": "{{productId}}",
    "title": "...",
    "isPurchased": false,  ← Owner hasn't purchased
    "isOwner": true,
    "presetFiles": [  ← Visible because owner
      "https://storage.lensor.com/presets/preset1.xmp",
      ...
    ]
  }
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: sellCount không tăng sau payment
**Cause:** VNPay callback failed hoặc order status không đổi thành "completed"

**Debug:**
```
1. Check order status:
   GET /orders/:orderId
   → Verify status = "completed"

2. Check VNPay callback log:
   → Look for: "Payment callback received with code: 00"

3. Manually trigger increment (dev only):
   PATCH /products/:productId
   Body: { "sellCount": currentCount + 1 }
```

### Issue 2: presetFiles luôn undefined
**Cause:** User chưa mua product hoặc purchase check failed

**Debug:**
```
1. Check orders:
   GET /orders
   → Find order with items containing productId

2. Verify order status:
   → Must be "completed", not "pending"

3. Check user authentication:
   → Verify JWT token valid
   → Verify userId matches order buyer
```

### Issue 3: imagePairs upload failed
**Cause:** File too large hoặc Python image service offline

**Debug:**
```
1. Check file size:
   → Max 10MB per file (configurable in multer.config.ts)

2. Check Python service:
   curl http://localhost:5000/health
   → Should return 200 OK

3. Check logs:
   → Look for: "Error processing image"
```

---

## 📊 Test Data Examples

### Sample Product 1: Portrait Presets
```json
{
  "title": "Professional Portrait Presets",
  "description": "Flattering skin tones, soft lighting effects",
  "price": 249000,
  "category": "Presets",
  "tags": ["portrait", "beauty", "professional"],
  "includesCount": 30,
  "presetFiles": [
    "https://example.com/portrait-soft.xmp",
    "https://example.com/portrait-dramatic.xmp"
  ]
}
```

### Sample Product 2: Landscape Presets
```json
{
  "title": "Epic Landscape Collection",
  "description": "Vibrant skies, enhanced details",
  "price": 199000,
  "category": "Presets",
  "tags": ["landscape", "nature", "outdoor"],
  "includesCount": 20,
  "presetFiles": [
    "https://example.com/landscape-sunset.xmp",
    "https://example.com/landscape-forest.xmp"
  ]
}
```

---

## ✅ Checklist

Before marking as complete:

- [ ] Product creation works (with and without files)
- [ ] sellCount increments on successful payment
- [ ] presetFiles visible only after purchase or for owner
- [ ] imagePairs display correctly
- [ ] Reviews update product rating and reviewCount
- [ ] Marketplace listing shows all products
- [ ] Product details return full specifications
- [ ] Access control working (buyers vs non-buyers)
- [ ] File uploads processed by Python image service
- [ ] Soft delete works (deletedAt timestamp)

---

**Happy Testing! 🚀**
