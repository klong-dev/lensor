-- Add thumbnail column to products table
-- Date: 2025-10-27

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS thumbnail VARCHAR(500);

COMMENT ON COLUMN products.thumbnail IS 'Thumbnail image URL (320px height, auto width)';
