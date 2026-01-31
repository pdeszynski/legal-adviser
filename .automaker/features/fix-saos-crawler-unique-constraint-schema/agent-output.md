
🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase to understand SAOS crawler and LegalRuling entity structure",
      "status": "in_progress",
      "activeForm": "Exploring codebase structure"
    },
    {
      "content": "Update LegalRuling entity with composite unique constraint (courtId + signature + judgmentDate)",
      "status": "pending",
      "activeForm": "Updating LegalRuling entity schema"
    },
    {
      "content": "Create database migration for composite unique index",
      "status": "pending",
      "activeForm": "Creating database migration"
    },
    {
      "content": "Update SAOS crawler deduplication logic",
      "status": "pending",
      "activeForm": "Updating SAOS crawler deduplication"
    },
    {
      "content": "Add documentation for SAOS signature structure",
      "status": "pending",
      "activeForm": "Adding documentation"
    }
  ]
}

🔧 Tool: Task
Input: {
  "description": "Explore SAOS crawler structure",
  "prompt": "Explore the codebase to understand the SAOS crawler implementation and LegalRuling entity structure. I need to find:\n\n1. The LegalRuling entity - location, current schema, especially the unique constraints on signature field\n2. The SAOS adapter/transformer that handles judgment data - where deduplication logic exists\n3. Any existing database migrations related to LegalRuling\n4. The SAOS types/interfaces that define judgment structure\n\nFocus on:\n- apps/backend/src/modules/documents/entities/legal-ruling.entity.ts\n- apps/backend/src/infrastructure/anti-corruption/saos/ directory\n- apps/backend/src/modules/temporal/activities/billing/ for SAOS crawler activities\n- Database migrations in apps/backend/src/database/migrations/\n\nReturn the file paths and key code snippets showing:\n1. Current unique constraint definition on LegalRuling\n2. Current deduplication check in SAOS adapter\n3. Court/SaosCourt field relationships\n4. Signature field definition",
  "subagent_type": "Explore"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/entities/legal-ruling.entity.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/infrastructure/anti-corruption/saos/*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/infrastructure/anti-corruption/saos/saos.adapter.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/infrastructure/anti-corruption/saos/saos.transformer.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/infrastructure/anti-corruption/saos/saos.types.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/temporal/activities/billing/ruling-indexing.activities.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/legal-ruling.service.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/database/migrations/*migrations*"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/database/migrations/202*"
}

🔧 Tool: LS
Input: {
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/database"
}

🔧 Tool: Bash
Input: {
  "command": "find apps/backend/src/database -type f -name \"*.ts\" | head -20",
  "description": "Find database migration files in TypeORM format"
}

🔧 Tool: Bash
Input: {
  "command": "find . -name \"*.migration.ts\" -o -name \"*migrations*\" -type d | head -20",
  "description": "Find migration files and directories"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/domain/legal-rulings/value-objects/ruling-source.vo.ts"
}
Now I have a good understanding. Let me read the key files to understand the exact implementation details:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/entities/legal-ruling.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/infrastructure/anti-corruption/saos/saos.adapter.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/infrastructure/anti-corruption/saos/saos.transformer.ts"
}
Now let me also look at the ruling indexing activity and the legal ruling service to understand the deduplication logic:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/temporal/activities/billing/ruling-indexing.activities.ts"
}

🔧 Tool: Grep
Input: {
  "pattern": "findBySignature",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src",
  "output_mode": "files_with_matches"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/legal-ruling.service.ts"
}
Now I have a complete understanding of the codebase. Let me update the todo list and implement the changes:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase structure",
      "content": "Explore codebase to understand SAOS crawler and LegalRuling entity structure",
      "status": "completed"
    },
    {
      "activeForm": "Updating LegalRuling entity schema",
      "content": "Update LegalRuling entity with composite unique constraint (courtName + signature + rulingDate)",
      "status": "in_progress"
    },
    {
      "activeForm": "Creating database migration",
      "content": "Create database migration for composite unique index",
      "status": "pending"
    },
    {
      "activeForm": "Updating SAOS crawler deduplication",
      "content": "Update SAOS crawler deduplication logic",
      "status": "pending"
    },
    {
      "activeForm": "Adding documentation",
      "content": "Add documentation for SAOS signature structure",
      "status": "pending"
    }
  ]
}
Now let me implement the changes. First, I need to update the LegalRuling entity:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/entities/legal-ruling.entity.ts",
  "old_string": "/**\n * LegalRuling Entity\n *\n * Represents a legal ruling (case law / court decision) stored in the system.\n * Used for referencing precedents and supporting legal analysis.\n *\n * Aggregate Root: LegalRuling\n * Invariants:\n *   - A ruling must have a signature (unique case identifier)\n *   - A ruling must have a court name\n *   - Ruling date must be a valid date\n *\n * Uses nestjs-query decorators for auto-generated CRUD resolvers.\n */\n@Entity('legal_rulings')\n@ObjectType('LegalRuling')\n@QueryOptions({ enableTotalCount: true })\n@Index(['signature'], { unique: true })\n@Index(['courtName'])\n@Index(['courtType'])\n@Index(['rulingDate'])\n@Index(['createdAt'])\n@Index('idx_legal_ruling_search', { synchronize: false }) // Full-text search index, created manually via migration/SQL\nexport class LegalRuling {\n  @PrimaryGeneratedColumn('uuid')\n  @IDField(() => ID)\n  id: string;\n\n  /**\n   * Unique case signature/identifier (e.g., \"III CZP 8/21\")\n   * This is the official court case reference number\n   */\n  @Column({ type: 'varchar', length: 100, unique: true })\n  @FilterableField()\n  signature: string;",
  "new_string": "/**\n * LegalRuling Entity\n *\n * Represents a legal ruling (case law / court decision) stored in the system.\n * Used for referencing precedents and supporting legal analysis.\n *\n * Aggregate Root: LegalRuling\n * Invariants:\n *   - A ruling must have a signature (case identifier)\n *   - A ruling must have a court name\n *   - Ruling date must be a valid date\n *   - The combination of courtName + signature + rulingDate must be unique\n *\n * Uniqueness Note:\n *   Signatures are unique within a single court, not nationwide.\n *   Different courts can issue judgments with identical signatures\n *   (e.g., 'I C 697/19' can appear in multiple regional courts).\n *   Therefore, the unique constraint uses a composite key: (courtName, signature, rulingDate).\n *\n * Uses nestjs-query decorators for auto-generated CRUD resolvers.\n */\n@Entity('legal_rulings')\n@ObjectType('LegalRuling')\n@QueryOptions({ enableTotalCount: true })\n@Index(['courtName', 'signature', 'rulingDate'], { unique: true })\n@Index(['courtName'])\n@Index(['courtType'])\n@Index(['rulingDate'])\n@Index(['createdAt'])\n@Index('idx_legal_ruling_search', { synchronize: false }) // Full-text search index, created manually via migration/SQL\nexport class LegalRuling {\n  @PrimaryGeneratedColumn('uuid')\n  @IDField(() => ID)\n  id: string;\n\n  /**\n   * Case signature/identifier (e.g., \"III CZP 8/21\")\n   * This is the official court case reference number.\n   *\n   * Note: This field is NOT unique by itself. The uniqueness is guaranteed\n   * by the composite index on (courtName, signature, rulingDate).\n   */\n  @Column({ type: 'varchar', length: 100 })\n  @FilterableField()\n  signature: string;"
}
Now I need to add a new method to the LegalRulingService to find a ruling by the composite key (courtName, signature, rulingDate):

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/legal-ruling.service.ts",
  "old_string": "  /**\n   * Find a ruling by signature (unique case identifier)\n   */\n  async findBySignature(signature: string): Promise<LegalRuling | null> {\n    return this.rulingRepository.findOne({\n      where: { signature },\n    });\n  }",
  "new_string": "  /**\n   * Find a ruling by signature (unique case identifier)\n   *\n   * @deprecated Use findByCourtSignatureDate instead for proper uniqueness\n   * Different courts can have judgments with the same signature\n   */\n  async findBySignature(signature: string): Promise<LegalRuling | null> {\n    return this.rulingRepository.findOne({\n      where: { signature },\n    });\n  }\n\n  /**\n   * Find a ruling by the composite key: courtName + signature + rulingDate\n   *\n   * This is the proper unique identifier for legal rulings since signatures\n   * are only unique within a single court, not nationwide.\n   *\n   * @param courtName Name of the court\n   * @param signature Case signature/identifier\n   * @param rulingDate Date of the ruling\n   * @returns The ruling if found, null otherwise\n   */\n  async findByCourtSignatureDate(\n    courtName: string,\n    signature: string,\n    rulingDate: Date,\n  ): Promise<LegalRuling | null> {\n    return this.rulingRepository.findOne({\n      where: {\n        courtName,\n        signature,\n        rulingDate,\n      },\n    });\n  }"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase structure",
      "content": "Explore codebase to understand SAOS crawler and LegalRuling entity structure",
      "status": "completed"
    },
    {
      "activeForm": "Updating LegalRuling entity schema",
      "content": "Update LegalRuling entity with composite unique constraint (courtName + signature + rulingDate)",
      "status": "completed"
    },
    {
      "activeForm": "Creating database migration",
      "content": "Create database migration for composite unique index",
      "status": "in_progress"
    },
    {
      "activeForm": "Updating SAOS crawler deduplication",
      "content": "Update SAOS crawler deduplication logic",
      "status": "pending"
    },
    {
      "activeForm": "Adding documentation",
      "content": "Add documentation for SAOS signature structure",
      "status": "pending"
    }
  ]
}
Now let me check if there's a migrations directory:

