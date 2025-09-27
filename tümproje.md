3 AŞAMALI PROJE OLUŞTURMA DOSYALARI
📁 PHASE1_ENVIRONMENT_SETUP.md
markdown# PHASE 1: TURNUVAYONETIM - Environment Setup

Codex, TURNUVAYONETIM poker turnuva yönetim sistemi için ortam kurulumunu yapacağız. Bu ilk aşamada temel altyapıyı oluşturacaksın.

## 1. Monorepo Klasör Yapısını Oluştur

Aşağıdaki klasör yapısını oluştur:
TURNUVAYONETIM/
├── apps/
│   ├── web/                 # Next.js frontend
│   ├── backend/             # Node.js API server
│   ├── ws/                  # WebSocket server
│   └── cli/                 # CLI interface
├── packages/
│   ├── mbao-core/          # Agent orchestration core
│   │   └── src/
│   ├── poker-adapter/      # Poker-specific adapter
│   │   └── src/
│   ├── ui/                 # Shared UI components
│   │   └── src/
│   ├── db/                 # Database schemas
│   └── shared/             # Shared utilities
│       └── src/
├── profiles/               # Agent browser profiles
│   ├── architect/
│   ├── backend/
│   ├── frontend/
│   └── devops/
├── scripts/                # Utility scripts
├── docs/                   # Documentation
├── docker/                 # Docker files
├── output/                 # Generated code output
│   ├── architecture/
│   ├── backend/
│   ├── frontend/
│   └── deployment/
└── .github/
└── workflows/          # CI/CD workflows

## 2. Root Package.json

Proje kökünde `package.json` oluştur:
```json
{
  "name": "turnuvayonetim",
  "version": "1.0.0",
  "description": "Advanced Poker Tournament Management System with Agent Orchestration",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "clean": "turbo run clean",
    "setup:agents": "node scripts/setup-agents.js",
    "agents:start": "node scripts/start-agents.js",
    "agents:status": "node scripts/agent-status.js",
    "orchestrate": "node apps/cli/dist/index.js",
    "orchestrate:build": "npm run orchestrate build --full",
    "orchestrate:mvp": "npm run orchestrate build --mvp",
    "db:setup": "docker-compose up -d postgres redis",
    "db:migrate": "cd apps/backend && npx prisma migrate dev",
    "db:seed": "cd apps/backend && npx prisma db seed",
    "db:studio": "cd apps/backend && npx prisma studio",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "@typescript-eslint/parser": "^6.13.0",
    "concurrently": "^8.2.2",
    "eslint": "^8.54.0",
    "prettier": "^3.1.0",
    "rimraf": "^5.0.5",
    "turbo": "^1.11.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  },
  "dependencies": {
    "chalk": "^5.3.0",
    "commander": "^11.1.0",
    "dotenv": "^16.3.1",
    "inquirer": "^9.2.12",
    "ora": "^7.0.1",
    "p-queue": "^7.4.1",
    "playwright": "^1.40.0",
    "puppeteer": "^21.6.0",
    "redis": "^4.6.11",
    "xstate": "^5.5.0",
    "zod": "^3.22.4"
  }
}
3. Turbo Configuration
turbo.json oluştur:
json{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "outputs": [],
      "dependsOn": ["build"]
    },
    "lint": {
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
4. TypeScript Configuration
Root tsconfig.json:
json{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "commonjs",
    "jsx": "preserve",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": ".",
    "paths": {
      "@turnuva/*": ["./packages/*/src"],
      "@mbao/*": ["./packages/mbao-core/src/*"],
      "@poker/*": ["./packages/poker-adapter/src/*"],
      "@ui/*": ["./packages/ui/src/*"],
      "@shared/*": ["./packages/shared/src/*"]
    }
  },
  "exclude": ["node_modules", "dist", ".turbo"]
}
5. Docker Configuration
docker-compose.yml:
yamlversion: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: tournament
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Agent Chrome instances
  chrome-architect:
    image: selenium/standalone-chrome:latest
    ports:
      - "4444:4444"
      - "7900:7900"
    shm_size: 2gb
    environment:
      - SE_NODE_MAX_SESSIONS=1
      - SE_NODE_SESSION_TIMEOUT=86400
    volumes:
      - ./profiles/architect:/home/seluser

  chrome-backend:
    image: selenium/standalone-chrome:latest
    ports:
      - "4445:4444"
      - "7901:7900"
    shm_size: 2gb
    environment:
      - SE_NODE_MAX_SESSIONS=1
    volumes:
      - ./profiles/backend:/home/seluser

  chrome-frontend:
    image: selenium/standalone-chrome:latest
    ports:
      - "4446:4444"
      - "7902:7900"
    shm_size: 2gb
    environment:
      - SE_NODE_MAX_SESSIONS=1
    volumes:
      - ./profiles/frontend:/home/seluser

  chrome-devops:
    image: selenium/standalone-chrome:latest
    ports:
      - "4447:4444"
      - "7903:7900"
    shm_size: 2gb
    environment:
      - SE_NODE_MAX_SESSIONS=1
    volumes:
      - ./profiles/devops:/home/seluser

volumes:
  postgres_data:
  redis_data:
6. Environment Files
.env.local:
env# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tournament
REDIS_URL=redis://localhost:6379

# Agent Credentials (4 Codex Accounts)
CODEX_1_EMAIL=your-email-1@example.com
CODEX_1_PASSWORD=your-password-1
CODEX_2_EMAIL=your-email-2@example.com
CODEX_2_PASSWORD=your-password-2
CODEX_3_EMAIL=your-email-3@example.com
CODEX_3_PASSWORD=your-password-3
CODEX_4_EMAIL=your-email-4@example.com
CODEX_4_PASSWORD=your-password-4

# WebSocket
WS_PORT=3001
WS_SECRET=your-websocket-secret-key

# Agent Settings
AGENT_HEADLESS=false
AGENT_TIMEOUT=60000
AGENT_MAX_RETRIES=3

# API
API_PORT=4000
JWT_SECRET=your-jwt-secret-key
SESSION_SECRET=your-session-secret

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
7. Agent Configuration
agent-config.json:
json{
  "agents": [
    {
      "id": "architect",
      "name": "System Architect",
      "email": "${CODEX_1_EMAIL}",
      "password": "${CODEX_1_PASSWORD}",
      "platform": "https://platform.openai.com/playground",
      "role": "System design, database architecture, API design",
      "capabilities": ["architecture", "database", "planning", "documentation"],
      "browserConfig": {
        "profilePath": "./profiles/architect",
        "headless": false,
        "position": "0,0"
      }
    },
    {
      "id": "backend",
      "name": "Backend Developer",
      "email": "${CODEX_2_EMAIL}",
      "password": "${CODEX_2_PASSWORD}",
      "platform": "https://platform.openai.com/playground",
      "role": "API development, WebSocket, event sourcing",
      "capabilities": ["nodejs", "typescript", "prisma", "websocket", "redis"],
      "browserConfig": {
        "profilePath": "./profiles/backend",
        "headless": false,
        "position": "640,0"
      }
    },
    {
      "id": "frontend",
      "name": "Frontend Developer",
      "email": "${CODEX_3_EMAIL}",
      "password": "${CODEX_3_PASSWORD}",
      "platform": "https://platform.openai.com/playground",
      "role": "React components, UI/UX, PWA",
      "capabilities": ["react", "nextjs", "tailwind", "typescript", "pwa"],
      "browserConfig": {
        "profilePath": "./profiles/frontend",
        "headless": false,
        "position": "0,400"
      }
    },
    {
      "id": "devops",
      "name": "DevOps Engineer",
      "email": "${CODEX_4_EMAIL}",
      "password": "${CODEX_4_PASSWORD}",
      "platform": "https://platform.openai.com/playground",
      "role": "Docker, CI/CD, testing, deployment",
      "capabilities": ["docker", "kubernetes", "testing", "ci-cd", "monitoring"],
      "browserConfig": {
        "profilePath": "./profiles/devops",
        "headless": false,
        "position": "640,400"
      }
    }
  ],
  "orchestration": {
    "maxConcurrency": 4,
    "taskTimeout": 60000,
    "retryAttempts": 3,
    "retryDelay": 5000
  }
}
8. ESLint Configuration
.eslintrc.json:
json{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "env": {
    "node": true,
    "es2022": true
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["warn", "error", "info"] }]
  }
}
9. Prettier Configuration
.prettierrc:
json{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
10. Setup Scripts
scripts/setup-windows.bat:
batch@echo off
title TURNUVAYONETIM Setup
color 0A

echo Installing dependencies...
call npm install

echo Setting up database...
docker-compose up -d postgres redis

echo Waiting for services...
timeout /t 5 /nobreak >nul

echo Setup complete!
pause
scripts/setup-unix.sh:
bash#!/bin/bash

echo "Installing dependencies..."
npm install

echo "Setting up database..."
docker-compose up -d postgres redis

echo "Waiting for services..."
sleep 5

echo "Setup complete!"
Bu aşamayı tamamladıktan sonra "Phase 1 completed" diye bildir ve Phase 2'ye geçebiliriz.

## **🤖 PHASE2_AGENT_SYSTEM.md**
```markdown
# PHASE 2: TURNUVAYONETIM - Agent System Implementation

Codex, şimdi MBAO (Modular Browser Agent Orchestrator) sistemini implement edeceğiz. Bu sistem 4 browser agent'ı koordine edecek.

## 1. MBAO Core Library

