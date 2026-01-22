# Disaster Recovery Plan

## Overview

This document outlines the comprehensive disaster recovery (DR) procedures for the Legal AI Platform. It covers database restoration, service failover, data integrity verification, and recovery time objectives.

## Recovery Objectives

### RTO (Recovery Time Objective)
- **Critical Services**: 4 hours
- **Non-Critical Services**: 24 hours

### RPO (Recovery Point Objective)
- **Database**: 24 hours (daily automated backups)
- **User Data**: 24 hours
- **Configuration**: Immediate (stored in git)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Environment                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │   Web    │───▶│ Backend  │───▶│AI Engine │              │
│  └──────────┘    └────┬─────┘    └──────────┘              │
│                       │                                       │
│              ┌────────┴────────┐                            │
│              │                 │                            │
│        ┌─────▼─────┐    ┌─────▼─────┐                       │
│        │ PostgreSQL│    │  Redis   │                        │
│        └───────────┘    └──────────┘                       │
│                                                           │
└───────────────────────────────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────┐
│                    Backup Storage                          │
├───────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐              │
│  │  Local Storage  │    │  S3 / Cloud     │              │
│  │  (Development)  │    │  (Production)   │              │
│  └─────────────────┘    └─────────────────┘              │
└───────────────────────────────────────────────────────────┘
```

## Backup Strategy

### Automated Backups

#### Database Backups
- **Frequency**: Daily at 2:00 AM UTC
- **Method**: PostgreSQL `pg_dump` with custom format
- **Compression**: gzip level 9
- **Retention**:
  - Daily backups: 7 days
  - Weekly backups: 4 weeks
  - Monthly backups: 12 months
  - Maximum retention: 90 days

#### Backup Locations
- **Development**: Local filesystem (`./backups`)
- **Production**: S3-compatible storage (configurable endpoint)

### Backup Components
1. **PostgreSQL Database**: Complete database dump
2. **Metadata**: Backup timestamps, checksums, PostgreSQL version
3. **Configuration**: Environment variables (version controlled)

## Disaster Scenarios

### Scenario 1: Database Corruption

**Severity**: HIGH
**Impact**: Complete system unavailability

#### Detection
- Application errors: `database connection failed`
- PostgreSQL logs: `corruption detected`
- Health checks failing

#### Recovery Steps

1. **Assess the situation**
   ```bash
   # Check PostgreSQL logs
   docker-compose logs postgres | tail -100

   # Check database connectivity
   docker-compose exec postgres pg_isready -U postgres
   ```

2. **Stop application services**
   ```bash
   docker-compose stop backend web ai-engine
   ```

3. **Identify last healthy backup**
   ```bash
   # Via GraphQL API
   curl -X POST http://localhost:3001/graphql \
     -H "Content-Type: application/json" \
     -d '{"query":"query { backups(limit: 5) { id filename createdAt status } }"}'
   ```

4. **Restore database** (see [Database Restoration Procedures](#database-restoration-procedures))

5. **Verify data integrity** (see [Data Integrity Verification](#data-integrity-verification))

6. **Restart services**
   ```bash
   docker-compose start backend web ai-engine
   ```

7. **Verify system health**
   ```bash
   curl http://localhost:3001/health
   ```

#### Recovery Time: 2-4 hours

---

### Scenario 2: Complete Server Failure

**Severity**: CRITICAL
**Impact**: Complete system unavailability

#### Detection
- Server not responding to ping
- All services unreachable
- Monitoring alerts

#### Recovery Steps

1. **Provision new server** (or restore from standby)

2. **Install dependencies**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh

   # Install Docker Compose
   sudo apt-get install docker-compose

   # Clone repository
   git clone <repository-url>
   cd legal
   ```

3. **Configure environment**
   ```bash
   cp .env.production .env
   # Edit .env with production values
   ```

4. **Restore database** (see below)

5. **Start services**
   ```bash
   docker-compose up -d
   ```

6. **Update DNS** (if IP changed)

#### Recovery Time: 4-8 hours

---

### Scenario 3: Data Loss / Accidental Deletion

