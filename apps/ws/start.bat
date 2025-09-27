@echo off
echo.
echo 🔌 Starting TURNUVAYONETIM WebSocket Server...
echo ===========================================

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  Warning: .env file not found!
    echo 📋 Please copy .env.example to .env and configure your settings
    echo.
    set /p "continue=Continue anyway? (y/N): "
    if /i not "%continue%"=="y" (
        exit /b 1
    )
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Build if dist doesn't exist
if not exist "dist" (
    echo 🔨 Building TypeScript...
    npm run build
)

echo 🚀 Starting WebSocket server...
npm run dev