🔧 Tool: Glob
Input: {
  "pattern": "**/migrations/**/*.ts",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/migrations/**/*.sql",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend"
}
Let me check how TypeORM migrations are configured in this project:

🔧 Tool: Grep
Input: {
  "pattern": "migration|synchronize",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src",
  "output_mode": "files_with_matches"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/database/database.module.ts"
}
I see that TypeORM is configured with `synchronize: true` in development/production (only false in production). This means TypeORM will automatically sync schema changes. However, we need a proper migration to handle existing data. Let me create a manual migration file for the database changes. First, let me check if there's a migrations directory:

🔧 Tool: Glob
Input: {
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend",
  "pattern": "**/*.sql"
}
I see there's a `constraints` directory with SQL files. Let me check its structure:

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/piteer/workspace/radca-prawny/legal/apps/backend/src/database/constraints/",
  "description": "List constraints directory"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/database/constraints/add-chat-message-content-not-empty.sql"
}
Now I'll create a migration SQL file for updating the unique constraint on the legal_rulings table:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/database/constraints/update-legal-ruling-unique-constraint.sql",
  "content": "-- Update LegalRuling Unique Constraint from Signature to Composite Key\n--\n-- This script changes the uniqueness constraint on the legal_rulings table\n-- from a single field (signature) to a composite key (courtName, signature, rulingDate).\n--\n-- Background:\n--   Signatures in the Polish court system are only unique within a single court,\n--   not nationwide. Different courts can issue judgments with identical signatures\n--   (e.g., 'I C 697/19' can appear in multiple regional courts).\n--\n-- Changes:\n--   1. Drop the existing unique index on the signature column\n--   2. Add a new composite unique index on (courtName, signature, rulingDate)\n--\n-- Run this script manually to update the database schema:\n--   psql -U your_user -d your_database -f src/database/constraints/update-legal-ruling-unique-constraint.sql\n--\n-- Note: If there are existing duplicate signatures across different courts,\n-- this script will keep the first occurrence (based on creation time) and\n-- mark subsequent ones as duplicates by appending the court name to the signature.\n\nBEGIN;\n\n-- Step 1: Check for existing duplicates before changing the constraint\n-- This query identifies signatures that appear in multiple courts\nDO $$\nDECLARE\n    duplicate_count INTEGER;\nBEGIN\n    SELECT COUNT(*) INTO duplicate_count\n    FROM (\n        SELECT signature, rulingDate, COUNT(DISTINCT \"courtName\") as court_count\n        FROM legal_rulings\n        GROUP BY signature, rulingDate\n        HAVING COUNT(DISTINCT \"courtName\") > 1\n    ) duplicates;\n\n    IF duplicate_count > 0 THEN\n        RAISE NOTICE 'Found % signature(s) appearing in multiple courts. These will be modified to ensure uniqueness.', duplicate_count;\n    ELSE\n        RAISE NOTICE 'No duplicate signatures found across courts. Proceeding with constraint update.';\n    END IF;\nEND $$;\n\n-- Step 2: Handle existing duplicates by appending court name to signature\n-- This ensures the constraint change won't fail due to existing duplicates\n-- We keep the first occurrence (by createdAt) and modify subsequent ones\nUPDATE legal_rulings\nSET signature = signature || ' [' || SUBSTRING(\"courtName\" FOR 20) || ']'\nWHERE id IN (\n    SELECT id FROM (\n        SELECT\n            id,\n            signature,\n            \"courtName\",\n            \"rulingDate\",\n            ROW_NUMBER() OVER (PARTITION BY signature, \"rulingDate\" ORDER BY \"createdAt\") as rn\n        FROM legal_rulings\n    ) ranked\n    WHERE rn > 1\n);\n\n-- Step 3: Drop the existing unique constraint on signature\n-- The constraint name may vary, so we drop it by finding the actual name\nDO $$\nDECLARE\n    constraint_name TEXT;\nBEGIN\n    -- Find the unique constraint on the signature column\n    SELECT conname INTO constraint_name\n    FROM pg_constraint\n    WHERE conrelid = 'legal_rulings'::regclass\n      AND contype = 'u'\n      AND conkey @> ARRAY(\n          SELECT attnum\n          FROM pg_attribute\n          WHERE attrelid = 'legal_rulings'::regclass\n            AND attname = 'signature'\n      );\n\n    IF constraint_name IS NOT NULL THEN\n        EXECUTE format('ALTER TABLE legal_rulings DROP CONSTRAINT %I', constraint_name);\n        RAISE NOTICE 'Dropped existing unique constraint: %', constraint_name;\n    ELSE\n        RAISE NOTICE 'No unique constraint found on signature column';\n    END IF;\nEND $$;\n\n-- Step 4: Drop the unique index if it exists (in case it was created separately)\nDROP INDEX IF EXISTS UIDX_legal_rulings_signature;\nDROP INDEX IF EXISTS legal_rulings_signature_key;\n\n-- Step 5: Create the new composite unique index\n-- This creates a unique constraint on (courtName, signature, rulingDate)\nCREATE UNIQUE INDEX IF NOT EXISTS UIDX_legal_rulings_court_signature_date\nON legal_rulings (\"courtName\", signature, \"rulingDate\");\n\n-- Step 6: Remove the unique attribute from the signature column definition\n-- This is done at the entity level in TypeScript, but for database consistency:\nALTER TABLE legal_rulings\nALTER COLUMN signature DROP NOT NULL;  -- First drop NOT NULL temporarily\nALTER TABLE legal_rulings\nALTER COLUMN signature SET NOT NULL;  -- Re-add NOT NULL without unique\n\n-- Step 7: Add comments for documentation\nCOMMENT ON INDEX UIDX_legal_rulings_court_signature_date IS\n'Ensures each judgment is uniquely identified by court, signature, and date. Signatures are unique within a court, not nationwide.';\n\nCOMMENT ON COLUMN legal_rulings.signature IS\n'Case signature/identifier (e.g., \"III CZP 8/21\"). Combined with courtName and rulingDate, forms a unique key.';\n\n-- Step 8: Verification query to check the new constraint\nSELECT\n    indexname AS index_name,\n    indexdef AS index_definition\nFROM pg_indexes\nWHERE tablename = 'legal_rulings'\n  AND indexname = 'uidx_legal_rulings_court_signature_date';\n\n-- Show any remaining duplicates (should be empty if migration succeeded)\nDO $$\nDECLARE\n    remaining_duplicates INTEGER;\nBEGIN\n    SELECT COUNT(*) INTO remaining_duplicates\n    FROM (\n        SELECT \"courtName\", signature, \"rulingDate\", COUNT(*) as cnt\n        FROM legal_rulings\n        GROUP BY \"courtName\", signature, \"rulingDate\"\n        HAVING COUNT(*) > 1\n    ) dupes;\n\n    IF remaining_duplicates > 0 THEN\n        RAISE WARNING 'Found % remaining duplicate(s) after migration!', remaining_duplicates;\n    ELSE\n        RAISE NOTICE 'Migration completed successfully. No duplicates remain.';\n    END IF;\nEND $$;\n\nCOMMIT;\n\n-- Rollback script (in case you need to revert)\n-- BEGIN;\n-- DROP INDEX IF EXISTS UIDX_legal_rulings_court_signature_date;\n-- CREATE UNIQUE INDEX IF NOT EXISTS UIDX_legal_rulings_signature ON legal_rulings (signature);\n-- COMMIT;\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase structure",
      "content": "Explore codebase to understand SAOS crawler and LegalRuling entity structure",
      "status": "completed"
    },
    {
      "activeForm": "Updating LegalRuling entity schema",
      "content": "Update LegalRuling entity with composite unique constraint (courtName + signature + rulingDate)",
      "status": "completed"
    },
    {
      "activeForm": "Creating database migration",
      "content": "Create database migration for composite unique index",
      "status": "completed"
    },
    {
      "activeForm": "Updating SAOS crawler deduplication",
      "content": "Update SAOS crawler deduplication logic",
      "status": "in_progress"
    },
    {
      "activeForm": "Adding documentation",
      "content": "Add documentation for SAOS signature structure",
      "status": "pending"
    }
  ]
}
Now let me update the SAOS crawler deduplication logic to use the new composite key:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/temporal/activities/billing/ruling-indexing.activities.ts",
  "old_string": "    try {\n      // Check if ruling already exists by signature\n      const existingRuling = await this.legalRulingService.findBySignature(\n        ruling.signature,\n      );\n\n      if (existingRuling) {\n        this.logger.debug(\n          `[${source}] Found existing ruling: signature=\"${ruling.signature}\", existingId=\"${existingRuling.id}\", existingDate=\"${existingRuling.rulingDate.toISOString()}\"`,\n        );",
  "new_string": "    try {\n      // Check if ruling already exists by composite key (courtName + signature + rulingDate)\n      // Signatures are only unique within a court, not nationwide\n      const existingRuling =\n        await this.legalRulingService.findByCourtSignatureDate(\n          ruling.courtName,\n          ruling.signature,\n          ruling.rulingDate,\n        );\n\n      if (existingRuling) {\n        this.logger.debug(\n          `[${source}] Found existing ruling: signature=\"${ruling.signature}\", court=\"${ruling.courtName}\", date=\"${ruling.rulingDate.toISOString()}\", existingId=\"${existingRuling.id}\"`,\n        );"
}
Now let me also check the implementation file to see if there's similar deduplication logic:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/temporal/activities/billing/impl.ts"
}
I need to update the type definitions in impl.ts to include the new method:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/temporal/activities/billing/impl.ts",
  "old_string": "  legalRulingService: {\n    findBySignature: (signature: string) => Promise<{\n      id: string;\n      signature: string;\n      rulingDate: Date;\n      courtName: string;\n      courtType: any;\n      summary?: string;\n      fullText?: string;\n      metadata?: {\n        sourceReference?: string;\n        [key: string]: unknown;\n      };\n    } | null>;\n    create: (data: {",
  "new_string": "  legalRulingService: {\n    findBySignature: (signature: string) => Promise<{\n      id: string;\n      signature: string;\n      rulingDate: Date;\n      courtName: string;\n      courtType: any;\n      summary?: string;\n      fullText?: string;\n      metadata?: {\n        sourceReference?: string;\n        [key: string]: unknown;\n      };\n    } | null>;\n    findByCourtSignatureDate: (\n      courtName: string,\n      signature: string,\n      rulingDate: Date,\n    ) => Promise<{\n      id: string;\n      signature: string;\n      rulingDate: Date;\n      courtName: string;\n      courtType: any;\n      summary?: string;\n      fullText?: string;\n      metadata?: {\n        sourceReference?: string;\n        [key: string]: unknown;\n      };\n    } | null>;\n    create: (data: {"
}
Let me also check the legal-ruling.resolver.ts to see if there's any deduplication logic there:

