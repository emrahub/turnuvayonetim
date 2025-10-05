# Production Deployment Guide

This guide covers the production deployment setup for the Turnuva Yönetim (Tournament Management) System.

## Architecture Overview

The production setup includes:
- **Backend API** (Node.js/Express with tRPC)
- **Frontend** (Next.js)
- **WebSocket Server** (Socket.io)
- **PostgreSQL Database**
- **Redis Cache**
- **Nginx Reverse Proxy** (optional)

## Prerequisites

- Docker & Docker Compose
- Git
- SSL certificates (for HTTPS)
- Production server with SSH access

## Quick Start

1. **Clone and Setup**
   ```bash
   git clone <your-repo>
   cd turnuvayonetim
   cp .env.production.example .env.production
   ```

2. **Configure Environment**
   Edit `.env.production` with your production values:
   ```bash
   nano .env.production
   ```

3. **Deploy**
   ```bash
   ./scripts/deploy.sh deploy
   ```

## Detailed Setup

### 1. Environment Configuration

Copy and configure the production environment file:

```bash
cp .env.production.example .env.production
```

**Required Variables:**
- `POSTGRES_PASSWORD` - Strong database password
- `REDIS_PASSWORD` - Strong Redis password
- `JWT_SECRET` - 32+ character secret for JWT tokens
- `SESSION_SECRET` - 32+ character secret for sessions
- `WS_SECRET` - WebSocket authentication secret

