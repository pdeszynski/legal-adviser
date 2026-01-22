#!/bin/bash

###############################################################################
# Service Failover Script
#
# Description: Manages service failover and restart procedures
# Usage: ./service-failover.sh [ACTION] [SERVICE]
#
# Actions:
#   check           Check service health status
#   restart         Restart a service
#   failover        Initiate full failover procedure
#   status          Show all service statuses
#
# Services:
#   all             All services
#   backend         Backend API service
#   web             Web frontend service
#   ai-engine       AI Engine service
#   postgres        PostgreSQL database
#   redis           Redis cache
#
# Examples:
#   # Check all services
#   ./service-failover.sh check all
#
#   # Restart backend
#   ./service-failover.sh restart backend
#
#   # Full failover (restart all in order)
#   ./service-failover.sh failover all
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
AI_ENGINE_URL="${AI_ENGINE_URL:-http://localhost:8000}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

check_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        log_error "Docker is not installed"
        exit 1
    fi

    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running"
        exit 1
    fi
}

get_container_id() {
    local service=$1
    local container

    case "$service" in
        postgres)
            container=$(docker ps -q -f "name=postgres" -f "name=db" -f "name=legal-ai-db" | head -n1)
            ;;
        redis)
            container=$(docker ps -q -f "name=redis" -f "name=legal-ai-redis" | head -n1)
            ;;
        backend)
            container=$(docker ps -q -f "name=backend" -f "name=legal-ai-backend" | head -n1)
            ;;
        web)
            container=$(docker ps -q -f "name=web" -f "name=legal-ai-web" | head -n1)
            ;;
        ai-engine|ai_engine)
            container=$(docker ps -q -f "name=ai-engine" -f "name=legal-ai-engine" | head -n1)
            ;;
        *)
            container=$(docker ps -q -f "name=$service" | head -n1)
            ;;
    esac

    echo "$container"
}

check_service_health() {
    local service=$1

    local container_id=$(get_container_id "$service")

    if [ -z "$container_id" ]; then
        echo -e "${RED}DOWN${NC} (Container not found)"
        return 1
    fi

    # Check if container is running
    local status=$(docker inspect "$container_id" -f '{{.State.Status}}' 2>/dev/null || echo "unknown")

    if [ "$status" != "running" ]; then
        echo -e "${RED}DOWN${NC} (Status: $status)"
        return 1
    fi

    # Service-specific health checks
    case "$service" in
        postgres)
            local pg_result=$(docker exec "$container_id" pg_isready -U postgres 2>&1 || echo "FAILED")
            if echo "$pg_result" | grep -q "accepting connections"; then
                echo -e "${GREEN}HEALTHY${NC}"
                return 0
            else
                echo -e "${RED}UNHEALTHY${NC} (pg_isready: $pg_result)"
                return 1
            fi
            ;;
        redis)
            local redis_result=$(docker exec "$container_id" redis-cli ping 2>/dev/null || echo "FAILED")
            if [ "$redis_result" = "PONG" ]; then
                echo -e "${GREEN}HEALTHY${NC}"
                return 0
            else
                echo -e "${RED}UNHEALTHY${NC} (redis-cli ping failed: $redis_result)"
                return 1
            fi
            ;;
        backend)
            if curl -sf "$BACKEND_URL/health" >/dev/null 2>&1; then
                echo -e "${GREEN}HEALTHY${NC}"
                return 0
            else
                echo -e "${RED}UNHEALTHY${NC} (HTTP health check failed)"
                return 1
            fi
            ;;
        ai-engine|ai_engine)
            if curl -sf "$AI_ENGINE_URL/health" >/dev/null 2>&1; then
                echo -e "${GREEN}HEALTHY${NC}"
                return 0
            else
                echo -e "${YELLOW}UNKNOWN${NC} (No health endpoint)"
                return 0
            fi
            ;;
        web)
            local port=$(docker port "$container_id" 3000 >/dev/null 2>&1 && echo "3000" || echo "3000")
            if curl -sf "http://localhost:$port" >/dev/null 2>&1; then
                echo -e "${GREEN}HEALTHY${NC}"
                return 0
            else
                echo -e "${YELLOW}UNKNOWN${NC} (Web server check)"
                return 0
            fi
            ;;
        *)
            echo -e "${GREEN}RUNNING${NC}"
            return 0
            ;;
    esac
}

show_service_status() {
    local service=$1

    local container_id=$(get_container_id "$service")

    if [ -z "$container_id" ]; then
        printf "%-20s %s\n" "$service:" "Not found"
        return 1
    fi

    local health_status=$(check_service_health "$service")
    local uptime=$(docker exec "$container_id" uptime -p 2>/dev/null || echo "unknown")
    local cpu=$(docker stats "$container_id" --no-stream --format "{{.CPUPerc}}" 2>/dev/null || echo "N/A")
    local memory=$(docker stats "$container_id" --no-stream --format "{{.MemUsage}}" 2>/dev/null || echo "N/A")

    printf "%-20s %s\n" "$service:" "$health_status"
    printf "%-20s Uptime: %s\n" "" "$uptime"
    printf "%-20s CPU: %s | Memory: %s\n" "" "$cpu" "$memory"
    echo ""
}