🔧 Tool: Grep
Input: {
  "output_mode": "content",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/legal-ruling.resolver.ts",
  "pattern": "findBySignature",
  "-B": 2,
  "-A": 5
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/legal-ruling.resolver.ts",
  "limit": 200
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase structure",
      "content": "Explore codebase to understand SAOS crawler and LegalRuling entity structure",
      "status": "completed"
    },
    {
      "activeForm": "Updating LegalRuling entity schema",
      "content": "Update LegalRuling entity with composite unique constraint (courtName + signature + rulingDate)",
      "status": "completed"
    },
    {
      "activeForm": "Creating database migration",
      "content": "Create database migration for composite unique index",
      "status": "completed"
    },
    {
      "activeForm": "Updating SAOS crawler deduplication",
      "content": "Update SAOS crawler deduplication logic",
      "status": "completed"
    },
    {
      "activeForm": "Adding documentation",
      "content": "Add documentation for SAOS signature structure",
      "status": "in_progress"
    }
  ]
}
Now let me create a documentation file for the SAOS signature structure:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/infrastructure/anti-corruption/saos/SAOS_SIGNATURE_STRUCTURE.md",
  "content": "# SAOS Signature Structure and Uniqueness\n\n## Overview\n\nThis document explains the structure of legal case signatures in the Polish court system (SAOS - System Analizy Orzecznictwa Sądowego) and how uniqueness is handled in the Legal AI Platform.\n\n## Signature Format\n\nPolish court case signatures typically follow this pattern:\n\n```\n[Department Roman Numeral] [Case Type Abbreviation] [Number]/[Year]\n```\n\n### Examples\n\n| Signature | Department | Case Type | Number | Year |\n|-----------|------------|-----------|--------|------|\n| `III CZP 8/21` | III | CZP (Civil Chamber of Supreme Court) | 8 | 2021 |\n| `I C 697/19` | I | C (Civil) | 697 | 2019 |\n| `V Ka 123/22` | V | Ka (Penal) | 123 | 2022 |\n| `II UK 45/20` | II | UK (Labor/Social Security) | 45 | 2020 |\n\n### Case Type Abbreviations\n\n| Abbreviation | Meaning (Polish) | Meaning (English) |\n|--------------|-----------------|-------------------|\n| C | Cywilny | Civil |\n| K | Karny | Penal |\n| Ka | Karny odwoławczy | Penal Appellate |\n| UK | Ubezpieczeń społecznych | Social Security |\n| Uz | Ubezpieczeń społecznych odwoławczy | Social Security Appellate |\n| P | Pracy | Labor |\n| RP | Rodzinny i opiekuńczy | Family and Guardianship |\n| W | Wykroczeń | Offenses |\n| N | Nieletnich | Juvenile |\n| CZP | Izba Cywilna | Civil Chamber (Supreme Court) |\n| KK | Izba Karna | Criminal Chamber (Supreme Court) |\n| KP | Izba Pracy, Ubezpieczeń Społecznych i Spraw Publicznych | Labor, Social Security and Public Affairs Chamber |\n\n## Uniqueness Problem\n\n**Key Insight:** Signatures are unique **within a single court**, not nationwide.\n\n### Example of the Problem\n\nThe signature `I C 697/19` can legally exist in:\n\n- Sąd Rejonowy dla Krakowa-Śródmieścia w Krakowie (District Court Kraków-City)\n- Sąd Rejonowy dla Warszawy-Śródmieścia w Warszawie (District Court Warsaw-City)\n- Sąd Rejonowy dla Gdańska-Północ w Gdańsku (District Court Gdańsk-North)\n- ... and many other regional courts\n\nEach of these courts can independently assign the same signature `I C 697/19` to a different case heard in 2019.\n\n## Database Schema Solution\n\n### Composite Unique Constraint\n\nTo handle this correctly, the `legal_rulings` table uses a **composite unique constraint** on three columns:\n\n```sql\nCREATE UNIQUE INDEX UIDX_legal_rulings_court_signature_date\nON legal_rulings (\"courtName\", signature, \"rulingDate\");\n```\n\nThis ensures that the combination of `(courtName, signature, rulingDate)` is unique, allowing the same signature to exist in different courts or on different dates.\n\n### Entity Definition\n\n```typescript\n@Entity('legal_rulings')\n@Index(['courtName', 'signature', 'rulingDate'], { unique: true })\nexport class LegalRuling {\n  @Column({ type: 'varchar', length: 100 })\n  signature: string;\n\n  @Column({ type: 'varchar', length: 300 })\n  courtName: string;\n\n  @Column({ type: 'date' })\n  rulingDate: Date;\n  // ...\n}\n```\n\n## API Usage\n\n### Finding a Ruling (Correct Way)\n\nUse the composite key for reliable lookups:\n\n```typescript\nconst ruling = await legalRulingService.findByCourtSignatureDate(\n  'Sąd Rejonowy dla Krakowa-Śródmieścia w Krakowie',\n  'I C 697/19',\n  new Date('2019-03-15')\n);\n```\n\n### Finding a Ruling (Deprecated)\n\nUsing only the signature is **not recommended** as it may return the wrong ruling if duplicates exist:\n\n```typescript\n// DEPRECATED - May return wrong ruling if signature exists in multiple courts\nconst ruling = await legalRulingService.findBySignature('I C 697/19');\n```\n\n## SAOS Crawler Deduplication\n\nThe SAOS crawler uses the composite key for deduplication:\n\n```typescript\nconst existingRuling =\n  await this.legalRulingService.findByCourtSignatureDate(\n    ruling.courtName,\n    ruling.signature,\n    ruling.rulingDate,\n  );\n```\n\nThis ensures that:\n1. Valid judgments from different courts with the same signature are all stored\n2. Only exact duplicates (same court, signature, and date) are skipped\n3. Updates to existing judgments are applied correctly\n\n## Migration Notes\n\nWhen migrating from the old schema (signature-only unique constraint) to the new schema (composite key):\n\n1. Any existing duplicates (same signature, different courts) will be handled by the migration script\n2. The migration appends the court name to the signature for duplicates to maintain uniqueness\n3. The old unique index on `signature` is dropped\n4. The new composite index is created\n\nSee `apps/backend/src/database/constraints/update-legal-ruling-unique-constraint.sql` for the migration script.\n\n## References\n\n- SAOS API: https://www.saos.org.pl/api\n- Polish Court System: https://www.gov.pl/web/sadysta\n- SAOS Documentation: https://www.saos.org.pl/o-systemie\n"
}
Now let me run codegen to update the GraphQL types after the schema changes:

