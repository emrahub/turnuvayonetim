# 📘 TURNUVAYONETIM - Detailed Setup Guide

Complete installation and configuration guide for TURNUVAYONETIM poker tournament management system.

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Steps](#installation-steps)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Troubleshooting](#troubleshooting)

---

## 🖥️ System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 20.04+)
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 2GB free space

### Required Software
- **Docker Desktop**: For PostgreSQL and Redis containers
- **Git**: For version control
- **Code Editor**: VS Code recommended

---

## 🚀 Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/turnuvayonetim.git
cd turnuvayonetim
```

### Step 2: Install Dependencies

```bash
# Install all workspace dependencies
npm install

# This will install dependencies for:
# - Root workspace
# - apps/web (Frontend)
# - apps/backend (Backend API)
# - apps/ws (WebSocket Server)
# - apps/cli (CLI tools)
# - All packages (db, shared, ui)
```

### Step 3: Setup Docker Services

```bash
# Start PostgreSQL and Redis containers
npm run docker:up

# Verify containers are running
docker ps

# You should see:
# - turnuvayonetim-postgres-1 (PostgreSQL on port 5432)
# - turnuvayonetim-redis-1 (Redis on port 6379)
```

---

## ⚙️ Environment Configuration

### Create Environment File

```bash
# Copy the example environment file
cp .env.local.example .env.local
```

### Configure .env.local

Edit `.env.local` with your settings:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tournament
REDIS_URL=redis://localhost:6379

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3005
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:3003

# Port Configuration
API_PORT=4000
WS_PORT=3003
FRONTEND_PORT=3005

# Authentication & Security (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
REFRESH_TOKEN_SECRET=your-refresh-token-secret-change-this
SESSION_SECRET=your-session-secret-change-this
PASSWORD_PEPPER=your-password-pepper-change-this

# Development Settings
NODE_ENV=development
LOG_LEVEL=debug
```

**⚠️ IMPORTANT**: Change all secrets in production!

---

## 🗄️ Database Setup

### Option 1: Push Schema (Development)

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push
```

### Option 2: Migrations (Production)

```bash
# Create a migration
npm run db:migrate

# Deploy migrations
npm run db:migrate:deploy
```

### Optional: Seed Data

```bash
# Seed the database with sample data
npm run db:seed
```

### Database Tools

```bash
# Open Prisma Studio (GUI for database)
npm run db:studio

# View database in browser at http://localhost:5555
```

---

## 🎮 Running the Application

### Quick Start (All Services)

**Windows:**
```bash
START-ALL.bat
```

**PowerShell:**
```bash
./START-ALL.ps1
```

**Manual (All platforms):**
```bash
# Terminal 1: WebSocket Server
cd apps/ws
npm run dev

# Terminal 2: Backend API
cd apps/backend
npm run dev

# Terminal 3: Frontend
cd apps/web
npm run dev
```

### Verify Services

Open these URLs in your browser:

- **Frontend**: http://localhost:3005
- **Backend Health**: http://localhost:4000/health
- **WebSocket**: Connected automatically by frontend

---

## 🔧 Development Workflow

### Common Commands

```bash
# Development
npm run dev               # Start all services (Turbo)
npm run build             # Build all packages
npm run lint              # Lint all code
npm run type-check        # TypeScript type checking
npm run test              # Run tests

# Database
npm run db:generate       # Generate Prisma client
npm run db:push           # Push schema changes
npm run db:migrate        # Create new migration
npm run db:studio         # Open database GUI
npm run db:seed           # Seed database

# Docker
npm run docker:up         # Start containers
npm run docker:down       # Stop containers
npm run docker:logs       # View container logs

# Cleanup
npm run clean             # Clean build artifacts
rm -rf node_modules       # Remove dependencies
npm install               # Reinstall dependencies
```

### Hot Reload

All services support hot reload:
- Frontend (Next.js): Automatic refresh on file changes
- Backend (tsx watch): Automatic restart on file changes
- WebSocket (tsx watch): Automatic restart on file changes

---

## 🐛 Troubleshooting

### Port Already in Use

**Problem**: Error `EADDRINUSE` or port conflict

**Solution**:
```bash
# Windows: Use restart script (cleans ports first)
yenidenbaslat.bat

# Or manually kill processes
netstat -ano | findstr ":3003 :4000 :3005"
taskkill /F /PID <PID>
```

### Docker Containers Not Starting

**Problem**: PostgreSQL or Redis not running

**Solution**:
```bash
# Stop all containers
docker-compose down

# Remove volumes and restart
docker-compose down -v
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Database Connection Failed

**Problem**: Prisma can't connect to PostgreSQL

**Solution**:
```bash
# 1. Verify PostgreSQL is running
docker ps | grep postgres

# 2. Check DATABASE_URL in .env.local
# Should be: postgresql://postgres:postgres@localhost:5432/tournament

# 3. Test connection
npm run db:studio

# 4. Reset and push schema
npm run db:push
```

### Prisma Client Not Found

**Problem**: `@prisma/client` not found error

**Solution**:
```bash
# Regenerate Prisma client
npm run db:generate

# If still failing, reinstall
cd packages/db
npm install
npx prisma generate
```

### Build Errors

**Problem**: TypeScript or build errors

**Solution**:
```bash
# 1. Clean build artifacts
npm run clean

# 2. Remove all node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# 3. Reinstall dependencies
npm install

# 4. Regenerate Prisma
npm run db:generate

# 5. Try building
npm run build
```

### Frontend Shows Blank Page

**Problem**: Frontend loads but shows nothing

**Solution**:
```bash
# 1. Check browser console for errors
# 2. Verify WebSocket connection
# 3. Check Backend API is running
curl http://localhost:4000/health

# 4. Clear Next.js cache
cd apps/web
rm -rf .next
npm run dev
```

### WebSocket Connection Failed

**Problem**: Client can't connect to WebSocket

**Solution**:
```bash
# 1. Verify WS server is running on port 3003
# Check logs for: "WebSocket server running on ws://localhost:3003"

# 2. Check NEXT_PUBLIC_WS_URL in .env.local
# Should be: ws://localhost:3003

# 3. Check firewall isn't blocking port 3003

# 4. Restart WebSocket server
cd apps/ws
npm run dev
```

---

## 🎯 Next Steps

After successful setup:

1. **Explore the Application**: Open http://localhost:3005
2. **Create a Tournament**: Use the demo mode or database
3. **Read Documentation**: Check `docs/` folder
4. **Start Development**: See [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📞 Getting Help

If you encounter issues not covered here:

1. Check [README.md](README.md) troubleshooting section
2. Search [GitHub Issues](https://github.com/yourusername/turnuvayonetim/issues)
3. Create a new issue with:
   - Your operating system
   - Node.js version (`node -v`)
   - Error messages
   - Steps to reproduce

---

**Happy Coding! 🎉**
