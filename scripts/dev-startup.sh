#!/bin/bash
# =============================================================================
# Development Service Startup Script
# =============================================================================
#
# This script starts all development services in the correct order:
# 1. Infrastructure (PostgreSQL, Redis) - via Docker Compose
# 2. AI Engine (FastAPI/Python)
# 3. Backend (NestJS/Node.js)
# 4. Frontend (Next.js/Node.js)
#
# Usage:
#   ./scripts/dev-startup.sh           # Start all services
#   ./scripts/dev-startup.sh --infra   # Start infrastructure only
#   ./scripts/dev-startup.sh --skip-infra  # Skip infrastructure, start apps
#   ./scripts/dev-startup.sh --ai-only # Start AI Engine only
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INFRA_ONLY=false
SKIP_INFRA=false
AI_ONLY=false
WITH_INFRA=true

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --infra)
      INFRA_ONLY=true
      shift
      ;;
    --skip-infra)
      SKIP_INFRA=true
      WITH_INFRA=false
      shift
      ;;
    --ai-only)
      AI_ONLY=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --infra         Start infrastructure services only (PostgreSQL, Redis)"
      echo "  --skip-infra    Skip infrastructure, assume already running"
      echo "  --ai-only       Start AI Engine only"
      echo "  -h, --help      Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Health check function
health_check() {
  local url=$1
  local name=$2
  local max_attempts=${3:-30}
  local attempt=1

  log_info "Waiting for $name at $url..."

  while [ $attempt -le $max_attempts ]; do
    response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    # Check for HTTP 200 OK
    if [ "$http_code" = "200" ]; then
      # For AI Engine, also check startup_complete in response
      if [[ "$name" == *"AI Engine"* ]] && command -v jq &> /dev/null; then
        startup_complete=$(echo "$body" | jq -r '.startup_complete // false')
        if [ "$startup_complete" != "true" ]; then
          echo -n "."
          sleep 2
          attempt=$((attempt + 1))
          continue
        fi
      fi

      log_success "$name is healthy!"
      return 0
    fi

    # Check for HTTP 503 (service unavailable - starting up)
    if [ "$http_code" = "503" ]; then
      echo -n "."
      sleep 2
      attempt=$((attempt + 1))
      continue
    fi

    # Connection refused or other error
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
  done

  echo ""

  # Get detailed error info
  if command -v jq &> /dev/null && [ -n "$body" ]; then
    error_msg=$(echo "$body" | jq -r '.error // .startup_message // .detail // "Unknown error"' 2>/dev/null)
    log_error "$name failed to start within expected time"
    log_error "Error details: $error_msg"
  else
    log_error "$name failed to start within expected time"
  fi

  log_error "Check logs: tail -f $(get_log_path "$name")"
  return 1
}

# Get log file path for a service
get_log_path() {
  local name=$1
  if [[ "$name" == *"AI Engine"* ]]; then
    echo "/tmp/ai-engine.log"
  elif [[ "$name" == *"Backend"* ]]; then
    echo "/tmp/legal-backend.log"
  elif [[ "$name" == *"Frontend"* ]]; then
    echo "/tmp/legal-frontend.log"
  else
    echo "/tmp/unknown-service.log"
  fi
}

# Check if required tools are available
check_dependencies() {
  log_info "Checking dependencies..."

  if ! command -v docker &> /dev/null && ! command -v podman &> /dev/null; then
    log_error "Docker or Podman is required but not installed"
    exit 1
  fi

  if ! command -v pnpm &> /dev/null; then
    log_error "pnpm is required but not installed"
    exit 1
  fi

  if ! command -v uv &> /dev/null && [ "$AI_ONLY" = false ]; then
    log_warn "uv is not installed. AI Engine may not start properly"
  fi

  log_success "All dependencies are available"
}

# Start infrastructure services
start_infrastructure() {
  log_info "Starting infrastructure services (PostgreSQL, Redis)..."

  # Check if services are already running
  if docker compose ps | grep -q "legal-ai-db.*Up"; then
    log_warn "Database is already running. Skipping..."
  elif docker compose ps | grep -q "legal-ai-redis.*Up"; then
    log_warn "Redis is already running. Skipping..."
  else
    docker compose -f docker-compose.infra.yml up -d

    log_info "Waiting for PostgreSQL to be healthy..."
    health_check "http://localhost:5432" "PostgreSQL" 30 || log_warn "PostgreSQL health check failed, but continuing..."

    log_info "Waiting for Redis to be healthy..."
    health_check "http://localhost:6379" "Redis" 15 || log_warn "Redis health check failed, but continuing..."
  fi

  log_success "Infrastructure services started"
}