🔧 Tool: Bash
Input: {
  "command": "pnpm codegen 2>&1 | head -50",
  "description": "Run GraphQL codegen after schema changes",
  "timeout": 120000
}
Codegen completed successfully. Now let me verify the changes compile:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/backend && npx tsc --noEmit 2>&1 | head -50",
  "description": "Type check backend after changes",
  "timeout": 120000
}
There's a pre-existing TypeScript error in the codebase that's unrelated to my changes. Let me check if my changes specifically cause any errors:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"(legal-ruling|ruling-indexing)\" | head -20",
  "description": "Check for TypeScript errors in changed files",
  "timeout": 120000
}
Good, no TypeScript errors in the files I modified. The pre-existing error is in `saos-indexing-analytics.service.ts` which I didn't touch.

Now let me update the todo list and create a summary:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase structure",
      "content": "Explore codebase to understand SAOS crawler and LegalRuling entity structure",
      "status": "completed"
    },
    {
      "activeForm": "Updating LegalRuling entity schema",
      "content": "Update LegalRuling entity with composite unique constraint (courtName + signature + rulingDate)",
      "status": "completed"
    },
    {
      "activeForm": "Creating database migration",
      "content": "Create database migration for composite unique index",
      "status": "completed"
    },
    {
      "activeForm": "Updating SAOS crawler deduplication",
      "content": "Update SAOS crawler deduplication logic",
      "status": "completed"
    },
    {
      "activeForm": "Adding documentation",
      "content": "Add documentation for SAOS signature structure",
      "status": "completed"
    }
  ]
}
I see the file was modified by a linter (likely adding an import). Let me verify my changes are still intact and read the file to see what's going on:

