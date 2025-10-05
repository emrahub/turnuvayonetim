#!/bin/bash

# Health check script for production deployment
# This script checks the health of all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:4000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3005}"
WS_URL="${WS_URL:-http://localhost:3003}"
TIMEOUT="${TIMEOUT:-10}"

echo "🏥 Starting health check for Turnuva Yönetim System..."
echo "=================================================="

# Function to check service health
check_service() {
    local service_name="$1"
    local url="$2"
    local expected_status="${3:-200}"

    echo -n "Checking $service_name... "

    if curl -f -s --max-time $TIMEOUT "$url/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Healthy${NC}"
        return 0
    else
        echo -e "${RED}✗ Unhealthy${NC}"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    echo -n "Checking PostgreSQL connection... "

    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Connected${NC}"
        return 0
    else
        echo -e "${RED}✗ Connection failed${NC}"
        return 1
    fi
}

# Function to check Redis connectivity
check_redis() {
    echo -n "Checking Redis connection... "

    if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Connected${NC}"
        return 0
    else
        echo -e "${RED}✗ Connection failed${NC}"
        return 1
    fi
}

# Function to check Docker containers
check_containers() {
    echo "Checking Docker containers:"

    services=("turnuva-postgres" "turnuva-redis" "turnuva-backend" "turnuva-frontend" "turnuva-ws")
    all_healthy=true

    for service in "${services[@]}"; do
        echo -n "  $service... "

        if docker ps --filter "name=$service" --filter "status=running" | grep -q "$service"; then
            echo -e "${GREEN}✓ Running${NC}"
        else
            echo -e "${RED}✗ Not running${NC}"
            all_healthy=false
        fi
    done

    return $all_healthy
}

# Main health check
main() {
    local exit_code=0

    # Check Docker containers
    if ! check_containers; then
        exit_code=1
    fi

    echo ""

    # Check database services
    if ! check_database; then
        exit_code=1
    fi

    if ! check_redis; then
        exit_code=1
    fi

    echo ""

    # Check application services
    if ! check_service "Backend API" "$BACKEND_URL"; then
        exit_code=1
    fi

    if ! check_service "WebSocket Server" "$WS_URL"; then
        exit_code=1
    fi

    if ! check_service "Frontend" "$FRONTEND_URL"; then
        exit_code=1
    fi

    echo ""
    echo "=================================================="

    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}🎉 All services are healthy!${NC}"
    else
        echo -e "${RED}❌ Some services are unhealthy!${NC}"
        echo "Please check the logs with: docker-compose -f docker-compose.prod.yml logs"
    fi

    exit $exit_code
}

# Show usage if help requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --backend-url URL    Backend API URL (default: http://localhost:4000)"
    echo "  --frontend-url URL   Frontend URL (default: http://localhost:3005)"
    echo "  --ws-url URL         WebSocket URL (default: http://localhost:3003)"
    echo "  --timeout SECONDS    Request timeout (default: 10)"
    echo "  --help, -h           Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  BACKEND_URL         Override default backend URL"
    echo "  FRONTEND_URL        Override default frontend URL"
    echo "  WS_URL              Override default WebSocket URL"
    echo "  TIMEOUT             Override default timeout"
    exit 0
fi

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-url)
            BACKEND_URL="$2"
            shift 2
            ;;
        --frontend-url)
            FRONTEND_URL="$2"
            shift 2
            ;;
        --ws-url)
            WS_URL="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run the health check
main