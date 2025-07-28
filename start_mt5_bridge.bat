@echo off
echo 🚀 Starting MT5 Bridge Server for Wing Zero
echo.
echo 📋 Prerequisites:
echo    ✓ Python 3.8+ installed
echo    ✓ MetaTrader 5 terminal running
echo    ✓ Required packages installed
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found! Please install Python 3.8+
    pause
    exit /b 1
)

REM Check if requirements are installed
echo 📦 Checking dependencies...
pip show MetaTrader5 >nul 2>&1
if %errorlevel% neq 0 (
    echo 📥 Installing required packages...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo ❌ Failed to install packages
        pause
        exit /b 1
    )
)

echo ✅ Dependencies ready
echo.
echo 🔄 Starting MT5 Bridge Server...
echo 📡 Server will be available at: http://localhost:6542
echo 🌐 Wing Zero can connect to this endpoint
echo.
echo 🛑 Press Ctrl+C to stop the server
echo.

python mt5_bridge_server.py

pause