🔧 Tool: Grep
Input: {
  "-A": 10,
  "-B": 5,
  "output_mode": "content",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/temporal/activities/billing/ruling-indexing.activities.ts",
  "pattern": "findByCourtSignatureDate"
}
My changes are intact. The linter just added an import. Let me update the todo list to mark everything as complete and provide a summary:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase structure",
      "content": "Explore codebase to understand SAOS crawler and LegalRuling entity structure",
      "status": "completed"
    },
    {
      "activeForm": "Updating LegalRuling entity schema",
      "content": "Update LegalRuling entity with composite unique constraint (courtName + signature + rulingDate)",
      "status": "completed"
    },
    {
      "activeForm": "Creating database migration",
      "content": "Create database migration for composite unique index",
      "status": "completed"
    },
    {
      "activeForm": "Updating SAOS crawler deduplication",
      "content": "Update SAOS crawler deduplication logic",
      "status": "completed"
    },
    {
      "activeForm": "Adding documentation",
      "content": "Add documentation for SAOS signature structure",
      "status": "completed"
    }
  ]
}
<summary>
## Summary: Fix SAOS Crawler Unique Constraint Schema

### Changes Implemented

1. **Updated LegalRuling Entity Schema** (`apps/backend/src/modules/documents/entities/legal-ruling.entity.ts`)
   - Removed the `unique: true` constraint from the `signature` column
   - Added composite unique index on `['courtName', 'signature', 'rulingDate']`
   - Added documentation explaining why signatures are only unique within a court, not nationwide

