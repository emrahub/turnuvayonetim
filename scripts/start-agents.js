#!/usr/bin/env node

/**
 * Start script for Codex Agents
 * This script starts all configured agents with their respective browser profiles
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');

// Agent configurations
const AGENTS = [
  { id: 1, name: 'architect', port: 9001 },
  { id: 2, name: 'backend', port: 9002 },
  { id: 3, name: 'frontend', port: 9003 },
  { id: 4, name: 'devops', port: 9004 }
];

// Active agent processes
const activeAgents = new Map();

// Check if agent profiles exist
function checkProfiles() {
  const spinner = ora('Checking agent profiles...').start();
  const profilesDir = path.join(__dirname, '..', 'profiles');

  if (!fs.existsSync(profilesDir)) {
    spinner.fail('Agent profiles not found');
    console.error(chalk.red('\nPlease run "npm run setup:agents" first'));
    process.exit(1);
  }

  const missingProfiles = [];
  AGENTS.forEach(agent => {
    const profilePath = path.join(profilesDir, agent.name);
    if (!fs.existsSync(profilePath)) {
      missingProfiles.push(agent.name);
    }
  });

  if (missingProfiles.length > 0) {
    spinner.fail('Some agent profiles are missing');
    console.error(chalk.red('\nMissing profiles:'));
    missingProfiles.forEach(p => console.error(chalk.red(`  - ${p}`)));
    console.error(chalk.yellow('\nPlease run "npm run setup:agents" to create them'));
    process.exit(1);
  }

  spinner.succeed('Agent profiles found');
}

// Start individual agent
function startAgent(agent) {
  return new Promise((resolve, reject) => {
    const spinner = ora(`Starting ${agent.name} agent...`).start();

    // Load environment variables
    const env = { ...process.env };
    env.AGENT_NAME = agent.name;
    env.AGENT_PORT = agent.port;
    env.AGENT_ID = agent.id;
    env.CODEX_EMAIL = process.env[`CODEX_${agent.id}_EMAIL`];
    env.CODEX_PASSWORD = process.env[`CODEX_${agent.id}_PASSWORD`];

    // Path to agent orchestrator
    const orchestratorPath = path.join(__dirname, '..', 'packages', 'mbao-core', 'dist', 'index.js');

    if (!fs.existsSync(orchestratorPath)) {
      spinner.fail(`${agent.name} agent orchestrator not found`);
      console.error(chalk.red(`\nPlease build the mbao-core package first:`));
      console.error(chalk.yellow(`  cd packages/mbao-core && npm run build`));
      reject(new Error('Orchestrator not found'));
      return;
    }

    // Start the agent process
    const agentProcess = spawn('node', [orchestratorPath], {
      env,
      cwd: path.join(__dirname, '..'),
      detached: false
    });

    // Handle agent output
    agentProcess.stdout.on('data', (data) => {
      console.log(chalk.gray(`[${agent.name}]`), data.toString().trim());
    });

    agentProcess.stderr.on('data', (data) => {
      console.error(chalk.red(`[${agent.name} ERROR]`), data.toString().trim());
    });

    // Handle agent exit
    agentProcess.on('exit', (code, signal) => {
      if (code !== 0) {
        spinner.fail(`${agent.name} agent exited with code ${code}`);
        activeAgents.delete(agent.name);
      }
    });

    agentProcess.on('error', (error) => {
      spinner.fail(`Failed to start ${agent.name} agent`);
      console.error(chalk.red(error.message));
      reject(error);
    });

    // Store the process reference
    activeAgents.set(agent.name, agentProcess);

    // Consider the agent started after a short delay
    setTimeout(() => {
      spinner.succeed(`${agent.name} agent started on port ${agent.port}`);
      resolve();
    }, 2000);
  });
}

// Start all agents
async function startAllAgents() {
  console.log(chalk.blue.bold('\n=== Starting Codex Agents ===\n'));

  // Load environment variables
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

  // Check profiles exist
  checkProfiles();

  // Start agents sequentially with delay
  for (const agent of AGENTS) {
    try {
      await startAgent(agent);
      // Add delay between agent starts
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(chalk.red(`Failed to start ${agent.name} agent:`, error.message));
    }
  }

  console.log(chalk.green.bold('\n✅ All agents started successfully!\n'));
  console.log(chalk.cyan('Agent endpoints:'));
  AGENTS.forEach(agent => {
    if (activeAgents.has(agent.name)) {
      console.log(chalk.white(`  ${agent.name}: http://localhost:${agent.port}`));
    }
  });

  console.log(chalk.yellow('\nPress Ctrl+C to stop all agents\n'));
}

// Graceful shutdown
function shutdown() {
  console.log(chalk.yellow('\n\nShutting down agents...'));

  activeAgents.forEach((process, name) => {
    console.log(chalk.gray(`Stopping ${name} agent...`));
    process.kill('SIGTERM');
  });

  setTimeout(() => {
    activeAgents.forEach((process) => {
      if (!process.killed) {
        process.kill('SIGKILL');
      }
    });
    console.log(chalk.green('All agents stopped'));
    process.exit(0);
  }, 5000);
}

// Handle signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled error:'), error);
  shutdown();
});

// Start the agents
startAllAgents().catch(error => {
  console.error(chalk.red('Failed to start agents:'), error);
  process.exit(1);
});