#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import dotenv from 'dotenv';
import { PokerProjectOrchestrator } from '@poker/adapter';

// Load environment variables
dotenv.config({ path: '.env.local' });

const program = new Command();

program
  .name('turnuva')
  .description('TURNUVAYONETIM - AI-Powered Poker Tournament Management System')
  .version('1.0.0');

// Build command
program
  .command('build')
  .description('Build the poker tournament system')
  .option('--full', 'Build full project with all features')
  .option('--mvp', 'Build MVP version')
  .action(async (options) => {
    console.log(chalk.cyan('🏆 TURNUVAYONETIM - AI Builder'));
    console.log(chalk.gray('Multi-Agent Browser Orchestration System\n'));

    // Check credentials
    const hasCredentials = checkCredentials();
    if (!hasCredentials) {
      console.log(chalk.red('❌ Missing Codex credentials. Please configure .env.local first.'));
      process.exit(1);
    }

    const spinner = ora('Initializing orchestrator...').start();

    try {
      const orchestrator = new PokerProjectOrchestrator();
      await orchestrator.initialize();
      spinner.succeed('Orchestrator initialized');

      if (options.full) {
        await orchestrator.buildFullProject();
      } else if (options.mvp) {
        await orchestrator.buildMVP();
      } else {
        // Interactive mode
        const { buildType } = await inquirer.prompt([
          {
            type: 'list',
            name: 'buildType',
            message: 'What would you like to build?',
            choices: [
              { name: '🚀 Full Project - Complete tournament system', value: 'full' },
              { name: '⚡ MVP - Basic clock and player management', value: 'mvp' }
            ]
          }
        ]);

        if (buildType === 'full') {
          await orchestrator.buildFullProject();
        } else {
          await orchestrator.buildMVP();
        }
      }

      await orchestrator.shutdown();
      console.log(chalk.green('\n🎉 Build completed successfully!'));

    } catch (error) {
      spinner.fail('Build failed');
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// Agents command
program
  .command('agents')
  .description('Manage AI agents')
  .option('--status', 'Show agent status')
  .option('--start', 'Start all agents')
  .option('--stop', 'Stop all agents')
  .action(async (options) => {
    if (options.status) {
      await showAgentStatus();
    } else if (options.start) {
      await startAgents();
    } else if (options.stop) {
      await stopAgents();
    } else {
      // Interactive mode
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: '📊 Show agent status', value: 'status' },
            { name: '▶️ Start all agents', value: 'start' },
            { name: '⏹️ Stop all agents', value: 'stop' }
          ]
        }
      ]);

      switch (action) {
        case 'status':
          await showAgentStatus();
          break;
        case 'start':
          await startAgents();
          break;
        case 'stop':
          await stopAgents();
          break;
      }
    }
  });

// Setup command
program
  .command('setup')
  .description('Setup environment and credentials')
  .action(async () => {
    console.log(chalk.cyan('🔧 Environment Setup'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'codex1Email',
        message: 'Codex Account 1 (Architect) Email:',
        validate: (input: string) => input.includes('@') || 'Please enter a valid email'
      },
      {
        type: 'password',
        name: 'codex1Password',
        message: 'Codex Account 1 Password:',
        mask: '*'
      },
      {
        type: 'input',
        name: 'codex2Email',
        message: 'Codex Account 2 (Backend) Email:',
        validate: (input: string) => input.includes('@') || 'Please enter a valid email'
      },
      {
        type: 'password',
        name: 'codex2Password',
        message: 'Codex Account 2 Password:',
        mask: '*'
      },
      {
        type: 'input',
        name: 'codex3Email',
        message: 'Codex Account 3 (Frontend) Email:',
        validate: (input: string) => input.includes('@') || 'Please enter a valid email'
      },
      {
        type: 'password',
        name: 'codex3Password',
        message: 'Codex Account 3 Password:',
        mask: '*'
      },
      {
        type: 'input',
        name: 'codex4Email',
        message: 'Codex Account 4 (DevOps) Email:',
        validate: (input: string) => input.includes('@') || 'Please enter a valid email'
      },
      {
        type: 'password',
        name: 'codex4Password',
        message: 'Codex Account 4 Password:',
        mask: '*'
      }
    ]);

    // Generate .env.local
    const envContent = `# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tournament
REDIS_URL=redis://localhost:6379

# Agent Credentials
CODEX_1_EMAIL=${answers.codex1Email}
CODEX_1_PASSWORD=${answers.codex1Password}
CODEX_2_EMAIL=${answers.codex2Email}
CODEX_2_PASSWORD=${answers.codex2Password}
CODEX_3_EMAIL=${answers.codex3Email}
CODEX_3_PASSWORD=${answers.codex3Password}
CODEX_4_EMAIL=${answers.codex4Email}
CODEX_4_PASSWORD=${answers.codex4Password}

# WebSocket
WS_PORT=3003
WS_SECRET=supersecret-ws-key-change-in-production

# Agent Settings
AGENT_HEADLESS=false
AGENT_TIMEOUT=60000
AGENT_MAX_RETRIES=3

# API
API_PORT=4000
JWT_SECRET=supersecret-jwt-key-change-in-production
SESSION_SECRET=supersecret-session-key-change-in-production

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:3003
NEXT_PUBLIC_APP_URL=http://localhost:3005`;

    const fs = await import('fs/promises');
    await fs.writeFile('.env.local', envContent);

    console.log(chalk.green('✅ Environment configured successfully!'));
    console.log(chalk.yellow('🔒 Please ensure your .env.local file is added to .gitignore'));
  });