2. **Added New Service Method** (`apps/backend/src/modules/documents/services/legal-ruling.service.ts`)
   - Added `findByCourtSignatureDate(courtName, signature, rulingDate)` method for proper deduplication
   - Marked `findBySignature()` as `@deprecated` since signatures alone are not sufficient for unique identification

3. **Created Database Migration** (`apps/backend/src/database/constraints/update-legal-ruling-unique-constraint.sql`)
   - Drops existing unique constraint on `signature` column
   - Creates new composite unique index on `(courtName, signature, rulingDate)`
   - Handles existing duplicates by appending court name to signature
   - Includes rollback script for reverting changes if needed

4. **Updated SAOS Crawler Deduplication** (`apps/backend/src/modules/temporal/activities/billing/ruling-indexing.activities.ts`)
   - Changed from `findBySignature()` to `findByCourtSignatureDate()`
   - Now checks all three fields (courtName, signature, rulingDate) for proper uniqueness

5. **Updated Type Definitions** (`apps/backend/src/modules/temporal/activities/billing/impl.ts`)
   - Added `findByCourtSignatureDate` method to the LegalRulingService interface

6. **Added Documentation** (`apps/backend/src/infrastructure/anti-corruption/saos/SAOS_SIGNATURE_STRUCTURE.md`)
   - Explains Polish court signature format
   - Documents the uniqueness problem
   - Provides examples of case type abbreviations
   - Describes the database schema solution
   - Includes migration notes

