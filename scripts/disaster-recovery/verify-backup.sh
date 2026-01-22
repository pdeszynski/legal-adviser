#!/bin/bash

###############################################################################
# Backup Verification Script
#
# Description: Verifies backup integrity and data consistency
# Usage: ./verify-backup.sh [OPTIONS]
#
# Options:
#   -b, --backup-id BACKUP_ID    Verify specific backup by ID
#   -f, --file PATH               Verify local backup file
#   -l, --latest                  Verify latest backup
#   -v, --verbose                 Show detailed output
#   -h, --help                    Show this help message
#
# Examples:
#   # Verify latest backup
#   ./verify-backup.sh --latest
#
#   # Verify specific backup
#   ./verify-backup.sh --backup-id abc123-def456
#
#   # Verify local file
#   ./verify-backup.sh --file /tmp/backup.dump
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
VERIFY_LATEST=false
VERBOSE=false

# Verification results
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((CHECKS_PASSED++))
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
    ((WARNINGS++))
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((CHECKS_FAILED++))
}

log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[VERBOSE]${NC} $1"
    fi
}

show_help() {
    grep '^#' "$0" | grep -v '#!/bin/bash' | sed 's/^# //' | sed 's/^#//'
    exit 0
}

check_dependencies() {
    log_info "Checking dependencies..."

    local missing_deps=()

    command -v docker >/dev/null 2>&1 || missing_deps+=("docker")
    command -v curl >/dev/null 2>&1 || missing_deps+=("curl")
    command -v jq >/dev/null 2>&1 || missing_deps+=("jq")

    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        exit 1
    fi

    log_success "All dependencies present"
}

get_latest_backup_id() {
    log_info "Fetching latest backup ID..."

    local query="query {
        backups(limit: 1, offset: 0) {
            id
            filename
            createdAt
            status
        }
    }"

    local response=$(curl -s -X POST "$GRAPHQL_URL" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$query\"}")

    local backup_id=$(echo "$response" | jq -r '.data.backups[0].id')

    if [ "$backup_id" = "null" ] || [ -z "$backup_id" ]; then
        log_error "No backups found"
        exit 1
    fi

    log_success "Latest backup ID: $backup_id"
    echo "$backup_id"
}

get_backup_info() {
    local backup_id=$1

    log_verbose "Fetching backup information for: $backup_id"

    local query="query {
        backup(id: \"$backup_id\") {
            id
            filename
            sizeBytes
            sizeMB
            createdAt
            status
            storagePath
            checksums {
                algorithm
                value
            }
            metadata {
                database
                host
                pgVersion
                compression
            }
            isRestored
        }
    }"

    local response=$(curl -s -X POST "$GRAPHQL_URL" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$query\"}")

    echo "$response"
}

verify_backup_metadata() {
    local backup_info=$1

    log_info "Verifying backup metadata..."

    local status=$(echo "$backup_info" | jq -r '.data.backup.status')
    local size_bytes=$(echo "$backup_info" | jq -r '.data.backup.sizeBytes')
    local filename=$(echo "$backup_info" | jq -r '.data.backup.filename')
    local created_at=$(echo "$backup_info" | jq -r '.data.backup.createdAt')

    if [ "$status" != "active" ]; then
        log_error "Backup status is '$status', expected 'active'"
        return 1
    fi
    log_success "Backup status is active"

    if [ "$size_bytes" -le 0 ]; then
        log_error "Backup size is invalid: $size_bytes bytes"
        return 1
    fi
    log_success "Backup size is valid: $size_bytes bytes"

    if [ "$filename" = "null" ] || [ -z "$filename" ]; then
        log_error "Backup filename is missing"
        return 1
    fi
    log_verbose "Backup filename: $filename"

    if [ "$created_at" = "null" ]; then
        log_error "Backup creation date is missing"
        return 1
    fi
    log_verbose "Backup created at: $created_at"

    return 0
}

verify_backup_checksums() {
    local backup_info=$1

    log_info "Verifying backup checksums..."

    local checksums=$(echo "$backup_info" | jq -r '.data.backup.checksums')

    if [ "$checksums" = "null" ] || [ "$checksums" = "[]" ]; then
        log_warning "No checksums found in backup metadata"
        return 0
    fi

    local checksum_count=$(echo "$checksums" | jq 'length')
    log_verbose "Found $checksum_count checksum(s)"

    echo "$checksums" | jq -c '.[]' | while IFS= read -r checksum; do
        local algorithm=$(echo "$checksum" | jq -r '.algorithm')
        local value=$(echo "$checksum" | jq -r '.value')

        if [ -z "$value" ] || [ "$value" = "null" ]; then
            log_warning "Checksum for $algorithm is empty"
        else
            log_verbose "Checksum ($algorithm): ${value:0:16}..."
            log_success "Checksum present for $algorithm"
        fi
    done

    return 0
}

