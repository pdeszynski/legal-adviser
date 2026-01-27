# Data Integrity Verification

## Overview

This document describes the procedures and methods for verifying data integrity after backup restoration or system recovery.

## Verification Levels

### Level 1: Basic Verification

- Database connectivity
- Table existence
- Row counts

### Level 2: Data Consistency

- Foreign key integrity
- Index validation
- Checksum verification

### Level 3: Functional Verification

- User authentication
- Document retrieval
- Search functionality
- AI query processing

---

## Automated Verification

### Backup Checksums

Every backup includes SHA-256 checksums that are automatically verified during restoration:

```typescript
// From BackupService
const checksum = createHash('sha256').update(dumpBuffer).digest('hex');
backup.checksums = [{ algorithm: 'sha256', value: checksum }];
```

### Verification Script

Run the automated verification script:

```bash
./scripts/disaster-recovery/verify-backup.sh --latest
```

This will check:

- Backup metadata
- Checksums
- Storage accessibility
- Database connectivity
- Table row counts

---

## Manual Verification Procedures

### 1. Database Connectivity

```bash
# Check PostgreSQL is running
docker-compose exec postgres pg_isready -U postgres

# Connect to database
docker-compose exec postgres psql -U postgres -d legal_ai_db
```

### 2. Table Structure Verification

```sql
-- List all tables
\dt

-- Check table structure
\d users

-- Verify expected tables exist
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected tables:

- `users`
- `legal_documents`
- `legal_queries`
- `document_templates`
- `notifications`
- `in_app_notifications`
- `api_keys`
- `user_preferences`
- `usage_records`
- `backups`

### 3. Row Count Verification

```sql
-- Key table row counts
SELECT
    'users' AS table_name,
    COUNT(*) AS row_count
FROM users
UNION ALL
SELECT
    'legal_documents',
    COUNT(*)
FROM legal_documents
UNION ALL
SELECT
    'legal_queries',
    COUNT(*)
FROM legal_queries
UNION ALL
SELECT
    'notifications',
    COUNT(*)
FROM notifications
ORDER BY row_count DESC;
```

**Baseline Comparison**: Compare these counts with pre-restoration baselines.

### 4. Data Consistency Checks

#### Foreign Key Integrity

```sql
-- Check for orphaned records (example: legal_documents without users)
SELECT COUNT(*) AS orphaned_documents
FROM legal_documents ld
LEFT JOIN users u ON ld.created_by_id = u.id
WHERE u.id IS NULL;

-- Check for broken foreign keys
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE convalidated = false;
```

#### Data Validation

```sql
-- Check for NULL values in critical fields
SELECT
    'users' AS table_name,
    'email' AS column_name,
    COUNT(*) AS null_count
FROM users
WHERE email IS NULL
UNION ALL
SELECT
    'users',
    'password_hash',
    COUNT(*)
FROM users
WHERE password_hash IS NULL
UNION ALL
SELECT
    'legal_documents',
    'title',
    COUNT(*)
FROM legal_documents
WHERE title IS NULL;
```

All critical fields should have null_count = 0.

### 5. Index Verification

```sql
-- Check if indexes are valid
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Verify index sizes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

### 6. Duplicate Detection

```sql
-- Check for duplicate users by email
SELECT email, COUNT(*) AS count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Check for duplicate documents
SELECT title, COUNT(*) AS count
FROM legal_documents
GROUP BY title
HAVING COUNT(*) > 1;
```

---

## Functional Verification

### 1. User Authentication

```bash
# Test login endpoint
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(input: { email: \"test@example.com\", password: \"password\" }) { accessToken user { id } } }"
  }'
```

Expected: Valid JWT token returned or appropriate error.

### 2. Document Retrieval

```bash
# Test document query
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "query { legalDocuments { id title createdAt } }"
  }'
```

Expected: Array of documents or empty array (not error).

### 3. Search Functionality

```bash
# Test search
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "query { searchLegalRulings(search: \"test\") { id title } }"
  }'
```

### 4. AI Query Processing

```bash
# Test AI query
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "mutation { createLegalQuery(input: { question: \"What is contract law?\" }) { id status } }"
  }'
```

---

## Performance Baseline Verification

### Query Performance

