@echo off
echo 🤖 Pterodactyl WhatsApp Bot Setup (Windows)
echo ==========================================

REM Check if Bun is installed
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Bun is not installed. Please install Bun first:
    echo https://bun.sh/
    echo.
    echo Or use Node.js as fallback:
    echo npm install
    pause
    exit /b 1
) else (
    echo ✅ Bun is already installed
)

REM Install dependencies
echo 📦 Installing dependencies...
bun install

REM Create environment file if it doesn't exist
if not exist .env (
    echo ⚙️ Creating .env file...
    copy .env.example .env
    echo 📝 Please edit .env file with your configuration
) else (
    echo ✅ .env file already exists
)

REM Create necessary directories
echo 📁 Creating directories...
if not exist sessions mkdir sessions
if not exist logs mkdir logs

echo.
echo ✅ Setup completed!
echo.
echo 📋 Next steps:
echo 1. Edit .env file with your configuration
echo 2. Configure your Pterodactyl panel URL and API key
echo 3. Set your WhatsApp admin number
echo 4. Run: bun start
echo.
echo 🚀 Happy botting!
pause