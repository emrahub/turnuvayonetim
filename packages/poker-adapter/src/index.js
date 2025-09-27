"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PokerProjectOrchestrator = void 0;
const core_1 = require("@mbao/core");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
class PokerProjectOrchestrator {
    orchestrator;
    outputDir;
    constructor() {
        this.orchestrator = new core_1.Orchestrator({
            maxConcurrency: 4,
            rateLimit: {
                interval: 1000,
                cap: 10
            },
            // redis: {
            //   url: process.env.REDIS_URL || 'redis://localhost:6379'
            // },
            monitoring: {
                enabled: true,
                port: 3002
            }
        });
        this.outputDir = path.join(process.cwd(), 'output');
    }
    async initialize() {
        await this.setupAgents();
        await this.registerWorkflows();
        console.log(chalk_1.default.green('✅ Poker Project Orchestrator initialized'));
    }
    async setupAgents() {
        // Load agent config
        const configPath = path.join(process.cwd(), 'agent-config.json');
        const configContent = await fs_1.promises.readFile(configPath, 'utf-8');
        const config = JSON.parse(configContent);
        // Register each agent
        for (const agentConfig of config.agents) {
            const agent = {
                ...agentConfig,
                credentials: {
                    email: process.env[`CODEX_${agentConfig.id.toUpperCase()}_EMAIL`] || agentConfig.email,
                    password: process.env[`CODEX_${agentConfig.id.toUpperCase()}_PASSWORD`] || agentConfig.password,
                    platform: agentConfig.platform
                }
            };
            await this.orchestrator.registerAgent(agent);
        }
    }
    async registerWorkflows() {
        // Full Project Workflow
        const fullProjectWorkflow = new core_1.WorkflowBuilder('full-project', 'Complete Poker Tournament System')
            .description('Build complete tournament management system with all features')
            // Stage 1: Architecture & Planning
            .stage('Architecture & Planning')
            .parallel()
            .task({
            type: core_1.TaskType.PROMPT,
            priority: 10,
            requiredCapabilities: ['architecture'],
            payload: {
                prompt: `Design a complete poker tournament management system architecture:

Requirements:
- Multi-tenant SaaS architecture
- Real-time clock synchronization with drift correction
- Event sourcing for audit trail
- Offline-first PWA capabilities
- WebSocket for real-time updates
- PostgreSQL + Redis
- Microservices or modular monolith

Provide:
1. System architecture diagram (as ASCII art)
2. Component breakdown
3. Data flow design
4. API structure
5. Database schema (ER diagram)
6. Technology recommendations`
            }
        })
            .task({
            type: core_1.TaskType.PROMPT,
            priority: 9,
            requiredCapabilities: ['architecture'],
            payload: {
                prompt: `Create detailed database schema for poker tournament system:

Entities needed:
- Organizations (multi-tenant)
- Users & Roles (RBAC)
- Tournaments
- Blind Structures & Levels
- Tables & Seats
- Entries & Players
- Eliminations
- Payouts
- Leagues & Seasons
- Events (for event sourcing)
- Clock States

Provide:
1. Complete Prisma schema
2. Relationships and constraints
3. Indexes for performance
4. RLS policies
5. Migration strategy`
            }
        })
            // Stage 2: Backend Development
            .stage('Backend Core Development')
            .task({
            type: core_1.TaskType.GENERATE,
            priority: 8,
            requiredCapabilities: ['nodejs'],
            payload: {
                specification: `Implement Clock Engine with drift correction:

Requirements:
- Server-authoritative time
- Drift correction algorithm
- Support pause/resume
- Level advancement
- Break management
- Sync protocol (minimize bandwidth)
- Handle reconnections
- State persistence

Include:
- TypeScript implementation
- Unit tests
- Usage examples`,
                language: 'typescript',
                framework: 'node.js'
            }
        })
            .task({
            type: core_1.TaskType.GENERATE,
            priority: 8,
            requiredCapabilities: ['nodejs'],
            payload: {
                specification: `Implement Event Store pattern:

Requirements:
- Append-only event log
- Event types (TournamentCreated, PlayerRegistered, etc.)
- Event sourcing
- CQRS projections
- Snapshots for performance
- Replay capability

Include:
- PostgreSQL schema
- TypeScript classes
- Event handlers
- Projection builders`,
                language: 'typescript',
                framework: 'node.js'
            }
        })
            .task({
            type: core_1.TaskType.GENERATE,
            priority: 8,
            requiredCapabilities: ['websocket'],
            payload: {
                specification: `Create WebSocket gateway with Socket.IO:

Features:
- Room-based broadcasting
- Authentication
- Reconnection handling
- Redis adapter for scaling
- Event types
- Client SDK

Implementation:
- Server setup
- Event handlers
- Middleware
- Client library`,
                language: 'typescript',
                framework: 'socket.io'
            }
        })
            // Stage 3: API Development
            .stage('API Development')
            .task({
            type: core_1.TaskType.GENERATE,
            priority: 7,
            requiredCapabilities: ['nodejs'],
            payload: {
                specification: `Implement tRPC API for tournament management:

Routers needed:
- auth (email/OTP, JWT)
- organization (CRUD, members)
- tournament (create, update, start, pause)
- player (register, rebuy, addon, eliminate)
- table (create, balance, break)
- payout (calculate, distribute)
- league (seasons, scoring)

Include:
- Type-safe procedures
- Validation with Zod
- Error handling
- Middleware (auth, logging)
- Rate limiting`,
                language: 'typescript',
                framework: 'trpc'
            }
        })
            // Stage 4: Frontend Development
            .stage('Frontend Core Components')
            .parallel()
            .task({
            type: core_1.TaskType.GENERATE,
            priority: 7,
            requiredCapabilities: ['react'],
            payload: {
                specification: `Create Tournament Clock component:

Features:
- Real-time display (mm:ss)
- Current/next blinds
- Ante display
- Progress bar
- Responsive design
- Theme support
- Animations

Stack:
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion`,
                language: 'typescript',
                framework: 'react'
            }
        })
            .task({
            type: core_1.TaskType.GENERATE,
            priority: 7,
            requiredCapabilities: ['react'],
            payload: {
                specification: `Create Player Registration component:

Features:
- Search/add players
- Bulk import
- Buy-in collection
- Seat assignment
- Late registration
- Rebuy/Addon buttons
- Player notes

Include:
- Form validation
- Optimistic updates
- Error handling`,
                language: 'typescript',
                framework: 'react'
            }
        })
            .task({
            type: core_1.TaskType.GENERATE,
            priority: 7,
            requiredCapabilities: ['react'],
            payload: {
                specification: `Create Seating Chart component:

Features:
- Visual table layout
- Drag & drop players
- Auto-balance suggestions
- Table breaking
- Chip counts
- Elimination marking
- Print view

Include:
- Touch support
- Animations
- Responsive grid`,
                language: 'typescript',
                framework: 'react'
            }
        })
            // Stage 5: PWA & Offline
            .stage('PWA & Offline Features')
            .task({
            type: core_1.TaskType.GENERATE,
            priority: 6,
            requiredCapabilities: ['pwa'],
            payload: {
                specification: `Implement PWA with offline support:

Requirements:
- Service Worker
- Cache strategies
- Offline queue
- Background sync
- Push notifications
- Install prompt
- App manifest

Include:
- Workbox config
- Sync logic
- Conflict resolution`,
                language: 'typescript',
                framework: 'next.js'
            }
        })
            // Stage 6: Testing
            .stage('Testing Suite')
            .parallel()
            .task({
            type: core_1.TaskType.GENERATE,
            priority: 5,
            requiredCapabilities: ['testing'],
            payload: {
                specification: `Create comprehensive test suite:

Unit tests for:
- Clock Engine
- Payout calculator
- Seating algorithm
- Event Store

Integration tests for:
- API endpoints
- WebSocket events
- Database operations

E2E tests for:
- Tournament creation flow
- Player registration
- Clock synchronization`,
                language: 'typescript',
                framework: 'vitest, playwright'
            }
        })
            // Stage 7: DevOps
            .stage('DevOps & Deployment')
            .task({
            type: core_1.TaskType.GENERATE,
            priority: 4,
            requiredCapabilities: ['docker'],
            payload: {
                specification: `Create Docker and CI/CD setup:

Docker:
- Multi-stage Dockerfile
- docker-compose for dev
- docker-compose for production
- Health checks

CI/CD:
- GitHub Actions workflow
- Build and test
- Security scanning
- Deploy to staging
- Deploy to production

Monitoring:
- Prometheus metrics
- Grafana dashboards
- Error tracking`,
                language: 'yaml',
                framework: 'docker, github-actions'
            }
        })
            .rollback(core_1.RollbackStrategy.COMPENSATE)
            .hooks({
            onStart: () => console.log(chalk_1.default.blue('🚀 Starting Full Project Build')),
            onComplete: (_result) => console.log(chalk_1.default.green('✅ Project Build Complete')),
            onError: (error) => console.log(chalk_1.default.red(`❌ Build Failed: ${error.message}`))
        })
            .build();
        this.orchestrator.registerWorkflow(fullProjectWorkflow);
        // MVP Workflow
        const mvpWorkflow = new core_1.WorkflowBuilder('mvp', 'MVP Tournament System')
            .description('Minimal viable product with core features only')
            .stage('MVP Development')
            .task({
            type: core_1.TaskType.PROMPT,
            priority: 10,
            requiredCapabilities: ['architecture'],
            payload: {
                prompt: 'Design minimal tournament system with just clock and player management'
            }
        })
            .task({
            type: core_1.TaskType.GENERATE,
            priority: 9,
            requiredCapabilities: ['nodejs'],
            payload: {
                specification: 'Basic clock engine and player CRUD API',
                language: 'typescript',
                framework: 'express'
            }
        })
            .task({
            type: core_1.TaskType.GENERATE,
            priority: 8,
            requiredCapabilities: ['react'],
            payload: {
                specification: 'Simple clock display and player list',
                language: 'typescript',
                framework: 'react'
            }
        })
            .build();
        this.orchestrator.registerWorkflow(mvpWorkflow);
    }
    async buildFullProject() {
        console.log(chalk_1.default.cyan('\n📦 Building Complete Poker Tournament System\n'));
        const result = await this.orchestrator.executeWorkflow('full-project', {
            projectName: 'TURNUVAYONETIM',
            features: [
                'tournament-clock',
                'player-management',
                'seating-balance',
                'payout-calculator',
                'league-system',
                'real-time-sync',
                'offline-first'
            ],
            timestamp: new Date()
        });
        await this.saveResults(result);
        console.log(chalk_1.default.green('\n✅ Project build complete!'));
        console.log(chalk_1.default.gray(`Output saved to: ${this.outputDir}`));
    }
    async buildMVP() {
        console.log(chalk_1.default.cyan('\n⚡ Building MVP Version\n'));
        const result = await this.orchestrator.executeWorkflow('mvp', {
            projectName: 'TURNUVAYONETIM-MVP',
            timestamp: new Date()
        });
        await this.saveResults(result);
        console.log(chalk_1.default.green('\n✅ MVP build complete!'));
    }
    async saveResults(result) {
        // Ensure output directories exist
        await fs_1.promises.mkdir(path.join(this.outputDir, 'architecture'), { recursive: true });
        await fs_1.promises.mkdir(path.join(this.outputDir, 'backend'), { recursive: true });
        await fs_1.promises.mkdir(path.join(this.outputDir, 'frontend'), { recursive: true });
        await fs_1.promises.mkdir(path.join(this.outputDir, 'deployment'), { recursive: true });
        // Save results to appropriate directories
        const stages = result.stages;
        // Architecture outputs
        if (stages['Architecture & Planning']) {
            await fs_1.promises.writeFile(path.join(this.outputDir, 'architecture', 'system-design.md'), stages['Architecture & Planning'][0]);
            await fs_1.promises.writeFile(path.join(this.outputDir, 'architecture', 'database-schema.prisma'), stages['Architecture & Planning'][1]);
        }
        // Backend outputs
        if (stages['Backend Core Development']) {
            await fs_1.promises.writeFile(path.join(this.outputDir, 'backend', 'clock-engine.ts'), stages['Backend Core Development'][0]);
            await fs_1.promises.writeFile(path.join(this.outputDir, 'backend', 'event-store.ts'), stages['Backend Core Development'][1]);
            await fs_1.promises.writeFile(path.join(this.outputDir, 'backend', 'websocket-gateway.ts'), stages['Backend Core Development'][2]);
        }
        // Save summary
        await fs_1.promises.writeFile(path.join(this.outputDir, 'build-summary.json'), JSON.stringify(result, null, 2));
    }
    async shutdown() {
        await this.orchestrator.shutdown();
    }
}
exports.PokerProjectOrchestrator = PokerProjectOrchestrator;
//# sourceMappingURL=index.js.map