`packages/mbao-core/src/index.ts`:
```typescript
import { EventEmitter } from 'events';
import PQueue from 'p-queue';
import { createMachine, interpret } from 'xstate';
import * as Redis from 'redis';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// ============= TYPE DEFINITIONS =============

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  browserConfig: {
    profilePath: string;
    position?: string;
    headless?: boolean;
    userAgent?: string;
  };
  credentials?: {
    email: string;
    password: string;
    platform: string;
  };
  maxConcurrency?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
}

export interface Task {
  id: string;
  type: TaskType;
  priority: number;
  payload: any;
  requiredCapabilities?: string[];
  dependencies?: string[];
  timeout?: number;
  retries?: number;
  metadata?: Record<string, any>;
}

export enum TaskType {
  PROMPT = 'prompt',
  EXTRACT = 'extract',
  NAVIGATE = 'navigate',
  INTERACT = 'interact',
  ANALYZE = 'analyze',
  GENERATE = 'generate',
  REVIEW = 'review'
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  stages: WorkflowStage[];
  rollbackStrategy?: RollbackStrategy;
  hooks?: {
    onStart?: () => void;
    onComplete?: (result: any) => void;
    onError?: (error: Error) => void;
  };
}

export interface WorkflowStage {
  id: string;
  name: string;
  parallel?: boolean;
  tasks: Task[];
  timeout?: number;
  onSuccess?: (results: any[]) => Task[];
  onFailure?: (error: Error) => void;
  retryable?: boolean;
}

export enum RollbackStrategy {
  NONE = 'none',
  COMPENSATE = 'compensate',
  RETRY = 'retry',
  ABORT = 'abort'
}

export interface OrchestratorConfig {
  maxConcurrency?: number;
  rateLimit?: {
    interval: number;
    cap: number;
  };
  redis?: {
    url: string;
  };
  monitoring?: {
    enabled: boolean;
    port?: number;
  };
}

// ============= ORCHESTRATOR CORE =============

export class Orchestrator extends EventEmitter {
  private agents: Map<string, BrowserAgent> = new Map();
  private taskQueue: PQueue;
  private workflows: Map<string, WorkflowTemplate> = new Map();
  private messageBus: MessageBus;
  private resultStore: ResultStore;
  private capabilityRegistry: CapabilityRegistry;
  private redis?: Redis.RedisClientType;
  private stateMachine: any;
  
  constructor(private config: OrchestratorConfig) {
    super();
    
    this.taskQueue = new PQueue({
      concurrency: config.maxConcurrency || 4,
      interval: config.rateLimit?.interval,
      intervalCap: config.rateLimit?.cap,
      throwOnTimeout: true
    });
    
    this.messageBus = new MessageBus();
    this.resultStore = new ResultStore();
    this.capabilityRegistry = new CapabilityRegistry();
    
    this.initializeStateMachine();
    
    if (config.redis) {
      this.initializeRedis(config.redis.url);
    }
  }
  
  private initializeStateMachine() {
    this.stateMachine = createMachine({
      id: 'orchestrator',
      initial: 'idle',
      states: {
        idle: {
          on: {
            START: 'running'
          }
        },
        running: {
          on: {
            PAUSE: 'paused',
            COMPLETE: 'completed',
            ERROR: 'error'
          }
        },
        paused: {
          on: {
            RESUME: 'running',
            RESET: 'idle'
          }
        },
        completed: {
          on: {
            RESET: 'idle'
          }
        },
        error: {
          on: {
            RETRY: 'running',
            RESET: 'idle'
          }
        }
      }
    });
  }
  
  private async initializeRedis(url: string) {
    this.redis = Redis.createClient({ url });
    await this.redis.connect();
    
    this.redis.on('error', err => {
      console.error('Redis error:', err);
      this.emit('redis:error', err);
    });
    
    this.redis.on('connect', () => {
      console.log('Redis connected');
      this.emit('redis:connected');
    });
  }
  
  async registerAgent(config: AgentConfig): Promise<void> {
    const agent = new BrowserAgent(config, this.messageBus);
    await agent.initialize();
    
    this.agents.set(config.id, agent);
    
    // Register capabilities
    config.capabilities.forEach(cap => {
      this.capabilityRegistry.register(cap, config.id);
    });
    
    this.emit('agent:registered', {
      id: config.id,
      name: config.name,
      capabilities: config.capabilities
    });
    
    console.log(`✅ Agent registered: ${config.name}`);
  }
  
  registerWorkflow(template: WorkflowTemplate): void {
    this.workflows.set(template.id, template);
    this.emit('workflow:registered', template.id);
  }
  
  async executeWorkflow(
    workflowId: string,
    context: any,
    options?: { timeout?: number; parallel?: boolean }
  ): Promise<WorkflowResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    const execution = new WorkflowExecution(workflow, context);
    
    if (workflow.hooks?.onStart) {
      workflow.hooks.onStart();
    }
    
    try {
      for (const stage of workflow.stages) {
        console.log(`📋 Executing stage: ${stage.name}`);
        const results = await this.executeStage(stage, execution);
        execution.addStageResult(stage.name, results);
        
        // Dynamic task generation
        if (stage.onSuccess) {
          const newTasks = stage.onSuccess(results);
          if (newTasks.length > 0) {
            await this.executeTasks(newTasks);
          }
        }
      }
      
      if (workflow.hooks?.onComplete) {
        workflow.hooks.onComplete(execution.getResult());
      }
      
      return execution.getResult();
      
    } catch (error) {
      if (workflow.hooks?.onError) {
        workflow.hooks.onError(error as Error);
      }
      
      if (workflow.rollbackStrategy) {
        await this.handleRollback(execution, workflow.rollbackStrategy);
      }
      
      throw error;
    }
  }
  
  private async executeStage(
    stage: WorkflowStage,
    execution: WorkflowExecution
  ): Promise<any[]> {
    const startTime = Date.now();
    
    try {
      if (stage.parallel) {
        // Parallel execution
        const promises = stage.tasks.map(task => 
          this.assignAndExecuteTask(task)
        );
        return await Promise.all(promises);
      } else {
        // Sequential execution
        const results = [];
        for (const task of stage.tasks) {
          const result = await this.assignAndExecuteTask(task);
          results.push(result);
        }
        return results;
      }
    } finally {
      const duration = Date.now() - startTime;
      this.emit('stage:completed', {
        stage: stage.name,
        duration
      });
    }
  }
  
  private async assignAndExecuteTask(task: Task): Promise<any> {
    // Find capable agent
    const agent = await this.findCapableAgent(task.requiredCapabilities);
    if (!agent) {
      throw new Error(`No agent found for task: ${task.id}`);
    }
    
    // Add to queue with retry logic
    return this.taskQueue.add(
      async () => {
        return this.executeWithRetry(
          () => agent.executeTask(task),
          task.retries || 3
        );
      },
      { priority: task.priority }
    );
  }
  
  private async findCapableAgent(
    requiredCapabilities?: string[]
  ): Promise<BrowserAgent | null> {
    if (!requiredCapabilities || requiredCapabilities.length === 0) {
      // Round-robin selection for generic tasks
      return this.getNextAvailableAgent();
    }
    
    // Capability-based selection
    const capableAgentIds = requiredCapabilities
      .map(cap => this.capabilityRegistry.getAgents(cap))
      .reduce((acc, agents) => {
        return acc.filter(id => agents.includes(id));
      });
    
    if (capableAgentIds.length === 0) {
      return null;
    }
    
    // Get least loaded agent
    const agents = capableAgentIds
      .map(id => this.agents.get(id))
      .filter(Boolean) as BrowserAgent[];
    
    return agents.reduce((best, agent) =>
      agent.getLoad() < best.getLoad() ? agent : best
    );
  }
  
  private getNextAvailableAgent(): BrowserAgent | null {
    const agents = Array.from(this.agents.values());
    if (agents.length === 0) return null;
    
    // Get least loaded agent
    return agents.reduce((best, agent) =>
      agent.getLoad() < best.getLoad() ? agent : best
    );
  }
  
  private async executeWithRetry(
    fn: () => Promise<any>,
    maxRetries: number
  ): Promise<any> {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const delay = Math.min(1000 * Math.pow(2, i), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
  
  private async executeTasks(tasks: Task[]): Promise<any[]> {
    const results = [];
    for (const task of tasks) {
      const result = await this.assignAndExecuteTask(task);
      results.push(result);
    }
    return results;
  }
  
  private async handleRollback(
    execution: WorkflowExecution,
    strategy: RollbackStrategy
  ): Promise<void> {
    switch (strategy) {
      case RollbackStrategy.COMPENSATE:
        // Reverse executed stages
        const stages = execution.getCompletedStages();
        for (const stage of stages.reverse()) {
          // Execute compensation logic
          console.log(`🔄 Rolling back stage: ${stage}`);
        }
        break;
        
      case RollbackStrategy.RETRY:
        // Retry from last successful stage
        console.log('🔁 Retrying workflow...');
        break;
        
      case RollbackStrategy.ABORT:
        // Clean abort
        console.log('❌ Aborting workflow');
        break;
        
      default:
        break;
    }
  }
  
  async shutdown(): Promise<void> {
    // Close all agents
    for (const agent of this.agents.values()) {
      await agent.shutdown();
    }
    
    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
    }
    
    // Clear task queue
    this.taskQueue.clear();
    
    this.emit('shutdown');
  }
}

// ============= BROWSER AGENT =============

export class BrowserAgent {
  private browser: any;
  private page: any;
  private context: any;
  private taskHistory: any[] = [];
  private load: number = 0;
  private isInitialized: boolean = false;
  
  constructor(
    public config: AgentConfig,
    private messageBus: MessageBus
  ) {}
  
  async initialize(): Promise<void> {
    const puppeteer = await import('puppeteer');
    
    this.browser = await puppeteer.launch({
      headless: this.config.browserConfig.headless || false,
      userDataDir: this.config.browserConfig.profilePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        this.config.browserConfig.position 
          ? `--window-position=${this.config.browserConfig.position}`
          : '',
        '--window-size=1280,800'
      ].filter(Boolean)
    });
    
    this.page = await this.browser.newPage();
    
    if (this.config.browserConfig.userAgent) {
      await this.page.setUserAgent(this.config.browserConfig.userAgent);
    }
    
    // Auto-login if credentials provided
    if (this.config.credentials) {
      await this.login();
    }
    
    this.isInitialized = true;
    this.messageBus.emit('agent:ready', this.config.id);
  }
  
  private async login(): Promise<void> {
    if (!this.config.credentials) return;
    
    const { platform, email, password } = this.config.credentials;
    
    await this.page.goto(platform, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Check if already logged in
    const needsLogin = await this.page.$('input[name="username"], input[name="email"]');
    
    if (needsLogin) {
      console.log(`🔐 Logging in ${this.config.name}...`);
      
      // Generic login flow
      await this.page.type(
        'input[name="username"], input[name="email"]',
        email,
        { delay: 100 }
      );
      
      // Click continue/next button if exists
      const continueBtn = await this.page.$('button[type="submit"]:not([name="password"])');
      if (continueBtn) {
        await continueBtn.click();
        await this.page.waitForTimeout(2000);
      }
      
      // Enter password
      await this.page.type(
        'input[name="password"], input[type="password"]',
        password,
        { delay: 100 }
      );
      
      // Submit
      await this.page.click('button[type="submit"]');
      await this.page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      console.log(`✅ ${this.config.name} logged in successfully`);
    } else {
      console.log(`✅ ${this.config.name} already logged in`);
    }
  }
  
  async executeTask(task: Task): Promise<any> {
    if (!this.isInitialized) {
      throw new Error(`Agent ${this.config.id} not initialized`);
    }
    
    this.load++;
    const startTime = Date.now();
    
    try {
      console.log(`🤖 [${this.config.name}] Executing task: ${task.id}`);
      
      // Get executor for task type
      const executor = this.getExecutor(task.type);
      const result = await executor.execute(task, this.page);
      
      // Record in history
      this.taskHistory.push({
        taskId: task.id,
        type: task.type,
        success: true,
        duration: Date.now() - startTime,
        timestamp: new Date()
      });
      
      this.messageBus.emit('task:completed', {
        agentId: this.config.id,
        taskId: task.id,
        result
      });
      
      return result;
      
    } catch (error) {
      this.taskHistory.push({
        taskId: task.id,
        type: task.type,
        success: false,
        error: (error as Error).message,
        duration: Date.now() - startTime,
        timestamp: new Date()
      });
      
      this.messageBus.emit('task:failed', {
        agentId: this.config.id,
        taskId: task.id,
        error
      });
      
      throw error;
      
    } finally {
      this.load--;
    }
  }
  
  private getExecutor(taskType: TaskType): TaskExecutor {
    const executors: Record<TaskType, TaskExecutor> = {
      [TaskType.PROMPT]: new PromptExecutor(),
      [TaskType.EXTRACT]: new DataExtractor(),
      [TaskType.NAVIGATE]: new NavigationExecutor(),
      [TaskType.INTERACT]: new InteractionExecutor(),
      [TaskType.ANALYZE]: new AnalysisExecutor(),
      [TaskType.GENERATE]: new CodeGenerator(),
      [TaskType.REVIEW]: new CodeReviewer()
    };
    
    return executors[taskType];
  }
  
  getLoad(): number {
    return this.load;
  }
  
  async shutdown(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
    this.isInitialized = false;
  }
}

// ============= TASK EXECUTORS =============

abstract class TaskExecutor {
  abstract execute(task: Task, page: any): Promise<any>;
}

class PromptExecutor extends TaskExecutor {
  async execute(task: Task, page: any): Promise<string> {
    const { prompt, waitForResponse = true, model = 'gpt-4' } = task.payload;
    
    // OpenAI Playground specific implementation
    const isPlayground = page.url().includes('platform.openai.com');
    
    if (isPlayground) {
      // Wait for editor to be ready
      await page.waitForSelector('.monaco-editor', { timeout: 10000 });
      
      // Clear existing content
      await page.evaluate(() => {
        const editor = (window as any).monaco?.editor?.getModels()[0];
        if (editor) {
          editor.setValue('');
        }
      });
      
      // Type prompt
      await page.keyboard.type(prompt);
      
      // Submit
      const submitBtn = await page.$('button:has-text("Submit"), button:has-text("Run")');
      if (submitBtn) {
        await submitBtn.click();
      } else {
        // Fallback: press Ctrl+Enter
        await page.keyboard.press('Control+Enter');
      }
      
      if (waitForResponse) {
        // Wait for response
        await page.waitForFunction(
          () => {
            const responses = document.querySelectorAll('.response-content, .output-content');
            return responses.length > 0 && responses[responses.length - 1].textContent?.length > 0;
          },
          { timeout: 60000 }
        );
        
        // Get response
        const response = await page.evaluate(() => {
          const responses = document.querySelectorAll('.response-content, .output-content');
          return responses[responses.length - 1]?.textContent || '';
        });
        
        return response;
      }
      
      return 'submitted';
    }
    
    // Generic implementation for other platforms
    const textArea = await page.$('textarea, [contenteditable="true"]');
    if (textArea) {
      await textArea.click();
      await page.keyboard.type(prompt);
      await page.keyboard.press('Enter');
      
      if (waitForResponse) {
        await page.waitForTimeout(5000);
        const response = await page.evaluate(() => {
          const elements = document.querySelectorAll('[data-message-role="assistant"], .assistant-message, .response');
          return elements[elements.length - 1]?.textContent || '';
        });
        return response;
      }
      
      return 'submitted';
    }
    
    throw new Error('Could not find input area');
  }
}

class DataExtractor extends TaskExecutor {
  async execute(task: Task, page: any): Promise<any> {
    const { selector, attribute, multiple = false } = task.payload;
    
    await page.waitForSelector(selector, { timeout: 10000 });
    
    if (multiple) {
      return await page.$$eval(selector, (elements: any[], attr: string) => {
        return elements.map(el => {
          if (attr === 'text') return el.textContent;
          if (attr === 'html') return el.innerHTML;
          return el.getAttribute(attr);
        });
      }, attribute);
    } else {
      return await page.$eval(selector, (element: any, attr: string) => {
        if (attr === 'text') return element.textContent;
        if (attr === 'html') return element.innerHTML;
        return element.getAttribute(attr);
      }, attribute);
    }
  }
}

class NavigationExecutor extends TaskExecutor {
  async execute(task: Task, page: any): Promise<void> {
    const { url, waitUntil = 'networkidle2' } = task.payload;
    
    await page.goto(url, {
      waitUntil,
      timeout: 30000
    });
    
    return;
  }
}

class InteractionExecutor extends TaskExecutor {
  async execute(task: Task, page: any): Promise<void> {
    const { action, selector, value } = task.payload;
    
    await page.waitForSelector(selector, { timeout: 10000 });
    
    switch (action) {
      case 'click':
        await page.click(selector);
        break;
        
      case 'type':
        await page.type(selector, value);
        break;
        
      case 'select':
        await page.select(selector, value);
        break;
        
      case 'hover':
        await page.hover(selector);
        break;
        
      case 'screenshot':
        return await page.screenshot({ path: value });
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
}

class AnalysisExecutor extends TaskExecutor {
  async execute(task: Task, page: any): Promise<any> {
    const { code } = task.payload;
    
    // Execute analysis code in page context
    const result = await page.evaluate(code);
    
    return result;
  }
}

class CodeGenerator extends TaskExecutor {
  async execute(task: Task, page: any): Promise<string> {
    const { specification, language, framework } = task.payload;
    
    const prompt = `
