export declare class PokerProjectOrchestrator {
    private orchestrator;
    private outputDir;
    constructor();
    initialize(): Promise<void>;
    private setupAgents;
    private registerWorkflows;
    buildFullProject(): Promise<void>;
    buildMVP(): Promise<void>;
    private saveResults;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map