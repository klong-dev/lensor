-- Add imageMetadata column to products table
-- This column stores comprehensive EXIF metadata extracted from product images

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS "imageMetadata" jsonb;

-- Add index for better query performance on metadata fields
CREATE INDEX IF NOT EXISTS idx_products_image_metadata 
ON products USING gin ("imageMetadata");

-- Add comments
COMMENT ON COLUMN products."imageMetadata" IS 'Comprehensive EXIF metadata from product image including camera, lens, exposure settings, GPS, and more';

-- Example imageMetadata structure:
-- {
--   "width": 6000,
--   "height": 4000,
--   "dimensions": "6000x4000",
--   "fileSize": 15728640,
--   "format": "JPEG",
--   "colorSpace": "RGB",
--   "bitDepth": 24,
--   "dpi": 300,
--   "orientation": 1,
--   "cameraMake": "Canon",
--   "cameraModel": "Canon EOS R5",
--   "cameraSerialNumber": "123456789",
--   "lensMake": "Canon",
--   "lensModel": "RF 24-70mm F2.8 L IS USM",
--   "lensSerialNumber": "987654321",
--   "focalLength": "50mm",
--   "focalLengthIn35mm": "50mm",
--   "iso": 400,
--   "fStop": "f/2.8",
--   "aperture": "f/2.8",
--   "shutterSpeed": "1/200s",
--   "exposureTime": "1/200s",
--   "exposureMode": "Manual",
--   "exposureProgram": "Manual",
--   "exposureBias": "+0.3 EV",
--   "meteringMode": "Multi-segment",
--   "flash": "No flash",
--   "whiteBalance": "Auto",
--   "lightSource": "Daylight",
--   "focusMode": "AF",
--   "dateTimeOriginal": "2025:11:11 10:30:45",
--   "dateTimeDigitized": "2025:11:11 10:30:45",
--   "dateTime": "2025:11:11 10:30:45",
--   "artist": "John Doe",
--   "author": "John Doe",
--   "copyright": "Copyright 2025 John Doe",
--   "software": "Adobe Photoshop Lightroom Classic 13.0",
--   "gpsLatitude": 10.762622,
--   "gpsLongitude": 106.660172,
--   "gpsAltitude": 10.5,
--   "gpsLocation": "10.762622, 106.660172",
--   "contrast": "Normal",
--   "saturation": "Normal",
--   "sharpness": "Normal",
--   "brightness": "5.2",
--   "sceneCaptureType": "Standard"
-- }
