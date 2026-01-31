-- Improve LegalRuling Full-Text Search with Polish Language and Weighted Ranking
--
-- This script enhances the full-text search capabilities for legal rulings by:
-- 1. Switching from 'simple' to 'polish' text search configuration for proper stemming
-- 2. Adding GIN index for improved query performance
-- 3. Creating automatic trigger to update search vector on INSERT/UPDATE
-- 4. Using ts_rank with proper weight array to respect A-D weights
--
-- Weight Hierarchy:
--   A (1.0): signature, courtName - highest priority
--   B (0.7): legalArea, divisionName
--   C (0.5): summary, keywords, legalBasis
--   D (0.3): fullText - lowest priority (large content)
--
-- Run this script manually to update the database:
--   psql -U your_user -d your_database -f src/database/constraints/update-legal-ruling-fulltext-search-polish.sql
--
-- Note: This requires the Polish text search configuration to be available.
-- Run 'CREATE TEXT SEARCH CONFIGURATION polish (COPY = polish);' if needed.

BEGIN;

-- Step 1: Ensure Polish text search configuration exists
-- Most PostgreSQL installations include this by default
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'polish') THEN
        -- Try to create from template (if available)
        BEGIN
            CREATE TEXT SEARCH CONFIGURATION polish (COPY = polish);
            RAISE NOTICE 'Created Polish text search configuration';
        EXCEPTION WHEN undefined_object THEN
            RAISE WARNING 'Polish text search configuration not available. Please install the Polish language pack.';
        END;
    ELSE
        RAISE NOTICE 'Polish text search configuration already exists';
    END IF;
END $$;

-- Step 2: Drop the old full-text search index if it exists
DROP INDEX IF EXISTS idx_legal_ruling_search;

-- Step 3: Create GIN index for improved full-text search performance
-- GIN indexes are optimized for tsvector columns and significantly speed up @@ queries
CREATE INDEX IF NOT EXISTS idx_legal_rulings_searchvector_gin
ON legal_rulings USING GIN ("searchVector");

COMMENT ON INDEX idx_legal_rulings_searchvector_gin IS
'GIN index for full-text search on legal rulings. Enables fast @@ queries on the searchVector column.';

-- Step 4: Create a function to update the search vector using Polish configuration and proper weights
-- This function uses the Polish text search configuration for proper stemming of Polish text
CREATE OR REPLACE FUNCTION update_legal_ruling_searchvector()
RETURNS TRIGGER AS $$
BEGIN
    NEW."searchVector" :=
        -- Weight A (highest): signature and court name
        setweight(to_tsvector('polish', COALESCE(NEW.signature, '')), 'A') ||
        setweight(to_tsvector('polish', COALESCE(NEW."courtName", '')), 'A') ||

        -- Weight B: legal area, division name
        setweight(to_tsvector('polish', COALESCE(NEW.metadata->>'legalArea', '')), 'B') ||
        setweight(to_tsvector('polish', COALESCE(NEW.metadata->>'divisionName', '')), 'B') ||

        -- Weight C: summary, keywords, legal basis
        setweight(to_tsvector('polish', COALESCE(NEW.summary, '')), 'C') ||
        setweight(to_tsvector('polish', COALESCE(
            array_to_string(
                ARRAY(SELECT jsonb_array_elements_text(COALESCE(NEW.metadata->'keywords', '[]'::jsonb))),
                ' '
            ), ''
        )), 'C') ||
        setweight(to_tsvector('polish', COALESCE(
            array_to_string(
                ARRAY(SELECT jsonb_array_elements_text(COALESCE(NEW.metadata->'legalBasis', '[]'::jsonb))),
                ' '
            ), ''
        )), 'C') ||

        -- Weight D (lowest): full text content
        setweight(to_tsvector('polish', COALESCE(NEW."fullText", '')), 'D') ||

        -- Additional metadata fields with lower weight
        setweight(to_tsvector('polish', COALESCE(NEW.metadata->>'proceedingType', '')), 'D');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_legal_ruling_searchvector() IS
'Trigger function to update the full-text search vector for legal rulings using Polish text configuration with weighted fields.';

-- Step 5: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_legal_ruling_searchvector_update ON legal_rulings;

-- Step 6: Create trigger to automatically update search vector on INSERT and UPDATE
CREATE TRIGGER trg_legal_ruling_searchvector_update
    BEFORE INSERT OR UPDATE ON legal_rulings
    FOR EACH ROW
    EXECUTE FUNCTION update_legal_ruling_searchvector();

COMMENT ON TRIGGER trg_legal_ruling_searchvector_update ON legal_rulings IS
'Automatically updates the searchVector column before INSERT/UPDATE using weighted Polish text configuration.';

-- Step 7: Rebuild all existing search vectors using the new Polish configuration
UPDATE legal_rulings
SET "searchVector" =
    setweight(to_tsvector('polish', COALESCE(signature, '')), 'A') ||
    setweight(to_tsvector('polish', COALESCE("courtName", '')), 'A') ||
    setweight(to_tsvector('polish', COALESCE(metadata->>'legalArea', '')), 'B') ||
    setweight(to_tsvector('polish', COALESCE(metadata->>'divisionName', '')), 'B') ||
    setweight(to_tsvector('polish', COALESCE(summary, '')), 'C') ||
    setweight(to_tsvector('polish', COALESCE(
        array_to_string(
            ARRAY(SELECT jsonb_array_elements_text(COALESCE(metadata->'keywords', '[]'::jsonb))),
            ' '
        ), ''
    )), 'C') ||
    setweight(to_tsvector('polish', COALESCE(
        array_to_string(
            ARRAY(SELECT jsonb_array_elements_text(COALESCE(metadata->'legalBasis', '[]'::jsonb))),
            ' '
        ), ''
    )), 'C') ||
    setweight(to_tsvector('polish', COALESCE("fullText", '')), 'D') ||
    setweight(to_tsvector('polish', COALESCE(metadata->>'proceedingType', '')), 'D');

-- Step 8: Verification queries
-- Check that the index was created
SELECT
    indexname AS index_name,
    indexdef AS index_definition
FROM pg_indexes
WHERE tablename = 'legal_rulings'
  AND indexname = 'idx_legal_rulings_searchvector_gin';

-- Check the trigger exists
SELECT
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'legal_rulings'
  AND trigger_name = 'trg_legal_ruling_searchvector_update';

-- Sample search results with rank (to verify weighting works)
-- Note: This will only show results if you have data in the table
-- Uncomment to test:
-- SELECT
--     signature,
--     "courtName",
--     ts_rank("searchVector", plainto_tsquery('polish', 'umowa'), '{1.0, 0.7, 0.5, 0.3}') as rank
-- FROM legal_rulings
-- WHERE "searchVector" @@ plainto_tsquery('polish', 'umowa')
-- ORDER BY rank DESC
-- LIMIT 5;

-- Show updated count
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % legal ruling(s) with Polish full-text search vectors.', updated_count;
END $$;

COMMIT;

-- Rollback script (in case you need to revert)
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_legal_ruling_searchvector_update ON legal_rulings;
-- DROP FUNCTION IF EXISTS update_legal_ruling_searchvector();
-- DROP INDEX IF EXISTS idx_legal_rulings_searchvector_gin;
-- Revert to old search vectors if needed
-- UPDATE legal_rulings SET "searchVector" = NULL;
-- COMMIT;
