@echo off
title TURNUVAYONETIM Setup
color 0A

echo.
echo ====================================
echo  TURNUVAYONETIM Setup - Windows
echo ====================================
echo.

echo Installing dependencies...
call npm install

echo.
echo Setting up database...
docker-compose up -d postgres redis

echo.
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

echo.
echo Building packages...
call npm run build

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Configure your Codex credentials: npm run setup
echo 2. Start agents: npm run agents:start
echo 3. Build project: npm run orchestrate:build
echo.
pause