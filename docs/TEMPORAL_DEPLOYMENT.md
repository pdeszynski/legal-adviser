# Temporal Production Deployment Guide

This guide covers deploying a production-grade Temporal cluster for the Legal AI Platform.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Docker Compose Deployment](#docker-compose-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Configuration](#configuration)
- [Monitoring and Observability](#monitoring-and-observability)
- [Archival](#archival)
- [Security](#security)
- [Maintenance](#maintenance)
- [Bull Queue Migration](./BULL_TO_TEMPORAL_MIGRATION.md)

## Overview

The Temporal deployment provides:

- **High Availability**: Replicated services (frontend, history, matching, worker)
- **Persistence**: PostgreSQL for primary storage
- **Visibility**: Elasticsearch for workflow search and visibility
- **Monitoring**: Prometheus metrics with Grafana dashboards
- **Alerting**: AlertManager for proactive monitoring
- **Archival**: Long-term workflow history archival
- **Security**: TLS/SSL for service communication

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Temporal Cluster                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │  Frontend  │  │  History   │  │  Matching  │  │   Worker   ││
│  │   (x3)     │  │   (x5)     │  │   (x3)     │  │   (x3)     ││
│  │  Port:7233 │  │  Port:7234 │  │  Port:7235 │  │  Port:7236 ││
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘│
│        │                │                │                │      │
│        └────────────────┴────────────────┴────────────────┘      │
│                                 │                                │
├─────────────────────────────────┼────────────────────────────────┤
│                                  │                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │ PostgreSQL │  │Elasticsearch│  │   Temporal  │                 │
│  │  Primary   │  │  Visibility │  │     UI     │                 │
│  └────────────┘  └────────────┘  └────────────┘                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     Monitoring & Observability                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │ Prometheus │  │  Grafana   │  │AlertManager│                 │
│  │  Metrics   │  │  Dashboards│  │  Alerting  │                 │
│  └────────────┘  └────────────┘  └────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

### General Requirements

- Docker 20.10+ and Docker Compose 2.0+
- OR Kubernetes 1.25+ with kubectl configured
- At least 32GB RAM available
- 200GB+ SSD storage

### For Kubernetes Deployment

- Kubernetes cluster with minimum 6 nodes (16 cores, 64GB RAM recommended)
- StorageClass configured for PVC provisioning
- cert-manager installed (for TLS certificates)
- Ingress controller (nginx recommended)

### Cloud Storage (for archival)

- AWS S3, GCS, or Azure Blob Storage account
- Or NFS mount for file-based archival

## Deployment Options

### Option 1: Docker Compose (Self-Hosted)

Best for:

- Single-server deployments
- Development and staging environments
- Smaller production workloads

### Option 2: Kubernetes (Production)

Best for:

- Large-scale production deployments
- Multi-AZ/region deployments
- Auto-scaling requirements

## Docker Compose Deployment

### Step 1: Create Environment File

Create a `.env.temporal` file:

```bash
# PostgreSQL Configuration
TEMPORAL_POSTGRES_USER=temporal
TEMPORAL_POSTGRES_PASSWORD=your-secure-password-here
TEMPORAL_POSTGRES_DB=temporal
TEMPORAL_POSTGRES_PORT=5433

# Temporal Configuration
TEMPORAL_CLUSTER_NAME=legal-ai-temporal
TEMPORAL_ADDRESS=0.0.0.0:7233
TEMPORAL_NAMESPACE=default,production
TEMPORAL_HISTORY_SHARDS=512

# TLS Configuration (optional, for production)
TEMPORAL_TLS_ENABLED=false
TEMPORAL_TLS_SERVER_NAME=
TEMPORAL_TLS_CERT_FILE=
TEMPORAL_TLS_KEY_FILE=

# UI Configuration
TEMPORAL_UI_PORT=8088
TEMPORAL_CORS_ORIGINS=https://temporal.yourdomain.com,http://localhost:3000

# Grafana Configuration
TEMPORAL_GRAFANA_USER=admin
TEMPORAL_GRAFANA_PASSWORD=your-secure-grafana-password

# Archival Configuration
TEMPORAL_ARCHIVE_BUCKET=temporal-archive-legal-ai
AWS_REGION=us-east-1

# Alerting
ALERTMANAGER_SLACK_API_URL=https://hooks.slack.com/...
ALERTMANAGER_CRITICAL_EMAIL=ops@yourdomain.com
```

### Step 2: Start the Cluster

```bash
# Load environment variables
export $(cat .env.temporal | xargs)

# Start Temporal cluster
docker compose -f docker-compose.temporal.yml up -d

# Verify services are running
docker compose -f docker-compose.temporal.yml ps
```

### Step 3: Verify Deployment

```bash
# Check cluster health
docker exec legal-ai-temporal tctl --address temporal:7233 cluster health

# Access Temporal UI
open http://localhost:8088

# Access Grafana
open http://localhost:3001
# Login with admin / your-secure-grafana-password
```

## Kubernetes Deployment

### Step 1: Install Prerequisites

```bash
# Install cert-manager for TLS certificates
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Verify installation
kubectl get pods -n cert-manager
```

### Step 2: Create Namespace

```bash
kubectl create namespace temporal
```

### Step 3: Configure Secrets

```bash
# Update secrets in k8s/temporal/base/secrets.yaml
# Or use external secret operator for production

# Create TLS secrets (if using cert-manager, skip this)
kubectl create secret tls temporal-tls \
  --cert=path/to/server.crt \
  --key=path/to/server.key \
  --namespace=temporal

# Create database secret
kubectl create secret generic temporal-postgres-credentials \
  --from-literal=password=your-secure-password \
  --namespace=temporal
```

### Step 4: Deploy Base Configuration

```bash
# Apply base manifests
kubectl apply -k k8s/temporal/base

# Verify deployment
kubectl get pods -n temporal
kubectl get svc -n temporal
```

### Step 5: Deploy Production Overlay

```bash
# Apply production overlay with TLS and increased replicas
kubectl apply -k k8s/temporal/overlays/production

# Verify all pods are running
kubectl wait --for=condition=ready pod -l app.kubernetes.io/part-of=temporal-cluster -n temporal --timeout=300s
```

### Step 6: Expose Services

Create Ingress for UI access:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: temporal-ui
  namespace: temporal
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - temporal.yourdomain.com
      secretName: temporal-ui-tls
  rules:
    - host: temporal.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: temporal-ui
                port:
                  number: 8088
```

### Step 7: Connect Backend to Temporal

Update backend environment variables:

```yaml
env:
  - name: TEMPORAL_CLUSTER_URL
    value: 'temporal-frontend.temporal.svc.cluster.local:7233'
  - name: TEMPORAL_NAMESPACE
    value: 'production'
  - name: TEMPORAL_TLS_ENABLED
    value: 'true'
  - name: TEMPORAL_SERVER_NAME
    value: 'temporal.production.local'
  - name: TEMPORAL_SERVER_ROOT_CA_CERT_PATH
    value: '/etc/tls/ca.crt'
  - name: TEMPORAL_CLIENT_CERT_PATH
    value: '/etc/tls/client.crt'
  - name: TEMPORAL_CLIENT_PRIVATE_KEY_PATH
    value: '/etc/tls/client.key'
```

## Configuration

### Environment Variables

| Variable                  | Description               | Default               | Required |
| ------------------------- | ------------------------- | --------------------- | -------- |
| `TEMPORAL_CLUSTER_URL`    | Temporal frontend address | `localhost:7233`      | Yes      |
| `TEMPORAL_NAMESPACE`      | Temporal namespace        | `default`             | No       |
| `TEMPORAL_TLS_ENABLED`    | Enable TLS                | `false`               | No       |
| `TEMPORAL_TASK_QUEUE`     | Default task queue        | `legal-ai-task-queue` | No       |
| `TEMPORAL_HISTORY_SHARDS` | Number of history shards  | `512`                 | No       |

### Worker Configuration

Worker configuration is defined in `temporal-config.yml`:

```yaml
production:
  workerPools:
    - name: 'document-processing'
      taskQueue: 'document-processing'
      workerCount: 4
      maxConcurrentWorkflowTasks: 200
      maxConcurrentActivities: 100
```

### Namespace Configuration

Register a new namespace:

```bash
# Using tctl
tctl --address temporal-frontend:7233 namespace register --namespace production
tctl --address temporal-frontend:7233 namespace describe --namespace production
```

## Monitoring and Observability

### Prometheus Metrics

Access metrics at:

- Frontend: `http://temporal-frontend:9090/metrics`
- History: `http://temporal-history:9091/metrics`
- Matching: `http://temporal-matching:9092/metrics`
- Worker: `http://temporal-worker:9093/metrics`

### Grafana Dashboards

1. Access Grafana at `http://localhost:3001` (Docker) or via Ingress (Kubernetes)
2. Login with configured credentials
3. Navigate to Dashboards → Temporal

Pre-built dashboards include:

- **Temporal Cluster Overview**: Overall cluster health
- **Workflow Throughput**: Workflow execution metrics
- **Activity Metrics**: Activity execution metrics
- **Service Health**: Individual service health

### Alerts

Alerts are configured in `prometheus-alerts.yml`:

| Alert                      | Severity | Description                 |
| -------------------------- | -------- | --------------------------- |
| `TemporalFrontendDown`     | Critical | Frontend service is down    |
| `TemporalHistoryDown`      | Critical | History service is down     |
| `HighWorkflowFailureRate`  | Warning  | Workflow failure rate > 10% |
| `WorkflowExecutionTimeout` | Warning  | High workflow timeout rate  |

Configure AlertManager to receive notifications:

- Slack: Update `ALERTMANAGER_SLACK_API_URL`
- Email: Update `ALERTMANAGER_*` environment variables

## Archival

### Enabling Archival

Archival is configured in `config/archival.yml`.

For S3 archival:

```yaml
archival:
  history:
    state:
      enabled: true
      provider: 's3'
      s3:
        region: 'us-east-1'
        bucket: 'temporal-archive-legal-ai'
        prefix: 'history/'
```

### Configure Namespace for Archival

```bash
# Using tctl
tctl namespace update \
  --namespace production \
  --history_archival_state enabled \
  --history_archival_uri "s3://temporal-archive-legal-ai/history/?region=us-east-1"
```

### Querying Archived Workflows

```bash
# List archived workflows
tctl workflow list --archived

# Describe archived workflow
tctl workflow describe \
  --workflow_id my-workflow-id \
  --run_id my-run-id \
  --archived
```

## Security

### TLS Configuration

For production, enable TLS for all service communication:

```yaml
# In k8s/temporal/overlays/production/kustomization.yml
patches:
  - path: patches-tls.yaml
    target:
      kind: Deployment
```

Generate certificates:

```bash
# Using cert-manager (recommended)
kubectl apply -f k8s/temporal/overlays/production/tls-config.yaml

# Or manually with OpenSSL
openssl genrsa -out ca.key 2048
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 -out ca.crt
# ... create server and client certificates
```

### UI Authentication

Configure OAuth2 proxy for UI authentication:

```yaml
# In ui.yaml
env:
  - name: OAUTH2_PROXY_ENABLED
    value: 'true'
  - name: OAUTH2_PROXY_CLIENT_ID
    value: 'your-client-id'
  - name: OAUTH2_PROXY_CLIENT_SECRET
    value: 'your-client-secret'
```

### Network Policies

Restrict network access with NetworkPolicy:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: temporal-network-policy
  namespace: temporal
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/part-of: temporal-cluster
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: temporal
      ports:
        - protocol: TCP
          port: 7233 # Frontend
```

## Maintenance

### Backup

```bash
# PostgreSQL backup
kubectl exec -n temporal temporal-postgres-0 -- \
  pg_dump -U temporal temporal > temporal-backup.sql

# Elasticsearch snapshot
kubectl exec -n temporal temporal-elasticsearch-0 -- \
  curl -X PUT "localhost:9200/_snapshot/backup/snapshot_1"
```

### Restore

```bash
# PostgreSQL restore
kubectl exec -i -n temporal temporal-postgres-0 -- \
  psql -U temporal temporal < temporal-backup.sql
```

### Upgrade

```bash
# Kubernetes rollout
kubectl set image deployment/temporal-frontend \
  frontend=temporalio/server:latest-version -n temporal

# Docker Compose
docker compose -f docker-compose.temporal.yml pull
docker compose -f docker-compose.temporal.yml up -d
```

### Scaling

```bash
# Kubernetes - autoscaling
kubectl autoscale deployment temporal-history \
  --min=3 --max=10 --cpu-percent=70 -n temporal

# Manual scaling
kubectl scale deployment temporal-history --replicas=5 -n temporal
```

## Troubleshooting

### Common Issues

**Issue**: Workers unable to connect to Temporal

- **Solution**: Verify `TEMPORAL_CLUSTER_URL` and TLS certificates

**Issue**: High workflow failure rate

- **Solution**: Check worker logs, increase worker count

**Issue**: UI shows "Connection refused"

- **Solution**: Verify frontend service is accessible

### Logs

```bash
# Kubernetes
kubectl logs -f deployment/temporal-frontend -n temporal
kubectl logs -f deployment/temporal-history -n temporal

# Docker Compose
docker compose -f docker-compose.temporal.yml logs -f temporal-frontend
```

### Health Checks

```bash
# Check cluster health
tctl --address temporal-frontend:7233 cluster health

# Check namespace
tctl --address temporal-frontend:7233 namespace describe

# Check task queues
tctl --address temporal-frontend:7233 task-queue describe
```

## Resources

- [Temporal Documentation](https://docs.temporal.io/)
- [Temporal Server Operations](https://docs.temporal.io/server)
- [Temporal Deployment Guide](https://docs.temporal.io/server/deployment)
