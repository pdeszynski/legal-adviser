#!/bin/bash

###############################################################################
# Database Restoration Script
#
# Description: Restores PostgreSQL database from backup
# Usage: ./restore-database.sh [OPTIONS]
#
# Options:
#   -b, --backup-id BACKUP_ID    Backup ID to restore (from GraphQL API)
#   -f, --file PATH               Local backup file to restore
#   -n, --new-db NAME             Create new database (non-destructive)
#   -d, --database NAME           Target database name (default: legal_ai_db)
#   -y, --yes                     Skip confirmation prompts
#   -h, --help                    Show this help message
#
# Examples:
#   # Restore from backup ID (via API)
#   ./restore-database.sh -b abc123-def456
#
#   # Restore from local file to new database
#   ./restore-database.sh -f /tmp/backup.dump -n legal_ai_db_restored
#
#   # Restore to existing database (destructive)
#   ./restore-database.sh -f /tmp/backup.dump -d legal_ai_db -y
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
GRAPHQL_URL="$BACKEND_URL/graphql"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-password}"

# Script parameters
BACKUP_ID=""
BACKUP_FILE=""
NEW_DB_NAME=""
TARGET_DB="legal_ai_db"
SKIP_CONFIRMATION=false

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    grep '^#' "$0" | grep -v '#!/bin/bash' | sed 's/^# //' | sed 's/^#//'
    exit 0
}

confirm() {
    if [ "$SKIP_CONFIRMATION" = true ]; then
        return 0
    fi

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

check_dependencies() {
    log_info "Checking dependencies..."

    local missing_deps=()

    command -v docker >/dev/null 2>&1 || missing_deps+=("docker")
    command -v curl >/dev/null 2>&1 || missing_deps+=("curl")
    command -v jq >/dev/null 2>&1 || missing_deps+=("jq")

    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_info "Install missing dependencies and try again"
        exit 1
    fi

    log_success "All dependencies present"
}

check_postgres_ready() {
    log_info "Checking PostgreSQL connectivity..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker exec $(docker ps -q -f "name=postgres") pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; then
            log_success "PostgreSQL is ready"
            return 0
        fi

        log_info "Waiting for PostgreSQL... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done

    log_error "PostgreSQL is not ready after $max_attempts attempts"
    exit 1
}

get_backup_info() {
    local backup_id=$1

    log_info "Fetching backup information..."

    local query="query {
        backup(id: \"$backup_id\") {
            id
            filename
            sizeMB
            createdAt
            status
            storagePath
            metadata {
                database
                pgVersion
            }
        }
    }"

    local response=$(curl -s -X POST "$GRAPHQL_URL" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$query\"}")

    echo "$response"
}

download_backup_via_api() {
    local backup_id=$1
    local output_file=$2

    log_info "Downloading backup via API..."

    # For local storage, we can directly access the file
    # For S3, we'd need to implement S3 download logic

    log_warning "API download not implemented. Using local storage path."

    # Get backup info to find local path
    local backup_info=$(get_backup_info "$backup_id")
    local storage_path=$(echo "$backup_info" | jq -r '.data.backup.storagePath')

    if [ ! -f "$storage_path" ]; then
        log_error "Backup file not found at: $storage_path"
        exit 1
    fi

    cp "$storage_path" "$output_file"
    log_success "Backup downloaded to: $output_file"
}

