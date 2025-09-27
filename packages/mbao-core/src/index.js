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
exports.WorkflowBuilder = exports.BrowserAgent = exports.Orchestrator = exports.RollbackStrategy = exports.TaskType = void 0;
const events_1 = require("events");
const p_queue_1 = __importDefault(require("p-queue"));
const Redis = __importStar(require("redis"));
const uuid_1 = require("uuid");
var TaskType;
(function (TaskType) {
    TaskType["PROMPT"] = "prompt";
    TaskType["EXTRACT"] = "extract";
    TaskType["NAVIGATE"] = "navigate";
    TaskType["INTERACT"] = "interact";
    TaskType["ANALYZE"] = "analyze";
    TaskType["GENERATE"] = "generate";
    TaskType["REVIEW"] = "review";
})(TaskType || (exports.TaskType = TaskType = {}));
var RollbackStrategy;
(function (RollbackStrategy) {
    RollbackStrategy["NONE"] = "none";
    RollbackStrategy["COMPENSATE"] = "compensate";
    RollbackStrategy["RETRY"] = "retry";
    RollbackStrategy["ABORT"] = "abort";
})(RollbackStrategy || (exports.RollbackStrategy = RollbackStrategy = {}));
// ============= ORCHESTRATOR CORE =============
class Orchestrator extends events_1.EventEmitter {
    agents = new Map();
    taskQueue;
    workflows = new Map();
    messageBus;
    capabilityRegistry;
    redis;
    constructor(config) {
        super();
        this.taskQueue = new p_queue_1.default({
            concurrency: config.maxConcurrency || 4,
            interval: config.rateLimit?.interval,
            intervalCap: config.rateLimit?.cap,
            throwOnTimeout: true
        });
        this.messageBus = new MessageBus();
        this.capabilityRegistry = new CapabilityRegistry();
        if (config.redis) {
            this.initializeRedis(config.redis.url);
        }
    }
    async initializeRedis(url) {
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
    async registerAgent(config) {
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
    registerWorkflow(template) {
        this.workflows.set(template.id, template);
        this.emit('workflow:registered', template.id);
    }
    async executeWorkflow(workflowId, context) {
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
                const results = await this.executeStage(stage);
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
        }
        catch (error) {
            if (workflow.hooks?.onError) {
                workflow.hooks.onError(error);
            }
            if (workflow.rollbackStrategy) {
                await this.handleRollback(execution, workflow.rollbackStrategy);
            }
            throw error;
        }
    }
    async executeStage(stage) {
        const startTime = Date.now();
        try {
            if (stage.parallel) {
                // Parallel execution
                const promises = stage.tasks.map(task => this.assignAndExecuteTask(task));
                return await Promise.all(promises);
            }
            else {
                // Sequential execution
                const results = [];
                for (const task of stage.tasks) {
                    const result = await this.assignAndExecuteTask(task);
                    results.push(result);
                }
                return results;
            }
        }
        finally {
            const duration = Date.now() - startTime;
            this.emit('stage:completed', {
                stage: stage.name,
                duration
            });
        }
    }
    async assignAndExecuteTask(task) {
        // Find capable agent
        const agent = await this.findCapableAgent(task.requiredCapabilities);
        if (!agent) {
            throw new Error(`No agent found for task: ${task.id}`);
        }
        // Add to queue with retry logic
        return this.taskQueue.add(async () => {
            return this.executeWithRetry(() => agent.executeTask(task), task.retries || 3);
        }, { priority: task.priority });
    }
    async findCapableAgent(requiredCapabilities) {
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
            .filter(Boolean);
        return agents.reduce((best, agent) => agent.getLoad() < best.getLoad() ? agent : best);
    }
    getNextAvailableAgent() {
        const agents = Array.from(this.agents.values());
        if (agents.length === 0)
            return null;
        // Get least loaded agent
        return agents.reduce((best, agent) => agent.getLoad() < best.getLoad() ? agent : best);
    }
    async executeWithRetry(fn, maxRetries) {
        let lastError;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                const delay = Math.min(1000 * Math.pow(2, i), 10000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }
    async executeTasks(tasks) {
        const results = [];
        for (const task of tasks) {
            const result = await this.assignAndExecuteTask(task);
            results.push(result);
        }
        return results;
    }
    async handleRollback(execution, _strategy) {
        switch (_strategy) {
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
    async shutdown() {
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
exports.Orchestrator = Orchestrator;
// ============= BROWSER AGENT =============
class BrowserAgent {
    config;
    messageBus;
    driver;
    taskHistory = [];
    load = 0;
    isInitialized = false;
    constructor(config, messageBus) {
        this.config = config;
        this.messageBus = messageBus;
    }
    async initialize() {
        const { Builder } = await Promise.resolve().then(() => __importStar(require('selenium-webdriver')));
        const chrome = await Promise.resolve().then(() => __importStar(require('selenium-webdriver/chrome')));
        // Configure Chrome options
        const options = new chrome.Options();
        if (this.config.browserConfig.headless) {
            options.addArguments('--headless');
        }
        options.addArguments('--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--disable-gpu', '--window-size=1280,800');
        if (this.config.browserConfig.userAgent) {
            options.addArguments(`--user-agent=${this.config.browserConfig.userAgent}`);
        }
        // Get Selenium Grid URL based on agent ID
        const gridUrls = {
            'architect': 'http://localhost:4444',
            'backend': 'http://localhost:4445',
            'frontend': 'http://localhost:4446',
            'devops': 'http://localhost:4447'
        };
        const gridUrl = gridUrls[this.config.id] || 'http://localhost:4444';
        try {
            console.log(`🔗 Connecting ${this.config.name} to Selenium Grid at ${gridUrl}...`);
            this.driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .usingServer(gridUrl)
                .build();
            // Test the connection
            await this.driver.getTitle();
            console.log(`✅ ${this.config.name} connected successfully`);
        }
        catch (error) {
            console.error(`❌ Failed to connect ${this.config.name} to Selenium Grid:`, error.message);
            console.log(`💡 Make sure Docker containers are running: docker-compose up -d chrome-${this.config.id}`);
            throw new Error(`Cannot connect to Selenium Grid for agent ${this.config.id}. Ensure Docker containers are running.`);
        }
        // Auto-login if credentials provided
        if (this.config.credentials) {
            await this.login();
        }
        this.isInitialized = true;
        this.messageBus.emit('agent:ready', this.config.id);
    }
    async login() {
        if (!this.config.credentials)
            return;
        const { By } = await Promise.resolve().then(() => __importStar(require('selenium-webdriver')));
        const { platform, email, password } = this.config.credentials;
        await this.driver.get(platform);
        await this.driver.sleep(3000);
        try {
            // Check if already logged in by looking for login inputs
            const emailInput = await this.driver.findElements(By.css('input[name="username"], input[name="email"], input[type="email"]'));
            if (emailInput.length > 0) {
                console.log(`🔐 Logging in ${this.config.name}...`);
                // Enter email
                await emailInput[0].clear();
                await emailInput[0].sendKeys(email);
                // Check for continue button
                try {
                    const continueBtn = await this.driver.findElement(By.css('button[type="submit"]:not([name="password"]), button:contains("Continue"), button:contains("Next")'));
                    await continueBtn.click();
                    await this.driver.sleep(2000);
                }
                catch (e) {
                    // No continue button, proceed to password
                }
                // Enter password
                const passwordInput = await this.driver.findElement(By.css('input[name="password"], input[type="password"]'));
                await passwordInput.clear();
                await passwordInput.sendKeys(password);
                // Submit
                const submitBtn = await this.driver.findElement(By.css('button[type="submit"], input[type="submit"], button:contains("Log in"), button:contains("Sign in")'));
                await submitBtn.click();
                // Wait for login to complete
                await this.driver.sleep(5000);
                console.log(`✅ ${this.config.name} logged in successfully`);
            }
            else {
                console.log(`✅ ${this.config.name} already logged in`);
            }
        }
        catch (error) {
            console.log(`⚠️ Login issue for ${this.config.name}, continuing anyway:`, error.message);
        }
    }
    async executeTask(task) {
        if (!this.isInitialized) {
            throw new Error(`Agent ${this.config.id} not initialized`);
        }
        this.load++;
        const startTime = Date.now();
        const timeout = task.timeout || 120000; // Default 2 minutes
        try {
            console.log(`🤖 [${this.config.name}] Executing task: ${task.id} (timeout: ${timeout}ms)`);
            // Get executor for task type
            const executor = this.getExecutor(task.type);
            // Add timeout wrapper
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Task ${task.id} timed out after ${timeout}ms`));
                }, timeout);
            });
            const result = await Promise.race([
                executor.execute(task, this.driver),
                timeoutPromise
            ]);
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
        }
        catch (error) {
            this.taskHistory.push({
                taskId: task.id,
                type: task.type,
                success: false,
                error: error.message,
                duration: Date.now() - startTime,
                timestamp: new Date()
            });
            this.messageBus.emit('task:failed', {
                agentId: this.config.id,
                taskId: task.id,
                error
            });
            throw error;
        }
        finally {
            this.load--;
        }
    }
    getExecutor(taskType) {
        const executors = {
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
    getLoad() {
        return this.load;
    }
    async shutdown() {
        if (this.driver) {
            await this.driver.quit();
        }
        this.isInitialized = false;
    }
}
exports.BrowserAgent = BrowserAgent;
// ============= TASK EXECUTORS =============
class TaskExecutor {
}
class PromptExecutor extends TaskExecutor {
    async execute(task, driver) {
        const { prompt, waitForResponse = true } = task.payload;
        const { By, Key } = await Promise.resolve().then(() => __importStar(require('selenium-webdriver')));
        // Check if we're on ChatGPT
        const currentUrl = await driver.getCurrentUrl();
        const isChatGPT = currentUrl.includes('chat.openai.com');
        if (isChatGPT) {
            // Wait for page to load
            await driver.sleep(3000);
            try {
                // Multiple selectors for ChatGPT input
                const inputSelectors = [
                    '#prompt-textarea',
                    'textarea[placeholder*="Message"]',
                    'textarea[data-id="root"]',
                    'textarea',
                    '[contenteditable="true"]'
                ];
                let inputElement = null;
                for (const selector of inputSelectors) {
                    try {
                        inputElement = await driver.findElement(By.css(selector));
                        break;
                    }
                    catch (e) {
                        continue;
                    }
                }
                if (!inputElement) {
                    // Fallback: try to find any input-like element
                    try {
                        inputElement = await driver.findElement(By.css('div[role="textbox"], textarea, input[type="text"]'));
                    }
                    catch (e) {
                        console.log('No input element found, trying to click and type directly');
                    }
                }
                if (inputElement) {
                    // Clear any existing text and type prompt
                    await inputElement.clear();
                    await inputElement.click();
                    await driver.sleep(500);
                    await inputElement.sendKeys(prompt);
                    await driver.sleep(1000);
                    // Submit with Enter
                    await inputElement.sendKeys(Key.RETURN);
                }
                else {
                    // Last resort: use actions to type directly
                    const actions = driver.actions();
                    await actions.sendKeys(prompt).perform();
                    await driver.sleep(1000);
                    await actions.sendKeys(Key.RETURN).perform();
                }
                if (waitForResponse) {
                    console.log(`🤖 Waiting for ChatGPT response...`);
                    // Wait longer for ChatGPT to start responding
                    await driver.sleep(8000);
                    let response = '';
                    let retries = 0;
                    const maxRetries = 15; // 45 seconds total
                    while (retries < maxRetries && (!response || response.length < 10)) {
                        try {
                            // Strategy 1: Look for assistant message elements
                            try {
                                const assistantMessages = await driver.findElements(By.css('[data-message-author-role="assistant"], [data-testid="bot-message"], .agent-turn, .markdown, .prose'));
                                if (assistantMessages.length > 0) {
                                    const lastMessage = assistantMessages[assistantMessages.length - 1];
                                    const text = await lastMessage.getText();
                                    if (text && text.length > 10 && !text.includes('thinking')) {
                                        response = text;
                                        console.log(`✅ Strategy 1 success: Found assistant message (${text.length} chars)`);
                                        break;
                                    }
                                }
                            }
                            catch (e) {
                                // Strategy 1 failed, continue to strategy 2
                            }
                            // Strategy 2: Look for message content patterns
                            if (!response || response.length < 10) {
                                try {
                                    const messageElements = await driver.findElements(By.css('.prose, .markdown, [class*="message-content"], [class*="response"], .group'));
                                    for (const element of messageElements) {
                                        try {
                                            const text = await element.getText();
                                            if (text && text.length > 100 &&
                                                !text.toLowerCase().includes('typing') &&
                                                !text.includes('...') &&
                                                !text.toLowerCase().includes('thinking') &&
                                                !text.toLowerCase().includes('enter a prompt')) {
                                                response = text;
                                                console.log(`✅ Strategy 2 success: Found message content (${text.length} chars)`);
                                                break;
                                            }
                                        }
                                        catch (e) {
                                            // Continue to next element
                                        }
                                    }
                                }
                                catch (e) {
                                    // Strategy 2 failed, continue to strategy 3
                                }
                            }
                            // Strategy 3: Look for any substantial content in conversation area
                            if (!response || response.length < 50) {
                                try {
                                    const conversationArea = await driver.findElement(By.css('main, [role="main"], .conversation, [class*="chat"]'));
                                    const allText = await conversationArea.getText();
                                    if (allText && allText.length > 200) {
                                        // Split by lines and filter out UI elements
                                        const lines = allText.split('\n')
                                            .filter((line) => line.trim().length > 20)
                                            .filter((line) => !line.toLowerCase().includes('enter a prompt'))
                                            .filter((line) => !line.toLowerCase().includes('typing'))
                                            .filter((line) => !line.includes('...'));
                                        const lastLines = lines.slice(-20); // Get last 20 substantial lines
                                        const potentialResponse = lastLines.join('\n');
                                        if (potentialResponse.length > 150) {
                                            response = potentialResponse;
                                            console.log(`✅ Strategy 3 success: Found conversation content (${potentialResponse.length} chars)`);
                                        }
                                    }
                                }
                                catch (e) {
                                    // Strategy 3 failed
                                }
                            }
                            // Strategy 4: Look for any text content in the page (last resort)
                            if (!response || response.length < 50) {
                                try {
                                    const bodyText = await driver.findElement(By.css('body')).getText();
                                    const lines = bodyText.split('\n')
                                        .filter((line) => line.trim().length > 30)
                                        .filter((line) => !line.toLowerCase().includes('enter a prompt'))
                                        .filter((line) => !line.toLowerCase().includes('typing'))
                                        .filter((line) => !line.toLowerCase().includes('sidebar'))
                                        .filter((line) => !line.toLowerCase().includes('menu'));
                                    if (lines.length > 5) {
                                        const lastSubstantialLines = lines.slice(-10);
                                        const fallbackResponse = lastSubstantialLines.join('\n');
                                        if (fallbackResponse.length > 100) {
                                            response = fallbackResponse;
                                            console.log(`⚠️ Strategy 4 fallback: Using page content (${fallbackResponse.length} chars)`);
                                        }
                                    }
                                }
                                catch (e) {
                                    // All strategies failed
                                }
                            }
                        }
                        catch (error) {
                            console.log(`🔄 Retry ${retries + 1}/${maxRetries}: ${error.message}`);
                        }
                        if (!response || response.length < 10) {
                            retries++;
                            if (retries < maxRetries) {
                                console.log(`⏳ Waiting 3s before retry ${retries + 1}/${maxRetries}...`);
                                await driver.sleep(3000);
                            }
                        }
                    }
                    if (response && response.length > 10) {
                        console.log(`✅ Response extracted (${response.length} chars)`);
                        // Extract code blocks if present
                        const codeMatch = response.match(/```[\w]*\n([\s\S]*?)\n```/);
                        if (codeMatch) {
                            console.log(`📝 Code block found in response`);
                            return codeMatch[1];
                        }
                        return response;
                    }
                    else {
                        console.log(`⚠️ Response detection incomplete, got: ${response?.substring(0, 100)}...`);
                        return 'submitted via actions';
                    }
                }
                return 'submitted';
            }
            catch (error) {
                console.error(`❌ Error in ChatGPT interaction:`, error);
                return 'Error occurred during prompt submission';
            }
        }
        // Generic implementation for other platforms
        try {
            const textArea = await driver.findElement(By.css('textarea, [contenteditable="true"]'));
            await textArea.clear();
            await textArea.sendKeys(prompt);
            await textArea.sendKeys(Key.RETURN);
            if (waitForResponse) {
                await driver.sleep(5000);
                const responseElements = await driver.findElements(By.css('[data-message-role="assistant"], .assistant-message, .response'));
                if (responseElements.length > 0) {
                    return await responseElements[responseElements.length - 1].getText();
                }
            }
            return 'submitted';
        }
        catch (error) {
            // Last resort: try to send keys directly
            const actions = driver.actions();
            await actions.sendKeys(prompt).perform();
            await actions.sendKeys(Key.RETURN).perform();
            return 'submitted via actions';
        }
    }
}
class DataExtractor extends TaskExecutor {
    async execute(task, driver) {
        const { selector, attribute, multiple = false } = task.payload;
        const { By, until } = await Promise.resolve().then(() => __importStar(require('selenium-webdriver')));
        await driver.wait(until.elementLocated(By.css(selector)), 10000);
        if (multiple) {
            const elements = await driver.findElements(By.css(selector));
            const results = [];
            for (const element of elements) {
                if (attribute === 'text') {
                    results.push(await element.getText());
                }
                else if (attribute === 'html') {
                    results.push(await element.getAttribute('innerHTML'));
                }
                else {
                    results.push(await element.getAttribute(attribute));
                }
            }
            return results;
        }
        else {
            const element = await driver.findElement(By.css(selector));
            if (attribute === 'text') {
                return await element.getText();
            }
            else if (attribute === 'html') {
                return await element.getAttribute('innerHTML');
            }
            else {
                return await element.getAttribute(attribute);
            }
        }
    }
}
class NavigationExecutor extends TaskExecutor {
    async execute(task, driver) {
        const { url } = task.payload;
        await driver.get(url);
        await driver.sleep(3000); // Wait for page to stabilize
        return;
    }
}
class InteractionExecutor extends TaskExecutor {
    async execute(task, driver) {
        const { action, selector, value } = task.payload;
        const { By, until } = await Promise.resolve().then(() => __importStar(require('selenium-webdriver')));
        await driver.wait(until.elementLocated(By.css(selector)), 10000);
        const element = await driver.findElement(By.css(selector));
        switch (action) {
            case 'click':
                await element.click();
                break;
            case 'type':
                await element.clear();
                await element.sendKeys(value);
                break;
            case 'select':
                const Select = await Promise.resolve().then(() => __importStar(require('selenium-webdriver/lib/select')));
                const select = new Select.Select(element);
                await select.selectByValue(value);
                break;
            case 'hover':
                const actions = driver.actions();
                await actions.move({ origin: element }).perform();
                break;
            case 'screenshot':
                const screenshot = await driver.takeScreenshot();
                const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
                await fs.writeFile(value, screenshot, 'base64');
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
}
class AnalysisExecutor extends TaskExecutor {
    async execute(task, driver) {
        const { code } = task.payload;
        // Execute analysis code in browser context
        const result = await driver.executeScript(code);
        return result;
    }
}
class CodeGenerator extends TaskExecutor {
    async execute(task, driver) {
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
        const code = await promptExecutor.execute({ ...task, payload: { prompt, waitForResponse: true } }, driver);
        // Extract code blocks
        const codeMatch = code.match(/```[\w]*\n([\s\S]*?)\n```/);
        return codeMatch ? codeMatch[1] : code;
    }
}
class CodeReviewer extends TaskExecutor {
    async execute(task, driver) {
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
        const review = await promptExecutor.execute({ ...task, payload: { prompt, waitForResponse: true } }, driver);
        return review;
    }
}
// ============= SUPPORT CLASSES =============
class MessageBus extends events_1.EventEmitter {
    channels = new Map();
    subscribe(agentId, channel) {
        if (!this.channels.has(channel)) {
            this.channels.set(channel, new Set());
        }
        this.channels.get(channel).add(agentId);
    }
    publish(channel, message) {
        const subscribers = this.channels.get(channel);
        if (!subscribers)
            return;
        subscribers.forEach(agentId => {
            this.emit(`message:${agentId}`, {
                channel,
                message,
                timestamp: new Date()
            });
        });
    }
    broadcast(message) {
        this.emit('broadcast', {
            message,
            timestamp: new Date()
        });
    }
}
class CapabilityRegistry {
    capabilities = new Map();
    register(capability, agentId) {
        if (!this.capabilities.has(capability)) {
            this.capabilities.set(capability, new Set());
        }
        this.capabilities.get(capability).add(agentId);
    }
    unregister(capability, agentId) {
        this.capabilities.get(capability)?.delete(agentId);
    }
    getAgents(capability) {
        return Array.from(this.capabilities.get(capability) || []);
    }
    getCapabilities(agentId) {
        const caps = [];
        this.capabilities.forEach((agents, capability) => {
            if (agents.has(agentId)) {
                caps.push(capability);
            }
        });
        return caps;
    }
}
class WorkflowExecution {
    workflow;
    _context;
    stageResults = new Map();
    completedStages = [];
    startTime = Date.now();
    constructor(workflow, _context) {
        this.workflow = workflow;
        this._context = _context;
    }
    addStageResult(stageName, result) {
        this.stageResults.set(stageName, result);
        this.completedStages.push(stageName);
    }
    getCompletedStages() {
        return [...this.completedStages];
    }
    getResult() {
        return {
            workflowId: this.workflow.id,
            context: this._context,
            stages: Object.fromEntries(this.stageResults),
            completedStages: this.completedStages,
            duration: Date.now() - this.startTime,
            timestamp: new Date()
        };
    }
}
// ============= WORKFLOW BUILDER =============
class WorkflowBuilder {
    workflow;
    currentStage;
    constructor(id, name) {
        this.workflow = {
            id,
            name,
            stages: []
        };
    }
    description(desc) {
        this.workflow.description = desc;
        return this;
    }
    stage(name) {
        const stage = {
            id: (0, uuid_1.v4)(),
            name,
            tasks: []
        };
        this.currentStage = stage;
        this.workflow.stages.push(stage);
        return this;
    }
    parallel() {
        if (this.currentStage) {
            this.currentStage.parallel = true;
        }
        return this;
    }
    task(taskInput) {
        if (!this.currentStage) {
            throw new Error('No stage defined');
        }
        const fullTask = {
            id: taskInput.id || (0, uuid_1.v4)(),
            type: taskInput.type,
            priority: taskInput.priority || 5,
            payload: taskInput.payload || {},
            requiredCapabilities: taskInput.requiredCapabilities,
            dependencies: taskInput.dependencies,
            timeout: taskInput.timeout,
            retries: taskInput.retries,
            metadata: taskInput.metadata
        };
        this.currentStage.tasks.push(fullTask);
        return this;
    }
    onSuccess(handler) {
        if (this.currentStage) {
            this.currentStage.onSuccess = handler;
        }
        return this;
    }
    onFailure(handler) {
        if (this.currentStage) {
            this.currentStage.onFailure = handler;
        }
        return this;
    }
    rollback(strategy) {
        this.workflow.rollbackStrategy = strategy;
        return this;
    }
    hooks(hooks) {
        this.workflow.hooks = hooks;
        return this;
    }
    build() {
        return this.workflow;
    }
}
exports.WorkflowBuilder = WorkflowBuilder;
exports.default = Orchestrator;
//# sourceMappingURL=index.js.map