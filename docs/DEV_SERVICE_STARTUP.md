# Development Service Startup Order

This document describes the proper startup sequence for development services in the Legal AI Platform.

## Service Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                     Infrastructure Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  1. PostgreSQL (port 5432)    - Database for Backend           │
│  2. Redis (port 6379)         - Queue/Cache for Backend         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AI Services Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  3. AI Engine (port 8000)      - FastAPI/Python AI Service     │
│     ├─ Health Check: GET /health                                │
│     ├─ API Docs: http://localhost:8000/docs                     │
│     └─ Startup time: ~10-30 seconds (uvicorn with dependencies)│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Application Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  4. Backend (port 3001)         - NestJS GraphQL API            │
│     ├─ GraphQL: http://localhost:3001/graphql                   │
│     ├─ Depends on: PostgreSQL, Redis, AI Engine                 │
│     └─ Startup time: ~5-15 seconds                              │
│                                                                  │
│  5. Frontend (port 3000)         - Next.js Web UI               │
│     ├─ Web UI: http://localhost:3000                            │
│     ├─ Depends on: Backend (GraphQL API)                        │
│     └─ Startup time: ~10-20 seconds                             │
└─────────────────────────────────────────────────────────────────┘
```

## Startup Sequence

### Phase 1: Infrastructure

1. **PostgreSQL** - Must be healthy before Backend starts
2. **Redis** - Must be healthy before Backend starts

### Phase 2: AI Services

3. **AI Engine** - Backend validates availability on startup
   - In production: Required, fails startup if unavailable
   - In development: Optional, logs warning if unavailable
   - Set `SKIP_AI_ENGINE_CHECK=true` to skip validation

### Phase 3: Application

4. **Backend** - Waits for AI Engine health check
5. **Frontend** - Starts after Backend (for GraphQL introspection)

## Environment Variables

### AI Engine Configuration

| Variable               | Description                            | Default                 | Required |
| ---------------------- | -------------------------------------- | ----------------------- | -------- |
| `AI_ENGINE_URL`        | AI Engine base URL                     | `http://localhost:8000` | No       |
| `SKIP_AI_ENGINE_CHECK` | Skip AI Engine health check on startup | `false`                 | No       |

### Infrastructure Configuration

| Variable     | Description     | Default     |
| ------------ | --------------- | ----------- |
| `DB_HOST`    | PostgreSQL host | `localhost` |
| `DB_PORT`    | PostgreSQL port | `5432`      |
| `REDIS_HOST` | Redis host      | `localhost` |
| `REDIS_PORT` | Redis port      | `6379`      |

## Startup Scripts

### Full Development Environment

```bash
# Start all services in correct order (recommended)
pnpm dev:full

# Or using the script directly
./scripts/dev-startup.sh
```

This will:

1. Start PostgreSQL and Redis (Docker)
2. Wait for infrastructure health checks
3. Start AI Engine (Python/uv)
4. Wait for AI Engine /health endpoint
5. Start Backend (NestJS)
6. Start Frontend (Next.js)

### Infrastructure Only

```bash
# Start only PostgreSQL and Redis
pnpm dev:infra

# Or using Docker Compose directly
docker compose -f docker-compose.infra.yml up -d
```

### Application Services Only

```bash
# Start AI Engine, Backend, Frontend (assuming infrastructure is running)
pnpm dev:apps

# Or using the script directly
./scripts/dev-startup.sh --skip-infra
```

### Individual Services

```bash
# Start AI Engine only
pnpm dev:ai-engine-only

# Start Backend only (requires infrastructure)
pnpm dev:backend

# Start Frontend only (requires backend)
pnpm dev:web
```

## Stopping Services

```bash
# Stop application services (keeps infrastructure running)
pnpm dev:stop

# Stop everything including infrastructure
pnpm dev:stop:all
```

## Docker Compose Startup

When using Docker Compose for full containerized development:

```bash
# Start all services with health check dependencies
docker compose up -d

# View service status
docker compose ps

# View logs
docker compose logs -f backend
```

The Docker Compose configuration enforces startup order using `depends_on` with health conditions:

- `backend` depends on: `postgres:healthy`, `redis:healthy`, `ai-engine:healthy`
- `ai-engine` has health check: `/health` endpoint
- `web` depends on: `backend:started`

## Health Check Endpoints

| Service    | Endpoint                       | Expected Response                  |
| ---------- | ------------------------------ | ---------------------------------- |
| PostgreSQL | `tcp://localhost:5432`         | Connection accepted                |
| Redis      | `tcp://localhost:6379`         | PING/PONG                          |
| AI Engine  | `http://localhost:8000/health` | `{"status": "ok"}`                 |
| Backend    | `http://localhost:3001`        | HTML response (GraphQL playground) |
| Frontend   | `http://localhost:3000`        | HTML response (Next.js)            |

## Troubleshooting

### Backend fails to start with "AI Engine unavailable"

**Cause:** AI Engine is not running or not responding on `/health` endpoint.

**Solutions:**

1. Start AI Engine: `pnpm dev:ai-engine`
2. Skip health check: `SKIP_AI_ENGINE_CHECK=true pnpm dev:backend`
3. Check AI Engine logs: `tail -f /tmp/ai-engine.log`

### Services start but can't connect to database

**Cause:** Infrastructure services not running.

**Solution:**

```bash
# Start infrastructure
pnpm dev:infra

# Or check Docker Compose
docker compose -f docker-compose.infra.yml ps
```

### Port conflicts

**Cause:** Previous instances still running.

**Solution:**

```bash
# Stop all dev services
pnpm dev:stop

# Or kill processes on specific ports
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:3001 | xargs kill -9  # Backend
lsof -ti:8000 | xargs kill -9  # AI Engine
```

## Production Deployment

In production, service startup is managed by Kubernetes with proper init containers and readiness probes. The dependency order remains the same:

1. Database (StatefulSet with persistent volume)
2. Redis (StatefulSet)
3. AI Engine (Deployment with readiness probe on `/health`)
4. Backend (Deployment with readiness probe, waits for AI Engine)
5. Frontend (Deployment with readiness probe)

See `docs/KUBERNETES_DEPLOYMENT.md` for production deployment details.
