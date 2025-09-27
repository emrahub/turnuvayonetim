# 🏆 TURNUVAYONETIM

**Advanced Poker Tournament Management System with AI-Powered Multi-Agent Orchestration**

## 🎭 AGENT ORKESTRASYON REHBERİ - CLAUDE CODE İÇİN TALİMATLAR

### 🎯 Orkestra Şefi Olarak Çalışma Stratejisi

Bu proje **4 AI Agent** ile orkestrasyon metodolojisi kullanır. Claude Code, bu agent'ları bir orkestra şefi gibi yönetir ve görevleri paralel dağıtır.

### 📋 Agent Görev Dağıtım Matrisi

| Agent | Sorumluluk Alanları | Görev Örnekleri |
|-------|-------------------|-----------------|
| **🏗️ Architect Agent** | Sistem tasarımı, mimari kararlar | PWA implementation, Database schema, System architecture |
| **⚙️ Backend Agent** | Server-side development | TypeScript fixes, API endpoints, Event Store, Authentication |
| **🎨 Frontend Agent** | Client-side development | React components, ESLint fixes, UI/UX, Styling |
| **🚀 DevOps Agent** | Infrastructure & deployment | Docker setup, CI/CD, Testing, Build optimization |

### 🚀 Orkestrasyon Komutları

```markdown
# PARALEL EXECUTION STRATEJİSİ
1. Birden fazla agent'a AYNI ANDA görev ver (Task tool ile)
2. TodoWrite ile görev takibi yap
3. Agent çıktılarını kontrol et ve koordine et

# GÖREV DAĞITIM ÖRNEĞİ
- TypeScript hatası → Backend Agent
- Component oluşturma → Frontend Agent
- Docker/deployment → DevOps Agent
- Sistem tasarımı → Architect Agent

# HATA YÖNETİMİ
- Build hatası aldığında ilgili agent'a yönlendir
- Agent'lar arası bağımlılıkları yönet
- Paralel çalışmayı maksimize et
```

### 🎯 Best Practices

1. **TodoWrite Kullanımı**: Her görev dağıtımında TodoWrite ile takip et
2. **Paralel Çalışma**: Mümkün olduğunca agent'ları paralel çalıştır
3. **Hata Yönetimi**: Hataları doğru agent'a yönlendir
4. **Durum Kontrolü**: Regular olarak build ve test çalıştır

---

TURNUVAYONETIM is a revolutionary poker tournament management system that uses **MBAO (Modular Browser Agent Orchestration)** to coordinate 4 specialized AI agents that collaboratively build and manage the entire system.

## 🤖 Multi-Agent Architecture

### 4 Specialized AI Agents:
- **🏗️ Architect Agent**: System design, database architecture, API planning
- **⚙️ Backend Agent**: Node.js, TypeScript, Prisma, WebSocket development
- **🎨 Frontend Agent**: React, Next.js, Tailwind CSS, PWA components
- **🚀 DevOps Agent**: Docker, CI/CD, testing, deployment automation

Each agent operates in its own Chrome browser instance, connected to OpenAI Codex, working collaboratively to build the complete system.

## ✨ Key Features

### Tournament Management
- ⏰ **Server-Authoritative Clock** with drift correction
- 👥 **Real-Time Player Management** with automatic seating
- 💰 **Dynamic Payout Calculator** with league scoring
- 📊 **Multi-Display Support** with PIN protection
- 🔄 **Event Sourcing** for complete audit trail

### Technical Excellence
- 🏢 **Multi-Tenant SaaS** architecture
- 📱 **Offline-First PWA** with background sync
- 🔌 **Real-Time WebSocket** communication
- 🗄️ **PostgreSQL + Redis** for performance
- 🐳 **Docker** containerization
- 🧪 **Comprehensive Testing** suite

## 🎉 Kurulum ve Çalıştırma Başarı Raporu

### Sistem Durumu
✅ **4 Agent Başarıyla Aktif:**
- **Architect**: http://localhost:4444 (VNC: http://localhost:7900)
- **Backend**: http://localhost:4445 (VNC: http://localhost:7901)
- **Frontend**: http://localhost:4446 (VNC: http://localhost:7902)
- **DevOps**: http://localhost:4447 (VNC: http://localhost:7903)

