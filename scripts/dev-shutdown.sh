#!/bin/bash
# =============================================================================
# Development Service Shutdown Script
# =============================================================================
#
# This script stops all development services started by dev-startup.sh
#
# Usage:
#   ./scripts/dev-shutdown.sh          # Stop application services
#   ./scripts/dev-shutdown.sh --all    # Stop everything including infrastructure
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
STOP_INFRA=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --all)
      STOP_INFRA=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --all         Stop all services including infrastructure"
      echo "  -h, --help    Show this help message"
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

# Stop application services
stop_apps() {
  log_info "Stopping application services..."

  # Stop AI Engine
  if [ -f /tmp/legal-ai-engine.pid ]; then
    PID=$(cat /tmp/legal-ai-engine.pid)
    if ps -p $PID > /dev/null 2>&1; then
      kill $PID
      log_success "AI Engine stopped (PID: $PID)"
    fi
    rm /tmp/legal-ai-engine.pid
  else
    log_warn "AI Engine PID file not found"
  fi

  # Stop Backend
  if [ -f /tmp/legal-backend.pid ]; then
    PID=$(cat /tmp/legal-backend.pid)
    if ps -p $PID > /dev/null 2>&1; then
      kill $PID
      log_success "Backend stopped (PID: $PID)"
    fi
    rm /tmp/legal-backend.pid
  else
    log_warn "Backend PID file not found"
  fi

  # Stop Frontend
  if [ -f /tmp/legal-frontend.pid ]; then
    PID=$(cat /tmp/legal-frontend.pid)
    if ps -p $PID > /dev/null 2>&1; then
      kill $PID
      log_success "Frontend stopped (PID: $PID)"
    fi
    rm /tmp/legal-frontend.pid
  else
    log_warn "Frontend PID file not found"
  fi

  # Kill any stray processes on the ports
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  lsof -ti:3001 | xargs kill -9 2>/dev/null || true
  lsof -ti:8000 | xargs kill -9 2>/dev/null || true

  log_success "Application services stopped"
}

# Stop infrastructure
stop_infrastructure() {
  log_info "Stopping infrastructure services..."

  if docker compose ps | grep -q "Up"; then
    docker compose -f docker-compose.infra.yml down
    log_success "Infrastructure services stopped"
  else
    log_warn "No infrastructure services are running"
  fi
}

# Main execution
main() {
  log_info "Shutting down Legal AI Platform development environment..."
  echo ""

  stop_apps

  if [ "$STOP_INFRA" = true ]; then
    stop_infrastructure
  fi

  echo ""
  log_success "Shutdown complete"
  echo ""

  if [ "$STOP_INFRA" = false ]; then
    echo "Infrastructure services (PostgreSQL, Redis) are still running."
    echo "To stop them as well, run:"
    echo "  ./scripts/dev-shutdown.sh --all"
  fi
}

# Run main function
main
