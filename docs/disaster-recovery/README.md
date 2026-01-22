# Disaster Recovery Documentation

This directory contains comprehensive disaster recovery documentation and procedures for the Legal AI Platform.

## Documentation

### [DISASTER_RECOVERY_PLAN.md](./DISASTER_RECOVERY_PLAN.md)
Complete disaster recovery plan covering:
- Recovery objectives (RTO/RPO)
- Architecture overview
- Backup strategy
- Disaster scenarios and response procedures
- Database restoration
- Service failover
- Communication plan
- Testing & drills
- Quick reference commands

### [DATA_INTEGRITY_VERIFICATION.md](./DATA_INTEGRITY_VERIFICATION.md)
Data integrity verification procedures:
- Verification levels (basic, consistency, functional)
- Automated verification with checksums
- Manual verification procedures
- SQL verification queries
- Functional testing
- Performance baselines
- Troubleshooting guide

## Scripts

### [restore-database.sh](../../scripts/disaster-recovery/restore-database.sh)
Database restoration script with support for:
- Restoring from backup ID (via GraphQL API)
- Restoring from local backup files
- Creating new databases (non-destructive testing)
- Database connectivity checks
- Automated verification after restoration

Usage:
```bash
# Restore from backup ID
./restore-database.sh --backup-id abc123-def456

# Restore to new database
./restore-database.sh --file /tmp/backup.dump --new-db legal_ai_db_restored

# Show help
./restore-database.sh --help
```

### [verify-backup.sh](../../scripts/disaster-recovery/verify-backup.sh)
Backup verification script that checks:
- Backup metadata integrity
- Checksum verification
- Storage accessibility
- Database connectivity
- Table structure
- Row counts

Usage:
```bash
# Verify latest backup
./verify-backup.sh --latest

# Verify specific backup
./verify-backup.sh --backup-id abc123-def456

# Show help
./verify-backup.sh --help
```

### [service-failover.sh](../../scripts/disaster-recovery/service-failover.sh)
Service failover and restart management:
- Check service health status
- Restart individual services
- Full failover procedure
- All service status overview

Usage:
```bash
# Check all services
./service-failover.sh check all

# Restart backend
./service-failover.sh restart backend

# Full failover
./service-failover.sh failover all

# Show help
./service-failover.sh --help
```

## Quick Reference

### Emergency Contacts
- DevOps Lead: [Add contact]
- Database Admin: [Add contact]
- Engineering Lead: [Add contact]

### Common Commands

**Check service health:**
```bash
./scripts/disaster-recovery/service-failover.sh check all
```

**Restore database:**
```bash
./scripts/disaster-recovery/restore-database.sh --backup-id <ID>
```

**Verify backup:**
```bash
./scripts/disaster-recovery/verify-backup.sh --latest
```

**View logs:**
```bash
docker-compose logs -f postgres
docker-compose logs -f backend
```

### Recovery Time Objectives
- Critical Services: 4 hours
- Non-Critical Services: 24 hours
- Database RPO: 24 hours

## Testing

### Quarterly Testing Schedule
1. **Q1**: Tabletop exercise (review procedures)
2. **Q2**: Simulation test (restore to staging)
3. **Q3**: Full DR test (complete failover)
4. **Q4**: Review and update documentation

### Test Results
Document all test results in:
```
docs/disaster-recovery/test-results/YYYY-MM-DD-test-name.md
```

## Maintenance

### Regular Updates
- Review and update this documentation quarterly
- Update contact information as needed
- Add lessons learned from incidents
- Update baseline metrics after major changes

### Backup Configuration
Environment variables for backup configuration:
- `BACKUP_STORAGE_TYPE`: local or s3
- `BACKUP_RETENTION_DAILY`: 7
- `BACKUP_RETENTION_WEEKLY`: 4
- `BACKUP_RETENTION_MONTHLY`: 12
- `BACKUP_RETENTION_DAYS`: 90

See `apps/backend/.env.example` for full configuration.

## Support

For questions or issues with disaster recovery procedures:
1. Check this documentation first
2. Review logs: `docker-compose logs`
3. Contact the DevOps team
4. Create an incident ticket

---

**Last Updated**: 2025-01-22
**Version**: 1.0.0
**Next Review**: 2025-04-22