**Domain Configuration:**
- `NEXT_PUBLIC_API_URL` - Your API domain (e.g., https://api.yourdomain.com)
- `NEXT_PUBLIC_WS_URL` - Your WebSocket domain (e.g., wss://ws.yourdomain.com)
- `NEXT_PUBLIC_APP_URL` - Your frontend domain (e.g., https://yourdomain.com)

### 2. Docker Images

The multi-stage Dockerfile creates optimized production images:

- **Security**: Non-root users, minimal attack surface
- **Performance**: Alpine Linux, optimized layers
- **Health Checks**: Built-in health monitoring
- **Multi-arch**: Supports AMD64 and ARM64

Build images manually:
```bash
# Backend
docker build --target backend-prod -t turnuva-backend .

# Frontend
docker build --target frontend-prod -t turnuva-frontend .

# WebSocket
docker build --target ws-prod -t turnuva-ws .
```

### 3. Database Setup

The setup includes:
- Automated database initialization
- Read-only and backup users
- Performance optimizations
- Security hardening

**Manual database setup:**
```bash
# Start only database services
docker-compose -f docker-compose.prod.yml up -d postgres redis

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Create initial admin user (if applicable)
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

### 4. SSL/TLS Configuration

For HTTPS support, place your SSL certificates in the `ssl/` directory:

```
ssl/
├── cert.pem
├── key.pem
├── staging-cert.pem
└── staging-key.pem
```

Update `config/nginx.conf` with your domain names.

### 5. Deployment Scripts

#### Deploy Script
```bash
# Full deployment
./scripts/deploy.sh deploy

# Deploy without backup
./scripts/deploy.sh deploy --no-backup

# Force deployment (no prompts)
./scripts/deploy.sh deploy --force

# Check status
./scripts/deploy.sh status

# View logs
./scripts/deploy.sh logs

# Rollback
./scripts/deploy.sh rollback
```

#### Health Check Script
```bash
# Run health check
./scripts/health-check.sh

# Custom endpoints
./scripts/health-check.sh --backend-url https://api.yourdomain.com
```

## CI/CD Pipeline

### GitHub Actions Setup

1. **Repository Secrets**
   ```
   DEPLOY_SSH_KEY          - SSH private key for production server
   DEPLOY_HOST             - Production server hostname/IP
   DEPLOY_USER             - SSH username
   DEPLOY_PATH             - Deployment directory path
   ENV_PRODUCTION          - Complete .env.production content
   GITHUB_TOKEN            - GitHub token for package registry
   SLACK_WEBHOOK_URL       - Slack webhook for notifications (optional)
   ```

2. **Staging Environment** (optional)
   ```
   STAGING_SSH_KEY         - SSH key for staging server
   STAGING_HOST            - Staging server hostname
   STAGING_USER            - Staging SSH username
   STAGING_PATH            - Staging deployment path
   ```

### Pipeline Stages

1. **Test & Lint** - Run tests, linting, and build validation
2. **Build** - Create and push Docker images to GitHub Container Registry
3. **Security** - Vulnerability scanning with Trivy
4. **Deploy** - Automated deployment to production
5. **Health Check** - Verify deployment success

### Manual Triggers

Trigger deployments manually:
```bash
# Via GitHub CLI
gh workflow run deploy.yml

# Via GitHub web interface
# Go to Actions → Deploy → Run workflow
```

## Monitoring & Logging

### Container Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 frontend
```

### Health Monitoring
```bash
# Manual health check
./scripts/health-check.sh

# Container status
docker-compose -f docker-compose.prod.yml ps

# Resource usage
docker stats
```

### Database Monitoring
```bash
# Connect to database
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d tournament

# Monitor connections
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Check database size
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('tournament'));"
```

## Backup & Recovery

### Automated Backups
Backups are created automatically before deployments and stored in `./backups/`.

### Manual Backup
```bash
# Create backup
./scripts/deploy.sh backup

# List backups
ls -la backups/

# Restore from backup
./scripts/deploy.sh restore backups/db_backup_20240327_123456.sql
```

### Database Backup Script
```bash
# Manual database backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres tournament > backup.sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d tournament < backup.sql
```

## Security Considerations

### Container Security
- ✅ Non-root users in all containers
- ✅ Read-only root filesystems where possible
- ✅ No-new-privileges security option
- ✅ Minimal attack surface with Alpine Linux
- ✅ Security updates in base images

### Network Security
- ✅ Isolated Docker networks
- ✅ Internal-only backend network
- ✅ Rate limiting on public endpoints
- ✅ CORS configuration
- ✅ Security headers

### Data Security
- ✅ Encrypted connections (HTTPS/WSS)
- ✅ Environment variable secrets
- ✅ Database connection encryption
- ✅ Redis password authentication
- ✅ JWT token security

### Access Control
- ✅ SSH key-based deployment
- ✅ Container registry authentication
- ✅ Database user separation
- ✅ Read-only database users

## Troubleshooting

### Common Issues

1. **Service won't start**
   ```bash
   # Check logs
   docker-compose -f docker-compose.prod.yml logs service-name

   # Check container status
   docker-compose -f docker-compose.prod.yml ps

   # Restart service
   docker-compose -f docker-compose.prod.yml restart service-name
   ```

2. **Database connection issues**
   ```bash
   # Check database health
   docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres

   # Test connection from backend
   docker-compose -f docker-compose.prod.yml exec backend node -e "console.log('Testing DB connection...')"
   ```

3. **Memory issues**
   ```bash
   # Check resource usage
   docker stats

   # Adjust memory limits in docker-compose.prod.yml
   ```

4. **SSL certificate issues**
   ```bash
   # Check certificate validity
   openssl x509 -in ssl/cert.pem -text -noout

   # Test SSL connection
   openssl s_client -connect yourdomain.com:443
   ```

### Performance Tuning

1. **Database Optimization**
   - Monitor slow queries with `pg_stat_statements`
   - Adjust `shared_buffers` and `effective_cache_size`
   - Regular `VACUUM` and `ANALYZE`

2. **Redis Optimization**
   - Monitor memory usage
   - Adjust `maxmemory-policy`
   - Use Redis clustering for high load

3. **Container Resources**
   - Monitor with `docker stats`
   - Adjust CPU and memory limits
   - Use horizontal scaling for high load

## Maintenance

### Regular Tasks

1. **Weekly**
   - Review application logs
   - Check backup integrity
   - Monitor resource usage
   - Update security patches

2. **Monthly**
   - Update Docker images
   - Review and rotate secrets
   - Performance optimization review
   - Security audit

3. **Quarterly**
   - Disaster recovery testing
   - Infrastructure review
   - Capacity planning
   - Security penetration testing

### Updates

```bash
# Update application
git pull origin main
./scripts/deploy.sh deploy

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Update system packages
docker-compose -f docker-compose.prod.yml build --no-cache
```

## Support

For issues and questions:
1. Check application logs
2. Review this documentation
3. Check GitHub Issues
4. Contact the development team

---

**Note**: This is a production system. Always test changes in a staging environment first, maintain backups, and follow security best practices.