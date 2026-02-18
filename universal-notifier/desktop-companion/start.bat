@echo off
REM Desktop Companion - Start Script for Windows

cd /d "%~dp0"

echo 🖥️  Betting Notifier - Desktop Companion
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    echo.
)

REM Check if .env exists
if not exist ".env" (
    if exist ".env.example" (
        echo 📝 Creating .env from .env.example...
        copy ".env.example" ".env"
        echo ✅ Created .env file
        echo.
    )
)

echo 🚀 Starting desktop companion...
echo.

call npm start
