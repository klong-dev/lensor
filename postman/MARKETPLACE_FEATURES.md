# Marketplace Features Documentation

## 🆕 Các tính năng mới trong Task T013

### 1. **sellCount** (Số lượng đã bán)

**Mô tả:** Đếm số lần sản phẩm được mua thành công.

**Type:** `INTEGER` (mặc định: 0)

**Cập nhật tự động:**
- Tăng lên khi thanh toán thành công qua VNPay callback
- Tăng lên khi order có status = `completed`

**Hiển thị:**
```json
{
  "id": "product-uuid",
  "title": "Professional Lightroom Preset Bundle",
  "price": 299000,
  "sellCount": 156,
  "rating": 4.8,
  "reviewCount": 42
}
```

**Use cases:**
- Hiển thị "Best Seller" badge cho products có sellCount > 100
- Sắp xếp products theo độ phổ biến
- Thống kê doanh thu: `totalRevenue = price * sellCount`

---

### 2. **presetFiles** (File preset đính kèm)

**Mô tả:** Mảng chứa URLs của các file preset mà buyer nhận được sau khi mua.

**Type:** `TEXT[]` (array of strings)

**Supported file formats:**
- `.xmp` - Lightroom Preset (XML-based)
- `.lrtemplate` - Lightroom Classic Preset
- `.dcp` - DNG Camera Profile

**Cấu trúc:**
```json
{
  "presetFiles": [
    "https://storage.lensor.com/presets/user123/moody-portrait.xmp",
    "https://storage.lensor.com/presets/user123/warm-sunset.xmp",
    "https://storage.lensor.com/presets/user123/cinematic-teal.lrtemplate",
    "https://storage.lensor.com/presets/user123/fuji-film-profile.dcp"
  ]
}
```

**Workflow:**

1. **Seller uploads product:**
   ```
   POST /products
   - Upload product cover image
   - Upload imagePairs (before/after examples)
   - Metadata: title, price, description, compatibility
   - presetFiles = [] (empty ban đầu)
   ```

2. **Seller adds preset files (sau khi product được tạo):**
   ```
   PATCH /products/:id
   Body: {
     "presetFiles": [
       "https://storage.lensor.com/presets/moody-pack.xmp",
       "https://storage.lensor.com/presets/warm-pack.xmp"
     ]
   }
   ```

3. **Buyer mua product:**
   ```
   POST /cart/add → POST /payment/vnpay/create → Callback success
   → Order created with status = "completed"
   → sellCount tăng lên
   ```

4. **Buyer download preset files:**
   ```
   GET /products/:id
   → Response includes presetFiles array (chỉ hiển thị nếu user đã mua)
   → Frontend tạo download links cho từng file
   ```

**Security considerations:**
- ❌ Không trả về `presetFiles` trong public marketplace listing
- ✅ Chỉ trả về `presetFiles` khi:
  - User là owner của product, HOẶC
  - User đã mua product (check qua orders table)

**Example response (đã mua):**
```json
{
  "data": {
    "id": "product-uuid",
    "title": "Moody Preset Pack",
    "price": 199000,
    "sellCount": 89,
    "isPurchased": true,
    "presetFiles": [
      "https://storage.lensor.com/presets/moody-01.xmp",
      "https://storage.lensor.com/presets/moody-02.xmp",
      "https://storage.lensor.com/presets/moody-03.xmp"
    ],
    "downloadInstructions": "Import these .xmp files into Lightroom Classic or CC"
  }
}
```

**Example response (chưa mua):**
```json
{
  "data": {
    "id": "product-uuid",
    "title": "Moody Preset Pack",
    "price": 199000,
    "sellCount": 89,
    "isPurchased": false,
    "includesCount": 25,
    "fileFormat": ".xmp",
    "imagePairs": [
      { "before": "url1", "after": "url2" }
    ]
  }
}
```

---

### 3. **imagePairs** (Ảnh Before/After)

**Mô tả:** Mảng chứa cặp ảnh before/after để showcase hiệu quả của preset.

**Type:** `JSON[]`

