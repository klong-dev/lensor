# Image Metadata Feature Documentation

## 📸 Tổng quan

Tính năng **Image Metadata** tự động trích xuất và lưu trữ toàn bộ thông tin EXIF từ ảnh sản phẩm khi upload. Dữ liệu này giúp:
- Hiển thị thông tin kỹ thuật chuyên nghiệp cho buyer
- Xác thực chất lượng ảnh và thiết bị
- Tìm kiếm và filter theo thông số camera/lens
- Phân tích xu hướng thiết bị của community

---

## 🗄️ Database Schema

### Column: `imageMetadata` (JSONB)

```sql
ALTER TABLE products 
ADD COLUMN "imageMetadata" jsonb;

CREATE INDEX idx_products_image_metadata 
ON products USING gin ("imageMetadata");
```

**Type:** `JSONB` - Cho phép:
- Index và query nhanh
- Flexible schema
- Không cần define trước tất cả fields

---

## 📋 Metadata Fields

### 1️⃣ Basic Image Information

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `width` | number | `6000` | Chiều rộng ảnh (pixels) |
| `height` | number | `4000` | Chiều cao ảnh (pixels) |
| `dimensions` | string | `"6000x4000"` | Kích thước formatted |
| `fileSize` | number | `15728640` | Dung lượng file (bytes) |
| `format` | string | `"JPEG"` | Định dạng ảnh |
| `colorSpace` | string | `"RGB"` | Color space |
| `bitDepth` | number | `24` | Bit depth (8-bit, 16-bit, etc.) |
| `dpi` | number | `300` | Dots per inch |
| `orientation` | number | `1` | Orientation (1-8) |

---

### 2️⃣ Camera Information

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `cameraMake` | string | `"Canon"` | Hãng camera |
| `cameraModel` | string | `"Canon EOS R5"` | Model camera |
| `cameraSerialNumber` | string | `"123456789"` | Serial number camera |

**Use cases:**
- Badge "Shot on Canon EOS R5"
- Filter products by camera brand
- Verify professional equipment

---

### 3️⃣ Lens Information

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `lensMake` | string | `"Canon"` | Hãng lens |
| `lensModel` | string | `"RF 24-70mm F2.8 L IS USM"` | Model lens |
| `lensSerialNumber` | string | `"987654321"` | Serial number lens |
| `focalLength` | string | `"50mm"` | Tiêu cự thực tế |
| `focalLengthIn35mm` | string | `"50mm"` | Tiêu cự tương đương 35mm |

**Use cases:**
- Showcase lens used in preset creation
- Filter by focal length range
- Lens compatibility reference

---

### 4️⃣ Exposure Settings

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `iso` | number | `400` | ISO sensitivity |
| `fStop` | string | `"f/2.8"` | F-number (aperture) |
| `aperture` | string | `"f/2.8"` | Aperture (same as fStop) |
| `shutterSpeed` | string | `"1/200s"` | Shutter speed |
| `exposureTime` | string | `"1/200s"` | Exposure time (same as shutterSpeed) |
| `exposureMode` | string | `"Manual"` | Auto/Manual/Auto bracket |
| `exposureProgram` | string | `"Manual"` | Program AE, Aperture-priority, etc. |
| `exposureBias` | string | `"+0.3 EV"` | Exposure compensation |
| `meteringMode` | string | `"Multi-segment"` | Metering mode |

**Use cases:**
- Educational content (show settings used)
- Filter by shooting style (manual vs auto)
- Technical reference for learners

---

### 5️⃣ Flash & Lighting

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `flash` | string | `"No flash"` | Flash status and mode |
| `flashMode` | string | `"Off"` | Flash mode setting |
| `whiteBalance` | string | `"Auto"` | White balance mode |
| `lightSource` | string | `"Daylight"` | Light source type |

---

### 6️⃣ Focus Settings

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `focusMode` | string | `"AF"` | Autofocus mode |
| `focusDistance` | string | `"2.5m"` | Focus distance |
| `subjectDistance` | string | `"2.50m"` | Distance to subject |
| `subjectDistanceRange` | string | `"Close"` | Macro/Close/Distant |

---

### 7️⃣ Date & Time

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `dateTimeOriginal` | string | `"2025:11:11 10:30:45"` | Original capture time |
| `dateTimeDigitized` | string | `"2025:11:11 10:30:45"` | Digitized time |
| `dateTime` | string | `"2025:11:11 10:30:45"` | Last modified time |
| `timezone` | string | `"GMT+7"` | Timezone |