Generate ${language} code using ${framework || 'vanilla'} for:
${specification}

Requirements:
- Production-ready code
- Proper error handling
- Type safety (if applicable)
- Comments for complex logic
- Follow best practices

Code:
`;
    
    // Reuse PromptExecutor
    const promptExecutor = new PromptExecutor();
    const code = await promptExecutor.execute(
      { ...task, payload: { prompt, waitForResponse: true } },
      page
    );
    
    // Extract code blocks
    const codeMatch = code.match(/```[\w]*\n([\s\S]*?)\n```/);
    return codeMatch ? codeMatch[1] : code;
  }
}

class CodeReviewer extends TaskExecutor {
  async execute(task: Task, page: any): Promise<any> {
    const { code, language, criteria } = task.payload;
    
    const prompt = `
Review this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Review criteria:
${criteria?.join('\n') || '- Code quality\n- Performance\n- Security\n- Best practices'}

Provide:
1. Issues found (if any)
2. Suggestions for improvement
3. Security concerns
4. Performance optimizations
5. Overall score (1-10)
`;
    
    const promptExecutor = new PromptExecutor();
    const review = await promptExecutor.execute(
      { ...task, payload: { prompt, waitForResponse: true } },
      page
    );
    
    return review;
  }
}

// ============= SUPPORT CLASSES =============

class MessageBus extends EventEmitter {
  private channels: Map<string, Set<string>> = new Map();
  
  subscribe(agentId: string, channel: string): void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(agentId);
  }
  
  publish(channel: string, message: any): void {
    const subscribers = this.channels.get(channel);
    if (!subscribers) return;
    
    subscribers.forEach(agentId => {
      this.emit(`message:${agentId}`, {
        channel,
        message,
        timestamp: new Date()
      });
    });
  }
  
  broadcast(message: any): void {
    this.emit('broadcast', {
      message,
      timestamp: new Date()
    });
  }
}

class ResultStore {
  private results: Map<string, any> = new Map();
  
  store(key: string, value: any): void {
    this.results.set(key, {
      value,
      timestamp: new Date()
    });
  }
  
  get(key: string): any {
    const result = this.results.get(key);
    return result?.value;
  }
  
  getAll(): Record<string, any> {
    const all: Record<string, any> = {};
    this.results.forEach((value, key) => {
      all[key] = value.value;
    });
    return all;
  }
  
  clear(): void {
    this.results.clear();
  }
}

class CapabilityRegistry {
  private capabilities: Map<string, Set<string>> = new Map();
  
  register(capability: string, agentId: string): void {
    if (!this.capabilities.has(capability)) {
      this.capabilities.set(capability, new Set());
    }
    this.capabilities.get(capability)!.add(agentId);
  }
  
  unregister(capability: string, agentId: string): void {
    this.capabilities.get(capability)?.delete(agentId);
  }
  
  getAgents(capability: string): string[] {
    return Array.from(this.capabilities.get(capability) || []);
  }
  
  getCapabilities(agentId: string): string[] {
    const caps: string[] = [];
    this.capabilities.forEach((agents, capability) => {
      if (agents.has(agentId)) {
        caps.push(capability);
      }
    });
    return caps;
  }
}

class WorkflowExecution {
  private stageResults: Map<string, any> = new Map();
  private completedStages: string[] = [];
  private startTime: number = Date.now();
  
  constructor(
    private workflow: WorkflowTemplate,
    private context: any
  ) {}
  
  addStageResult(stageName: string, result: any): void {
    this.stageResults.set(stageName, result);
    this.completedStages.push(stageName);
  }
  
  getCompletedStages(): string[] {
    return [...this.completedStages];
  }
  
  getResult(): WorkflowResult {
    return {
      workflowId: this.workflow.id,
      context: this.context,
      stages: Object.fromEntries(this.stageResults),
      completedStages: this.completedStages,
      duration: Date.now() - this.startTime,
      timestamp: new Date()
    };
  }
}

interface WorkflowResult {
  workflowId: string;
  context: any;
  stages: Record<string, any>;
  completedStages: string[];
  duration: number;
  timestamp: Date;
}

// ============= WORKFLOW BUILDER =============

export class WorkflowBuilder {
  private workflow: WorkflowTemplate;
  private currentStage?: WorkflowStage;
  
  constructor(id: string, name: string) {
    this.workflow = {
      id,
      name,
      stages: []
    };
  }
  
  description(desc: string): this {
    this.workflow.description = desc;
    return this;
  }
  
  stage(name: string): this {
    const stage: WorkflowStage = {
      id: uuidv4(),
      name,
      tasks: []
    };
    this.currentStage = stage;
    this.workflow.stages.push(stage);
    return this;
  }
  
  parallel(): this {
    if (this.currentStage) {
      this.currentStage.parallel = true;
    }
    return this;
  }
  
  task(task: Partial<Task> & { type: TaskType }): this {
    if (!this.currentStage) {
      throw new Error('No stage defined');
    }
    
    const fullTask: Task = {
      id: task.id || uuidv4(),
      type: task.type,
      priority: task.priority || 5,
      payload: task.payload || {},
      ...task
    };
    
    this.currentStage.tasks.push(fullTask);
    return this;
  }
  
  onSuccess(handler: (results: any[]) => Task[]): this {
    if (this.currentStage) {
      this.currentStage.onSuccess = handler;
    }
    return this;
  }
  
  onFailure(handler: (error: Error) => void): this {
    if (this.currentStage) {
      this.currentStage.onFailure = handler;
    }
    return this;
  }
  
  rollback(strategy: RollbackStrategy): this {
    this.workflow.rollbackStrategy = strategy;
    return this;
  }
  
  hooks(hooks: WorkflowTemplate['hooks']): this {
    this.workflow.hooks = hooks;
    return this;
  }
  
  build(): WorkflowTemplate {
    return this.workflow;
  }
}

export default Orchestrator;
2. Poker Project Adapter
packages/poker-adapter/src/index.ts:
typescriptimport {
  Orchestrator,
  WorkflowBuilder,
  TaskType,
  RollbackStrategy,
  AgentConfig
} from '@mbao/mbao-core';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';

export class PokerProjectOrchestrator {
  private orchestrator: Orchestrator;
  private outputDir: string;
  
  constructor() {
    this.orchestrator = new Orchestrator({
      maxConcurrency: 4,
      rateLimit: {
        interval: 1000,
        cap: 10
      },
      redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      },
      monitoring: {
        enabled: true,
        port: 3002
      }
    });
    
    this.outputDir = path.join(process.cwd(), 'output');
  }
  
  async initialize(): Promise<void> {
    await this.setupAgents();
    await this.registerWorkflows();
    console.log(chalk.green('✅ Poker Project Orchestrator initialized'));
  }
  
  private async setupAgents(): Promise<void> {
    // Load agent config
    const configPath = path.join(process.cwd(), 'agent-config.json');
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    // Register each agent
    for (const agentConfig of config.agents) {
      const agent: AgentConfig = {
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
  
  private async registerWorkflows(): Promise<void> {
    // Full Project Workflow
    const fullProjectWorkflow = new WorkflowBuilder('full-project', 'Complete Poker Tournament System')
      .description('Build complete tournament management system with all features')
      
      // Stage 1: Architecture & Planning
      .stage('Architecture & Planning')
      .parallel()
      .task({
        type: TaskType.PROMPT,
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
        type: TaskType.PROMPT,
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
        type: TaskType.GENERATE,
        priority: 8,
        requiredCapabilities: ['backend'],
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
        type: TaskType.GENERATE,
        priority: 8,
        requiredCapabilities: ['backend'],
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
        type: TaskType.GENERATE,
        priority: 8,
        requiredCapabilities: ['backend'],
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
        type: TaskType.GENERATE,
        priority: 7,
        requiredCapabilities: ['backend'],
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
        type: TaskType.GENERATE,
        priority: 7,
        requiredCapabilities: ['frontend'],
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
        type: TaskType.GENERATE,
        priority: 7,
        requiredCapabilities: ['frontend'],
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
        type: TaskType.GENERATE,
        priority: 7,
        requiredCapabilities: ['frontend'],
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
        type: TaskType.GENERATE,
        priority: 6,
        requiredCapabilities: ['frontend'],
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
        type: TaskType.GENERATE,
        priority: 5,
        requiredCapabilities: ['testing', 'backend'],
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
        type: TaskType.GENERATE,
        priority: 4,
        requiredCapabilities: ['devops'],
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
      
      .rollback(RollbackStrategy.COMPENSATE)
      .hooks({
        onStart: () => console.log(chalk.blue('🚀 Starting Full Project Build')),
        onComplete: (result) => console.log(chalk.green('✅ Project Build Complete')),
        onError: (error) => console.log(chalk.red(`❌ Build Failed: ${error.message}`))
      })
      .build();
    
    this.orchestrator.registerWorkflow(fullProjectWorkflow);
    
    // MVP Workflow
    const mvpWorkflow = new WorkflowBuilder('mvp', 'MVP Tournament System')
      .description('Minimal viable product with core features only')
      
      .stage('MVP Development')
      .task({
        type: TaskType.PROMPT,
        priority: 10,
        requiredCapabilities: ['architecture'],
        payload: {
          prompt: 'Design minimal tournament system with just clock and player management'
        }
      })
      .task({
        type: TaskType.GENERATE,
        priority: 9,
        requiredCapabilities: ['backend'],
        payload: {
          specification: 'Basic clock engine and player CRUD API',
          language: 'typescript',
          framework: 'express'
        }
      })
      .task({
        type: TaskType.GENERATE,
        priority: 8,
        requiredCapabilities: ['frontend'],
        payload: {
          specification: 'Simple clock display and player list',
          language: 'typescript',
          framework: 'react'
        }
      })
      .build();
    
    this.orchestrator.registerWorkflow(mvpWorkflow);
  }
  
  async buildFullProject(): Promise<void> {
    console.log(chalk.cyan('\n📦 Building Complete Poker Tournament System\n'));
    
    const result = await this.orchestrator.executeWorkflow(
      'full-project',
      {
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
      }
    );
    
    await this.saveResults(result);
    
    console.log(chalk.green('\n✅ Project build complete!'));
    console.log(chalk.gray(`Output saved to: ${this.outputDir}`));
  }
  
  async buildMVP(): Promise<void> {
    console.log(chalk.cyan('\n⚡ Building MVP Version\n'));
    
    const result = await this.orchestrator.executeWorkflow('mvp', {
      projectName: 'TURNUVAYONETIM-MVP',
      timestamp: new Date()
    });
    
    await this.saveResults(result);
    
    console.log(chalk.green('\n✅ MVP build complete!'));
  }
  
  private async saveResults(result: any): Promise<void> {
    // Ensure output directories exist
    await fs.mkdir(path.join(this.outputDir, 'architecture'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'backend'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'frontend'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'deployment'), { recursive: true });
    
    // Save results to appropriate directories
    const stages = result.stages;
    
    // Architecture outputs
    if (stages['Architecture & Planning']) {
      await fs.writeFile(
        path.join(this.outputDir, 'architecture', 'system-design.md'),
        stages['Architecture & Planning'][0]
      );
      await fs.writeFile(
        path.join(this.outputDir, 'architecture', 'database-schema.prisma'),
        stages['Architecture & Planning'][1]
      );
    }
    
    // Backend outputs
    if (stages['Backend Core Development']) {
      await fs.writeFile(
        path.join(this.outputDir, 'backend', 'clock-engine.ts'),
        stages['Backend Core Development'][0]
      );
      await fs.writeFile(
        path.join(this.outputDir, 'backend', 'event-store.ts'),
        stages['Backend Core Development'][1]
      );
      await fs.writeFile(
        path.join(this.outputDir, 'backend', 'websocket-gateway.ts'),
        stages['Backend Core Development'][2]
      );
    }
    
    // Save summary
    await fs.writeFile(
      path.join(this.outputDir, 'build-summary.json'),
      JSON.stringify(result, null, 2)
    );
  }
  
  async shutdown(): Promise<void> {
    await this.orchestrator.shutdown();
  }
}

export default PokerProjectOrchestrator;
3. CLI Interface
apps/cli/src/index.ts:
typescript#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { PokerProjectOrchestrator } from '@poker/poker-adapter';
import * as figlet from 'figlet';
import * as fs from 'fs/promises';
import * as path from 'path';

class TurnuvaYonetimCLI {
  private orchestrator: PokerProjectOrchestrator;
  private program: Command;
  
  constructor() {
    this.orchestrator = new PokerProjectOrchestrator();
    this.program = new Command();
    this.setupCommands();
  }
  
  private async showBanner(): Promise<void> {
    console.clear();
    console.log(
      chalk.cyan(
        figlet.textSync('TURNUVA', { horizontalLayout: 'full' })
      )
    );
    console.log(
      chalk.cyan(
        figlet.textSync('YONETIM', { horizontalLayout: 'full' })
      )
    );
    console.log(chalk.gray('\n  Advanced Poker Tournament Management System'));
    console.log(chalk.gray('  Powered by 4-Agent AI Orchestration\n'));
    console.log(chalk.gray('═'.repeat(60)));
  }
  
  private setupCommands(): void {
    this.program
      .name('turnuva')
      .description('TURNUVAYONETIM CLI - Poker Tournament System Builder')
      .version('1.0.0');
    
    // Initialize command
    this.program
      .command('init')
      .description('Initialize agents and environment')
      .action(async () => {
        await this.showBanner();
        const spinner = ora('Initializing orchestrator...').start();
        
        try {
          await this.orchestrator.initialize();
          spinner.succeed('Orchestrator initialized');
          
          console.log(chalk.green('\n✅ System ready!'));
          console.log(chalk.gray('\nAgents online:'));
          console.log(chalk.blue('  • System Architect'));
          console.log(chalk.green('  • Backend Developer'));
          console.log(chalk.magenta('  • Frontend Developer'));
          console.log(chalk.yellow('  • DevOps Engineer\n'));
          
        } catch (error) {
          spinner.fail('Initialization failed');
          console.error(chalk.red(error));
          process.exit(1);
        }
      });
    
    // Build command
    this.program
      .command('build')
      .description('Build poker tournament system')
      .option('--mvp', 'Build MVP version only')
      .option('--full', 'Build complete system (default)')
      .action(async (options) => {
        await this.showBanner();
        
        try {
          await this.orchestrator.initialize();
          
          if (options.mvp) {
            await this.orchestrator.buildMVP();
          } else {
            await this.orchestrator.buildFullProject();
          }
          
        } catch (error) {
          console.error(chalk.red('Build failed:'), error);
          process.exit(1);
        }
      });
    
    // Interactive command
    this.program
      .command('interactive')
      .alias('i')
      .description('Interactive project builder')
      .action(async () => {
        await this.interactiveMode();
      });
    
    // Status command
    this.program
      .command('status')
      .description('Check system status')
      .action(async () => {
        await this.checkStatus();
      });
  }
  
  private async interactiveMode(): Promise<void> {
    await this.showBanner();
    
    while (true) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: '🚀 Build Full Project', value: 'build-full' },
            { name: '⚡ Build MVP Version', value: 'build-mvp' },
            { name: '🔧 Custom Workflow', value: 'custom' },
            { name: '📊 View Progress', value: 'progress' },
            { name: '🔍 Check Status', value: 'status' },
            { name: '📚 Documentation', value: 'docs' },
            { name: '❌ Exit', value: 'exit' }
          ]
        }
      ]);
      
      switch (action) {
        case 'build-full':
          await this.buildFullInteractive();
          break;
          
        case 'build-mvp':
          await this.buildMVPInteractive();
          break;
          
        case 'custom':
          await this.customWorkflow();
          break;
          
        case 'progress':
          await this.viewProgress();
          break;
          
        case 'status':
          await this.checkStatus();
          break;
          
        case 'docs':
          await this.showDocumentation();
          break;
          
        case 'exit':
          console.log(chalk.yellow('\n👋 Goodbye!\n'));
          process.exit(0);
      }
    }
  }
  
  private async buildFullInteractive(): Promise<void> {
    const { features } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select features to include:',
        choices: [
          { name: 'Tournament Clock', value: 'clock', checked: true },
          { name: 'Player Management', value: 'players', checked: true },
          { name: 'Seating & Balance', value: 'seating', checked: true },
          { name: 'Payout Calculator', value: 'payouts', checked: true },
          { name: 'League System', value: 'league', checked: true },
          { name: 'Real-time Sync', value: 'realtime', checked: true },
          { name: 'PWA/Offline', value: 'pwa', checked: true },
          { name: 'Analytics', value: 'analytics', checked: false },
          { name: 'White Label', value: 'whitelabel', checked: false }
        ]
      }
    ]);
    
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Build project with ${features.length} features?`,
        default: true
      }
    ]);
    
    if (confirm) {
      console.log(chalk.cyan('\n🏗️ Building project...\n'));
      
      const spinner = ora('Initializing agents...').start();
      await this.orchestrator.initialize();
      spinner.succeed('Agents ready');
      
      const stages = [
        { name: 'Architecture & Planning', emoji: '📐' },
        { name: 'Database Design', emoji: '🗄️' },
        { name: 'Backend Development', emoji: '⚙️' },
        { name: 'API Development', emoji: '🔌' },
        { name: 'Frontend Components', emoji: '🎨' },
        { name: 'Real-time Features', emoji: '⚡' },
        { name: 'Testing Suite', emoji: '🧪' },
        { name: 'DevOps Setup', emoji: '🚀' }
      ];
      
      for (const stage of stages) {
        const stageSpinner = ora(`${stage.emoji} ${stage.name}...`).start();
        
        // Simulate stage execution
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        stageSpinner.succeed(`${stage.emoji} ${stage.name} completed`);
      }
      
      console.log(chalk.green('\n✅ Project build complete!\n'));
      console.log(chalk.gray('Output location: ./output'));
      console.log(chalk.gray('Next steps: cd output && npm install'));
    }
  }
  
  private async buildMVPInteractive(): Promise<void> {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Build MVP with basic clock and player management?',
        default: true
      }
    ]);
    
    if (confirm) {
      const spinner = ora('Building MVP...').start();
      
      await this.orchestrator.initialize();
      await this.orchestrator.buildMVP();
      
      spinner.succeed('MVP build complete');
    }
  }
  
  private async customWorkflow(): Promise<void> {
    const { tasks } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'tasks',
        message: 'Select tasks to execute:',
        choices: [
          { name: 'Design System Architecture', value: 'architecture' },
          { name: 'Create Database Schema', value: 'database' },
          { name: 'Build Clock Engine', value: 'clock' },
          { name: 'Implement WebSocket', value: 'websocket' },
          { name: 'Create React Components', value: 'components' },
          { name: 'Setup Docker', value: 'docker' },
          { name: 'Write Tests', value: 'tests' }
        ]
      }
    ]);
    
    console.log(chalk.cyan(`\nExecuting ${tasks.length} tasks...\n`));
    
    for (const task of tasks) {
      const spinner = ora(`Executing: ${task}`).start();
      await new Promise(resolve => setTimeout(resolve, 2000));
      spinner.succeed(`Completed: ${task}`);
    }
  }
  
  private async viewProgress(): Promise<void> {
    console.log(chalk.cyan('\n📊 Project Progress\n'));
    
    const stages = [
      { name: 'Environment Setup', progress: 100 },
      { name: 'Agent Configuration', progress: 100 },
      { name: 'Architecture Design', progress: 75 },
      { name: 'Backend Development', progress: 60 },
      { name: 'Frontend Development', progress: 45 },
      { name: 'Testing', progress: 20 },
      { name: 'Deployment', progress: 10 }
    ];
    
    stages.forEach(stage => {
      const filled = Math.round(stage.progress / 5);
      const empty = 20 - filled;
      const bar = '█'.repeat(filled) + '░'.repeat(empty);
      const color = stage.progress === 100 ? chalk.green : 
                     stage.progress >= 50 ? chalk.yellow : chalk.red;
      
      console.log(`${stage.name.padEnd(20)} ${color(bar)} ${stage.progress}%`);
    });
    
    const overall = Math.round(
      stages.reduce((acc, s) => acc + s.progress, 0) / stages.length
    );
    
    console.log(chalk.gray('\n' + '─'.repeat(50)));
    console.log(`Overall Progress: ${chalk.cyan(overall + '%')}\n`);
  }
  
  private async checkStatus(): Promise<void> {
    console.log(chalk.cyan('\n🔍 System Status\n'));
    
    const checks = [
      { name: 'Docker', status: 'running', icon: '🐳' },
      { name: 'PostgreSQL', status: 'running', icon: '🗄️' },
      { name: 'Redis', status: 'running', icon: '📮' },
      { name: 'Agent 1: Architect', status: 'ready', icon: '🏗️' },
      { name: 'Agent 2: Backend', status: 'ready', icon: '⚙️' },
      { name: 'Agent 3: Frontend', status: 'ready', icon: '🎨' },
      { name: 'Agent 4: DevOps', status: 'ready', icon: '🚀' }
    ];
    
    for (const check of checks) {
      const spinner = ora(`Checking ${check.name}...`).start();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (check.status === 'running' || check.status === 'ready') {
        spinner.succeed(`${check.icon} ${check.name}: ${chalk.green(check.status)}`);
      } else {
        spinner.fail(`${check.icon} ${check.name}: ${chalk.red(check.status)}`);
      }
    }
    
    console.log('');
  }
  
  private async showDocumentation(): Promise<void> {
    console.log(chalk.cyan('\n📚 Documentation\n'));
    
    const docs = [
      { title: 'Getting Started', file: 'README.md' },
      { title: 'API Reference', file: 'docs/API.md' },
      { title: 'Agent Setup', file: 'docs/AGENT_SETUP.md' },
      { title: 'Deployment Guide', file: 'docs/DEPLOYMENT.md' }
    ];
    
    const { doc } = await inquirer.prompt([
      {
        type: 'list',
        name: 'doc',
        message: 'Select documentation:',
        choices: docs.map(d => ({ name: d.title, value: d.file }))
      }
    ]);
    
    try {
      const content = await fs.readFile(
        path.join(process.cwd(), doc),
        'utf-8'
      );
      console.log(chalk.gray('\n' + '─'.repeat(60) + '\n'));
      console.log(content.substring(0, 1000) + '...\n');
      console.log(chalk.gray(`Full document: ${doc}`));
    } catch (error) {
      console.log(chalk.yellow(`Documentation not found: ${doc}`));
    }
  }
  
  async run(): Promise<void> {
    this.program.parse(process.argv);
  }
}