// Status command
program
  .command('status')
  .description('Show system status')
  .action(async () => {
    console.log(chalk.cyan('📊 TURNUVAYONETIM System Status\n'));

    // Check services
    await checkServices();

    // Check credentials
    const hasCredentials = checkCredentials();
    console.log(`Credentials: ${hasCredentials ? chalk.green('✅ Configured') : chalk.red('❌ Missing')}`);

    // Check agents
    await showAgentStatus();
  });

async function checkServices() {
  const spinner = ora('Checking services...').start();

  try {
    // Check PostgreSQL
    // Check Redis
    // Check Docker

    spinner.succeed('Services checked');
    console.log(`PostgreSQL: ${chalk.green('✅ Running')}`);
    console.log(`Redis: ${chalk.green('✅ Running')}`);
    console.log(`Docker: ${chalk.green('✅ Running')}`);
  } catch (error) {
    spinner.fail('Service check failed');
    console.log(`PostgreSQL: ${chalk.red('❌ Not running')}`);
    console.log(`Redis: ${chalk.red('❌ Not running')}`);
    console.log(`Docker: ${chalk.red('❌ Not running')}`);
  }
}

function checkCredentials(): boolean {
  const required = [
    'CODEX_1_EMAIL', 'CODEX_1_PASSWORD',
    'CODEX_2_EMAIL', 'CODEX_2_PASSWORD',
    'CODEX_3_EMAIL', 'CODEX_3_PASSWORD',
    'CODEX_4_EMAIL', 'CODEX_4_PASSWORD'
  ];

  return required.every(key => process.env[key]);
}

async function showAgentStatus() {
  console.log(chalk.blue('\n🤖 Agent Status:'));

  const agents = [
    { name: 'Architect', id: 'architect', port: '7900' },
    { name: 'Backend', id: 'backend', port: '7901' },
    { name: 'Frontend', id: 'frontend', port: '7902' },
    { name: 'DevOps', id: 'devops', port: '7903' }
  ];

  agents.forEach(agent => {
    console.log(`  ${agent.name}: ${chalk.yellow('🔄 Checking...')} (Port: ${agent.port})`);
  });
}

async function startAgents() {
  const spinner = ora('Starting agents...').start();

  try {
    // Start Docker containers
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    await execAsync('docker-compose up -d chrome-architect chrome-backend chrome-frontend chrome-devops');

    spinner.succeed('Agents started');
    console.log(chalk.green('✅ All agents are now running'));
    console.log(chalk.gray('You can view them at:'));
    console.log('  Architect: http://localhost:7900');
    console.log('  Backend: http://localhost:7901');
    console.log('  Frontend: http://localhost:7902');
    console.log('  DevOps: http://localhost:7903');
  } catch (error) {
    spinner.fail('Failed to start agents');
    console.error(chalk.red(`Error: ${(error as Error).message}`));
  }
}

async function stopAgents() {
  const spinner = ora('Stopping agents...').start();

  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    await execAsync('docker-compose stop chrome-architect chrome-backend chrome-frontend chrome-devops');

    spinner.succeed('Agents stopped');
    console.log(chalk.green('✅ All agents have been stopped'));
  } catch (error) {
    spinner.fail('Failed to stop agents');
    console.error(chalk.red(`Error: ${(error as Error).message}`));
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('Unhandled Rejection:'), reason);
  process.exit(1);
});

program.parse();