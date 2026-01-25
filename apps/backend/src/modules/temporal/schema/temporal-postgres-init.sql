-- ============================================================================
-- Temporal PostgreSQL Schema Initialization
-- ============================================================================
-- This script initializes the PostgreSQL database for Temporal.
-- It creates the necessary schema for Temporal's persistence layer.
--
-- Note: Temporal's auto-setup image handles this automatically.
-- This file is provided for reference and manual setup if needed.
-- ============================================================================

-- Create the Temporal schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS temporal;

-- Create the visibility schema for search
CREATE SCHEMA IF NOT EXISTS temporal_visibility;

-- Grant permissions (adjust as needed)
GRANT ALL PRIVILEGES ON SCHEMA temporal TO temporal;
GRANT ALL PRIVILEGES ON SCHEMA temporal_visibility TO temporal;

-- Note: The actual table creation is handled by Temporal server
-- on first startup. This script ensures schemas and permissions exist.
