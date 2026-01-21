-- Enable pgvector extension for vector similarity search
-- This must be run before creating tables with vector columns

CREATE EXTENSION IF NOT EXISTS vector;

-- Add comment for documentation
COMMENT ON EXTENSION vector IS 'Vector data type and similarity operations for embeddings';
