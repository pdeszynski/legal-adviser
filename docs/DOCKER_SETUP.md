# Docker Setup Guide

This guide explains the different Docker Compose configurations available for the Legal AI Platform and how to use them for various development scenarios.

## Architecture

The Docker Compose setup consists of two files:

- **`docker-compose.yml`** - Full stack (infrastructure + applications)
- **`docker-compose.infra.yml`** - Infrastructure only (PostgreSQL, Redis)

This allows you to run everything in Docker, or run only infrastructure while developing services locally.

---

## Setup 1: Full Docker (All Services in Containers)

**Best for:** Quick environment setup, testing integrations, CI/CD

Run all services (infrastructure + applications) in Docker containers with hot-reload enabled.

```bash
# Start everything
docker compose up --build

# Start in detached mode
docker compose up -d

# View logs
docker compose logs -f

# Stop everything
docker compose down

# Stop and remove volumes (wipe database)
docker compose down -v
```

**Services:**

- `postgres` - PostgreSQL database on `localhost:5432`
- `redis` - Redis cache on `localhost:6379`
- `backend` - NestJS backend on `localhost:3001`
- `ai-engine` - FastAPI AI service on `localhost:8000`
- `web` - Next.js frontend on `localhost:3000`

---

## Setup 2: Infrastructure Only (Local Development)

**Best for:** Active development of application code with full debugging capabilities

Run only infrastructure services (PostgreSQL, Redis) in Docker, while running applications locally on your host machine.

### Step 1: Start Infrastructure

```bash
docker compose -f docker-compose.infra.yml up -d
```

### Step 2: Configure Environment

Create a `.env` file in the relevant app directories:

**`apps/backend/.env`**:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=legal_ai_db
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d
AI_ENGINE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

**`apps/web/.env.local`**:

```env
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/graphql
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Step 3: Install Dependencies & Run Services

```bash
# Install all dependencies
pnpm install

# Terminal 1: Backend
cd apps/backend
pnpm dev:backend

# Terminal 2: AI Engine
cd apps/ai-engine
uv run dev

# Terminal 3: Web Frontend
cd apps/web
pnpm dev:web
```

### Stop Infrastructure

```bash
docker compose -f docker-compose.infra.yml down
```

---

## Setup 3: Hybrid (Partial Docker)

**Best for:** Developing specific services while running others in containers

You can mix and match. For example, run backend locally but keep AI Engine and Web in Docker:

```bash
# Start infrastructure and specific app services in Docker
docker compose up postgres redis ai-engine web -d

# Run backend locally
cd apps/backend && pnpm dev:backend
```

**Note:** When running services locally, ensure environment variables point to `localhost` for infrastructure and Docker services.

---

## Environment Variables Reference

| Variable        | Full Docker             | Local Development       | Description         |
| --------------- | ----------------------- | ----------------------- | ------------------- |
| `DB_HOST`       | `postgres`              | `localhost`             | PostgreSQL hostname |
| `DB_PORT`       | `5432`                  | `5432`                  | PostgreSQL port     |
| `REDIS_HOST`    | `redis`                 | `localhost`             | Redis hostname      |
| `REDIS_PORT`    | `6379`                  | `6379`                  | Redis port          |
| `AI_ENGINE_URL` | `http://ai-engine:8000` | `http://localhost:8000` | AI Engine URL       |

---

## Hot-Reload

When using Setup 1 (Full Docker), source code changes are automatically reflected:

- `apps/backend/src` - Backend source code
- `apps/web/src` - Frontend source code
- `apps/web/public` - Static assets
- `apps/ai-engine/src` - AI Engine source code
- `packages/` - Shared packages

No rebuild is required for code changes. Only changes to `package.json`, Dockerfiles, or build configurations require a rebuild.

---

## Troubleshooting

### Port Already in Use

If a port is already in use (e.g., you have PostgreSQL running locally):

```bash
# Check what's using the port
lsof -i :5432

# Option 1: Stop the local service
# Option 2: Change the port mapping in docker-compose.yml
```

### Database Connection Issues

When running services locally with Docker infrastructure:

```bash
# Check if containers are running
docker compose -f docker-compose.infra.yml ps

# Check logs
docker compose -f docker-compose.infra.yml logs postgres redis

# Verify database connectivity
docker exec -it legal-ai-db psql -U postgres -d legal_ai_db
```

### Network Issues

If services can't communicate:

```bash
# Check network
docker network ls | grep legal-ai

# Re-create network
docker compose down
docker compose up -d
```

### Clear Everything

Start fresh with a clean slate:

```bash
# Stop and remove all containers, networks, and volumes
docker compose down -v

# Remove dangling images
docker image prune

# Start fresh
docker compose up --build
```

---

## Production

This Docker Compose setup is **for local development only**. Production deployments use Kubernetes manifests located in `./k8s/`.

---

## References

- [Docker Compose Overview](https://docs.docker.com/compose/)
- [Docker Compose Multiple Files](https://docs.docker.com/compose/how-tos/multiple-compose-files/)
