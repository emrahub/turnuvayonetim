#!/usr/bin/env node

/**
 * Status check script for Codex Agents
 * This script checks the status of all configured agents
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const chalk = require('chalk');
const ora = require('ora');

// Agent configurations
const AGENTS = [
  { id: 1, name: 'architect', port: 9001, role: 'System Architecture' },
  { id: 2, name: 'backend', port: 9002, role: 'Backend Development' },
  { id: 3, name: 'frontend', port: 9003, role: 'Frontend Development' },
  { id: 4, name: 'devops', port: 9004, role: 'DevOps & Infrastructure' }
];

// Check if agent is running
function checkAgent(agent) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: agent.port,
      path: '/health',
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ...agent,
          status: 'online',
          statusCode: res.statusCode,
          response: data
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        ...agent,
        status: 'offline',
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        ...agent,
        status: 'offline',
        error: 'Connection timeout'
      });
    });

    req.end();
  });
}

// Check profile status
function checkProfileStatus(agent) {
  const profilePath = path.join(__dirname, '..', 'profiles', agent.name);
  const browserDataPath = path.join(profilePath, 'browser-data');
  const logsPath = path.join(profilePath, 'logs');

  const status = {
    profileExists: fs.existsSync(profilePath),
    browserDataExists: fs.existsSync(browserDataPath),
    logsExists: fs.existsSync(logsPath)
  };

  if (status.logsExists) {
    const logFiles = fs.readdirSync(logsPath);
    status.logCount = logFiles.length;

    if (logFiles.length > 0) {
      const latestLog = logFiles
        .map(f => ({ name: f, time: fs.statSync(path.join(logsPath, f)).mtime }))
        .sort((a, b) => b.time - a.time)[0];
      status.latestLog = latestLog.name;
      status.lastActivity = latestLog.time;
    }
  }

  return status;
}

// Check environment variables
function checkEnvironmentVariables() {
  const results = [];

  AGENTS.forEach(agent => {
    const emailVar = `CODEX_${agent.id}_EMAIL`;
    const passwordVar = `CODEX_${agent.id}_PASSWORD`;

    results.push({
      agent: agent.name,
      email: {
        variable: emailVar,
        exists: !!process.env[emailVar],
        value: process.env[emailVar] ? '***' + process.env[emailVar].slice(-8) : 'Not set'
      },
      password: {
        variable: passwordVar,
        exists: !!process.env[passwordVar],
        value: process.env[passwordVar] ? '********' : 'Not set'
      }
    });
  });

  return results;
}

// Display status report
function displayStatus(results) {
  console.log(chalk.blue.bold('\n=== Codex Agent Status Report ===\n'));

  // Display agent connectivity status
  console.log(chalk.cyan.bold('Agent Connectivity:'));
  console.log(chalk.gray('─'.repeat(50)));

  results.agents.forEach(agent => {
    const statusIcon = agent.status === 'online' ? '🟢' : '🔴';
    const statusColor = agent.status === 'online' ? chalk.green : chalk.red;

    console.log(`${statusIcon} ${chalk.white.bold(agent.name.padEnd(12))} ${statusColor(agent.status.toUpperCase().padEnd(8))} Port: ${agent.port}`);

    if (agent.status === 'online') {
      console.log(chalk.gray(`   └─ Response: ${agent.statusCode} - ${agent.response || 'OK'}`));
    } else {
      console.log(chalk.gray(`   └─ Error: ${agent.error}`));
    }
  });

  // Display profile status
  console.log(chalk.cyan.bold('\nProfile Status:'));
  console.log(chalk.gray('─'.repeat(50)));

  results.profiles.forEach(profile => {
    const icons = {
      profile: profile.profileExists ? '✅' : '❌',
      browser: profile.browserDataExists ? '✅' : '❌',
      logs: profile.logsExists ? '✅' : '❌'
    };

    console.log(`${chalk.white.bold(profile.name.padEnd(12))} Profile: ${icons.profile}  Browser: ${icons.browser}  Logs: ${icons.logs}`);

    if (profile.lastActivity) {
      const timeAgo = getTimeAgo(profile.lastActivity);
      console.log(chalk.gray(`   └─ Last activity: ${timeAgo} (${profile.logCount} log files)`));
    }
  });

  // Display environment status
  console.log(chalk.cyan.bold('\nEnvironment Variables:'));
  console.log(chalk.gray('─'.repeat(50)));

  results.environment.forEach(env => {
    const emailIcon = env.email.exists ? '✅' : '❌';
    const passwordIcon = env.password.exists ? '✅' : '❌';

    console.log(`${chalk.white.bold(env.agent.padEnd(12))} Email: ${emailIcon} ${env.email.value.padEnd(20)} Password: ${passwordIcon}`);
  });

  // Display summary
  console.log(chalk.cyan.bold('\nSummary:'));
  console.log(chalk.gray('─'.repeat(50)));

  const onlineCount = results.agents.filter(a => a.status === 'online').length;
  const totalAgents = results.agents.length;
  const profileCount = results.profiles.filter(p => p.profileExists).length;
  const envComplete = results.environment.every(e => e.email.exists && e.password.exists);

  console.log(`Agents Online:     ${onlineCount}/${totalAgents} ${getStatusEmoji(onlineCount, totalAgents)}`);
  console.log(`Profiles Ready:    ${profileCount}/${totalAgents} ${getStatusEmoji(profileCount, totalAgents)}`);
  console.log(`Environment:       ${envComplete ? 'Complete ✅' : 'Incomplete ❌'}`);

  // Recommendations
  if (onlineCount < totalAgents || profileCount < totalAgents || !envComplete) {
    console.log(chalk.yellow.bold('\nRecommendations:'));

    if (profileCount < totalAgents) {
      console.log(chalk.yellow('  • Run "npm run setup:agents" to create missing profiles'));
    }

    if (!envComplete) {
      console.log(chalk.yellow('  • Set missing environment variables in .env.local'));
    }

    if (onlineCount < totalAgents) {
      console.log(chalk.yellow('  • Run "npm run agents:start" to start offline agents'));
    }
  } else {
    console.log(chalk.green.bold('\n✅ All systems operational!'));
  }
}

// Helper function to get time ago string
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

// Helper function to get status emoji
function getStatusEmoji(current, total) {
  const percentage = current / total;
  if (percentage === 1) return '🟢';
  if (percentage >= 0.75) return '🟡';
  if (percentage >= 0.5) return '🟠';
  return '🔴';
}

// Main status check function
async function checkStatus() {
  // Load environment variables
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

  const spinner = ora('Checking agent status...').start();

  try {
    // Check all agents
    const agentPromises = AGENTS.map(agent => checkAgent(agent));
    const agents = await Promise.all(agentPromises);

    // Check profiles
    const profiles = AGENTS.map(agent => ({
      name: agent.name,
      ...checkProfileStatus(agent)
    }));

    // Check environment
    const environment = checkEnvironmentVariables();

    spinner.stop();

    // Display results
    displayStatus({
      agents,
      profiles,
      environment
    });

  } catch (error) {
    spinner.fail('Status check failed');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Status check failed:'), error);
  process.exit(1);
});

// Run status check
checkStatus().catch(error => {
  console.error(chalk.red('Status check failed:'), error);
  process.exit(1);
});