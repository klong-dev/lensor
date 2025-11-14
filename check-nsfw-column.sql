-- Check if is_nsfw column exists in posts table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'posts' 
  AND column_name = 'is_nsfw';

-- If column exists, check sample posts
SELECT id, title, is_nsfw, created_at
FROM posts
ORDER BY created_at DESC
LIMIT 10;
