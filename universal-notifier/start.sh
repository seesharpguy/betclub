#!/bin/bash

# Universal Notifier - Quick Start Script

cd "$(dirname "$0")"

echo "🌍 Starting Universal Notification Service"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "   Please install Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if serviceAccountKey.json exists
if [ ! -f "serviceAccountKey.json" ]; then
    echo "❌ Error: serviceAccountKey.json not found!"
    echo ""
    echo "Please follow these steps:"
    echo "1. Go to Firebase Console: https://console.firebase.google.com"
    echo "2. Select your project → Settings → Service Accounts"
    echo "3. Click 'Generate New Private Key'"
    echo "4. Save the file as 'serviceAccountKey.json' in this directory"
    echo ""
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "💡 Web dashboard will be available (no additional config needed)"
    echo "   To enable other channels, edit .env file"
    echo ""
fi

# Stop existing container
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null

# Build and start
echo "🔨 Building Docker image..."
docker-compose build

echo "🚀 Starting service..."
docker-compose up -d

# Wait for service to start
sleep 3

# Check if running
if docker ps | grep -q betting-universal-notifier; then
    echo ""
    echo "✅ Service started successfully!"
    echo ""
    echo "🌐 Web Dashboard: http://localhost:${WEB_PORT:-3001}"
    echo ""
    echo "📋 Useful commands:"
    echo "   View logs:    docker-compose logs -f"
    echo "   Stop service: docker-compose down"
    echo "   Restart:      docker-compose restart"
    echo ""

    # Try to open browser
    if command -v open &> /dev/null; then
        echo "Opening web dashboard in browser..."
        sleep 2
        open "http://localhost:${WEB_PORT:-3001}"
    elif command -v xdg-open &> /dev/null; then
        echo "Opening web dashboard in browser..."
        sleep 2
        xdg-open "http://localhost:${WEB_PORT:-3001}"
    fi
else
    echo ""
    echo "❌ Failed to start service"
    echo "   Check logs: docker-compose logs"
fi