---

### 8️⃣ Author & Copyright

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `artist` | string | `"John Doe"` | Artist name |
| `author` | string | `"John Doe"` | Author name |
| `copyright` | string | `"Copyright 2025 John Doe"` | Copyright info |

**Use cases:**
- Watermark/attribution display
- Copyright verification
- Author portfolio

---

### 9️⃣ Software & Processing

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `software` | string | `"Adobe Lightroom Classic 13.0"` | Editing software |
| `processingMethod` | string | `"RAW conversion"` | Processing method |

---

### 🔟 GPS Location

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `gpsLatitude` | number | `10.762622` | Latitude |
| `gpsLongitude` | number | `106.660172` | Longitude |
| `gpsAltitude` | number | `10.5` | Altitude (meters) |
| `gpsLocation` | string | `"10.762622, 106.660172"` | Formatted coordinates |

**Use cases:**
- Location-based search
- Map view of shooting locations
- Travel photography showcase

**Privacy note:** ⚠️ Consider stripping GPS for privacy

---

### 1️⃣1️⃣ Image Quality Settings

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `contrast` | string | `"Normal"` | Contrast setting |
| `saturation` | string | `"Normal"` | Saturation setting |
| `sharpness` | string | `"Normal"` | Sharpness setting |
| `brightness` | string | `"5.2"` | Brightness value |
| `gainControl` | string | `"None"` | ISO gain control |
| `digitalZoomRatio` | string | `"1.0x"` | Digital zoom ratio |

---

### 1️⃣2️⃣ Scene Information

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `sceneType` | string | `"Directly photographed"` | Scene type |
| `sceneCaptureType` | string | `"Standard"` | Capture type (Landscape/Portrait/Night) |

---

### 1️⃣3️⃣ RAW Processing (Custom fields)

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `rawProcessing` | string | `"Adobe Camera Raw"` | RAW processor used |
| `toneMapping` | string | `"HDR"` | Tone mapping technique |
| `colorGrading` | string | `"Cinematic teal & orange"` | Color grading style |

---

## 🔧 Implementation

### Python Service (EXIF Extraction)

```python
def extract_exif_data(image_path):
    """Extract comprehensive EXIF metadata from image"""
    with Image.open(image_path) as img:
        metadata = {}
        
        # Basic info
        metadata['width'] = img.width
        metadata['height'] = img.height
        metadata['format'] = img.format
        metadata['colorSpace'] = img.mode
        
        # EXIF data
        exif = img._getexif()
        if exif:
            # Camera
            metadata['cameraMake'] = get_exif_value('Make')
            metadata['cameraModel'] = get_exif_value('Model')
            
            # Lens
            metadata['lensModel'] = get_exif_value('LensModel')
            metadata['focalLength'] = format_focal_length(get_exif_value('FocalLength'))
            
            # Exposure
            metadata['iso'] = get_exif_value('ISOSpeedRatings')
            metadata['fStop'] = format_f_number(get_exif_value('FNumber'))
            metadata['shutterSpeed'] = format_shutter_speed(get_exif_value('ExposureTime'))
            
            # ... (more fields)
        
        return metadata
```

### NestJS Service (Storage)

```typescript
// In products.controller.ts
const result = await this.imageProcessingService.processSingleImage(
  productImage,
  user.userId,
);

createProductDto.image = result.original;
createProductDto.thumbnail = result.thumbnail;
createProductDto.imageMetadata = result.metadata; // ✅ Store metadata
```

### TypeORM Entity

```typescript
@Entity('products')
export class Product {
  // ...
  
  @Column({ type: 'jsonb', nullable: true })
  imageMetadata: {
    width?: number;
    height?: number;
    cameraMake?: string;
    cameraModel?: string;
    lensModel?: string;
    iso?: number;
    fStop?: string;
    shutterSpeed?: string;
    // ... (all fields)
  };
}
```

---

## 🎨 Frontend Display Examples

### 1. Product Details Card

