#!/bin/bash

# Desktop Companion - Start Script

cd "$(dirname "$0")"

echo "🖥️  Betting Notifier - Desktop Companion"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📝 Creating .env from .env.example..."
        cp .env.example .env
        echo "✅ Created .env file"
        echo ""
    fi
fi

# Check if Docker service is running
NOTIFIER_URL="${NOTIFIER_URL:-http://localhost:3001}"
if ! curl -s "$NOTIFIER_URL" > /dev/null 2>&1; then
    echo "⚠️  Warning: Cannot reach notification service at $NOTIFIER_URL"
    echo ""
    echo "Please make sure the Docker service is running:"
    echo "  cd ../  # Go to universal-notifier directory"
    echo "  docker-compose up -d"
    echo ""
    echo "Starting anyway... will retry connection automatically"
    echo ""
fi

echo "🚀 Starting desktop companion..."
echo ""

npm start