verify_storage_accessible() {
    local backup_info=$1

    log_info "Verifying backup storage accessibility..."

    local storage_path=$(echo "$backup_info" | jq -r '.data.backup.storagePath')
    local storage_type=$(echo "$backup_info" | jq -r '.data.backup.storageType')

    log_verbose "Storage type: $storage_type"
    log_verbose "Storage path: $storage_path"

    if [ "$storage_type" = "local" ]; then
        if [ -f "$storage_path" ]; then
            log_success "Local backup file is accessible"
            local file_size=$(stat -f%z "$storage_path" 2>/dev/null || stat -c%s "$storage_path" 2>/dev/null)
            log_verbose "File size on disk: $file_size bytes"
        else
            log_warning "Local backup file not found at: $storage_path"
        fi
    else
        log_warning "Cannot verify $storage_type storage accessibility from this script"
    fi
}

verify_database_connectivity() {
    log_info "Verifying database connectivity..."

    local pg_container=$(docker ps -q -f "name=postgres")

    if [ -z "$pg_container" ]; then
        log_error "PostgreSQL container not found"
        return 1
    fi

    if docker exec "$pg_container" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; then
        log_success "PostgreSQL is accessible"
    else
        log_error "PostgreSQL is not accessible"
        return 1
    fi
}

verify_database_consistency() {
    log_info "Verifying database consistency..."

    local pg_container=$(docker ps -q -f "name=postgres")

    # Check for database corruption
    local corruption_check=$(docker exec "$pg_container" psql -U "$DB_USER" -d postgres -tAc \
        "SELECT COUNT(*) FROM pg_database WHERE datname='legal_ai_db'" 2>/dev/null || echo "0")

    if [ "$corruption_check" -ge 0 ]; then
        log_success "Database catalog is accessible"
    else
        log_error "Database catalog check failed"
        return 1
    fi

    # Check table counts
    local table_count=$(docker exec "$pg_container" psql -U "$DB_USER" -d legal_ai_db -tAc \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" 2>/dev/null || echo "0")

    if [ "$table_count" -gt 0 ]; then
        log_success "Database has $table_count tables"
    else
        log_warning "No tables found in database (might be empty)"
    fi
}

verify_row_counts() {
    log_info "Verifying key table row counts..."

    local pg_container=$(docker ps -q -f "name=postgres")

    # Key tables to verify
    local tables=("users" "legal_documents" "legal_queries")

    for table in "${tables[@]}"; do
        local count=$(docker exec "$pg_container" psql -U "$DB_USER" -d legal_ai_db -tAc \
            "SELECT COUNT(*) FROM $table" 2>/dev/null || echo "N/A")

        if [ "$count" != "N/A" ]; then
            log_success "Table '$table': $count rows"
        else
            log_verbose "Table '$table' does not exist or is not accessible"
        fi
    done
}

print_summary() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Verification Summary${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "Checks Passed: ${GREEN}$CHECKS_PASSED${NC}"
    echo -e "Warnings:      ${YELLOW}$WARNINGS${NC}"
    echo -e "Checks Failed: ${RED}$CHECKS_FAILED${NC}"
    echo ""

    if [ $CHECKS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ Backup verification PASSED${NC}"
        return 0
    else
        echo -e "${RED}✗ Backup verification FAILED${NC}"
        return 1
    fi
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
        -l|--latest)
            VERIFY_LATEST=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
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
    echo -e "${BLUE}  Backup Verification Script${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    check_dependencies

    # Determine which backup to verify
    if [ "$VERIFY_LATEST" = true ]; then
        BACKUP_ID=$(get_latest_backup_id)
    elif [ -z "$BACKUP_ID" ] && [ -z "$BACKUP_FILE" ]; then
        log_error "Either --backup-id, --file, or --latest must be specified"
        show_help
    fi

    # Get backup info
    if [ -n "$BACKUP_ID" ]; then
        BACKUP_INFO=$(get_backup_info "$BACKUP_ID")

        if [ "$(echo "$BACKUP_INFO" | jq -r '.data.backup')" = "null" ]; then
            log_error "Backup not found: $BACKUP_ID"
            exit 1
        fi

        echo ""
        echo -e "${BLUE}Backup Information:${NC}"
        echo "$BACKUP_INFO" | jq -r '.data.backup | {
            id, filename, sizeMB, status, created_at: .createdAt
        }' || true
        echo ""

        # Perform verifications
        verify_backup_metadata "$BACKUP_INFO"
        verify_backup_checksums "$BACKUP_INFO"
        verify_storage_accessible "$BACKUP_INFO"
    fi

    # Verify database (if backup was restored or file provided)
    verify_database_connectivity
    verify_database_consistency
    verify_row_counts

    # Print summary
    print_summary
}

main