```tsx
<MetadataCard>
  <h3>📸 Technical Specifications</h3>
  
  <Section>
    <Label>Camera</Label>
    <Value>{metadata.cameraMake} {metadata.cameraModel}</Value>
  </Section>
  
  <Section>
    <Label>Lens</Label>
    <Value>{metadata.lensModel}</Value>
  </Section>
  
  <Section>
    <Label>Exposure</Label>
    <Value>
      ISO {metadata.iso} • {metadata.fStop} • {metadata.shutterSpeed}
    </Value>
  </Section>
  
  <Section>
    <Label>Resolution</Label>
    <Value>{metadata.dimensions} @ {metadata.dpi} DPI</Value>
  </Section>
</MetadataCard>
```

### 2. Compact Badge

```tsx
<TechBadge>
  📷 Shot on {metadata.cameraModel} • {metadata.lensModel} • {metadata.focalLength}
</TechBadge>
```

### 3. Filterable Tags

```tsx
<FilterTags>
  <Tag onClick={() => filterByCameraMake(metadata.cameraMake)}>
    {metadata.cameraMake}
  </Tag>
  <Tag onClick={() => filterByISO(metadata.iso)}>
    ISO {metadata.iso}
  </Tag>
  <Tag onClick={() => filterByFocalLength(metadata.focalLength)}>
    {metadata.focalLength}
  </Tag>
</FilterTags>
```

### 4. Map View (GPS)

```tsx
{metadata.gpsLocation && (
  <MapView
    center={[metadata.gpsLatitude, metadata.gpsLongitude]}
    zoom={15}
  >
    <Marker position={[metadata.gpsLatitude, metadata.gpsLongitude]} />
  </MapView>
)}
```

---

## 🔍 Query Examples

### PostgreSQL JSONB Queries

```sql
-- Find products shot with Canon cameras
SELECT * FROM products 
WHERE "imageMetadata"->>'cameraMake' = 'Canon';

-- Find products with ISO >= 1600 (low light)
SELECT * FROM products 
WHERE CAST("imageMetadata"->>'iso' AS INTEGER) >= 1600;

-- Find products shot with 50mm lens
SELECT * FROM products 
WHERE "imageMetadata"->>'focalLength' LIKE '50mm%';

-- Find products with GPS location
SELECT * FROM products 
WHERE "imageMetadata"->>'gpsLocation' IS NOT NULL;

-- Find Canon R5 + RF 24-70mm combo
SELECT * FROM products 
WHERE "imageMetadata"->>'cameraModel' = 'Canon EOS R5'
  AND "imageMetadata"->>'lensModel' LIKE 'RF 24-70mm%';

-- Find high-resolution images (>= 6000px width)
SELECT * FROM products 
WHERE CAST("imageMetadata"->>'width' AS INTEGER) >= 6000;
```

### TypeORM Query Builder

```typescript
// Find products by camera make
const products = await this.productRepository
  .createQueryBuilder('product')
  .where("product.imageMetadata->>'cameraMake' = :make", { make: 'Canon' })
  .getMany();

// Find products by ISO range
const products = await this.productRepository
  .createQueryBuilder('product')
  .where("CAST(product.imageMetadata->>'iso' AS INTEGER) BETWEEN :min AND :max", 
    { min: 400, max: 1600 })
  .getMany();

// Find products with specific lens
const products = await this.productRepository
  .createQueryBuilder('product')
  .where("product.imageMetadata->>'lensModel' ILIKE :lens", 
    { lens: '%24-70mm%' })
  .getMany();
```

---

## 📊 Analytics Use Cases

### 1. Popular Equipment Stats

```typescript
async getPopularCameras() {
  const result = await this.productRepository
    .createQueryBuilder('product')
    .select("product.imageMetadata->>'cameraMake'", 'cameraMake')
    .addSelect("product.imageMetadata->>'cameraModel'", 'cameraModel')
    .addSelect('COUNT(*)', 'count')
    .where("product.imageMetadata->>'cameraModel' IS NOT NULL")
    .groupBy("product.imageMetadata->>'cameraMake'")
    .addGroupBy("product.imageMetadata->>'cameraModel'")
    .orderBy('count', 'DESC')
    .limit(10)
    .getRawMany();
  
  return result;
  // Output: [
  //   { cameraMake: "Canon", cameraModel: "EOS R5", count: "152" },
  //   { cameraMake: "Sony", cameraModel: "A7R IV", count: "143" },
  //   ...
  // ]
}
```

### 2. ISO Distribution