### Files Modified
- `apps/backend/src/modules/documents/entities/legal-ruling.entity.ts`
- `apps/backend/src/modules/documents/services/legal-ruling.service.ts`
- `apps/backend/src/modules/temporal/activities/billing/ruling-indexing.activities.ts`
- `apps/backend/src/modules/temporal/activities/billing/impl.ts`

### Files Created
- `apps/backend/src/database/constraints/update-legal-ruling-unique-constraint.sql`
- `apps/backend/src/infrastructure/anti-corruption/saos/SAOS_SIGNATURE_STRUCTURE.md`

### Notes for Developer
1. **Migration Required**: Run the SQL migration script to update existing databases:
   ```bash
   psql -U your_user -d your_database -f src/database/constraints/update-legal-ruling-unique-constraint.sql
   ```

2. **TypeORM Sync**: In development mode, TypeORM will automatically apply the index changes when the application restarts (since `synchronize: true` in non-production).

3. **Breaking Change**: The `findBySignature()` method is now deprecated. Use `findByCourtSignatureDate()` for reliable lookups.

4. **GraphQL Codegen**: Run `pnpm codegen` after schema changes (already completed).

5. **Pre-existing TypeScript Error**: There's an unrelated TypeScript error in `saos-indexing-analytics.service.ts(235,76)` that existed before these changes.
</summary>