✅ **Tüm Servisler Çalışıyor:**
- **Backend API**: http://localhost:4000 (tRPC: http://localhost:4000/trpc)
- **WebSocket**: ws://localhost:3003
- **Frontend**: http://localhost:3005
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

✅ **MVP Build**: Agentlar başarıyla MVP sürümünü oluşturdu
✅ **Orkestrasyon**: Tüm agentlar koordine halinde çalışıyor

## 📊 Port Reference Table

| Service | Port | URL | Status |
|---------|------|-----|--------|
| **Frontend** | 3005 | http://localhost:3005 | ✅ Active |
| **WebSocket** | 3003 | ws://localhost:3003 | ✅ Active |
| **Backend API** | 4000 | http://localhost:4000 | ✅ Active |
| **tRPC** | 4000 | http://localhost:4000/trpc | ✅ Active |
| **PostgreSQL** | 5432 | localhost:5432 | ✅ Active |
| **Redis** | 6379 | localhost:6379 | ✅ Active |

> **⚠️ Important**: WebSocket port migrated from 3001 → 3003, Frontend port migrated from 3000 → 3005

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- 4 OpenAI Codex accounts (for agent-based development)

### Installation

1. **Clone and Setup**
   ```bash
   git clone <repository>
   cd turnuvayonetim
   npm install
   ```

2. **Environment Configuration**
   Create `.env.local` file with correct ports:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database credentials and API keys
   ```

3. **Database Setup**
   ```bash
   # Start PostgreSQL and Redis (Docker)
   docker-compose up -d postgres redis

   # Or manual database setup
   # PostgreSQL: localhost:5432
   # Redis: localhost:6379
   ```

4. **Manual Development Mode (Recommended)**
   Open 3 separate terminals:

   **Terminal 1 - Backend API:**
   ```bash
   cd apps/backend
   npm run dev
   # API will start on http://localhost:4000
   ```

   **Terminal 2 - WebSocket Server:**
   ```bash
   cd apps/ws
   npm run dev
   # WebSocket will start on ws://localhost:3003
   ```

   **Terminal 3 - Frontend:**
   ```bash
   cd apps/web
   npm run dev -- --port 3005
   # Frontend will start on http://localhost:3005
   ```

5. **Access Application**
   - **Frontend**: http://localhost:3005
   - **Backend API**: http://localhost:4000
   - **WebSocket**: ws://localhost:3003

### AI Agent Mode (Advanced)
For AI-powered development with 4 specialized agents:

1. **Configure Agent Credentials**
   ```bash
   npm run setup
   # Follow interactive prompts for 4 Codex credentials
   ```

2. **Start AI Agents**
   ```bash
   npm run agents:start
   ```

3. **Agent Orchestration**
   ```bash
   npm run orchestrate:build --mvp
   ```

## 📂 Project Structure

```
turnuvayonetim/
├── apps/
│   ├── web/                 # Next.js frontend
│   ├── backend/             # Node.js API server
│   ├── ws/                  # WebSocket server
│   └── cli/                 # CLI orchestrator
├── packages/
│   ├── mbao-core/          # Agent orchestration engine
│   ├── poker-adapter/      # Poker-specific workflows
│   ├── ui/                 # Shared UI components
│   ├── db/                 # Database schemas
│   └── shared/             # Shared utilities
├── profiles/               # Agent browser profiles
├── output/                 # Generated code
└── docker/                 # Container configs
```

## 🛠️ Available Commands

### Development
```bash
# Manual Development Mode (Recommended)
cd apps/backend && npm run dev     # Backend API on port 4000
cd apps/ws && npm run dev          # WebSocket server on port 3003
cd apps/web && npm run dev -- --port 3005  # Frontend on port 3005

