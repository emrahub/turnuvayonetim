import { EventEmitter } from 'events';
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
export declare enum TaskType {
    PROMPT = "prompt",
    EXTRACT = "extract",
    NAVIGATE = "navigate",
    INTERACT = "interact",
    ANALYZE = "analyze",
    GENERATE = "generate",
    REVIEW = "review"
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
export declare enum RollbackStrategy {
    NONE = "none",
    COMPENSATE = "compensate",
    RETRY = "retry",
    ABORT = "abort"
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
export declare class Orchestrator extends EventEmitter {
    private agents;
    private taskQueue;
    private workflows;
    private messageBus;
    private capabilityRegistry;
    private redis?;
    constructor(config: OrchestratorConfig);
    private initializeRedis;
    registerAgent(config: AgentConfig): Promise<void>;
    registerWorkflow(template: WorkflowTemplate): void;
    executeWorkflow(workflowId: string, context: any): Promise<WorkflowResult>;
    private executeStage;
    private assignAndExecuteTask;
    private findCapableAgent;
    private getNextAvailableAgent;
    private executeWithRetry;
    private executeTasks;
    private handleRollback;
    shutdown(): Promise<void>;
}
export declare class BrowserAgent {
    config: AgentConfig;
    private messageBus;
    private driver;
    private taskHistory;
    private load;
    private isInitialized;
    constructor(config: AgentConfig, messageBus: MessageBus);
    initialize(): Promise<void>;
    private login;
    executeTask(task: Task): Promise<any>;
    private getExecutor;
    getLoad(): number;
    shutdown(): Promise<void>;
}
declare class MessageBus extends EventEmitter {
    private channels;
    subscribe(agentId: string, channel: string): void;
    publish(channel: string, message: any): void;
    broadcast(message: any): void;
}
interface WorkflowResult {
    workflowId: string;
    context: any;
    stages: Record<string, any>;
    completedStages: string[];
    duration: number;
    timestamp: Date;
}
export declare class WorkflowBuilder {
    private workflow;
    private currentStage?;
    constructor(id: string, name: string);
    description(desc: string): this;
    stage(name: string): this;
    parallel(): this;
    task(taskInput: Partial<Task> & {
        type: TaskType;
    }): this;
    onSuccess(handler: (results: any[]) => Task[]): this;
    onFailure(handler: (error: Error) => void): this;
    rollback(strategy: RollbackStrategy): this;
    hooks(hooks: WorkflowTemplate['hooks']): this;
    build(): WorkflowTemplate;
}
export default Orchestrator;
//# sourceMappingURL=index.d.ts.map