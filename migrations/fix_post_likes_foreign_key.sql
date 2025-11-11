-- Fix post_likes foreign key constraint
-- Drop the foreign key constraint on userId since we store Supabase UUIDs

-- Drop the constraint
ALTER TABLE post_likes 
DROP CONSTRAINT IF EXISTS "FK_6999d13aca25e33515210abaf16";

-- Verify the constraint is dropped
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'post_likes'
    AND tc.constraint_type = 'FOREIGN KEY';
