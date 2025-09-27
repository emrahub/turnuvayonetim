#!/usr/bin/env node

/**
 * Setup script for Codex Agents
 * This script sets up the browser profiles and configurations for all agents
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');

// Agent configurations
const AGENTS = [
  { id: 1, name: 'architect', role: 'System Architecture' },
  { id: 2, name: 'backend', role: 'Backend Development' },
  { id: 3, name: 'frontend', role: 'Frontend Development' },
  { id: 4, name: 'devops', role: 'DevOps & Infrastructure' }
];

// Check for required environment variables
function checkEnvironment() {
  const spinner = ora('Checking environment variables...').start();
  const required = [];
  const missing = [];

  AGENTS.forEach(agent => {
    const emailVar = `CODEX_${agent.id}_EMAIL`;
    const passwordVar = `CODEX_${agent.id}_PASSWORD`;

    required.push(emailVar, passwordVar);

    if (!process.env[emailVar]) missing.push(emailVar);
    if (!process.env[passwordVar]) missing.push(passwordVar);
  });

  if (missing.length > 0) {
    spinner.fail('Missing required environment variables');
    console.error(chalk.red('\nMissing environment variables:'));
    missing.forEach(v => console.error(chalk.red(`  - ${v}`)));
    console.log(chalk.yellow('\nPlease set these in your .env.local file'));
    process.exit(1);
  }

  spinner.succeed('Environment variables checked');
  return true;
}

// Create profile directories
function createProfileDirectories() {
  const spinner = ora('Creating agent profile directories...').start();
  const profilesDir = path.join(__dirname, '..', 'profiles');

  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
  }

  AGENTS.forEach(agent => {
    const agentDir = path.join(profilesDir, agent.name);
    if (!fs.existsSync(agentDir)) {
      fs.mkdirSync(agentDir, { recursive: true });
    }

    // Create browser data directory
    const browserDataDir = path.join(agentDir, 'browser-data');
    if (!fs.existsSync(browserDataDir)) {
      fs.mkdirSync(browserDataDir, { recursive: true });
    }

    // Create logs directory
    const logsDir = path.join(agentDir, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  });

  spinner.succeed('Agent profile directories created');
}

// Initialize agent configurations
function initializeAgentConfigs() {
  const spinner = ora('Initializing agent configurations...').start();
  const configPath = path.join(__dirname, '..', 'agent-config.json');

  if (!fs.existsSync(configPath)) {
    spinner.fail('agent-config.json not found');
    console.error(chalk.red('Please ensure agent-config.json exists in the project root'));
    process.exit(1);
  }

  // Read and parse the config
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);

    // Update config with environment variables
    config.agents.forEach((agent, index) => {
      const agentId = index + 1;
      agent.credentials.email = process.env[`CODEX_${agentId}_EMAIL`];
      agent.credentials.password = process.env[`CODEX_${agentId}_PASSWORD`];
    });

    // Save the updated config (without actual credentials for security)
    const safeConfig = JSON.parse(JSON.stringify(config));
    safeConfig.agents.forEach((agent, index) => {
      const agentId = index + 1;
      agent.credentials.email = `\${CODEX_${agentId}_EMAIL}`;
      agent.credentials.password = `\${CODEX_${agentId}_PASSWORD}`;
    });

    fs.writeFileSync(configPath, JSON.stringify(safeConfig, null, 2));
    spinner.succeed('Agent configurations initialized');
  } catch (error) {
    spinner.fail('Failed to initialize agent configurations');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

// Install browser drivers
function installBrowserDrivers() {
  const spinner = ora('Installing browser drivers...').start();

  try {
    // Install Playwright browsers
    if (fs.existsSync(path.join(__dirname, '..', 'node_modules', 'playwright'))) {
      execSync('npx playwright install chromium', { stdio: 'ignore' });
    }

    // Install Puppeteer (it downloads Chromium automatically)
    if (fs.existsSync(path.join(__dirname, '..', 'node_modules', 'puppeteer'))) {
      // Puppeteer downloads browser on installation, no extra step needed
    }

    spinner.succeed('Browser drivers installed');
  } catch (error) {
    spinner.warn('Some browser drivers may not have installed correctly');
    console.log(chalk.yellow('You may need to install them manually'));
  }
}

// Main setup function
async function setup() {
  console.log(chalk.blue.bold('\n=== Codex Agent Setup ===\n'));

  // Load environment variables
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

  // Run setup steps
  checkEnvironment();
  createProfileDirectories();
  initializeAgentConfigs();
  installBrowserDrivers();

  console.log(chalk.green.bold('\n✅ Agent setup completed successfully!\n'));
  console.log(chalk.cyan('You can now run:'));
  console.log(chalk.white('  npm run agents:start    - Start all agents'));
  console.log(chalk.white('  npm run agents:status   - Check agent status\n'));
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Setup failed:'), error);
  process.exit(1);
});

// Run setup
setup().catch(error => {
  console.error(chalk.red('Setup failed:'), error);
  process.exit(1);
});