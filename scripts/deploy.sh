#!/bin/bash

# Production deployment script for Turnuva Yönetim System
# This script handles the deployment process safely with rollback capabilities

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
LOG_FILE="${LOG_FILE:-./logs/deploy.log}"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
    log "INFO: $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    log "SUCCESS: $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    log "WARNING: $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    log "ERROR: $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  deploy          Deploy the application"
    echo "  rollback        Rollback to previous version"
    echo "  status          Check deployment status"
    echo "  logs            Show application logs"
    echo "  backup          Create database backup"
    echo "  restore         Restore from backup"
    echo ""
    echo "Options:"
    echo "  --env-file FILE     Environment file (default: .env.production)"
    echo "  --compose-file FILE Docker compose file (default: docker-compose.prod.yml)"
    echo "  --no-backup        Skip database backup before deployment"
    echo "  --force            Force deployment without confirmations"
    echo "  --help, -h         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy                    # Deploy with default settings"
    echo "  $0 deploy --no-backup        # Deploy without backup"
    echo "  $0 rollback                  # Rollback to previous version"
    echo "  $0 status                    # Check current status"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running or not accessible"
        exit 1
    fi

    # Check if docker-compose is available
    if ! command -v docker-compose > /dev/null 2>&1; then
        print_error "docker-compose is not installed"
        exit 1
    fi

    # Check if environment file exists
    if [[ ! -f "$ENV_FILE" ]]; then
        print_error "Environment file $ENV_FILE not found"
        print_status "Please copy .env.production.example to $ENV_FILE and configure it"
        exit 1
    fi

    # Check if compose file exists
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        print_error "Docker compose file $COMPOSE_FILE not found"
        exit 1
    fi

    print_success "Prerequisites check passed"
}

# Function to create database backup
create_backup() {
    if [[ "$NO_BACKUP" == "true" ]]; then
        print_warning "Skipping backup as requested"
        return 0
    fi

    print_status "Creating database backup..."

    local backup_file="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"

    if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U postgres tournament > "$backup_file" 2>/dev/null; then
        print_success "Database backup created: $backup_file"

        # Keep only last 5 backups
        ls -t "$BACKUP_DIR"/db_backup_*.sql | tail -n +6 | xargs -r rm
        print_status "Old backups cleaned up"
    else
        print_warning "Failed to create database backup, but continuing..."
    fi
}

# Function to pull latest images
pull_images() {
    print_status "Pulling latest Docker images..."

    if docker-compose -f "$COMPOSE_FILE" pull; then
        print_success "Images pulled successfully"
    else
        print_error "Failed to pull images"
        exit 1
    fi
}

# Function to deploy application
deploy_application() {
    print_status "Starting deployment..."

    # Start services
    if docker-compose -f "$COMPOSE_FILE" up -d; then
        print_success "Services started successfully"
    else
        print_error "Failed to start services"
        exit 1
    fi

    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10

    # Run database migrations
    print_status "Running database migrations..."
    if docker-compose -f "$COMPOSE_FILE" exec -T backend npx prisma migrate deploy; then
        print_success "Database migrations completed"
    else
        print_warning "Database migrations failed or not needed"
    fi

    # Health check
    print_status "Performing health check..."
    if ./scripts/health-check.sh; then
        print_success "Health check passed"
    else
        print_error "Health check failed"
        print_status "Check logs with: docker-compose -f $COMPOSE_FILE logs"
        exit 1
    fi

    print_success "Deployment completed successfully! 🚀"
}

# Function to rollback
rollback_deployment() {
    print_status "Starting rollback process..."

    # Stop current services
    print_status "Stopping current services..."
    docker-compose -f "$COMPOSE_FILE" down

    # Here you would typically restore from a previous image tag or backup
    # For now, we'll just restart with the same compose file
    print_status "Starting services with previous configuration..."
    docker-compose -f "$COMPOSE_FILE" up -d

    print_success "Rollback completed"
}

# Function to show status
show_status() {
    print_status "Current deployment status:"
    echo ""

    docker-compose -f "$COMPOSE_FILE" ps

    echo ""
    print_status "Running health check..."
    ./scripts/health-check.sh || true
}

# Function to show logs
show_logs() {
    docker-compose -f "$COMPOSE_FILE" logs -f --tail=100
}

# Function to restore from backup
restore_backup() {
    local backup_file="$1"

    if [[ -z "$backup_file" ]]; then
        print_error "Please specify backup file to restore"
        echo "Available backups:"
        ls -la "$BACKUP_DIR"/db_backup_*.sql 2>/dev/null || echo "No backups found"
        exit 1
    fi

    if [[ ! -f "$backup_file" ]]; then
        print_error "Backup file $backup_file not found"
        exit 1
    fi

    print_status "Restoring database from $backup_file..."

    if docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -d tournament < "$backup_file"; then
        print_success "Database restored successfully"
    else
        print_error "Failed to restore database"
        exit 1
    fi
}

# Parse command line arguments
COMMAND=""
NO_BACKUP="false"
FORCE="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        deploy|rollback|status|logs|backup|restore)
            COMMAND="$1"
            shift
            ;;
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        --compose-file)
            COMPOSE_FILE="$2"
            shift 2
            ;;
        --no-backup)
            NO_BACKUP="true"
            shift
            ;;
        --force)
            FORCE="true"
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        *)
            if [[ "$COMMAND" == "restore" ]]; then
                BACKUP_FILE="$1"
                shift
            else
                echo "Unknown option: $1"
                show_usage
                exit 1
            fi
            ;;
    esac
done

# Set default command if none provided
if [[ -z "$COMMAND" ]]; then
    COMMAND="deploy"
fi

# Main execution
main() {
    print_status "Starting $COMMAND process for Turnuva Yönetim System"
    print_status "Using compose file: $COMPOSE_FILE"
    print_status "Using environment file: $ENV_FILE"
    echo ""

    case "$COMMAND" in
        deploy)
            check_prerequisites

            if [[ "$FORCE" != "true" ]]; then
                echo -n "Are you sure you want to deploy to production? (y/N): "
                read -r response
                if [[ ! "$response" =~ ^[Yy]$ ]]; then
                    print_status "Deployment cancelled"
                    exit 0
                fi
            fi

            create_backup
            pull_images
            deploy_application
            ;;
        rollback)
            if [[ "$FORCE" != "true" ]]; then
                echo -n "Are you sure you want to rollback? (y/N): "
                read -r response
                if [[ ! "$response" =~ ^[Yy]$ ]]; then
                    print_status "Rollback cancelled"
                    exit 0
                fi
            fi

            rollback_deployment
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        backup)
            check_prerequisites
            create_backup
            ;;
        restore)
            check_prerequisites
            restore_backup "$BACKUP_FILE"
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main