# Start AI Engine
start_ai_engine() {
  log_info "Starting AI Engine..."

  cd apps/ai-engine

  # Check if uv is available
  if ! command -v uv &> /dev/null; then
    log_error "uv is required to start AI Engine"
    return 1
  fi

  # Start in background
  log_info "Launching AI Engine service..."
  uv run dev > /tmp/ai-engine.log 2>&1 &
  AI_ENGINE_PID=$!

  echo $AI_ENGINE_PID > /tmp/legal-ai-engine.pid

  # Wait for readiness check (uses /health/ready which waits for startup_complete)
  cd ../..
  health_check "http://localhost:8000/health/ready" "AI Engine" 45

  log_success "AI Engine started and ready (PID: $AI_ENGINE_PID)"
}

# Start Backend
start_backend() {
  log_info "Starting Backend..."

  cd apps/backend

  # Start in background with AI Engine check
  SKIP_AI_ENGINE_CHECK=false pnpm dev > /tmp/legal-backend.log 2>&1 &
  BACKEND_PID=$!

  echo $BACKEND_PID > /tmp/legal-backend.pid

  # Wait for GraphQL playground to be available
  cd ../..
  health_check "http://localhost:3001/graphql" "Backend" 45

  log_success "Backend started (PID: $BACKEND_PID)"
}

# Start Frontend
start_frontend() {
  log_info "Starting Frontend..."

  cd apps/web

  # Start in background
  pnpm dev > /tmp/legal-frontend.log 2>&1 &
  FRONTEND_PID=$!

  echo $FRONTEND_PID > /tmp/legal-frontend.pid

  # Wait for Next.js to be available
  cd ../..
  sleep 5  # Give Next.js a moment to start
  health_check "http://localhost:3000" "Frontend" 60

  log_success "Frontend started (PID: $FRONTEND_PID)"
}

# Main execution
main() {
  log_info "Starting Legal AI Platform development environment..."
  echo ""

  check_dependencies

  if [ "$WITH_INFRA" = true ] && [ "$INFRA_ONLY" = false ] && [ "$AI_ONLY" = false ]; then
    start_infrastructure
  fi

  if [ "$INFRA_ONLY" = true ]; then
    log_success "Infrastructure started. Exiting."
    echo ""
    echo "To start application services:"
    echo "  ./scripts/dev-startup.sh --skip-infra"
    exit 0
  fi

  if [ "$SKIP_INFRA" = true ]; then
    log_warn "Skipping infrastructure startup. Assuming services are already running."
  fi

  if [ "$AI_ONLY" = true ]; then
    start_ai_engine
    log_success "AI Engine is running. Logs: /tmp/ai-engine.log"
    echo ""
    echo "To stop: kill \$(cat /tmp/legal-ai-engine.pid)"
    exit 0
  fi

  # Sequential startup with health checks
  start_ai_engine
  start_backend
  start_frontend

  echo ""
  log_success "All services started successfully!"
  echo ""
  echo "Service URLs:"
  echo "  - Frontend:       http://localhost:3000"
  echo "  - Backend:        http://localhost:3001"
  echo "  - Backend API:    http://localhost:3001/graphql"
  echo "  - AI Engine:      http://localhost:8000"
  echo "  - AI Engine Docs: http://localhost:8000/docs"
  echo ""
  echo "Logs:"
  echo "  - AI Engine:  tail -f /tmp/ai-engine.log"
  echo "  - Backend:    tail -f /tmp/legal-backend.log"
  echo "  - Frontend:   tail -f /tmp/legal-frontend.log"
  echo ""
  echo "To stop all services:"
  echo "  ./scripts/dev-shutdown.sh"
  echo ""
}

# Trap Ctrl+C and cleanup
cleanup() {
  log_info "Shutting down..."
  if [ -f /tmp/legal-ai-engine.pid ]; then
    kill $(cat /tmp/legal-ai-engine.pid) 2>/dev/null || true
    rm /tmp/legal-ai-engine.pid
  fi
  if [ -f /tmp/legal-backend.pid ]; then
    kill $(cat /tmp/legal-backend.pid) 2>/dev/null || true
    rm /tmp/legal-backend.pid
  fi
  if [ -f /tmp/legal-frontend.pid ]; then
    kill $(cat /tmp/legal-frontend.pid) 2>/dev/null || true
    rm /tmp/legal-frontend.pid
  fi
  exit 0
}

trap cleanup SIGINT SIGTERM

# Run main function
main