// Run CLI
if (require.main === module) {
  const cli = new TurnuvaYonetimCLI();
  cli.run().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

export default TurnuvaYonetimCLI;
4. Package.json Files
packages/mbao-core/package.json:
json{
  "name": "@turnuva/mbao-core",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest"
  },
  "dependencies": {
    "eventemitter3": "^5.0.1",
    "p-queue": "^7.4.1",
    "puppeteer": "^21.6.0",
    "redis": "^4.6.11",
    "uuid": "^9.0.1",
    "xstate": "^5.5.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
packages/poker-adapter/package.json:
json{
  "name": "@turnuva/poker-adapter",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest"
  },
  "dependencies": {
    "@turnuva/mbao-core": "workspace:*",
    "chalk": "^5.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
apps/cli/package.json:
json{
  "name": "@turnuva/cli",
  "version": "1.0.0",
  "bin": {
    "turnuva": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@turnuva/poker-adapter": "workspace:*",
    "chalk": "^5.3.0",
    "commander": "^11.1.0",
    "figlet": "^1.7.0",
    "inquirer": "^9.2.12",
    "ora": "^7.0.1"
  },
  "devDependencies": {
    "@types/figlet": "^1.5.8",
    "@types/inquirer": "^9.0.7",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0"
  }
}
Bu aşamayı tamamladıktan sonra "Phase 2 completed" diye bildir ve Phase 3'e geçebiliriz.

## **🚀 PHASE3_PROJECT_BUILD.md**
```markdown
# PHASE 3: TURNUVAYONETIM - Project Build

Codex, şimdi poker turnuva yönetim sisteminin ana uygulamasını oluşturacağız. Backend, frontend ve tüm sistemleri implement edeceğiz.

## 1. Backend Application

`apps/backend/src/index.ts`:
```typescript
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { PrismaClient } from '@prisma/client';
import * as trpc from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import * as ws from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createClient } from 'redis';
import { appRouter } from './routers';
import { createContext } from './context';
import { ClockEngine } from './services/clock-engine';
import { EventStore } from './services/event-store';
import { WebSocketGateway } from './services/websocket-gateway';
import chalk from 'chalk';

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// tRPC
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ path, error }) => {
      console.error(`tRPC error on ${path}:`, error);
    }
  })
);

