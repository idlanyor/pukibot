#!/bin/bash

echo "🔧 Testing Pterodactyl WhatsApp Bot with Enhanced Timeout Handling"
echo "================================================================="

# Check if required environment variables are set
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating sample .env file..."
    cat > .env << 'EOF'
# Bot Configuration
BOT_NAME="Pterodactyl Store Bot"
BOT_PREFIX="!"

# Owner Configuration
OWNER_NUMBER="62812345678"
STORE_ADMIN="62812345678"

# Store Configuration
STORE_NAME="Pterodactyl Store"
STORE_CURRENCY="IDR"

# Pterodactyl API Configuration
PTERODACTYL_URL="https://panel.example.com"
PTERODACTYL_API_KEY="ptlc_your_api_key_here"

# Logging
LOG_LEVEL="info"
EOF
    echo "✅ Sample .env file created. Please edit it with your actual values."
    echo "📝 Edit .env file and run this script again."
    exit 1
fi

echo "✅ Environment file found"

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first."
    echo "🔗 Visit: https://bun.sh/docs/installation"
    exit 1
fi

echo "✅ Bun is installed: $(bun --version)"

# Install dependencies
echo "📦 Installing dependencies..."
bun install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Check TypeScript compilation
echo "🔍 Checking TypeScript compilation..."
bun run build

if [ $? -ne 0 ]; then
    echo "❌ TypeScript compilation failed"
    exit 1
fi

echo "✅ TypeScript compilation successful"

# Create sessions directory if it doesn't exist
if [ ! -d "sessions" ]; then
    mkdir sessions
    echo "✅ Sessions directory created"
fi

echo ""
echo "🚀 Starting bot with enhanced timeout handling..."
echo "📱 Make sure to scan the QR code when it appears"
echo "🛑 Press Ctrl+C to stop the bot"
echo ""

# Start the bot
bun run start