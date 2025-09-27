#!/bin/bash

echo "===================================="
echo " TURNUVAYONETIM Setup - Unix/Linux"
echo "===================================="
echo

echo "Installing dependencies..."
npm install

echo
echo "Setting up database..."
docker-compose up -d postgres redis

echo
echo "Waiting for services to start..."
sleep 10

echo
echo "Building packages..."
npm run build

echo
echo "Setup complete!"
echo
echo "Next steps:"
echo "1. Configure your Codex credentials: npm run setup"
echo "2. Start agents: npm run agents:start"
echo "3. Build project: npm run orchestrate:build"
echo