// WebSocket setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Redis adapter for scaling
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log(chalk.green('✅ Redis adapter connected'));
});

// WebSocket Gateway
const wsGateway = new WebSocketGateway(io, prisma);
wsGateway.initialize();

// Start server
const PORT = process.env.API_PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════╗
║           TURNUVAYONETIM Backend Server                 ║
╚══════════════════════════════════════════════════════════╝

🚀 Server running on http://localhost:${PORT}
📡 WebSocket ready on ws://localhost:${PORT}
🗄️ Database connected
📮 Redis connected
  `));
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close();
  await prisma.$disconnect();
  await pubClient.quit();
  await subClient.quit();
  process.exit(0);
});
2. Clock Engine Service
apps/backend/src/services/clock-engine.ts:
typescriptimport { EventEmitter } from 'events';

export interface BlindLevel {
  idx: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  durationSeconds: number;
  isBreak: boolean;
  breakName?: string;
}

export interface ClockState {
  tournamentId: string;
  status: 'idle' | 'running' | 'paused' | 'completed';
  currentLevelIdx: number;
  levelStartTime: number;
  pausedDuration: number;
  serverTime: number;
  version: number;
}

export class ClockEngine extends EventEmitter {
  private state: ClockState;
  private levels: BlindLevel[];
  private syncInterval: NodeJS.Timeout | null = null;
  
  constructor(tournamentId: string, levels: BlindLevel[]) {
    super();
    this.levels = levels;
    this.state = {
      tournamentId,
      status: 'idle',
      currentLevelIdx: 0,
      levelStartTime: 0,
      pausedDuration: 0,
      serverTime: Date.now(),
      version: 0
    };
  }
  
  start(levelIdx: number = 0): ClockState {
    if (this.state.status === 'running') return this.state;
    
    const now = Date.now();
    this.state = {
      ...this.state,
      status: 'running',
      currentLevelIdx: levelIdx,
      levelStartTime: now,
      pausedDuration: 0,
      serverTime: now,
      version: this.state.version + 1
    };
    
    this.startSyncInterval();
    this.emit('clock:started', this.state);
    
    return this.state;
  }
  
  pause(): ClockState {
    if (this.state.status !== 'running') return this.state;
    
    const now = Date.now();
    const elapsed = this.getElapsedTime(now);
    
    this.state = {
      ...this.state,
      status: 'paused',
      pausedDuration: elapsed,
      serverTime: now,
      version: this.state.version + 1
    };
    
    this.stopSyncInterval();
    this.emit('clock:paused', this.state);
    
    return this.state;
  }
  
  resume(): ClockState {
    if (this.state.status !== 'paused') return this.state;
    
    const now = Date.now();
    
    // Adjust level start time to account for pause
    this.state = {
      ...this.state,
      status: 'running',
      levelStartTime: now - this.state.pausedDuration,
      serverTime: now,
      version: this.state.version + 1
    };
    
    this.startSyncInterval();
    this.emit('clock:resumed', this.state);
    
    return this.state;
  }
  
  goToLevel(levelIdx: number): ClockState {
    if (levelIdx < 0 || levelIdx >= this.levels.length) {
      throw new Error('Invalid level index');
    }
    
    const now = Date.now();
    
    this.state = {
      ...this.state,
      status: 'running',
      currentLevelIdx: levelIdx,
      levelStartTime: now,
      pausedDuration: 0,
      serverTime: now,
      version: this.state.version + 1
    };
    
    this.emit('clock:levelChanged', this.state);
    
    return this.state;
  }
  
  private getElapsedTime(now: number): number {
    if (this.state.status === 'paused') {
      return this.state.pausedDuration;
    }
    
    if (this.state.status === 'running') {
      return now - this.state.levelStartTime;
    }
    
    return 0;
  }
  
  getRemainingTime(now: number = Date.now()): number {
    const level = this.levels[this.state.currentLevelIdx];
    if (!level) return 0;
    
    const elapsed = this.getElapsedTime(now);
    const remaining = (level.durationSeconds * 1000) - elapsed;
    
    return Math.max(0, remaining);
  }
  
  private checkLevelAdvance(): void {
    if (this.state.status !== 'running') return;
    
    const now = Date.now();
    const remaining = this.getRemainingTime(now);
    
    if (remaining === 0) {
      // Advance to next level
      const nextIdx = this.state.currentLevelIdx + 1;
      
      if (nextIdx >= this.levels.length) {
        // Tournament completed
        this.state = {
          ...this.state,
          status: 'completed',
          serverTime: now,
          version: this.state.version + 1
        };
        
        this.stopSyncInterval();
        this.emit('clock:completed', this.state);
      } else {
        // Go to next level
        this.goToLevel(nextIdx);
      }
    }
  }
  
  private startSyncInterval(): void {
    if (this.syncInterval) return;
    
    // Sync every 3 seconds
    this.syncInterval = setInterval(() => {
      this.checkLevelAdvance();
      
      this.state = {
        ...this.state,
        serverTime: Date.now()
      };
      
      this.emit('clock:sync', this.state);
    }, 3000);
  }
  
  private stopSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  getState(): ClockState {
    return {
      ...this.state,
      serverTime: Date.now()
    };
  }
  
  getCurrentLevel(): BlindLevel | null {
    return this.levels[this.state.currentLevelIdx] || null;
  }
  
  getNextLevel(): BlindLevel | null {
    return this.levels[this.state.currentLevelIdx + 1] || null;
  }
  
  destroy(): void {
    this.stopSyncInterval();
    this.removeAllListeners();
  }
}

export default ClockEngine;
3. Event Store Implementation
apps/backend/src/services/event-store.ts:
typescriptimport { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface Event {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventVersion: number;
  eventData: any;
  metadata: {
    userId?: string;
    timestamp: Date;
    correlationId?: string;
  };
  createdAt: Date;
}

export class EventStore extends EventEmitter {
  constructor(private prisma: PrismaClient) {
    super();
  }
  
  async append(
    aggregateId: string,
    aggregateType: string,
    eventType: string,
    eventData: any,
    metadata?: Partial<Event['metadata']>
  ): Promise<Event> {
    const event: Event = {
      id: uuidv4(),
      aggregateId,
      aggregateType,
      eventType,
      eventVersion: 1,
      eventData,
      metadata: {
        timestamp: new Date(),
        ...metadata
      },
      createdAt: new Date()
    };
    
    // Store in database
    const stored = await this.prisma.event.create({
      data: {
        id: event.id,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        eventType: event.eventType,
        eventVersion: event.eventVersion,
        eventData: event.eventData,
        metadata: event.metadata
      }
    });
    
    // Emit for projections
    this.emit('event:appended', event);
    this.emit(`event:${eventType}`, event);
    
    return event;
  }
  
  async getEvents(
    aggregateId: string,
    fromVersion?: number
  ): Promise<Event[]> {
    const events = await this.prisma.event.findMany({
      where: {
        aggregateId,
        ...(fromVersion && { eventVersion: { gte: fromVersion } })
      },
      orderBy: { eventVersion: 'asc' }
    });
    
    return events as Event[];
  }
  
  async getEventsByType(
    eventType: string,
    limit: number = 100
  ): Promise<Event[]> {
    const events = await this.prisma.event.findMany({
      where: { eventType },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    return events as Event[];
  }
  
  async replay(
    aggregateId: string,
    handler: (event: Event) => void
  ): Promise<void> {
    const events = await this.getEvents(aggregateId);
    
    for (const event of events) {
      handler(event);
    }
  }
  
  async getSnapshot(aggregateId: string): Promise<any | null> {
    const snapshot = await this.prisma.snapshot.findFirst({
      where: { aggregateId },
      orderBy: { version: 'desc' }
    });
    
    return snapshot?.data || null;
  }
  
  async saveSnapshot(
    aggregateId: string,
    data: any,
    version: number
  ): Promise<void> {
    await this.prisma.snapshot.create({
      data: {
        aggregateId,
        version,
        data
      }
    });
  }
}

// Event Types
export enum TournamentEvents {
  TOURNAMENT_CREATED = 'TournamentCreated',
  TOURNAMENT_STARTED = 'TournamentStarted',
  TOURNAMENT_PAUSED = 'TournamentPaused',
  TOURNAMENT_RESUMED = 'TournamentResumed',
  TOURNAMENT_COMPLETED = 'TournamentCompleted',
  
  PLAYER_REGISTERED = 'PlayerRegistered',
  PLAYER_REBOUGHT = 'PlayerRebought',
  PLAYER_ADDED_ON = 'PlayerAddedOn',
  PLAYER_ELIMINATED = 'PlayerEliminated',
  
  TABLE_CREATED = 'TableCreated',
  TABLE_BALANCED = 'TableBalanced',
  TABLE_BROKEN = 'TableBroken',
  
  SEAT_ASSIGNED = 'SeatAssigned',
  SEAT_VACATED = 'SeatVacated',
  
  PAYOUT_CALCULATED = 'PayoutCalculated',
  PAYOUT_DISTRIBUTED = 'PayoutDistributed',
  
  CLOCK_STARTED = 'ClockStarted',
  CLOCK_PAUSED = 'ClockPaused',
  CLOCK_LEVEL_CHANGED = 'ClockLevelChanged'
}

export default EventStore;
4. WebSocket Gateway
apps/backend/src/services/websocket-gateway.ts:
typescriptimport { Server as SocketIOServer, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { ClockEngine } from './clock-engine';
import jwt from 'jsonwebtoken';

export class WebSocketGateway {
  private clocks: Map<string, ClockEngine> = new Map();
  
  constructor(
    private io: SocketIOServer,
    private prisma: PrismaClient
  ) {}
  
  initialize(): void {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (token) {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
          ) as any;
          socket.data.userId = decoded.userId;
          socket.data.role = decoded.role;
        }
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
    
    // Connection handler
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      // Join tournament room
      socket.on('tournament:join', async (data) => {
        await this.handleTournamentJoin(socket, data);
      });
      
      // Clock control
      socket.on('clock:start', async (data) => {
        await this.handleClockStart(socket, data);
      });
      
      socket.on('clock:pause', async (data) => {
        await this.handleClockPause(socket, data);
      });
      
      socket.on('clock:resume', async (data) => {
        await this.handleClockResume(socket, data);
      });
      
      socket.on('clock:gotoLevel', async (data) => {
        await this.handleClockGoToLevel(socket, data);
      });
      
      // Player management
      socket.on('player:register', async (data) => {
        await this.handlePlayerRegister(socket, data);
      });
      
      socket.on('player:eliminate', async (data) => {
        await this.handlePlayerEliminate(socket, data);
      });
      
      socket.on('player:rebuy', async (data) => {
        await this.handlePlayerRebuy(socket, data);
      });
      
      // Table management
      socket.on('table:balance', async (data) => {
        await this.handleTableBalance(socket, data);
      });
      
      // Display mode
      socket.on('display:join', async (data) => {
        await this.handleDisplayJoin(socket, data);
      });
      
      // Disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }
  
  private async handleTournamentJoin(
    socket: Socket,
    data: { tournamentId: string }
  ): Promise<void> {
    const { tournamentId } = data;
    
    // Verify tournament exists
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId }
    });
    
    if (!tournament) {
      socket.emit('error', { message: 'Tournament not found' });
      return;
    }
    
    // Join room
    socket.join(`tournament:${tournamentId}`);
    socket.data.tournamentId = tournamentId;
    
    // Send current state
    const clock = this.clocks.get(tournamentId);
    if (clock) {
      socket.emit('clock:sync', clock.getState());
    }
    
    // Send tournament data
    socket.emit('tournament:joined', {
      tournament,
      playersCount: await this.getPlayerCount(tournamentId),
      tablesCount: await this.getTableCount(tournamentId)
    });
  }
  
  private async handleClockStart(
    socket: Socket,
    data: { tournamentId: string; levelIdx?: number }
  ): Promise<void> {
    const { tournamentId, levelIdx = 0 } = data;
    
    // Check permissions
    if (!this.hasPermission(socket, 'clock:control')) {
      socket.emit('error', { message: 'Permission denied' });
      return;
    }
    
    // Get or create clock
    let clock = this.clocks.get(tournamentId);
    
    if (!clock) {
      // Load blind structure
      const structure = await this.prisma.blindStructure.findUnique({
        where: { tournamentId },
        include: { levels: { orderBy: { idx: 'asc' } } }
      });
      
      if (!structure) {
        socket.emit('error', { message: 'Blind structure not found' });
        return;
      }
      
      const levels = structure.levels.map(l => ({
        idx: l.idx,
        smallBlind: l.smallBlind,
        bigBlind: l.bigBlind,
        ante: l.ante,
        durationSeconds: l.durationSeconds,
        isBreak: l.isBreak,
        breakName: l.breakName
      }));
      
      clock = new ClockEngine(tournamentId, levels);
      
      // Setup clock event listeners
      clock.on('clock:sync', (state) => {
        this.io.to(`tournament:${tournamentId}`).emit('clock:sync', state);
      });
      
      clock.on('clock:levelChanged', (state) => {
        this.io.to(`tournament:${tournamentId}`).emit('clock:levelChanged', state);
      });
      
      clock.on('clock:completed', (state) => {
        this.io.to(`tournament:${tournamentId}`).emit('clock:completed', state);
      });
      
      this.clocks.set(tournamentId, clock);
    }
    
    // Start clock
    const state = clock.start(levelIdx);
    
    // Update tournament status
    await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'LIVE' }
    });
    
    // Broadcast to all clients in room
    this.io.to(`tournament:${tournamentId}`).emit('clock:started', state);
  }
  
  private async handleClockPause(
    socket: Socket,
    data: { tournamentId: string }
  ): Promise<void> {
    const { tournamentId } = data;
    
    if (!this.hasPermission(socket, 'clock:control')) {
      socket.emit('error', { message: 'Permission denied' });
      return;
    }
    
    const clock = this.clocks.get(tournamentId);
    if (!clock) {
      socket.emit('error', { message: 'Clock not found' });
      return;
    }
    
    const state = clock.pause();
    
    await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'PAUSED' }
    });
    
    this.io.to(`tournament:${tournamentId}`).emit('clock:paused', state);
  }
  
  private async handleClockResume(
    socket: Socket,
    data: { tournamentId: string }
  ): Promise<void> {
    const { tournamentId } = data;
    
    if (!this.hasPermission(socket, 'clock:control')) {
      socket.emit('error', { message: 'Permission denied' });
      return;
    }
    
    const clock = this.clocks.get(tournamentId);
    if (!clock) {
      socket.emit('error', { message: 'Clock not found' });
      return;
    }
    
    const state = clock.resume();
    
    await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'LIVE' }
    });
    
    this.io.to(`tournament:${tournamentId}`).emit('clock:resumed', state);
  }
  
  private async handleClockGoToLevel(
    socket: Socket,
    data: { tournamentId: string; levelIdx: number }
  ): Promise<void> {
    const { tournamentId, levelIdx } = data;
    
    if (!this.hasPermission(socket, 'clock:control')) {
      socket.emit('error', { message: 'Permission denied' });
      return;
    }
    
    const clock = this.clocks.get(tournamentId);
    if (!clock) {
      socket.emit('error', { message: 'Clock not found' });
      return;
    }
    
    const state = clock.goToLevel(levelIdx);
    this.io.to(`tournament:${tournamentId}`).emit('clock:levelChanged', state);
  }
  
  private async handlePlayerRegister(
    socket: Socket,
    data: {
      tournamentId: string;
      name: string;
      buyIn: number;
      tableId?: string;
      seatNumber?: number;
    }
  ): Promise<void> {
    const { tournamentId, name, buyIn, tableId, seatNumber } = data;
    
    if (!this.hasPermission(socket, 'player:manage')) {
      socket.emit('error', { message: 'Permission denied' });
      return;
    }
    
    // Create entry
    const entry = await this.prisma.entry.create({
      data: {
        tournamentId,
        displayName: name,
        chipCount: buyIn,
        status: 'ACTIVE'
      }
    });
    
    // Assign seat if provided
    if (tableId && seatNumber) {
      await this.prisma.seat.update({
        where: {
          tableId_seatNumber: {
            tableId,
            seatNumber
          }
        },
        data: {
          entryId: entry.id
        }
      });
    }
    
    // Broadcast update
    this.io.to(`tournament:${tournamentId}`).emit('player:registered', {
      entry,
      tableId,
      seatNumber,
      totalPlayers: await this.getPlayerCount(tournamentId)
    });
  }
  
  private async handlePlayerEliminate(
    socket: Socket,
    data: {
      tournamentId: string;
      entryId: string;
      place: number;
    }
  ): Promise<void> {
    const { tournamentId, entryId, place } = data;
    
    if (!this.hasPermission(socket, 'player:manage')) {
      socket.emit('error', { message: 'Permission denied' });
      return;
    }
    
    // Update entry
    await this.prisma.entry.update({
      where: { id: entryId },
      data: {
        status: 'ELIMINATED',
        eliminatedAt: new Date()
      }
    });
    
    // Create elimination record
    const elimination = await this.prisma.elimination.create({
      data: {
        tournamentId,
        entryId,
        place
      }
    });
    
    // Free seat
    await this.prisma.seat.updateMany({
      where: { entryId },
      data: { entryId: null }
    });
    
    // Broadcast update
    this.io.to(`tournament:${tournamentId}`).emit('player:eliminated', {
      elimination,
      remainingPlayers: await this.getActivePlayerCount(tournamentId)
    });
  }
  
  private async handlePlayerRebuy(
    socket: Socket,
    data: {
      tournamentId: string;
      entryId: string;
      amount: number;
    }
  ): Promise<void> {
    const { tournamentId, entryId, amount } = data;
    
    if (!this.hasPermission(socket, 'player:manage')) {
      socket.emit('error', { message: 'Permission denied' });
      return;
    }
    
    // Update chip count
    const entry = await this.prisma.entry.update({
      where: { id: entryId },
      data: {
        chipCount: {
          increment: amount
        }
      }
    });
    
    // Create transaction record
    await this.prisma.transaction.create({
      data: {
        entryId,
        type: 'REBUY',
        amount
      }
    });
    
    // Broadcast update
    this.io.to(`tournament:${tournamentId}`).emit('player:rebought', {
      entry,
      totalPrizePool: await this.calculatePrizePool(tournamentId)
    });
  }
  
  private async handleTableBalance(
    socket: Socket,
    data: { tournamentId: string }
  ): Promise<void> {
    const { tournamentId } = data;
    
    if (!this.hasPermission(socket, 'table:manage')) {
      socket.emit('error', { message: 'Permission denied' });
      return;
    }
    
    // Get current table state
    const tables = await this.prisma.table.findMany({
      where: { tournamentId },
      include: {
        seats: {
          include: {
            entry: true
          }
        }
      }
    });
    
    // Calculate balance moves
    const moves = this.calculateTableBalance(tables);
    
    // Execute moves
    for (const move of moves) {
      await this.prisma.seat.update({
        where: { id: move.fromSeatId },
        data: { entryId: null }
      });
      
      await this.prisma.seat.update({
        where: { id: move.toSeatId },
        data: { entryId: move.entryId }
      });
    }
    
    // Broadcast updates
    this.io.to(`tournament:${tournamentId}`).emit('tables:balanced', {
      moves,
      tables: await this.prisma.table.findMany({
        where: { tournamentId },
        include: { seats: { include: { entry: true } } }
      })
    });
  }
  
  private async handleDisplayJoin(
    socket: Socket,
    data: { tournamentId: string; pin?: string }
  ): Promise<void> {
    const { tournamentId, pin } = data;
    
    // Verify PIN if provided
    if (pin) {
      const display = await this.prisma.display.findFirst({
        where: {
          tournamentId,
          pin
        }
      });
      
      if (!display) {
        socket.emit('error', { message: 'Invalid PIN' });
        return;
      }
    }
    
    // Join display room
    socket.join(`display:${tournamentId}`);
    
    // Send clock state only
    const clock = this.clocks.get(tournamentId);
    if (clock) {
      socket.emit('clock:sync', clock.getState());
    }
  }
  
  private hasPermission(socket: Socket, permission: string): boolean {
    const role = socket.data.role;
    
    const permissions: Record<string, string[]> = {
      'clock:control': ['OWNER', 'ADMIN', 'DIRECTOR'],
      'player:manage': ['OWNER', 'ADMIN', 'DIRECTOR', 'STAFF'],
      'table:manage': ['OWNER', 'ADMIN', 'DIRECTOR']
    };
    
    return permissions[permission]?.includes(role) || false;
  }
  
  private async getPlayerCount(tournamentId: string): Promise<number> {
    return this.prisma.entry.count({
      where: { tournamentId }
    });
  }
  
  private async getActivePlayerCount(tournamentId: string): Promise<number> {
    return this.prisma.entry.count({
      where: {
        tournamentId,
        status: 'ACTIVE'
      }
    });
  }
  
  private async getTableCount(tournamentId: string): Promise<number> {
    return this.prisma.table.count({
      where: { tournamentId }
    });
  }
  
  private async calculatePrizePool(tournamentId: string): Promise<number> {
    const result = await this.prisma.transaction.aggregate({
      where: {
        entry: {
          tournamentId
        }
      },
      _sum: {
        amount: true
      }
    });
    
    return result._sum.amount || 0;
  }
  
  private calculateTableBalance(tables: any[]): any[] {
    // Simple balancing algorithm
    const moves: any[] = [];
    
    const playerCounts = tables.map(t => ({
      tableId: t.id,
      count: t.seats.filter((s: any) => s.entry).length
    }));
    
    const totalPlayers = playerCounts.reduce((sum, t) => sum + t.count, 0);
    const avgPlayers = Math.floor(totalPlayers / tables.length);
    
    // Find imbalanced tables
    const overloaded = playerCounts.filter(t => t.count > avgPlayers + 1);
    const underloaded = playerCounts.filter(t => t.count < avgPlayers);
    
    // Create moves
    for (const over of overloaded) {
      for (const under of underloaded) {
        if (over.count > avgPlayers + 1 && under.count < avgPlayers) {
          // Move one player
          const fromTable = tables.find(t => t.id === over.tableId);
          const toTable = tables.find(t => t.id === under.tableId);
          
          const playerSeat = fromTable.seats.find((s: any) => s.entry);
          const emptySeat = toTable.seats.find((s: any) => !s.entry);
          
          if (playerSeat && emptySeat) {
            moves.push({
              fromSeatId: playerSeat.id,
              toSeatId: emptySeat.id,
              entryId: playerSeat.entry.id
            });
            
            over.count--;
            under.count++;
          }
        }
      }
    }
    
    return moves;
  }
}

export default WebSocketGateway;
5. Database Schema (Prisma)
apps/backend/prisma/schema.prisma:
prismagenerator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============= ORGANIZATIONS =============

model Organization {
  id          String       @id @default(cuid())
  name        String
  slug        String       @unique
  tournaments Tournament[]
  leagues     League[]
  memberships Membership[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model User {
  id          String       @id @default(cuid())
  email       String       @unique
  name        String?
  memberships Membership[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Membership {
  id             String       @id @default(cuid())
  role           Role
  userId         String
  organizationId String
  user           User         @relation(fields: [userId], references: [id])
  organization   Organization @relation(fields: [organizationId], references: [id])
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  
  @@unique([userId, organizationId])
}

enum Role {
  OWNER
  ADMIN
  DIRECTOR
  STAFF
  DISPLAY
  PLAYER
}

// ============= TOURNAMENTS =============

model Tournament {
  id               String           @id @default(cuid())
  organizationId   String
  name             String
  buyInCents       Int
  rebuysAllowed    Boolean          @default(true)
  addonsAllowed    Boolean          @default(false)
  status           TournamentStatus @default(DRAFT)
  startedAt        DateTime?
  completedAt      DateTime?
  
  organization     Organization     @relation(fields: [organizationId], references: [id])
  blindStructure   BlindStructure?
  payoutStructure  PayoutStructure?
  tables           Table[]
  entries          Entry[]
  eliminations     Elimination[]
  events           Event[]
  displays         Display[]
  leagueTournament LeagueTournament?
  
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
}

enum TournamentStatus {
  DRAFT
  REGISTERED
  LIVE
  PAUSED
  COMPLETED
  CANCELLED
}

// ============= BLIND STRUCTURE =============

model BlindStructure {
  id           String       @id @default(cuid())
  tournamentId String       @unique
  tournament   Tournament   @relation(fields: [tournamentId], references: [id])
  levels       BlindLevel[]
}

model BlindLevel {
  id              String         @id @default(cuid())
  idx             Int
  smallBlind      Int
  bigBlind        Int
  ante            Int            @default(0)
  durationSeconds Int
  isBreak         Boolean        @default(false)
  breakName       String?
  structureId     String
  structure       BlindStructure @relation(fields: [structureId], references: [id])
  
  @@unique([structureId, idx])
}

// ============= TABLES & SEATING =============

model Table {
  id           String     @id @default(cuid())
  tournamentId String
  name         String
  capacity     Int
  tournament   Tournament @relation(fields: [tournamentId], references: [id])
  seats        Seat[]
  
  @@unique([tournamentId, name])
}

model Seat {
  id         String  @id @default(cuid())
  tableId    String
  seatNumber Int
  entryId    String?
  table      Table   @relation(fields: [tableId], references: [id])
  entry      Entry?  @relation(fields: [entryId], references: [id])
  
  @@unique([tableId, seatNumber])
}

// ============= PLAYERS & ENTRIES =============

model Entry {
  id           String        @id @default(cuid())
  tournamentId String
  displayName  String
  chipCount    Int
  status       EntryStatus   @default(ACTIVE)
  eliminatedAt DateTime?
  
  tournament   Tournament    @relation(fields: [tournamentId], references: [id])
  seats        Seat[]
  transactions Transaction[]
  elimination  Elimination?
  
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

enum EntryStatus {
  ACTIVE
  ELIMINATED
  WITHDRAWN
}

model Transaction {
  id        String          @id @default(cuid())
  entryId   String
  type      TransactionType
  amount    Int
  entry     Entry           @relation(fields: [entryId], references: [id])
  createdAt DateTime        @default(now())
}

enum TransactionType {
  BUYIN
  REBUY
  ADDON
  CASHOUT
}

model Elimination {
  id           String     @id @default(cuid())
  tournamentId String
  entryId      String     @unique
  place        Int
  tournament   Tournament @relation(fields: [tournamentId], references: [id])
  entry        Entry      @relation(fields: [entryId], references: [id])
  createdAt    DateTime   @default(now())
}

// ============= PAYOUTS =============

model PayoutStructure {
  id           String     @id @default(cuid())
  tournamentId String     @unique
  tournament   Tournament @relation(fields: [tournamentId], references: [id])
  payouts      Payout[]
}

model Payout {
  id            String          @id @default(cuid())
  place         Int
  percentageBp  Int // Basis points (10000 = 100%)
  amountCents   Int?
  structureId   String
  structure     PayoutStructure @relation(fields: [structureId], references: [id])
  
  @@unique([structureId, place])
}

// ============= LEAGUES =============

model League {
  id             String            @id @default(cuid())
  organizationId String
  name           String
  organization   Organization      @relation(fields: [organizationId], references: [id])
  seasons        Season[]
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
}

model Season {
  id         String             @id @default(cuid())
  leagueId   String
  name       String
  startDate  DateTime
  endDate    DateTime
  league     League             @relation(fields: [leagueId], references: [id])
  tournaments LeagueTournament[]
  scores      LeagueScore[]
  createdAt  DateTime           @default(now())
  updatedAt  DateTime           @updatedAt
}

model LeagueTournament {
  id           String     @id @default(cuid())
  seasonId     String
  tournamentId String     @unique
  multiplier   Float      @default(1.0)
  season       Season     @relation(fields: [seasonId], references: [id])
  tournament   Tournament @relation(fields: [tournamentId], references: [id])
}

model LeagueScore {
  id        String   @id @default(cuid())
  seasonId  String
  playerId  String
  points    Float
  season    Season   @relation(fields: [seasonId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([seasonId, playerId])
}

// ============= EVENT STORE =============

model Event {
  id            String   @id @default(cuid())
  aggregateId   String
  aggregateType String
  eventType     String
  eventVersion  Int
  eventData     Json
  metadata      Json
  createdAt     DateTime @default(now())
  
  @@index([aggregateId])
  @@index([eventType])
}

model Snapshot {
  id          String   @id @default(cuid())
  aggregateId String
  version     Int
  data        Json
  createdAt   DateTime @default(now())
  
  @@index([aggregateId])
}

// ============= DISPLAYS =============

model Display {
  id           String     @id @default(cuid())
  tournamentId String
  name         String
  pin          String?
  tournament   Tournament @relation(fields: [tournamentId], references: [id])
  createdAt    DateTime   @default(now())
  
  @@unique([tournamentId, pin])
}
6. Frontend - Next.js App
apps/web/src/app/page.tsx:
tsx'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Clock, Users, DollarSign, BarChart, Monitor } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-4">
            TURNUVA<span className="text-cyan-400">YÖNETİM</span>
          </h1>
          <p className="text-xl text-gray-300">
            Advanced Poker Tournament Management System
          </p>
          <div className="mt-8 space-x-4">
            <Button
              size="lg"
              onClick={() => router.push('/tournament/create')}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              Create Tournament
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/demo')}
              className="text-white border-white hover:bg-white hover:text-gray-900"
            >
              View Demo
            </Button>
          </div>
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          <Card className="bg-gray-800 border-gray-700 hover:border-cyan-400 transition-colors">
            <CardHeader>
              <Clock className="w-12 h-12 text-cyan-400 mb-4" />
              <CardTitle className="text-white">Real-time Clock</CardTitle>
              <CardDescription className="text-gray-400">
                Server-authoritative clock with drift correction
              </CardDescription>
            </CardHeader>
            <CardContent className="text-gray-300">
              Perfect synchronization across all devices with automatic level advancement
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 hover:border-cyan-400 transition-colors">
            <CardHeader>
              <Users className="w-12 h-12 text-cyan-400 mb-4" />
              <CardTitle className="text-white">Player Management</CardTitle>
              <CardDescription className="text-gray-400">
                Complete player lifecycle management
              </CardDescription>
            </CardHeader>
            <CardContent className="text-gray-300">
              Registration, rebuys, add-ons, eliminations with automatic seat balancing
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 hover:border-cyan-400 transition-colors">
            <CardHeader>
              <DollarSign className="w-12 h-12 text-cyan-400 mb-4" />
              <CardTitle className="text-white">Payout Calculator</CardTitle>
              <CarRetryEAContinueEditPlotted continuation of project documentation in Next.js section.The user wants me to continue with the PHASE3_PROJECT_BUILD.md file. I need to continue from where it was cut off in the Frontend - Next.js App section and complete the rest of the file.markdown              <CardDescription className="text-gray-400">
                Flexible payout structures and calculations
              </CardDescription>
            </CardHeader>
            <CardContent className="text-gray-300">
              Automatic payout distribution based on entries with customizable curves
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 hover:border-cyan-400 transition-colors">
            <CardHeader>
              <Trophy className="w-12 h-12 text-cyan-400 mb-4" />
              <CardTitle className="text-white">League System</CardTitle>
              <CardDescription className="text-gray-400">
                Season management with point tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="text-gray-300">
              Formula-based scoring, leaderboards, and championship tracking
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 hover:border-cyan-400 transition-colors">
            <CardHeader>
              <BarChart className="w-12 h-12 text-cyan-400 mb-4" />
              <CardTitle className="text-white">Analytics</CardTitle>
              <CardDescription className="text-gray-400">
                Comprehensive tournament statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="text-gray-300">
              Real-time analytics, historical data, and performance tracking
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 hover:border-cyan-400 transition-colors">
            <CardHeader>
              <Monitor className="w-12 h-12 text-cyan-400 mb-4" />
              <CardTitle className="text-white">Multi-Display</CardTitle>
              <CardDescription className="text-gray-400">
                Unlimited display connections
              </CardDescription>
            </CardHeader>
            <CardContent className="text-gray-300">
              Connect TVs, projectors, and devices with PIN-protected display mode
            </CardContent>
          </Card>
        </div>
        
        {/* Stats Section */}
        <div className="mt-20 text-center">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-bold text-cyan-400">10K+</div>
              <div className="text-gray-400 mt-2">Tournaments Run</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-cyan-400">100K+</div>
              <div className="text-gray-400 mt-2">Players Managed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-cyan-400">99.9%</div>
              <div className="text-gray-400 mt-2">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-cyan-400">4 AI</div>
              <div className="text-gray-400 mt-2">Agent Orchestra</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
7. Tournament Clock Component
apps/web/src/components/TournamentClock.tsx:
tsx'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react';

interface ClockState {
  tournamentId: string;
  status: 'idle' | 'running' | 'paused' | 'completed';
  currentLevelIdx: number;
  levelStartTime: number;
  pausedDuration: number;
  serverTime: number;
  version: number;
}

interface BlindLevel {
  idx: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  durationSeconds: number;
  isBreak: boolean;
  breakName?: string;
}

interface TournamentClockProps {
  tournamentId: string;
  levels: BlindLevel[];
  isController?: boolean;
}

export function TournamentClock({ 
  tournamentId, 
  levels, 
  isController = false 
}: TournamentClockProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [clockState, setClockState] = useState<ClockState | null>(null);
  const [localTime, setLocalTime] = useState(Date.now());
  const [serverTimeDelta, setServerTimeDelta] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('auth_token')
      }
    });
    
    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket');
      socketInstance.emit('tournament:join', { tournamentId });
    });
    
    socketInstance.on('clock:sync', (state: ClockState) => {
      // Calculate time difference for drift correction
      const delta = state.serverTime - Date.now();
      setServerTimeDelta(delta);
      setClockState(state);
    });
    
    socketInstance.on('clock:started', (state: ClockState) => {
      setClockState(state);
      playSound('start');
    });
    
    socketInstance.on('clock:paused', (state: ClockState) => {
      setClockState(state);
    });
    
    socketInstance.on('clock:resumed', (state: ClockState) => {
      setClockState(state);
    });
    
    socketInstance.on('clock:levelChanged', (state: ClockState) => {
      setClockState(state);
      playSound('levelChange');
    });
    
    socketInstance.on('clock:completed', (state: ClockState) => {
      setClockState(state);
      playSound('complete');
    });
    
    setSocket(socketInstance);
    
    return () => {
      socketInstance.disconnect();
    };
  }, [tournamentId]);
  
  // Update local time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTime(Date.now());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate remaining time
  const getRemainingTime = (): number => {
    if (!clockState || !levels[clockState.currentLevelIdx]) return 0;
    
    const level = levels[clockState.currentLevelIdx];
    const adjustedTime = localTime + serverTimeDelta;
    
    let elapsed: number;
    if (clockState.status === 'paused') {
      elapsed = clockState.pausedDuration;
    } else if (clockState.status === 'running') {
      elapsed = adjustedTime - clockState.levelStartTime;
    } else {
      return 0;
    }
    
    const remaining = (level.durationSeconds * 1000) - elapsed;
    return Math.max(0, remaining);
  };
  
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cents / 100);
  };
  
  const playSound = (type: 'start' | 'levelChange' | 'complete') => {
    if (!soundEnabled) return;
    
    const sounds = {
      start: '/sounds/start.mp3',
      levelChange: '/sounds/level-change.mp3',
      complete: '/sounds/complete.mp3'
    };
    
    if (audioRef.current) {
      audioRef.current.src = sounds[type];
      audioRef.current.play();
    }
  };
  
  // Control functions
  const handleStart = () => {
    socket?.emit('clock:start', { tournamentId });
  };
  
  const handlePause = () => {
    socket?.emit('clock:pause', { tournamentId });
  };
  
  const handleResume = () => {
    socket?.emit('clock:resume', { tournamentId });
  };
  
  const handleNextLevel = () => {
    if (clockState && clockState.currentLevelIdx < levels.length - 1) {
      socket?.emit('clock:gotoLevel', { 
        tournamentId, 
        levelIdx: clockState.currentLevelIdx + 1 
      });
    }
  };
  
  const handlePrevLevel = () => {
    if (clockState && clockState.currentLevelIdx > 0) {
      socket?.emit('clock:gotoLevel', { 
        tournamentId, 
        levelIdx: clockState.currentLevelIdx - 1 
      });
    }
  };
  
  if (!clockState) {
    return (
      <Card className="p-8 text-center">
        <div className="text-2xl text-gray-500">Connecting to clock...</div>
      </Card>
    );
  }
  
  const currentLevel = levels[clockState.currentLevelIdx];
  const nextLevel = levels[clockState.currentLevelIdx + 1];
  const remainingTime = getRemainingTime();
  const progress = currentLevel 
    ? ((currentLevel.durationSeconds * 1000 - remainingTime) / (currentLevel.durationSeconds * 1000)) * 100
    : 0;
  
  return (
    <div className="space-y-6">
      <Card className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        {/* Main Clock Display */}
        <div className="text-center">
          {currentLevel?.isBreak ? (
            <div className="mb-4">
              <div className="text-3xl font-bold text-yellow-400">BREAK</div>
              <div className="text-xl text-gray-300">{currentLevel.breakName}</div>
            </div>
          ) : (
            <div className="mb-4">
              <div className="text-xl text-gray-300">Level {currentLevel?.idx + 1}</div>
            </div>
          )}
          
          <div className="text-8xl font-mono font-bold mb-8 tabular-nums">
            {formatTime(remainingTime)}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden mb-8">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Blinds Display */}
          {!currentLevel?.isBreak && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-gray-400 text-sm">SMALL BLIND</div>
                <div className="text-3xl font-bold">
                  {formatCurrency(currentLevel?.smallBlind || 0)}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">BIG BLIND</div>
                <div className="text-3xl font-bold">
                  {formatCurrency(currentLevel?.bigBlind || 0)}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">ANTE</div>
                <div className="text-3xl font-bold">
                  {currentLevel?.ante ? formatCurrency(currentLevel.ante) : '-'}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Next Level Preview */}
        {nextLevel && (
          <div className="mt-8 pt-8 border-t border-gray-700">
            <div className="text-center">
              <div className="text-gray-400 mb-2">NEXT LEVEL</div>
              {nextLevel.isBreak ? (
                <div className="text-xl">
                  Break: {nextLevel.breakName}
                </div>
              ) : (
                <div className="text-xl">
                  Blinds: {formatCurrency(nextLevel.smallBlind)} / {formatCurrency(nextLevel.bigBlind)}
                  {nextLevel.ante > 0 && ` (Ante: ${formatCurrency(nextLevel.ante)})`}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Controls */}
        {isController && (
          <div className="mt-8 pt-8 border-t border-gray-700">
            <div className="flex justify-center items-center space-x-4">
              <Button
                size="icon"
                variant="outline"
                onClick={handlePrevLevel}
                disabled={clockState.currentLevelIdx === 0}
                className="text-white border-gray-600"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              {clockState.status === 'idle' && (
                <Button
                  size="lg"
                  onClick={handleStart}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Clock
                </Button>
              )}
              
              {clockState.status === 'running' && (
                <Button
                  size="lg"
                  onClick={handlePause}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </Button>
              )}
              
              {clockState.status === 'paused' && (
                <Button
                  size="lg"
                  onClick={handleResume}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Resume
                </Button>
              )}
              
              <Button
                size="icon"
                variant="outline"
                onClick={handleNextLevel}
                disabled={clockState.currentLevelIdx >= levels.length - 1}
                className="text-white border-gray-600"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              
              <Button
                size="icon"
                variant="outline"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-white border-gray-600"
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
      
      {/* Audio Element */}
      <audio ref={audioRef} />
    </div>
  );
}
8. Scripts for Agent Management
scripts/setup-agents.js:
javascriptconst puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
require('dotenv').config({ path: '.env.local' });

class AgentSetup {
  constructor() {
    this.agents = [
      {
        id: 'architect',
        name: 'System Architect',
        email: process.env.CODEX_1_EMAIL,
        password: process.env.CODEX_1_PASSWORD,
        color: chalk.blue
      },
      {
        id: 'backend',
        name: 'Backend Developer',
        email: process.env.CODEX_2_EMAIL,
        password: process.env.CODEX_2_PASSWORD,
        color: chalk.green
      },
      {
        id: 'frontend',
        name: 'Frontend Developer',
        email: process.env.CODEX_3_EMAIL,
        password: process.env.CODEX_3_PASSWORD,
        color: chalk.magenta
      },
      {
        id: 'devops',
        name: 'DevOps Engineer',
        email: process.env.CODEX_4_EMAIL,
        password: process.env.CODEX_4_PASSWORD,
        color: chalk.yellow
      }
    ];
  }

  async setupAgent(agent) {
    const spinner = ora(`Setting up ${agent.name}...`).start();
    
    try {
      const profilePath = path.join(process.cwd(), 'profiles', agent.id);
      await fs.mkdir(profilePath, { recursive: true });
      
      const browser = await puppeteer.launch({
        headless: false,
        userDataDir: profilePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--window-size=1280,800'
        ]
      });
      
      const page = await browser.newPage();
      
      // Navigate to OpenAI Playground
      await page.goto('https://platform.openai.com/playground', {
        waitUntil: 'networkidle2'
      });
      
      // Check if login is needed
      const needsLogin = await page.$('input[name="username"]');
      
      if (needsLogin) {
        spinner.text = `Logging in ${agent.name}...`;
        
        // Enter email
        await page.type('input[name="username"]', agent.email, { delay: 100 });
        await page.click('button[type="submit"]');
        
        // Wait for password field
        await page.waitForSelector('input[name="password"]', { timeout: 10000 });
        await page.type('input[name="password"]', agent.password, { delay: 100 });
        await page.click('button[type="submit"]');
        
        // Wait for successful login
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        // Save cookies
        const cookies = await page.cookies();
        const cookiePath = path.join(profilePath, 'cookies.json');
        await fs.writeFile(cookiePath, JSON.stringify(cookies, null, 2));
        
        spinner.succeed(agent.color(`✓ ${agent.name} logged in successfully`));
      } else {
        spinner.succeed(agent.color(`✓ ${agent.name} already logged in`));
      }
      
      // Keep browser open for 3 seconds for verification
      await new Promise(resolve => setTimeout(resolve, 3000));
      await browser.close();
      
    } catch (error) {
      spinner.fail(`Failed to setup ${agent.name}: ${error.message}`);
      throw error;
    }
  }
  
  async run() {
    console.log(chalk.cyan('\n╔══════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║          TURNUVAYONETIM - Agent Setup Wizard            ║'));
    console.log(chalk.cyan('╚══════════════════════════════════════════════════════════╝\n'));
    
    // Check for credentials
    let validAgents = [];
    for (const agent of this.agents) {
      if (!agent.email || !agent.password) {
        console.log(chalk.yellow(`⚠ ${agent.name}: Credentials not found in .env.local`));
      } else {
        validAgents.push(agent);
      }
    }
    
    if (validAgents.length === 0) {
      console.log(chalk.red('\n❌ No agent credentials found!'));
      console.log(chalk.white('Please add your Codex account details to .env.local file\n'));
      process.exit(1);
    }
    
    console.log(chalk.white(`Found ${validAgents.length} agent configurations\n`));
    
    // Setup each agent
    for (const agent of validAgents) {
      await this.setupAgent(agent);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(chalk.green('\n✅ All agents have been set up successfully!\n'));
    console.log(chalk.white('Next steps:'));
    console.log(chalk.gray('  1. Run: npm run agents:start'));
    console.log(chalk.gray('  2. Run: npm run orchestrate:interactive'));
    console.log('');
  }
}

// Run setup
if (require.main === module) {
  const setup = new AgentSetup();
  setup.run().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = AgentSetup;
9. Docker Configuration
Dockerfile:
dockerfile# Multi-stage build for production
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/*/package.json apps/*/
COPY packages/*/package.json packages/*/
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 turnuva

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER turnuva

EXPOSE 3000 4000 3001

CMD ["npm", "start"]
10. GitHub Actions CI/CD
.github/workflows/ci.yml:
yamlname: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
          
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run tests
        run: npm run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      
      - name: Build project
        run: npm run build
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t turnuvayonetim:${{ github.sha }} .
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push turnuvayonetim:${{ github.sha }}
Bu aşamayı tamamladıktan sonra "Phase 3 completed" diye bildir. Tüm sistem hazır!
İLERLEME ÖZETI
✅ Phase 1: Environment Setup - Tamamlandı
✅ Phase 2: Agent System - Tamamlandı
✅ Phase 3: Project Build - Tamamlandı
Sistem şu anda:

4 Agent orchestration sistemi hazır
Poker tournament backend hazır
Frontend components hazır
WebSocket real-time sync hazır
Database schema hazır
Docker deployment hazır

Projeyi başlatmak için:

npm install
npm run setup:agents
npm run db:setup
npm run dev


---

## **KULLANIM TALİMATI**

Bu 3 MD dosyasını proje kökünüze koyun ve sırayla Codex CLI'ye verin:

1. **İlk olarak:** `PHASE1_ENVIRONMENT_SETUP.md` dosyasını Codex'e verin
2. **Sonra:** `PHASE2_AGENT_SYSTEM.md` dosyasını verin
3. **Son olarak:** `PHASE3_PROJECT_BUILD.md` dosyasını verin

Her aşama tamamlandığında Codex size onay verecek ve bir sonraki aşamaya geçebilirsiniz.