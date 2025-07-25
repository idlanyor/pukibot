#!/bin/bash

# Pterodactyl WhatsApp Bot Setup Script
# This script helps you set up the bot quickly

echo "🤖 Pterodactyl WhatsApp Bot Setup"
echo "================================="

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
else
    echo "✅ Bun is already installed"
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️ Creating .env file..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration"
else
    echo "✅ .env file already exists"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p sessions
mkdir -p logs

# Set permissions
chmod +x setup.sh
chmod 755 sessions
chmod 755 logs

echo ""
echo "✅ Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Configure your Pterodactyl panel URL and API key"
echo "3. Set your WhatsApp admin number"
echo "4. Run: bun start"
echo ""
echo "🚀 Happy botting!"