**Cấu trúc:**
```json
{
  "imagePairs": [
    {
      "before": "https://storage.lensor.com/images/before1.jpg",
      "after": "https://storage.lensor.com/images/after1.jpg"
    },
    {
      "before": "https://storage.lensor.com/images/before2.jpg",
      "after": "https://storage.lensor.com/images/after2.jpg"
    }
  ]
}
```

**Upload workflow:**
```
POST /products
Content-Type: multipart/form-data

Form fields:
- image: [product cover photo]
- imagePairs[0][before]: [file]
- imagePairs[0][after]: [file]
- imagePairs[1][before]: [file]
- imagePairs[1][after]: [file]
- title: "..."
- description: "..."
- price: 299000
```

**Frontend display:**
- Slider comparison (before ← → after)
- Side-by-side view
- Animated transitions

---

## 🔄 Complete Purchase Flow

### Step-by-step với sellCount update:

1. **Browse marketplace:**
   ```
   GET /marketplaces
   → Returns products với sellCount visible
   ```

2. **View product details:**
   ```
   GET /products/:id
   → Returns full info, imagePairs, specifications
   → presetFiles HIDDEN (chưa mua)
   ```

3. **Add to cart:**
   ```
   POST /cart/add
   Body: { "productId": "uuid", "quantity": 1 }
   ```

4. **Checkout:**
   ```
   POST /payment/vnpay/create
   Body: { "amount": 299000, "orderDescription": "..." }
   → Redirect to VNPay
   ```

5. **Payment success callback:**
   ```
   GET /payment/vnpay/callback?vnp_ResponseCode=00&...
   → Order status = "completed"
   → Product.sellCount += 1 ✅
   → Cart cleared
   ```

6. **Download purchased presets:**
   ```
   GET /products/:id
   → Check: User has purchased (query orders table)
   → Response includes presetFiles array ✅
   → Frontend renders download buttons
   ```

---

## 📊 Database Schema Changes

### Products Table Updates:

```sql
ALTER TABLE products 
ADD COLUMN sellCount INTEGER DEFAULT 0,
ADD COLUMN presetFiles TEXT[];

-- Index for performance
CREATE INDEX idx_products_sellcount ON products(sellCount DESC);

-- Trigger to increment sellCount when order completed
CREATE OR REPLACE FUNCTION increment_product_sell_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE products 
    SET sellCount = sellCount + 1 
    WHERE id IN (
      SELECT value->>'productId' 
      FROM json_array_elements(NEW.items::json)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_completed_increment_sellcount
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION increment_product_sell_count();
```

---

## 🎯 API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/marketplaces` | GET | Public | List all products (sellCount visible) |
| `/products` | GET | Public | Same as marketplace |
| `/products/:id` | GET | Public | Product details (presetFiles conditional) |
| `/products` | POST | JWT | Create product (upload images) |
| `/products/:id` | PATCH | JWT | Update product (add presetFiles) |
| `/products/:id` | DELETE | JWT | Soft delete product |
| `/products/upload-image` | POST | JWT | Upload product image separately |
| `/products/:id/reviews` | POST | JWT | Create review (updates rating) |

---

## 🧪 Testing Scenarios

### Scenario 1: Seller creates preset product
```bash
# 1. Upload product images first
POST /products/upload-image
→ Get image & thumbnail URLs

# 2. Create product with imagePairs
POST /products
Body: {
  "title": "Moody Film Preset Pack",
  "price": 199000,
  "image": "url-from-step-1",
  "imagePairs": [...],
  "presetFiles": [],  # Empty initially
  ...
}

# 3. Upload preset files to storage (external)
# Use AWS S3, Supabase Storage, etc.

# 4. Update product with preset file URLs
PATCH /products/:id
Body: {
  "presetFiles": [
    "https://storage.../preset1.xmp",
    "https://storage.../preset2.xmp"
  ]
}
```

### Scenario 2: Buyer purchases and downloads
```bash
# 1. Add to cart
POST /cart/add
Body: { "productId": "uuid", "quantity": 1 }

# 2. Create payment
POST /payment/vnpay/create
Body: { "amount": 199000, "orderInfo": "..." }

# 3. Complete payment via VNPay redirect
# → Callback increments sellCount

# 4. View purchased product
GET /products/:id
→ Response now includes presetFiles array

# 5. Download files
→ Frontend generates download links from presetFiles URLs
```