**Severity**: MEDIUM to HIGH
**Impact**: Partial or complete data loss

#### Detection
- User reports of missing data
- Database queries returning unexpected results
- Application logs showing deletion errors

#### Recovery Steps

1. **Identify affected data**
   ```bash
   # Connect to database
   docker-compose exec postgres psql -U postgres -d legal_ai_db

   # Check record counts
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM legal_documents;
   ```

2. **Determine point-in-time for recovery**
   - Review audit logs
   - Identify when data was lost

3. **Create backup of current state**
   ```bash
   # Before restoring, backup current (possibly corrupted) state
   docker-compose exec backend curl -X POST http://localhost:3001/graphql \
     -H "Content-Type: application/json" \
     -d '{"query":"mutation { createBackup(input: {name: \"pre-restore-snapshot\"}) { id filename } }"}'
   ```

4. **Restore to point-in-time**
   - Select appropriate backup
   - Restore to new database (for verification)
   - Verify restored data
   - Swap databases when verified

#### Recovery Time: 2-6 hours

---

### Scenario 4: Service Degradation

**Severity**: MEDIUM
**Impact**: Slow response times, partial functionality

#### Detection
- Performance monitoring alerts
- User complaints about slowness
- High CPU/memory usage

#### Recovery Steps

1. **Identify bottleneck**
   ```bash
   # Check resource usage
   docker stats

   # Check service health
   docker-compose ps
   curl http://localhost:3001/health
   ```

2. **Scale services** if needed
   ```bash
   docker-compose up -d --scale backend=3 --scale web=2
   ```

3. **Restart affected services**
   ```bash
   docker-compose restart backend
   ```

4. **Clear Redis cache** (if applicable)
   ```bash
   docker-compose exec redis redis-cli FLUSHALL
   ```

#### Recovery Time: 15-60 minutes

---

## Database Restoration Procedures

### Prerequisites

- Access to backup storage (local or S3)
- PostgreSQL client tools (`pg_restore`, `psql`)
- Database credentials
- Sufficient disk space (2x database size)

### Restoration Methods

#### Method 1: Via GraphQL API (Recommended)

This method uses the built-in BackupService which handles:
- Downloading from storage
- Database restoration
- Integrity verification
- Metadata updates

```graphql
# List available backups
query GetBackups {
  backups(limit: 10) {
    id
    filename
    sizeMB
    createdAt
    status
    metadata {
      database
      pgVersion
    }
  }
}

# Restore to existing database (DESTRUCTIVE)
mutation RestoreBackup {
  restoreBackup(input: {
    id: "backup-id-here"
  })
}

# Restore to new database (SAFE - for testing)
mutation RestoreBackupNew {
  restoreBackup(input: {
    id: "backup-id-here"
    createNewDatabase: true
    newDatabaseName: "legal_ai_db_restored"
  })
}
```

#### Method 2: Manual Restoration (Advanced)

```bash
# 1. Download backup from storage
# For local storage:
cp ./backups/2024/01/backup_2024-01-15T02:00:00.000Z.dump /tmp/

# For S3:
aws s3 cp s3://legal-backups/database-backups/2024/01/backup_2024-01-15T02:00:00.000Z.dump /tmp/

# 2. Drop existing database (CAUTION: data loss!)
docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS legal_ai_db;"

# 3. Create new database
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE legal_ai_db;"

# 4. Restore backup
docker-compose exec -T postgres pg_restore -U postgres -d legal_ai_db --clean --if-exists --no-owner --no-acl < /tmp/backup.dump

# 5. Verify restoration
docker-compose exec postgres psql -U postgres -d legal_ai_db -c "\dt"
```

### Point-in-Time Recovery (PITR)

For more granular recovery, you can use WAL (Write-Ahead Log) archives:

1. **Enable WAL archiving** in `postgresql.conf`:
   ```
   wal_level = replica
   archive_mode = on
   archive_command = 'cp %p /wal_archive/%f'
   ```