restore_database() {
    local backup_file=$1
    local target_db=$2

    log_info "Starting database restoration..."
    log_info "Backup file: $backup_file"
    log_info "Target database: $target_db"

    if [ "$target_db" != "$NEW_DB_NAME" ] && [ "$target_db" = "legal_ai_db" ]; then
        if ! confirm "This will REPLACE the existing database '$target_db'. Continue?"; then
            log_info "Restoration cancelled"
            exit 0
        fi
    fi

    # Get PostgreSQL container
    local pg_container=$(docker ps -q -f "name=postgres")

    if [ -z "$pg_container" ]; then
        log_error "PostgreSQL container not found. Is docker-compose running?"
        exit 1
    fi

    # Drop existing database if restoring to same database
    if [ "$target_db" = "$NEW_DB_NAME" ] || [ "$target_db" != "legal_ai_db" ]; then
        log_info "Creating new database: $target_db"

        docker exec "$pg_container" psql -U "$DB_USER" -d postgres \
            -c "DROP DATABASE IF EXISTS $target_db;" >/dev/null 2>&1 || true

        docker exec "$pg_container" psql -U "$DB_USER" -d postgres \
            -c "CREATE DATABASE $target_db;" || {
            log_error "Failed to create database"
            exit 1
        }
    else
        log_warning "Dropping existing database: $target_db"
        docker exec "$pg_container" psql -U "$DB_USER" -d postgres \
            -c "DROP DATABASE IF EXISTS $target_db WITH (FORCE);" || {
            log_error "Failed to drop database"
            exit 1
        }

        docker exec "$pg_container" psql -U "$DB_USER" -d postgres \
            -c "CREATE DATABASE $target_db;" || {
            log_error "Failed to create database"
            exit 1
        }
    fi

    # Restore backup
    log_info "Restoring database from backup..."
    log_info "This may take several minutes for large databases..."

    cat "$backup_file" | docker exec -i "$pg_container" pg_restore \
        -U "$DB_USER" \
        -d "$target_db" \
        --clean \
        --if-exists \
        --no-owner \
        --no-acl \
        --single-transaction \
        2>&1 | while IFS= read -r line; do
            echo "$line"
        done

    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log_success "Database restoration completed successfully"
    else
        log_error "Database restoration failed"
        exit 1
    fi
}

verify_restoration() {
    local target_db=$1

    log_info "Verifying restoration..."

    local pg_container=$(docker ps -q -f "name=postgres")

    # Check if database exists
    local db_exists=$(docker exec "$pg_container" psql -U "$DB_USER" -d postgres \
        -tAc "SELECT 1 FROM pg_database WHERE datname='$target_db'")

    if [ "$db_exists" != "1" ]; then
        log_error "Database '$target_db' does not exist after restoration"
        exit 1
    fi

    # Check table count
    local table_count=$(docker exec "$pg_container" psql -U "$DB_USER" -d "$target_db" \
        -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")

    log_success "Database exists with $table_count tables"

    # Show some basic stats
    log_info "Database statistics:"
    docker exec "$pg_container" psql -U "$DB_USER" -d "$target_db" \
        -c "
        SELECT
            schemaname,
            tablename,
            n_live_tup AS row_count
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 10;
        " || true
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--backup-id)
            BACKUP_ID="$2"
            shift 2
            ;;
        -f|--file)
            BACKUP_FILE="$2"
            shift 2
            ;;
        -n|--new-db)
            NEW_DB_NAME="$2"
            TARGET_DB="$2"
            shift 2
            ;;
        -d|--database)
            TARGET_DB="$2"
            shift 2
            ;;
        -y|--yes)
            SKIP_CONFIRMATION=true
            shift
            ;;
        -h|--help)
            show_help
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            ;;
    esac
done

# Main execution
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Database Restoration Script${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    check_dependencies

    # Validate input
    if [ -z "$BACKUP_ID" ] && [ -z "$BACKUP_FILE" ]; then
        log_error "Either --backup-id or --file must be specified"
        show_help
    fi

    # If backup ID provided, download it first
    if [ -n "$BACKUP_ID" ]; then
        local temp_file=$(mktemp)
        download_backup_via_api "$BACKUP_ID" "$temp_file"
        BACKUP_FILE="$temp_file"
    fi

    # Verify backup file exists
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi

    check_postgres_ready

    # Confirm restoration
    if ! confirm "Restore database from '$BACKUP_FILE' to '$TARGET_DB'?"; then
        log_info "Restoration cancelled"
        exit 0
    fi

    # Perform restoration
    restore_database "$BACKUP_FILE" "$TARGET_DB"

    # Verify
    verify_restoration "$TARGET_DB"

    echo ""
    log_success "=========================================="
    log_success "Restoration completed successfully!"
    log_success "Target database: $TARGET_DB"
    log_success "=========================================="

    # Cleanup temp file if we downloaded it
    if [ -n "$BACKUP_ID" ] && [ -f "$temp_file" ]; then
        rm "$temp_file"
        log_info "Cleaned up temporary download file"
    fi
}

main