# Build and Testing
npm run build           # Build all packages
npm run test            # Run test suite
npm run lint            # Lint code
```

### Database
```bash
npm run db:setup        # Start PostgreSQL + Redis
npm run db:migrate      # Run database migrations
npm run db:studio       # Open Prisma Studio
```

### Agents
```bash
npm run agents:start    # Start all agents
npm run agents:status   # Check agent status
npm run agents:stop     # Stop all agents
```

### Orchestration
```bash
npm run orchestrate           # Interactive build mode
npm run orchestrate:build     # Build with options
npm run orchestrate:mvp       # Build MVP version
```

## 🔧 Configuration

### Environment Variables (.env.local)
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tournament
REDIS_URL=redis://localhost:6379

# Agent Credentials (Required - 4 Codex Accounts)
CODEX_1_EMAIL=your-architect-email@example.com
CODEX_1_PASSWORD=your-architect-password
CODEX_2_EMAIL=your-backend-email@example.com
CODEX_2_PASSWORD=your-backend-password
CODEX_3_EMAIL=your-frontend-email@example.com
CODEX_3_PASSWORD=your-frontend-password
CODEX_4_EMAIL=your-devops-email@example.com
CODEX_4_PASSWORD=your-devops-password

# WebSocket
WS_PORT=3003
WS_SECRET=supersecret-ws-key-change-in-production

# API
API_PORT=4000
JWT_SECRET=supersecret-jwt-key-change-in-production
SESSION_SECRET=supersecret-session-key-change-in-production

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:3003
NEXT_PUBLIC_APP_URL=http://localhost:3005

# Agent Settings
AGENT_HEADLESS=false         # Set to true for production
AGENT_TIMEOUT=60000
AGENT_MAX_RETRIES=3
```

## 🏗️ Architecture

### MBAO (Modular Browser Agent Orchestration)
- **Task Queue**: Priority-based task assignment
- **Capability Registry**: Smart agent selection
- **Message Bus**: Inter-agent communication
- **Workflow Engine**: Declarative build pipelines
- **State Management**: XState for orchestration

### Application Architecture
- **Frontend**: Next.js 13+ with React 18, Tailwind CSS
- **Backend**: Node.js with tRPC, Prisma ORM
- **Database**: PostgreSQL with event sourcing
- **Real-time**: Socket.IO with Redis adapter
- **Caching**: Redis for sessions and pub/sub

## 🎯 Build Targets

### Full Project (Complete System)
- Tournament clock with drift correction
- Player management with seating algorithm
- Real-time WebSocket synchronization
- PWA with offline capabilities
- Event sourcing and CQRS
- Multi-tenant architecture
- Comprehensive testing suite

### MVP (Minimal Viable Product)
- Basic tournament clock
- Simple player management
- Essential API endpoints
- Basic frontend interface

## 🔍 Monitoring

### Agent Monitoring
- Real-time agent status dashboard
- Task execution metrics
- Error tracking and retry logic
- Performance analytics

### Application Monitoring
- Health checks for all services
- Redis pub/sub monitoring
- Database performance metrics
- WebSocket connection status

## 🧪 Testing

```bash
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests
npm run test:e2e          # End-to-end tests
```

## 🚢 Deployment

### Development
```bash
npm run docker:up         # Start all containers
npm run docker:logs       # View logs
```

### Production
- Multi-stage Docker builds
- GitHub Actions CI/CD pipeline
- Health checks and monitoring
- Horizontal scaling support

## 🤝 Contributing

This project uses AI agents for development. To contribute:

1. Fork the repository
2. Configure your Codex credentials
3. Use the orchestration system to make changes
4. Submit pull request with agent-generated code

## 📄 License

MIT License - See LICENSE file for details

## 🚨 Troubleshooting

### Common Port Issues

**Problem**: `EADDRINUSE: address already in use`
```bash
# Check which process is using the port
netstat -ano | findstr :3003    # Windows
lsof -i :3003                   # macOS/Linux

# Kill the process
taskkill /f /pid <PID>          # Windows
kill -9 <PID>                  # macOS/Linux
```

**Problem**: WebSocket connection fails
- ✅ Check WebSocket server is running on port 3003
- ✅ Verify CORS settings in `apps/ws/src/index.ts`
- ✅ Ensure frontend is accessing `ws://localhost:3003`

**Problem**: Frontend shows "Connecting to clock..."
- ✅ WebSocket server should be running and stable
- ✅ Check browser console for connection errors
- ✅ Verify all ports are correct in environment variables

### Port Migration History
- **Frontend**: 3000 → 3005 ✅
- **WebSocket**: 3001 → 3003 ✅
- **Backend**: 4000 (unchanged) ✅

## 🆘 Support

- 📚 Documentation: `/docs` directory
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions
- 📧 Email: support@turnuvayonetim.com

---

**Built with AI Agents • Powered by MBAO • Made for Poker Excellence** 🎯