2. **Recover to specific point**:
   ```bash
   # Restore base backup
   # Then replay WAL logs until target time
   pg_restore -U postgres -d legal_ai_db base_backup.dump
   psql -U postgres -d legal_ai_db -c "SELECT pg_wal_replay_resume();"
   ```

---

## Service Failover Procedures

### Backend Service Failover

```bash
# Check backend health
curl http://localhost:3001/health

# If unhealthy, restart backend
docker-compose restart backend

# If restart fails, rebuild and restart
docker-compose up -d --build backend
```

### AI Engine Failover

```bash
# Check AI engine health
curl http://localhost:8000/health

# Restart AI engine
docker-compose restart ai-engine

# Check logs
docker-compose logs --tail=100 ai-engine
```

### Database Failover

For production, consider setting up:

1. **Streaming Replication**
   - Primary-standby setup
   - Automatic failover with `patroni` or `repmgr`

2. **Connection Pooling**
   - Use `pgBouncer` for connection management
   - Automatic routing to healthy database

Example manual failover:

```bash
# 1. Promote standby to primary
docker-compose exec postgres-standby pg_ctl promote

# 2. Update application connection strings
# Update .env with new primary host

# 3. Restart services
docker-compose restart backend
```

---

## Data Integrity Verification

### Automated Verification

The backup system includes automatic integrity checks:

1. **Checksum Verification**
   - SHA-256 checksums calculated during backup
   - Verified after restoration
   - Stored in backup metadata

2. **Database Consistency Checks**
   ```sql
   -- Check for corrupted tables
   SELECT relname, pg_size_pretty(pg_relation_size(oid)) AS size
   FROM pg_class
   WHERE relkind = 'r'
   ORDER BY pg_relation_size(oid) DESC;

   -- Verify row counts
   SELECT
     schemaname,
     tablename,
     n_live_tup AS row_count
   FROM pg_stat_user_tables
   ORDER BY n_live_tup DESC;
   ```

### Manual Verification Scripts

See `scripts/disaster-recovery/verify-backup.sh` for automated verification.

### Verification Checklist

After restoration, verify:

- [ ] Database accessible
- [ ] User authentication working
- [ ] Document count matches expected
- [ ] Search functionality working
- [ ] AI queries processing
- [ ] No error logs in services
- [ ] Performance baseline acceptable

---

## Communication Plan

### Internal Notification

1. **Detection**: Immediately notify technical team
2. **Assessment**: Initial severity assessment within 15 minutes
3. **Updates**: Every 30 minutes during incident
4. **Resolution**: Post-incident report within 24 hours

### External Communication

1. **Severity Assessment**
   - LOW: No external communication needed
   - MEDIUM: Prepare status page update
   - HIGH/Critical: Public announcement within 1 hour

2. **Status Page**
   - Update incident status
   - Provide ETR (Estimated Time to Repair)
   - Update every 30 minutes

---

## Testing & Drills

### Quarterly DR Testing

1. **Tabletop Exercise**: Review procedures, identify gaps
2. **Simulation Test**: Restore backup to staging environment
3. **Full DR Test**: Complete failover to DR environment

### Test Documentation

Document all test results in `docs/disaster-recovery/test-results/`

---

## Contacts

| Role | Name | Email | Phone |
|------|------|-------|-------|
| DevOps Lead | | | |
| Database Admin | | | |
| Engineering Lead | | | |

---

## Appendix: Quick Reference Commands

### Database
```bash
# Backup
docker-compose exec postgres pg_dump -U postgres -d legal_ai_db -F c -Z 9 > backup.dump

# Restore
docker-compose exec -T postgres pg_restore -U postgres -d legal_ai_db --clean < backup.dump

# Connect
docker-compose exec postgres psql -U postgres -d legal_ai_db
```

### Docker
```bash
# Stop all services
docker-compose down

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Restart service
docker-compose restart backend
```

### Health Checks
```bash
# Backend health
curl http://localhost:3001/health

# AI Engine health
curl http://localhost:8000/health

# Database health
docker-compose exec postgres pg_isready -U postgres
```

---

## Document Version

- **Version**: 1.0.0
- **Last Updated**: 2025-01-22
- **Next Review**: 2025-04-22
