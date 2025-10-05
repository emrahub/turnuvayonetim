# 🏆 TURNUVAYONETIM

**Modern Poker Tournament Management System**

A professional, real-time poker tournament management platform built with cutting-edge web technologies.

---

## ⚡ Quick Start

Get up and running in 3 simple steps:

```bash
# 1. Install dependencies
npm install

# 2. Start all services (Docker + Dev servers)
npm run docker:up    # Start PostgreSQL + Redis

# 3. Start development servers (see STARTALL.md for details)
# Use Claude Code or run these commands in background:
cd apps/ws && set WS_PORT=3003 && npm run dev
cd apps/backend && set API_PORT=4000 && set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tournament && npm run dev
cd apps/web && set PORT=3005 && set NEXT_PUBLIC_APP_URL=http://localhost:3005 && npm run dev
```

**4. Open your browser:**
- 🎯 **Frontend**: http://localhost:3005
- 🔌 **Backend API**: http://localhost:4000
- 📡 **WebSocket**: ws://localhost:3003

> 💡 **Note**: For detailed startup instructions, see [STARTALL.md](STARTALL.md)

---

## 🏗️ Architecture

### Tech Stack

**Frontend**
- ⚛️ **Next.js 14** - React framework with App Router
- 🎨 **Tailwind CSS** - Utility-first styling
- 🔌 **Socket.IO Client** - Real-time communication
- 📱 **PWA** - Progressive Web App with offline support
- 🎯 **tRPC** - End-to-end typesafe API

**Backend**
- 🚀 **Node.js + Express** - Server runtime
- 📡 **tRPC** - Type-safe API layer
- 🔌 **Socket.IO** - Real-time WebSocket server
- 🗄️ **Prisma ORM** - Database toolkit
- 📊 **Event Sourcing** - Complete audit trail

**Database & Cache**
- 🐘 **PostgreSQL** - Relational database
- 🔴 **Redis** - Caching and session storage
- 🐳 **Docker** - Containerization

### Monorepo Structure

```
turnuvayonetim/
├── apps/
│   ├── web/           # Next.js frontend (Port 3005)
│   ├── backend/       # tRPC + Express API (Port 4000)
│   ├── ws/            # WebSocket server (Port 3003)
│   └── cli/           # Command-line tools
├── packages/
│   ├── db/            # Prisma schema & migrations
│   ├── shared/        # Shared utilities
│   └── ui/            # Shared UI components
├── docs/              # Documentation
└── scripts/           # Development scripts
```

---

## ✨ Features

### Tournament Management
- ⏰ **Server-Authoritative Clock** with client drift correction
- 👥 **Real-Time Player Management** with automatic seating
- 🏓 **Multi-Table Support** with table balancing
- 💰 **Dynamic Payout Calculator** with customizable structures
- 📊 **Live Leaderboard** with real-time updates

### Technical Excellence
- 🔄 **Real-Time Sync** via WebSocket for all tournament events
- 📱 **Offline-First** PWA with service worker caching
- 🔐 **Secure Authentication** with JWT tokens
- 🎯 **Type-Safe** end-to-end with TypeScript + tRPC
- 🧪 **Event Sourcing** for complete audit trail
- 🏢 **Multi-Tenant** architecture ready

---

## 📊 Port Reference

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Frontend | 3005 | http://localhost:3005 | Next.js web application |
| Backend API | 4000 | http://localhost:4000 | tRPC + Express server |
| WebSocket | 3003 | ws://localhost:3003 | Socket.IO real-time server |
| PostgreSQL | 5432 | localhost:5432 | Database |
| Redis | 6379 | localhost:6379 | Cache & sessions |

---

## 🚀 Development

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** (for PostgreSQL & Redis)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/turnuvayonetim.git
cd turnuvayonetim

# Install all dependencies
npm install

# Start Docker services (PostgreSQL + Redis)
npm run docker:up

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push
```

### Development Commands

```bash
# Start all development servers (see STARTALL.md for full details)
# Run these in background mode via Claude Code:
cd apps/ws && set WS_PORT=3003 && npm run dev         # WebSocket Server
cd apps/backend && set API_PORT=4000 && npm run dev   # Backend API
cd apps/web && set PORT=3005 && npm run dev           # Frontend

# Or start all at once
npm run dev          # All services (via Turbo)

# Database commands
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Create migration

# Build & Test
npm run build        # Build all packages
npm run type-check   # TypeScript check
npm run lint         # ESLint check
npm run test         # Run tests

# Docker
npm run docker:up    # Start containers
npm run docker:down  # Stop containers
npm run docker:logs  # View logs
```

---

## 📖 Documentation

- 📘 [Setup Guide](SETUP.md) - Detailed installation instructions
- 🏗️ [Architecture](docs/deployment/PRODUCTION_DEPLOYMENT.md) - System architecture overview
- 🔐 [Security](docs/deployment/CREDENTIAL_SECURITY.md) - Security best practices

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

## 🎯 Project Status

✅ **Production Ready** - Stable and actively maintained

**Current Version:** 1.0.0

**Last Updated:** October 2025

---

## 💡 Quick Tips

### Demo Mode
The system supports demo tournaments without database:
```javascript
// Frontend will connect to demo tournament automatically
http://localhost:3005
```

### Environment Variables
Copy `.env.local.example` to `.env.local` and configure:
```bash
cp .env.local.example .env.local
# Edit .env.local with your settings
```

### Port Conflicts?
If ports are in use, kill Node processes and restart:
```bash
taskkill /F /IM node.exe    # Kill all Node processes
# Then restart services as shown in STARTALL.md
```

---

## 🆘 Troubleshooting

**Services won't start?**
- Check Docker is running: `docker ps`
- Check ports are free: `netstat -ano | findstr "3003 4000 3005"`
- Kill Node processes: `taskkill /F /IM node.exe`
- See [STARTALL.md](STARTALL.md) for detailed startup guide

**Database connection failed?**
- Ensure Docker containers are running
- Check DATABASE_URL in .env.local
- Try: `npm run db:push`

**Build errors?**
- Clean build artifacts: `npm run clean`
- Regenerate Prisma: `npm run db:generate`
- Reinstall dependencies: `rm -rf node_modules && npm install`

---

## 📞 Support

For issues and questions:
- 🐛 [Report a Bug](https://github.com/yourusername/turnuvayonetim/issues)
- 💬 [Discussions](https://github.com/yourusername/turnuvayonetim/discussions)

---

**Made with ❤️ for the Poker Community**
