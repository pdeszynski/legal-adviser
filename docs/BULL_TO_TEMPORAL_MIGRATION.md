# Bull to Temporal Migration Guide

This guide covers the zero-downtime migration process from Bull queues to Temporal workflows for the Legal AI Platform.

## Table of Contents

- [Overview](#overview)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Zero-Downtime Migration Strategy](#zero-downtime-migration-strategy)
- [Data Migration Scripts](#data-migration-scripts)
- [Rollback Procedure](#rollback-procedure)
- [Validation Steps](#validation-steps)
- [Production Cutover Procedure](#production-cutover-procedure)
- [Post-Migration Cleanup](#post-migration-cleanup)
- [Environment Variables](#environment-variables)
- [Monitoring and Alerting](#monitoring-and-alerting)
- [Troubleshooting](#troubleshooting)

## Overview

### What's Being Migrated

The following Bull queues are being migrated to Temporal workflows:

| Bull Queue                | Temporal Workflow      | Purpose                       |
| ------------------------- | ---------------------- | ----------------------------- |
| `document-generation`     | `documentGeneration`   | Document generation workflows |
| `document-export-pdf`     | `documentPdfExport`    | PDF document exports          |
| `email-send`              | `emailSending`         | Email delivery                |
| `email-send-welcome`      | `emailSending`         | Welcome emails                |
| `email-send-notification` | `emailSending`         | Notification emails           |
| `notification-push`       | `notificationDelivery` | Push notifications            |
| `ai-process-query`        | `aiQueryProcessing`    | AI query processing           |
| `ai-generate-document`    | `aiDocumentGeneration` | AI document generation        |
| `ruling-index`            | `rulingIndexing`       | Court ruling indexing         |
| `webhook-deliver`         | `webhookDelivery`      | Webhook delivery              |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Migration Phases Overview                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Phase 1: Pre-Migration                    Phase 2: Parallel Run        │
│  ┌──────────────┐                        ┌──────────────┐              │
│  │   Bull Only  │                        │  Bull + Temp │              │
│  │  ──────────  │                        │  ─────────   │              │
│  │  Redis Queue │  ──────────────────►   │  Redis Queue │              │
│  └──────────────┘                        │  Temporal WF │              │
│                                          └──────────────┘              │
│                                                                          │
│  Phase 3: Cutover                        Phase 4: Cleanup              │
│  ┌──────────────┐                        ┌──────────────┐              │
│  │ Temporal Only│  ──────────────────►   │ Temporal Only│              │
│  │  ───────────  │                        │  ───────────  │              │
│  │  Temporal WF │                        │  Temporal WF │              │
│  └──────────────┘                        │  (Bull removed)│             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Pre-Deployment Checklist

### 1. Backup Redis Queues

Before starting the migration, create a complete backup of all Bull queue data:

```bash
# Create backup directory
mkdir -p backups/bull-queues-$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="backups/bull-queues-$(date +%Y%m%d-%H%M%S)"

# Method 1: Using redis-cli (recommended for production)
redis-cli --rdb $BACKUP_DIR/dump.rdb

# Method 2: Export queue data individually
for queue in "document-generation" "email-send" "notification-push" "ai-process-query" "ruling-index" "webhook-deliver"; do
  echo "Backing up queue: $queue"
  redis-cli --scan --pattern "bull:$queue:*" | \
    xargs -I {} redis-cli --raw DUMP {} > "$BACKUP_DIR/$queue.json"
done

# Method 3: Using Bull's built-in export (if available)
cd apps/backend
npm run bull:export -- --output $BACKUP_DIR
```

**Verify backup:**

```bash
# Check backup file exists and has content
ls -lh $BACKUP_DIR/
redis-cli --scan --pattern "bull:*" | wc -l  # Count queues before
```

### 2. Verify Temporal Cluster Health

Ensure the Temporal cluster is operational:

```bash
# For Docker Compose deployment
docker compose -f docker-compose.temporal.yml ps

# Check cluster health
docker exec temporal-frontend tctl --address temporal:7233 cluster health

# Verify namespaces exist
docker exec temporal-frontend tctl --address temporal:7233 namespace describe

# For Kubernetes deployment
kubectl get pods -n temporal
kubectl wait --for=condition=ready pod -l app.kubernetes.io/part-of=temporal-cluster -n temporal --timeout=60s
```

### 3. Prepare Environment Variables

Create a migration-specific environment file:

```bash
# Create migration environment file
cat > .env.migration << 'EOF'
# Migration Configuration
MIGRATION_MODE=true
MIGRATION_DRY_RUN=true
MIGRATION_BATCH_SIZE=50
MIGRATION_MAX_JOBS=0

# Queue Backend Selection (bull = current, temporal = new)
EMAIL_QUEUE_BACKEND=bull
DOCUMENT_QUEUE_BACKEND=bull
AI_QUEUE_BACKEND=bull
RULING_QUEUE_BACKEND=bull
WEBHOOK_QUEUE_BACKEND=bull

# Temporal Configuration
TEMPORAL_CLUSTER_URL=localhost:7233
TEMPORAL_NAMESPACE=production
TEMPORAL_TLS_ENABLED=false
EOF

# Source migration environment
export $(cat .env.migration | xargs)
```

### 4. Verify Worker Configuration

Ensure workers are configured correctly:

```bash
# Check worker configuration exists
cat apps/backend/temporal-config.yml

# Verify workers can connect
cd apps/backend
npm run temporal:worker -- --task-queue document-processing --dry-run
```

### 5. Pre-Migration Validation

Run pre-flight checks:

```bash
# Check current queue depths
cd apps/backend
npm run queues:stats

# Verify no stuck jobs
npm run queues:check-stuck

# Test Temporal connection
npm run temporal:health-check
```

## Zero-Downtime Migration Strategy

### Phase 1: Shadow Mode (Read-Only)

Run Temporal alongside Bull without affecting production:

```bash
# 1. Deploy Temporal workers in shadow mode
export EMAIL_QUEUE_BACKEND=bull
export TEMPORAL_SHADOW_MODE=true

# 2. Start shadow workers that listen but don't process
cd apps/backend
npm run start:workers:shadow

# 3. Verify workers receive events without processing
# Check logs for "Shadow mode: would process job..." messages
```

### Phase 2: Dual Write Mode

Write to both Bull and Temporal:

```bash
# Enable dual write mode
export EMAIL_QUEUE_BACKEND=temporal
export BULL_FALLBACK=true
export TEMPORAL_DUAL_WRITE=true

# Restart application
npm run start:prod

# Monitor both systems:
# - Bull queue depth should decrease
# - Temporal workflow count should increase
```

### Phase 3: Gradual Traffic Shift

Shift traffic incrementally by percentage:

```bash
# Start with 10% Temporal, 90% Bull
export TEMPORAL_TRAFFIC_PERCENTAGE=10
export BULL_FALLBACK=true

# Gradually increase over days:
# Day 1: 10% Temporal
# Day 2: 25% Temporal
# Day 3: 50% Temporal
# Day 4: 75% Temporal
# Day 5: 100% Temporal
```

### Phase 4: Full Cutover

Complete the migration:

```bash
# Set Temporal as primary
export EMAIL_QUEUE_BACKEND=temporal
export BULL_FALLBACK=false
export TEMPORAL_DUAL_WRITE=false

# Restart all services
kubectl rollout restart deployment/backend -n legal-ai
```

## Data Migration Scripts

### Email Queue Migration

Migrate existing email jobs from Bull to Temporal:

```bash
cd apps/backend

# Preview migration (see what will be migrated)
npm run migrate:email:preview

# Dry run (validate without executing)
npm run migrate:email -- --dry-run

# Execute migration with limited batch
npm run migrate:email -- --batch-size 10 --max-jobs 100

# Full migration (all waiting and failed jobs)
npm run migrate:email -- --batch-size 50 --status-filter waiting,failed
```

### Document Generation Migration

Migrate document generation jobs:

```bash
cd apps/backend

# Preview
npm run migrate:document:preview

# Dry run
npm run migrate:document -- --dry-run

# Execute migration
npm run migrate:document -- --batch-size 20

# Full migration
npm run migrate:document -- --max-jobs 0
```

### Batch Migration Script

Migrate all queues in sequence:

```bash
#!/bin/bash
# migrate-all-queues.sh

set -e

BACKEND_DIR="apps/backend"
BACKUP_DIR="backups/bull-queues-$(date +%Y%m%d-%H%M%S)"

# Create backup
echo "Creating backup..."
mkdir -p $BACKUP_DIR
redis-cli --rdb $BACKUP_DIR/dump.rdb

# Migrate each queue
QUEUES=("email" "document" "notification" "ai" "ruling" "webhook")

for queue in "${QUEUES[@]}"; do
  echo "Migrating $queue queue..."

  # Preview
  cd $BACKEND_DIR
  npm run migrate:$queue:preview

  # Dry run
  npm run migrate:$queue -- --dry-run

  # Execute
  npm run migrate:$queue -- --batch-size 50

  echo "$queue migration complete"
done

echo "All queues migrated successfully!"
```

### Migration Progress Monitoring

Monitor migration progress:

```bash
# Real-time queue depths
watch -n 5 'redis-cli --scan --pattern "bull:*" | wc -l'

# Temporal workflow count
watch -n 5 'docker exec temporal-frontend tctl --address temporal:7233 workflow list --query "ExecutionStatus=\"Running\""'

# Migration logs
tail -f apps/backend/logs/migration.log
```

## Rollback Procedure

### Immediate Rollback

If critical issues are detected during migration:

```bash
# 1. Switch back to Bull immediately
export EMAIL_QUEUE_BACKEND=bull
export DOCUMENT_QUEUE_BACKEND=bull
export AI_QUEUE_BACKEND=bull
export RULING_QUEUE_BACKEND=bull
export WEBHOOK_QUEUE_BACKEND=bull

# 2. Restart services
kubectl rollout restart deployment/backend -n legal-ai

# 3. Verify Bull processing
redis-cli --scan --pattern "bull:*:waiting" | wc -l

# 4. Cancel in-flight Temporal workflows (optional)
# Only cancel if workflows are causing issues
docker exec temporal-frontend tctl --address temporal:7233 \
  workflow cancel --query "ExecutionStatus=\"Running\""
```

### Rollback After Partial Migration

If some jobs were already migrated:

```bash
# 1. Re-import Bull queue data from backup
redis-cli --rdb backups/bull-queues-YYYYMMDD-HHMMSS/dump.rdb

# 2. Mark migrated Temporal workflows as completed
cd apps/backend
npm run temporal:complete-migrated --workflow-file migrated-workflow-ids.json

# 3. Switch back to Bull
export EMAIL_QUEUE_BACKEND=bull

# 4. Restart services
systemctl restart legal-ai-backend
```

### Rollback Workflow IDs

If you need to rollback specific migrations:

```bash
# Export migrated workflow IDs
docker exec temporal-frontend tctl --address temporal:7233 \
  workflow list \
  --query "TaskQueue='email-processing' and StartTime>\"$(date -d '1 hour ago' -Iseconds)\"" \
  > migrated-workflows.txt

# Cancel workflows
while read workflow_id; do
  docker exec temporal-frontend tctl --address temporal:7233 \
    workflow cancel \
    --workflow_id $workflow_id
done < migrated-workflows.txt
```

## Validation Steps

### 1. Verify Queue Depths Match

Ensure job counts match between Bull and Temporal:

```bash
# Bull queue depth
redis-cli --scan --pattern "bull:email-send:waiting" | wc -l

# Temporal workflow count (for same workflow)
docker exec temporal-frontend tctl --address temporal:7233 \
  workflow list \
  --query "TaskQueue='email-processing' and ExecutionStatus=\"Running\"" | wc -l

# Compare counts (should match within expected variance)
```

### 2. Monitor Error Rates

Track error rates during migration:

```bash
# Bull error rate
redis-cli --scan --pattern "bull:*:failed" | wc -l

# Temporal failure rate
docker exec temporal-frontend tctl --address temporal:7233 \
  workflow list \
  --query "ExecutionStatus=\"Failed\" and StartTime>\"$(date -d '1 hour ago' -Iseconds)\"" | wc -l

# Check application logs for errors
kubectl logs -f deployment/backend -n legal-ai | grep -i error
```

### 3. Validate Job Processing

Verify jobs are being processed correctly:

```bash
# Check Bull active jobs
redis-cli LLEN "bull:email-send:active"

# Check Temporal running workflows
docker exec temporal-frontend tctl --address temporal:7233 \
  workflow list \
  --query "TaskQueue='email-processing' and ExecutionStatus=\"Running\""

# Verify email delivery (example)
# Check if emails are being sent successfully
kubectl logs -f deployment/backend -n legal-ai | grep "Email sent"
```

### 4. End-to-End Validation

Test complete workflows:

```bash
# Submit test job via Bull
curl -X POST https://api.example.com/emails/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "subject": "Migration Test", "template": "test"}'

# Verify job appears in Bull
redis-cli LLEN "bull:email-send:waiting"

# After cutover, verify job appears in Temporal
docker exec temporal-frontend tctl --address temporal:7233 \
  workflow list \
  --query "TaskQueue='email-processing'" | grep test@example.com
```

### 5. Performance Validation

Compare performance metrics:

```bash
# Bull processing time (from logs)
grep "Processed email job" /var/log/backend/app.log | \
  tail -100 | \
  awk '{print $NF}' | \
  awk '{sum+=$1; count++} END {print "Avg:", sum/count "ms"}'

# Temporal workflow execution time
docker exec temporal-frontend tctl --address temporal:7233 \
  workflow list \
  --query "TaskQueue='email-processing' and ExecutionStatus=\"Completed\"" \
  --fields "workflowId,executionDuration"
```

## Production Cutover Procedure

### Step 1: Pre-Cutover Preparation

```bash
# 1. Schedule maintenance window (typically low-traffic period)
# 2. Notify stakeholders
# 3. Prepare rollback plan

# 4. Final backup before cutover
BACKUP_DIR="backups/pre-cutover-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
redis-cli --rdb $BACKUP_DIR/dump.rdb

# 5. Verify Temporal is ready
kubectl get pods -n temporal
docker exec temporal-frontend tctl --address temporal:7233 cluster health
```

### Step 2: Drain Bull Queues

Process remaining Bull jobs before cutover:

```bash
# 1. Stop accepting new jobs in Bull
redis-cli CLIENT PAUSE 5000  # Brief pause

# 2. Wait for active jobs to complete
while [ $(redis-cli LLEN "bull:email-send:active") -gt 0 ]; do
  echo "Waiting for active jobs..."
  sleep 5
done

# 3. Verify waiting jobs count
redis-cli --scan --pattern "bull:*:waiting" | wc -l
```

### Step 3: Migrate Remaining Jobs

```bash
# 1. Migrate any remaining waiting jobs
cd apps/backend
npm run migrate:all -- --force --status-filter waiting

# 2. Verify migration complete
redis-cli --scan --pattern "bull:*:waiting" | wc -l  # Should be 0 or near 0
```

### Step 4: Switch to Temporal

```bash
# 1. Update environment variables
cat > /etc/legal-ai/backend.env << 'EOF'
EMAIL_QUEUE_BACKEND=temporal
DOCUMENT_QUEUE_BACKEND=temporal
AI_QUEUE_BACKEND=temporal
RULING_QUEUE_BACKEND=temporal
WEBHOOK_QUEUE_BACKEND=temporal
BULL_FALLBACK=false
TEMPORAL_DUAL_WRITE=false
EOF

# 2. Rolling restart of backend services
kubectl rollout restart deployment/backend -n legal-ai

# 3. Wait for rollout to complete
kubectl rollout status deployment/backend -n legal-ai

# 4. Verify Temporal processing
docker exec temporal-frontend tctl --address temporal:7233 \
  workflow list --query "TaskQueue='email-processing'"
```

### Step 5: Post-Cutover Validation

```bash
# 1. Monitor Temporal for 15 minutes
watch -n 30 'docker exec temporal-frontend tctl --address temporal:7233 \
  workflow list --query "ExecutionStatus=\"Running\"" | wc -l'

# 2. Check error rates
kubectl logs -f deployment/backend -n legal-ai | grep -i error

# 3. Verify end-to-end functionality
# Run smoke tests
npm run test:smoke

# 4. Monitor metrics
open http://grafana.example.com/d/temporal-overview
```

## Post-Migration Cleanup

### 1. Deprecate Bull Queue Code

After successful migration (typically 30 days post-cutover):

```bash
# Remove Bull queue processors
# apps/backend/src/modules/notifications/queues/email.queue.ts
# apps/backend/src/modules/documents/queues/document.queue.ts

# Remove Bull dependencies
npm uninstall @nestjs/bull bull
```

### 2. Remove Bull Infrastructure

```bash
# 1. Stop Bull queues from processing
# Remove Bull queue processors from code

# 2. Clean up Redis keys (after 30 days)
redis-cli --scan --pattern "bull:*" | xargs redis-cli DEL

# 3. Update Redis configuration
# Remove Bull-specific memory limits if any
```

### 3. Update Monitoring

```bash
# Remove Bull queue metrics from dashboards
# Add Temporal-specific alerts

# Update Grafana dashboards
kubectl apply -f k8s/temporal/base/grafana-dashboards.yml
```

### 4. Update Documentation

Update operational documentation:

```bash
# Update runbooks to reference Temporal instead of Bull
# Update on-call procedures
# Update deployment documentation
```

### 5. Cleanup Timeline

| Task                      | Timeline                               |
| ------------------------- | -------------------------------------- |
| Stop Bull processors      | Immediately after cutover verification |
| Remove Bull code          | 30 days post-cutover                   |
| Clean up Redis            | 30 days post-cutover                   |
| Remove Bull dependencies  | 60 days post-cutover                   |
| Archive old Bull runbooks | 90 days post-cutover                   |

## Environment Variables

### Migration Configuration

| Variable               | Description                       | Default | Required |
| ---------------------- | --------------------------------- | ------- | -------- |
| `MIGRATION_MODE`       | Enable migration mode             | `false` | Yes      |
| `MIGRATION_DRY_RUN`    | Preview changes without executing | `true`  | No       |
| `MIGRATION_BATCH_SIZE` | Jobs per batch                    | `50`    | No       |
| `MIGRATION_MAX_JOBS`   | Max jobs to migrate (0 = all)     | `0`     | No       |

### Queue Backend Selection

| Variable                 | Description            | Valid Values       |
| ------------------------ | ---------------------- | ------------------ |
| `EMAIL_QUEUE_BACKEND`    | Email queue backend    | `bull`, `temporal` |
| `DOCUMENT_QUEUE_BACKEND` | Document queue backend | `bull`, `temporal` |
| `AI_QUEUE_BACKEND`       | AI queue backend       | `bull`, `temporal` |
| `RULING_QUEUE_BACKEND`   | Ruling queue backend   | `bull`, `temporal` |
| `WEBHOOK_QUEUE_BACKEND`  | Webhook queue backend  | `bull`, `temporal` |

### Fallback Configuration

| Variable                      | Description                         | Default |
| ----------------------------- | ----------------------------------- | ------- |
| `BULL_FALLBACK`               | Fall back to Bull on Temporal error | `true`  |
| `TEMPORAL_DUAL_WRITE`         | Write to both Bull and Temporal     | `false` |
| `TEMPORAL_TRAFFIC_PERCENTAGE` | Percentage of traffic to Temporal   | `100`   |

### Production Temporal Configuration

```bash
# Production Cluster Configuration
TEMPORAL_CLUSTER_URL=temporal-frontend.temporal.svc.cluster.local:7233
TEMPORAL_NAMESPACE=production
TEMPORAL_TLS_ENABLED=true
TEMPORAL_SERVER_NAME=temporal.production.local
TEMPORAL_SERVER_ROOT_CA_CERT_PATH=/etc/tls/ca.crt
TEMPORAL_CLIENT_CERT_PATH=/etc/tls/client.crt
TEMPORAL_CLIENT_PRIVATE_KEY_PATH=/etc/tls/client.key

# Cluster Settings
TEMPORAL_CLUSTER_NAME=legal-ai-temporal
TEMPORAL_HISTORY_SHARDS=512

# Worker Configuration
TEMPORAL_TASK_QUEUE=legal-ai-task-queue
TEMPORAL_WORKER_COUNT=4
TEMPORAL_MAX_CONCURRENT_WORKFLOW_TASKS=200
TEMPORAL_MAX_CONCURRENT_ACTIVITIES=100

# Timeout Configuration
TEMPORAL_WORKFLOW_EXECUTION_TIMEOUT=60m
TEMPORAL_WORKFLOW_TASK_TIMEOUT=10s
TEMPORAL_ACTIVITY_TIMEOUT=30s
TEMPORAL_RETRY_MAXIMUM_ATTEMPTS=5
```

## Monitoring and Alerting

### Key Metrics to Monitor

| Metric                                 | Description                        | Alert Threshold |
| -------------------------------------- | ---------------------------------- | --------------- |
| `temporal_workflow_success_rate`       | Percentage of successful workflows | < 95%           |
| `temporal_workflow_execution_duration` | Workflow execution time            | > 5 minutes p95 |
| `temporal_activity_failure_rate`       | Activity failure percentage        | > 5%            |
| `temporal_worker_task_queue_lag`       | Tasks pending per worker           | > 1000          |
| `temporal_pending_workflow_task_count` | Pending workflow tasks             | > 10000         |

### Grafana Dashboard Queries

```promql
# Workflow Success Rate
sum(rate(temporal_workflow_execution_duration_seconds_count{status="completed"}[5m])) /
sum(rate(temporal_workflow_execution_duration_seconds_count[5m])) * 100

# Workflow Execution Duration (p95)
histogram_quantile(0.95,
  sum(rate(temporal_workflow_execution_duration_seconds_bucket[5m])) by (le)
)

# Activity Failure Rate
sum(rate(temporal_activity_execution_failed_total[5m])) /
sum(rate(temporal_activity_execution_total[5m])) * 100

# Task Queue Backlog
temporal_task_queue_backlog{task_queue=~"legal-ai.*"}
```

### AlertManager Rules

```yaml
# prometheus-alerts.yml
groups:
  - name: temporal_migration
    interval: 30s
    rules:
      - alert: HighWorkflowFailureRate
        expr: |
          sum(rate(temporal_workflow_failed_total[5m])) /
          sum(rate(temporal_workflow_completed_total[5m])) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High workflow failure rate'
          description: 'Workflow failure rate is above 5%'

      - alert: TemporalWorkerDown
        expr: up{job="temporal-worker"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: 'Temporal worker is down'
          description: 'No temporal worker has been up for 2 minutes'

      - alert: TaskQueueBacklogHigh
        expr: temporal_task_queue_backlog > 10000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: 'Task queue backlog is high'
          description: 'Task queue {{ $labels.task_queue }} has {{ $value }} pending tasks'
```

### Migration Health Check Script

```bash
#!/bin/bash
# check-migration-health.sh

# Check Temporal cluster health
echo "Checking Temporal cluster health..."
docker exec temporal-frontend tctl --address temporal:7233 cluster health

# Check queue depths
echo -e "\nQueue depths:"
for queue in "email-processing" "document-processing" "ai-query-processing"; do
  count=$(docker exec temporal-frontend tctl --address temporal:7233 \
    task-queue describe --task-queue $queue 2>/dev/null | \
    grep -oP "pendingTaskCount: \K\d+" || echo "0")
  echo "$queue: $count pending tasks"
done

# Check error rates
echo -e "\nError rates (last 5 minutes):"
curl -s http://prometheus:9090/api/v1/query?query='sum(rate(temporal_workflow_failed_total[5m]))' | \
  jq -r '.data.result[0].value[1]'

# Check worker status
echo -e "\nWorker status:"
kubectl get pods -n legal-ai -l worker=temporal
```

## Troubleshooting

### Issue: Jobs Not Migrating

**Symptoms:**

- Migration shows 0 jobs processed
- Bull queue still has waiting jobs

**Diagnosis:**

```bash
# Check Bull queue state
redis-cli --scan --pattern "bull:*:waiting" | wc -l

# Check migration logs
tail -f apps/backend/logs/migration.log

# Verify Temporal connection
npm run temporal:health-check
```

**Solution:**

```bash
# Verify migration options
npm run migrate:email -- --dry-run --verbose

# Check worker permissions
kubectl auth can-i create workflows.temporal.io

# Re-run migration with smaller batch
npm run migrate:email -- --batch-size 10
```

### Issue: High Workflow Failure Rate

**Symptoms:**

- Many workflows failing after cutover
- Error rates > 5%

**Diagnosis:**

```bash
# List failed workflows
docker exec temporal-frontend tctl --address temporal:7233 \
  workflow list \
  --query "ExecutionStatus=\"Failed\"" \
  --fields "workflowId,type,failedHistoryLength"

# Describe specific failed workflow
docker exec temporal-frontend tctl --address temporal:7233 \
  workflow describe \
  --workflow_id <workflow-id>
```

**Solution:**

```bash
# 1. Check activity implementation
# 2. Verify retry policies
# 3. Enable fallback to Bull temporarily
export BULL_FALLBACK=true
export EMAIL_QUEUE_BACKEND=bull

# 4. Restart services
kubectl rollout restart deployment/backend -n legal-ai
```

### Issue: Temporal Workers Not Processing

**Symptoms:**

- Workflows stuck in "Running" state
- No activity being processed

**Diagnosis:**

```bash
# Check worker pods
kubectl get pods -n legal-ai -l worker=temporal

# Check worker logs
kubectl logs -f deployment/backend -n legal-ai | grep -i temporal

# Verify task queue
docker exec temporal-frontend tctl --address temporal:7233 \
  task-queue describe --task-queue email-processing
```

**Solution:**

```bash
# 1. Restart workers
kubectl rollout restart deployment/backend -n legal-ai

# 2. Verify worker configuration
kubectl describe pod -n legal-ai -l worker=temporal

# 3. Check task queue registration
docker exec temporal-frontend tctl --address temporal:7233 \
  task-queue describe --task-queue email-processing
```

### Issue: Memory Leaks During Migration

**Symptoms:**

- High memory usage during migration
- Migration slows down over time

**Solution:**

```bash
# 1. Reduce batch size
npm run migrate:email -- --batch-size 10

# 2. Add delays between batches
npm run migrate:email -- --batch-delay 1000

# 3. Run migration during off-peak hours

# 4. Monitor memory
kubectl top pod -n legal-ai -l worker=temporal
```

### Emergency Contacts

| Issue Type              | Contact          | Escalation |
| ----------------------- | ---------------- | ---------- |
| Platform Down           | On-call Engineer | 15 min     |
| Data Loss               | Engineering Lead | Immediate  |
| Performance Degradation | Team Lead        | 1 hour     |
| Migration Questions     | Temporal SME     | 4 hours    |

## Additional Resources

- [Temporal Documentation](https://docs.temporal.io/)
- [Temporal Server Operations](https://docs.temporal.io/server)
- [Migration Best Practices](https://docs.temporal.io/docs/nested-workflows#migration-guide)
- Internal: [TEMPORAL_DEPLOYMENT.md](./TEMPORAL_DEPLOYMENT.md)
