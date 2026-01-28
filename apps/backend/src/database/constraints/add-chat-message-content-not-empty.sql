-- Add NOT NULL and CHECK constraints to prevent empty chat messages
--
-- This script adds database-level validation to ensure chat messages
-- always have non-empty content.
--
-- Run this script manually to add constraints to existing database:
-- psql -U your_user -d your_database -f src/database/constraints/add-chat-message-content-not-empty.sql

-- First, clean up any existing empty messages (optional)
-- Uncomment the lines below to delete messages with empty content
-- DELETE FROM chat_messages
-- WHERE content IS NULL OR LENGTH(TRIM(content)) = 0;

-- Add NOT NULL constraint to content column (if not already set)
-- Note: If the column already has NOT NULL, this will be a no-op
ALTER TABLE chat_messages
ALTER COLUMN content SET NOT NULL;

-- Add CHECK constraint to ensure content is not empty string (only whitespace)
ALTER TABLE chat_messages
ADD CONSTRAINT IF NOT EXISTS check_content_not_empty
CHECK (LENGTH(TRIM(content)) > 0);

-- Add comment for documentation
COMMENT ON CONSTRAINT check_content_not_empty ON chat_messages IS
'Ensures message content is not empty or whitespace-only';

-- Verification query to check the constraint was added
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'chat_messages'::regclass
AND conname = 'check_content_not_empty';