```sql
-- Enable timing
\timing on

-- Test query performance
EXPLAIN ANALYZE
SELECT * FROM legal_documents ORDER BY created_at DESC LIMIT 10;

EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'test@example.com';
```

Compare execution times with pre-restoration baselines.

### Database Size

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('legal_ai_db')) AS database_size;

-- Table sizes
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Verification Checklist

Use this checklist after any restoration or recovery operation:

### Database Level

- [ ] PostgreSQL service is running
- [ ] Database `legal_ai_db` exists
- [ ] Can connect to database
- [ ] All expected tables exist
- [ ] No corrupted tables detected
- [ ] No unvalidated constraints

### Data Level

- [ ] User count matches expected baseline
- [ ] Document count matches expected baseline
- [ ] Query count matches expected baseline
- [ ] No orphaned records (broken foreign keys)
- [ ] No critical NULL values in required fields
- [ ] No duplicate emails in users table
- [ ] Checksums verified (if available)

### Application Level

- [ ] Backend service is healthy (`/health` returns 200)
- [ ] User authentication works
- [ ] Document listing works
- [ ] Search functionality works
- [ ] AI queries can be created
- [ ] No error logs in services

### Performance Level

- [ ] Query performance acceptable
- [ ] Database size as expected
- [ ] Index sizes reasonable
- [ ] Response times normal

---

## Troubleshooting

### Issue: Orphaned Records Detected

**Solution**:

```sql
-- Identify orphaned records
SELECT ld.id, ld.title
FROM legal_documents ld
LEFT JOIN users u ON ld.created_by_id = u.id
WHERE u.id IS NULL;

-- Either delete orphans or assign to default user
DELETE FROM legal_documents
WHERE created_by_id NOT IN (SELECT id FROM users);

-- Or reassign
UPDATE legal_documents
SET created_by_id = (SELECT id FROM users ORDER BY created_at LIMIT 1)
WHERE created_by_id NOT IN (SELECT id FROM users);
```

### Issue: Duplicate Records Found

**Solution**:

```sql
-- Find duplicates
SELECT email, COUNT(*)
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Keep oldest, delete newer duplicates
DELETE FROM users
WHERE id IN (
    SELECT id
    FROM (
        SELECT id, email,
            ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at) AS rn
        FROM users
    ) t
    WHERE rn > 1
);
```

### Issue: Index Not Valid

**Solution**:

```sql
-- Reindex specific table
REINDEX TABLE legal_documents;

-- Reindex entire database (use with caution)
REINDEX DATABASE legal_ai_db;
```

### Issue: Performance Degraded

**Solution**:

```sql
-- Update statistics
ANALYZE;

-- Vacuum database
VACUUM ANALYZE;

-- Check for missing indexes
EXPLAIN ANALYZE <your slow query>;
```

---

## Baseline Establishment

Establish baselines before issues occur:

```sql
-- Save baseline counts
CREATE TABLE baseline_counts AS
SELECT
    'users' AS table_name,
    COUNT(*) AS count,
    NOW() AS timestamp
FROM users
UNION ALL
SELECT 'legal_documents', COUNT(*), NOW() FROM legal_documents
UNION ALL
SELECT 'legal_queries', COUNT(*), NOW() FROM legal_queries;

--定期更新 (update periodically)
INSERT INTO baseline_counts
SELECT 'users', COUNT(*), NOW() FROM users
UNION ALL
SELECT 'legal_documents', COUNT(*), NOW() FROM legal_documents
UNION ALL
SELECT 'legal_queries', COUNT(*), NOW() FROM legal_queries;
```

---

## Automated Monitoring

Set up automated monitoring with the backup service:

```typescript
// The BackupService automatically tracks:
// - Backup success/failure rates
// - Backup sizes
// - Last successful backup time
// - Retention policy compliance

// Query via GraphQL:
query GetBackupStats {
  backupStats {
    totalBackups
    activeBackups
    successfulBackups
    failedBackups
    lastSuccessfulBackupDate
  }
}
```

---

## Documentation & Reporting

After verification, document:

1. Restoration date and time
2. Backup ID used
3. Verification results (pass/fail for each check)
4. Any issues found and resolutions
5. Performance metrics
6. Lessons learned

Store in: `docs/disaster-recovery/test-results/`
