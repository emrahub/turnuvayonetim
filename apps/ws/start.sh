#!/bin/bash

echo "🔌 Starting TURNUVAYONETIM WebSocket Server..."
echo "==========================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "📋 Please copy .env.example to .env and configure your settings"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build if dist doesn't exist
if [ ! -d "dist" ]; then
    echo "🔨 Building TypeScript..."
    npm run build
fi

echo "🚀 Starting WebSocket server..."
npm run dev