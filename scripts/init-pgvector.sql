-- Initialize pgvector extension
-- This script runs automatically on database creation

CREATE EXTENSION IF NOT EXISTS vector;

-- Verify the extension is installed
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