```typescript
async getISODistribution() {
  const products = await this.productRepository.find({
    where: { deletedAt: null },
    select: ['imageMetadata']
  });
  
  const isoGroups = {
    'Low (100-400)': 0,
    'Medium (500-1600)': 0,
    'High (1601-6400)': 0,
    'Extreme (6400+)': 0
  };
  
  products.forEach(p => {
    const iso = p.imageMetadata?.iso;
    if (!iso) return;
    
    if (iso <= 400) isoGroups['Low (100-400)']++;
    else if (iso <= 1600) isoGroups['Medium (500-1600)']++;
    else if (iso <= 6400) isoGroups['High (1601-6400)']++;
    else isoGroups['Extreme (6400+)']++;
  });
  
  return isoGroups;
}
```

### 3. Shooting Location Heatmap

```typescript
async getShootingLocations() {
  const products = await this.productRepository
    .createQueryBuilder('product')
    .select([
      "product.imageMetadata->>'gpsLatitude' as latitude",
      "product.imageMetadata->>'gpsLongitude' as longitude",
      "product.title as title"
    ])
    .where("product.imageMetadata->>'gpsLocation' IS NOT NULL")
    .getRawMany();
  
  return products.map(p => ({
    lat: parseFloat(p.latitude),
    lng: parseFloat(p.longitude),
    title: p.title
  }));
}
```

---

## 🎯 Best Practices

### ✅ DO:

1. **Strip sensitive GPS data** if privacy concern:
   ```typescript
   if (createProductDto.imageMetadata?.gpsLocation) {
     delete createProductDto.imageMetadata.gpsLocation;
     delete createProductDto.imageMetadata.gpsLatitude;
     delete createProductDto.imageMetadata.gpsLongitude;
   }
   ```

2. **Index frequently queried fields**:
   ```sql
   CREATE INDEX idx_camera_make ON products 
   USING btree ((imageMetadata->>'cameraMake'));
   ```

3. **Validate metadata completeness**:
   ```typescript
   const hasCompleteMetadata = 
     metadata.cameraMake && 
     metadata.cameraModel && 
     metadata.iso && 
     metadata.fStop && 
     metadata.shutterSpeed;
   ```

4. **Cache expensive queries**:
   ```typescript
   @Cacheable('popular-cameras', 3600) // 1 hour
   async getPopularCameras() { ... }
   ```

### ❌ DON'T:

1. Don't expose raw EXIF in public API (may contain sensitive info)
2. Don't trust client-provided metadata (always extract server-side)
3. Don't fail product creation if metadata extraction fails
4. Don't store duplicate data (width/height already in basic fields)

---

## 🐛 Troubleshooting

### Issue 1: Metadata not extracted

**Symptoms:** `imageMetadata` is `null` or empty

**Solutions:**
```bash
# Check Python service is running
curl http://localhost:5000/health

# Check PIL/Pillow installed
pip list | grep -i pillow

# Test EXIF extraction manually
python -c "from PIL import Image; print(Image.open('test.jpg')._getexif())"
```

### Issue 2: Missing fields

**Cause:** Image doesn't have that EXIF tag

**Solution:** Handle gracefully
```typescript
const cameraInfo = metadata.cameraModel 
  ? `${metadata.cameraMake} ${metadata.cameraModel}`
  : 'Unknown Camera';
```

### Issue 3: RAW files not processed

**Cause:** `rawpy` not installed

**Solution:**
```bash
cd image-service
pip install rawpy imageio
```

---

## 📈 Future Enhancements

1. **AI-based metadata enrichment**
   - Auto-detect scene type (landscape/portrait/night)
   - Subject recognition (person/nature/urban)
   - Quality scoring

2. **Metadata comparison tool**
   - Compare EXIF between before/after images
   - Show settings differences in preset application

3. **Smart recommendations**
   - "Users who shoot with Canon R5 also bought..."
   - ISO-based preset suggestions (low light presets for high ISO)

4. **Export metadata**
   - Generate camera report PDF
   - EXIF table export to CSV
   - Share equipment setup as image

---

## 📚 References

- [EXIF Standard 2.32](https://www.exif.org/Exif2-2.PDF)
- [PIL Image Module](https://pillow.readthedocs.io/en/stable/reference/Image.html)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [TypeORM JSONB Support](https://typeorm.io/entities#column-types-for-postgres)

---

**Created:** November 11, 2025  
**Version:** 1.0.0  
**Status:** ✅ Implemented