### Scenario 3: Check best-selling products
```bash
# Query products sorted by sellCount
GET /marketplaces?sort=sellCount&order=desc&limit=10

Response:
{
  "data": [
    { "id": "1", "title": "Top Preset Pack", "sellCount": 523 },
    { "id": "2", "title": "Popular Preset", "sellCount": 412 },
    ...
  ]
}
```

---

## 💡 Best Practices

### For Sellers:
1. ✅ Upload 3-5 high-quality imagePairs showcasing different scenarios
2. ✅ Provide detailed compatibility information
3. ✅ Include installation guide in description
4. ✅ Test presetFiles before uploading to ensure they work
5. ✅ Use descriptive filenames for presetFiles (e.g., `moody-portrait-v2.xmp`)

### For Buyers:
1. ✅ Check sellCount và reviews before purchasing
2. ✅ View all imagePairs to understand preset styles
3. ✅ Verify compatibility with your Lightroom version
4. ✅ Download presetFiles immediately after purchase
5. ✅ Leave review after testing presets

### For Developers:
1. ✅ Validate file formats (.xmp, .lrtemplate, .dcp only)
2. ✅ Implement access control for presetFiles (purchase check)
3. ✅ Add download tracking/analytics
4. ✅ Consider adding watermarks to imagePairs
5. ✅ Implement preset file versioning (v1, v2, etc.)

---

## 🔒 Security Notes

### PresetFiles Access Control:

```typescript
// In products.service.ts findOne()
async findOne(id: string, currentUserId?: string) {
  const product = await this.productRepo.findOne({ where: { id } });
  
  // Check if user has purchased this product
  const hasPurchased = currentUserId 
    ? await this.checkUserPurchase(currentUserId, id)
    : false;
  
  // Check if user is the owner
  const isOwner = currentUserId === product.userId;
  
  return {
    ...product,
    // Only include presetFiles if user has access
    presetFiles: (hasPurchased || isOwner) ? product.presetFiles : undefined,
    isPurchased: hasPurchased,
  };
}
```

### Rate Limiting:
- Limit preset file downloads to prevent abuse
- Track download count per user per product
- Implement daily download limits (e.g., 10 downloads/day per product)

---

## 📈 Analytics & Reporting

### Seller Dashboard Metrics:
```typescript
interface SellerStats {
  totalProducts: number;
  totalSales: number;        // Sum of all sellCounts
  totalRevenue: number;      // Sum of (price * sellCount)
  averageRating: number;     // Across all products
  topSellingProduct: {
    id: string;
    title: string;
    sellCount: number;
  };
}
```

### Marketplace Insights:
- Most popular preset categories
- Average sellCount by price range
- Conversion rate (views → purchases)
- Top-rated vs best-selling comparison

---

## 🎨 Frontend Integration Examples

### Display Product Card with sellCount:
```tsx
<ProductCard>
  <Image src={product.thumbnail} />
  <Title>{product.title}</Title>
  <Price>{formatCurrency(product.price)}</Price>
  <Stats>
    <Rating value={product.rating} /> ({product.reviewCount})
    <Badge>🔥 {product.sellCount} sold</Badge>
  </Stats>
</ProductCard>
```

### Download Presets UI:
```tsx
{product.isPurchased && (
  <DownloadSection>
    <h3>Download Your Presets</h3>
    {product.presetFiles.map(url => (
      <DownloadButton 
        key={url} 
        href={url}
        download
      >
        📥 {extractFilename(url)}
      </DownloadButton>
    ))}
  </DownloadSection>
)}
```

---

## 📞 Support

Nếu có vấn đề với:
- **sellCount không tăng:** Check order status và VNPay callback
- **presetFiles không hiển thị:** Verify purchase trong orders table
- **imagePairs upload failed:** Check file size limits và Python image service
- **Download links broken:** Validate storage URLs và expiry times

---

**Last Updated:** November 11, 2025  
**Version:** 1.0.0  
**Related:** Task T013 - Marketplace Enhancements