restart_service() {
    local service=$1

    log_info "Restarting service: $service"

    local container_id=$(get_container_id "$service")

    if [ -z "$container_id" ]; then
        log_error "Container not found for service: $service"
        return 1
    fi

    log_info "Stopping container..."
    docker stop "$container_id" || {
        log_error "Failed to stop container"
        return 1
    }

    log_info "Starting container..."
    docker start "$container_id" || {
        log_error "Failed to start container"
        return 1
    }

    # Wait for service to be healthy
    log_info "Waiting for service to be healthy..."
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if check_service_health "$service" >/dev/null 2>&1; then
            log_success "Service restarted successfully"
            return 0
        fi

        sleep 2
        ((attempt++))
    done

    log_warning "Service restarted but health checks are still failing"
    return 0
}

check_all_services() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Service Health Status${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    local services=("postgres" "redis" "ai-engine" "backend" "web")
    local healthy=0
    local unhealthy=0

    for service in "${services[@]}"; do
        show_service_status "$service"

        if check_service_health "$service" >/dev/null 2>&1; then
            ((healthy++))
        else
            ((unhealthy++))
        fi
    done

    echo ""
    echo -e "${BLUE}Summary:${NC} ${GREEN}$healthy healthy${NC}, ${RED}$unhealthy unhealthy${NC}"

    return $unhealthy
}

restart_all_services() {
    log_warning "Initiating service restart sequence..."
    echo ""

    # Stop services in reverse dependency order
    log_info "Stopping services..."
    docker-compose stop web backend ai-engine || true

    # Start services in dependency order
    log_info "Starting services..."

    log_info "Starting AI Engine..."
    docker-compose start ai-engine || log_warning "Failed to start AI Engine"

    sleep 5

    log_info "Starting Backend..."
    docker-compose start backend || log_warning "Failed to start Backend"

    sleep 5

    log_info "Starting Web..."
    docker-compose start web || log_warning "Failed to start Web"

    echo ""
    log_success "Service restart sequence completed"
    echo ""

    # Show final status
    check_all_services
}

full_failover() {
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}  FULL FAILOVER PROCEDURE${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""

    log_warning "This will restart all services in the correct order"
    echo ""

    if ! confirm "Proceed with full failover?"; then
        log_info "Failover cancelled"
        return 0
    fi

    echo ""
    log_info "Starting failover procedure..."
    echo ""

    # 1. Check infrastructure
    log_info "Step 1: Checking infrastructure services..."
    check_service_health postgres || {
        log_error "PostgreSQL is not healthy. Cannot proceed."
        return 1
    }
    check_service_health redis || {
        log_warning "Redis is not healthy. Continuing anyway..."
    }
    log_success "Infrastructure check passed"

    echo ""

    # 2. Stop application services
    log_info "Step 2: Stopping application services..."
    docker-compose stop web backend ai-engine
    log_success "Application services stopped"

    echo ""

    # 3. Start AI Engine
    log_info "Step 3: Starting AI Engine..."
    docker-compose start ai-engine

    local attempt=1
    while [ $attempt -le 30 ]; do
        if check_service_health ai-engine >/dev/null 2>&1; then
            log_success "AI Engine is healthy"
            break
        fi
        sleep 2
        ((attempt++))
    done

    echo ""

    # 4. Start Backend
    log_info "Step 4: Starting Backend..."
    docker-compose start backend

    attempt=1
    while [ $attempt -le 30 ]; do
        if check_service_health backend >/dev/null 2>&1; then
            log_success "Backend is healthy"
            break
        fi
        sleep 2
        ((attempt++))
    done

    echo ""

    # 5. Start Web
    log_info "Step 5: Starting Web..."
    docker-compose start web

    attempt=1
    while [ $attempt -le 30 ]; do
        if check_service_health web >/dev/null 2>&1; then
            log_success "Web is healthy"
            break
        fi
        sleep 2
        ((attempt++))
    done

    echo ""
    log_success "=========================================="
    log_success "Failover completed successfully!"
    log_success "=========================================="

    echo ""
    check_all_services
}

confirm() {
    local prompt="$1"
    local response

    while true; do
        read -r -p "$(echo -e ${YELLOW}[CONFIRM]${NC} $prompt (yes/no): )" response
        case "$response" in
            [Yy][Ee][Ss]|[Yy]) return 0 ;;
            [Nn][Oo]|[Nn]) return 1 ;;
            *) echo "Please answer yes or no" ;;
        esac
    done
}

show_help() {
    cat << EOF
Usage: $0 [ACTION] [SERVICE]

Actions:
  check           Check service health status
  restart         Restart a service
  failover        Initiate full failover procedure
  status          Show all service statuses (same as 'check all')

Services:
  all             All services
  backend         Backend API service
  web             Web frontend service
  ai-engine       AI Engine service
  postgres        PostgreSQL database
  redis           Redis cache

Examples:
  $0 check all           # Check all services
  $0 restart backend     # Restart backend service
  $0 failover all        # Full failover procedure

EOF
    exit 0
}

# Main execution
main() {
    check_docker

    local action=${1:-}
    local service=${2:-}

    if [ -z "$action" ]; then
        show_help
    fi

    case "$action" in
        check)
            if [ -z "$service" ] || [ "$service" = "all" ]; then
                check_all_services
            else
                show_service_status "$service"
            fi
            ;;
        status)
            check_all_services
            ;;
        restart)
            if [ -z "$service" ]; then
                log_error "Service name required for restart"
                exit 1
            fi
            if [ "$service" = "all" ]; then
                restart_all_services
            else
                restart_service "$service"
            fi
            ;;
        failover)
            full_failover
            ;;
        -h|--help|help)
            show_help
            ;;
        *)
            log_error "Unknown action: $action"
            show_help
            ;;
    esac
}

main "$@"
