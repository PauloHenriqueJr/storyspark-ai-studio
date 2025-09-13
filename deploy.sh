#!/bin/bash

# StorySpark AI Studio - Production Deployment Script
# Usage: ./deploy.sh [up|down|restart|logs|backup]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"

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

check_requirements() {
    log_info "Checking requirements..."

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    # Check if .env.prod exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file $ENV_FILE not found. Please copy .env.prod.example to .env.prod and configure it."
        exit 1
    fi

    log_success "Requirements check passed"
}

setup_ssl() {
    log_info "Setting up SSL certificates directory..."
    mkdir -p letsencrypt
    log_success "SSL directory created"
}

deploy_up() {
    log_info "Starting StorySpark AI Studio production deployment..."

    check_requirements
    setup_ssl

    log_info "Pulling latest images..."
    docker-compose -f $COMPOSE_FILE pull

    log_info "Building and starting services..."
    docker-compose -f $COMPOSE_FILE up -d --build

    log_info "Waiting for services to be healthy..."
    sleep 30

    log_success "Deployment completed!"
    log_info "Services available at:"
    echo "  - Frontend: https://studio.storyspark.com.br"
    echo "  - API: https://api.storyspark.com.br"
    echo "  - Traefik Dashboard: https://traefik.storyspark.com.br"
}

deploy_down() {
    log_info "Stopping StorySpark AI Studio..."
    docker-compose -f $COMPOSE_FILE down
    log_success "Services stopped"
}

show_logs() {
    log_info "Showing service logs..."
    docker-compose -f $COMPOSE_FILE logs -f
}

backup_database() {
    log_info "Creating database backup..."

    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_DIR="./backups"
    BACKUP_FILE="$BACKUP_DIR/storyspark_backup_$TIMESTAMP.sql"

    mkdir -p $BACKUP_DIR

    docker-compose -f $COMPOSE_FILE exec -T postgres pg_dump -U storyspark storyspark_ai_studio > $BACKUP_FILE

    if [ $? -eq 0 ]; then
        log_success "Database backup created: $BACKUP_FILE"
        log_info "Backup size: $(du -h $BACKUP_FILE | cut -f1)"
    else
        log_error "Failed to create database backup"
        exit 1
    fi
}

restart_services() {
    log_info "Restarting services..."
    docker-compose -f $COMPOSE_FILE restart
    log_success "Services restarted"
}

show_status() {
    log_info "Service Status:"
    docker-compose -f $COMPOSE_FILE ps

    log_info "Traefik Routes:"
    docker-compose -f $COMPOSE_FILE exec traefik traefik healthcheck 2>/dev/null || echo "Traefik health check not available"
}

# Main script logic
case "${1:-help}" in
    "up")
        deploy_up
        ;;
    "down")
        deploy_down
        ;;
    "restart")
        restart_services
        ;;
    "logs")
        show_logs
        ;;
    "backup")
        backup_database
        ;;
    "status")
        show_status
        ;;
    "help"|*)
        echo "StorySpark AI Studio - Production Deployment Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  up      - Deploy/start all services"
        echo "  down    - Stop all services"
        echo "  restart - Restart all services"
        echo "  logs    - Show service logs"
        echo "  backup  - Create database backup"
        echo "  status  - Show service status"
        echo "  help    - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 up          # Deploy the application"
        echo "  $0 logs        # View logs"
        echo "  $0 backup      # Create database backup"
        ;;
esac