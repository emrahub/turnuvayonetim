#!/usr/bin/env node

/**
 * Test script to verify MBAO agent functionality with fixed ChatGPT response extraction
 *
 * This script tests the corrected implementation that uses Selenium WebDriver
 * instead of Puppeteer to work with the Docker Chrome containers.
 */

const { PokerProjectOrchestrator } = require('@poker/adapter');
const chalk = require('chalk');

async function testAgents() {
  console.log(chalk.cyan('🧪 Testing MBAO Agent Response Extraction\n'));

  // Check if environment variables are set
  const requiredVars = [
    'CODEX_1_EMAIL', 'CODEX_1_PASSWORD',
    'CODEX_2_EMAIL', 'CODEX_2_PASSWORD',
    'CODEX_3_EMAIL', 'CODEX_3_PASSWORD',
    'CODEX_4_EMAIL', 'CODEX_4_PASSWORD'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.log(chalk.red('❌ Missing environment variables:'));
    missingVars.forEach(varName => {
      console.log(chalk.red(`   ${varName}`));
    });
    console.log(chalk.yellow('\n💡 Run `turnuva setup` to configure credentials'));
    process.exit(1);
  }

  try {
    console.log(chalk.blue('📋 Initializing orchestrator...'));
    const orchestrator = new PokerProjectOrchestrator();
    await orchestrator.initialize();

    console.log(chalk.green('✅ Orchestrator initialized successfully'));
    console.log(chalk.blue('\n🚀 Testing simple prompt with response extraction...'));

    // Test with a simple MVP build that should generate actual code
    await orchestrator.buildMVP();

    console.log(chalk.green('\n🎉 Test completed successfully!'));
    console.log(chalk.gray('Check the output directory for generated files'));

    await orchestrator.shutdown();

  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'));
    console.error(chalk.red(error.message));

    if (error.message.includes('Cannot connect to Selenium Grid')) {
      console.log(chalk.yellow('\n💡 Docker containers may not be running. Try:'));
      console.log(chalk.gray('   docker-compose up -d chrome-architect chrome-backend chrome-frontend chrome-devops'));
    }

    process.exit(1);
  }
}

async function checkDockerContainers() {
  console.log(chalk.blue('🐳 Checking Docker containers...'));

  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  try {
    const { stdout } = await execAsync('docker-compose ps');
    console.log(chalk.gray(stdout));

    // Check if Chrome containers are running
    const containers = ['chrome-architect', 'chrome-backend', 'chrome-frontend', 'chrome-devops'];
    const runningContainers = containers.filter(container => stdout.includes(container) && stdout.includes('Up'));

    if (runningContainers.length === containers.length) {
      console.log(chalk.green('✅ All Chrome containers are running'));
      return true;
    } else {
      console.log(chalk.yellow(`⚠️ Only ${runningContainers.length}/${containers.length} containers running`));
      console.log(chalk.yellow('💡 Starting missing containers...'));

      await execAsync('docker-compose up -d chrome-architect chrome-backend chrome-frontend chrome-devops');
      console.log(chalk.green('✅ Docker containers started'));

      // Wait for containers to be ready
      console.log(chalk.blue('⏳ Waiting for containers to be ready...'));
      await new Promise(resolve => setTimeout(resolve, 10000));

      return true;
    }
  } catch (error) {
    console.log(chalk.red('❌ Docker not available or containers not running'));
    console.log(chalk.yellow('💡 Make sure Docker is installed and run:'));
    console.log(chalk.gray('   docker-compose up -d'));
    return false;
  }
}

async function main() {
  console.log(chalk.cyan('=' .repeat(60)));
  console.log(chalk.cyan('🏆 TURNUVAYONETIM - Agent Response Test'));
  console.log(chalk.cyan('=' .repeat(60)));

  // Check Docker containers first
  const dockerReady = await checkDockerContainers();

  if (!dockerReady) {
    process.exit(1);
  }

  console.log(chalk.blue('\n📊 Container Status:'));
  console.log('  Architect:  http://localhost:7900 (VNC viewer)');
  console.log('  Backend:    http://localhost:7901 (VNC viewer)');
  console.log('  Frontend:   http://localhost:7902 (VNC viewer)');
  console.log('  DevOps:     http://localhost:7903 (VNC viewer)');

  console.log(chalk.yellow('\n💡 You can watch the agents work in real-time via VNC'));

  // Run the test
  await testAgents();
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n💥 Uncaught Exception:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('\n💥 Unhandled Rejection:'), reason);
  process.exit(1);
});

// Run the test
main().catch(error => {
  console.error(chalk.red('\n💥 Test failed:'), error.message);
  process.exit(1);
});