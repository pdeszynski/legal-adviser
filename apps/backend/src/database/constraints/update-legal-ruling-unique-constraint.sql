-- Update LegalRuling Unique Constraint from Signature to Composite Key
--
-- This script changes the uniqueness constraint on the legal_rulings table
-- from a single field (signature) to a composite key (courtName, signature, rulingDate).
--
-- Background:
--   Signatures in the Polish court system are only unique within a single court,
--   not nationwide. Different courts can issue judgments with identical signatures
--   (e.g., 'I C 697/19' can appear in multiple regional courts).
--
-- Changes:
--   1. Drop the existing unique index on the signature column
--   2. Add a new composite unique index on (courtName, signature, rulingDate)
--
-- Run this script manually to update the database schema:
--   psql -U your_user -d your_database -f src/database/constraints/update-legal-ruling-unique-constraint.sql
--
-- Note: If there are existing duplicate signatures across different courts,
-- this script will keep the first occurrence (based on creation time) and
-- mark subsequent ones as duplicates by appending the court name to the signature.

BEGIN;

-- Step 1: Check for existing duplicates before changing the constraint
-- This query identifies signatures that appear in multiple courts
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT signature, rulingDate, COUNT(DISTINCT "courtName") as court_count
        FROM legal_rulings
        GROUP BY signature, rulingDate
        HAVING COUNT(DISTINCT "courtName") > 1
    ) duplicates;

    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % signature(s) appearing in multiple courts. These will be modified to ensure uniqueness.', duplicate_count;
    ELSE
        RAISE NOTICE 'No duplicate signatures found across courts. Proceeding with constraint update.';
    END IF;
END $$;

-- Step 2: Handle existing duplicates by appending court name to signature
-- This ensures the constraint change won't fail due to existing duplicates
-- We keep the first occurrence (by createdAt) and modify subsequent ones
UPDATE legal_rulings
SET signature = signature || ' [' || SUBSTRING("courtName" FOR 20) || ']'
WHERE id IN (
    SELECT id FROM (
        SELECT
            id,
            signature,
            "courtName",
            "rulingDate",
            ROW_NUMBER() OVER (PARTITION BY signature, "rulingDate" ORDER BY "createdAt") as rn
        FROM legal_rulings
    ) ranked
    WHERE rn > 1
);

-- Step 3: Drop the existing unique constraint on signature
-- The constraint name may vary, so we drop it by finding the actual name
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the unique constraint on the signature column
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'legal_rulings'::regclass
      AND contype = 'u'
      AND conkey @> ARRAY(
          SELECT attnum
          FROM pg_attribute
          WHERE attrelid = 'legal_rulings'::regclass
            AND attname = 'signature'
      );

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE legal_rulings DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped existing unique constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No unique constraint found on signature column';
    END IF;
END $$;

-- Step 4: Drop the unique index if it exists (in case it was created separately)
DROP INDEX IF EXISTS UIDX_legal_rulings_signature;
DROP INDEX IF EXISTS legal_rulings_signature_key;

-- Step 5: Create the new composite unique index
-- This creates a unique constraint on (courtName, signature, rulingDate)
CREATE UNIQUE INDEX IF NOT EXISTS UIDX_legal_rulings_court_signature_date
ON legal_rulings ("courtName", signature, "rulingDate");

-- Step 6: Remove the unique attribute from the signature column definition
-- This is done at the entity level in TypeScript, but for database consistency:
ALTER TABLE legal_rulings
ALTER COLUMN signature DROP NOT NULL;  -- First drop NOT NULL temporarily
ALTER TABLE legal_rulings
ALTER COLUMN signature SET NOT NULL;  -- Re-add NOT NULL without unique

-- Step 7: Add comments for documentation
COMMENT ON INDEX UIDX_legal_rulings_court_signature_date IS
'Ensures each judgment is uniquely identified by court, signature, and date. Signatures are unique within a court, not nationwide.';

COMMENT ON COLUMN legal_rulings.signature IS
'Case signature/identifier (e.g., "III CZP 8/21"). Combined with courtName and rulingDate, forms a unique key.';

-- Step 8: Verification query to check the new constraint
SELECT
    indexname AS index_name,
    indexdef AS index_definition
FROM pg_indexes
WHERE tablename = 'legal_rulings'
  AND indexname = 'uidx_legal_rulings_court_signature_date';

-- Show any remaining duplicates (should be empty if migration succeeded)
DO $$
DECLARE
    remaining_duplicates INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_duplicates
    FROM (
        SELECT "courtName", signature, "rulingDate", COUNT(*) as cnt
        FROM legal_rulings
        GROUP BY "courtName", signature, "rulingDate"
        HAVING COUNT(*) > 1
    ) dupes;

    IF remaining_duplicates > 0 THEN
        RAISE WARNING 'Found % remaining duplicate(s) after migration!', remaining_duplicates;
    ELSE
        RAISE NOTICE 'Migration completed successfully. No duplicates remain.';
    END IF;
END $$;

COMMIT;

-- Rollback script (in case you need to revert)
-- BEGIN;
-- DROP INDEX IF EXISTS UIDX_legal_rulings_court_signature_date;
-- CREATE UNIQUE INDEX IF NOT EXISTS UIDX_legal_rulings_signature ON legal_rulings (signature);
-- COMMIT;
