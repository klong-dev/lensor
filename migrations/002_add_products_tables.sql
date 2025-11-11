-- Migration: Add Products and Product Reviews tables
-- Date: 2025-10-27

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  "originalPrice" DECIMAL(10, 2),
  discount INT DEFAULT 0,
  image VARCHAR(500),
  "imagePairs" TEXT,
  rating DECIMAL(2, 1) DEFAULT 0,
  "reviewCount" INT DEFAULT 0,
  downloads INT DEFAULT 0,
  category VARCHAR(100) NOT NULL,
  tags TEXT,
  compatibility TEXT,
  "fileFormat" VARCHAR(50),
  "fileSize" VARCHAR(50),
  "includesCount" INT DEFAULT 0,
  features TEXT,
  specifications TEXT,
  warranty TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "deletedAt" TIMESTAMP
);

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "productId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "userName" VARCHAR(255) NOT NULL,
  "userAvatar" VARCHAR(500),
  rating DECIMAL(2, 1) DEFAULT 5.0,
  comment TEXT,
  helpful INT DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "deletedAt" TIMESTAMP,
  CONSTRAINT fk_product FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products("userId");
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products("deletedAt");
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews("productId");
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews("userId");
CREATE INDEX IF NOT EXISTS idx_product_reviews_deleted_at ON product_reviews("deletedAt");

-- Add trigger to update updatedAt timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample data (optional)
-- INSERT INTO products (
--   "userId",
--   title,
--   description,
--   price,
--   "originalPrice",
--   discount,
--   image,
--   category,
--   tags,
--   features
-- ) VALUES (
--   'user-uuid-here',
--   'Premium Lightroom Preset Pack',
--   'Professional lightroom presets for portrait photography',
--   29.99,
--   49.99,
--   40,
--   '/images/preset-pack-1.jpg',
--   'Presets',
--   'portrait,lightroom,photography',
--   'One-click editing,Professional results,Easy to use'
-- );
