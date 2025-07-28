#!/bin/bash

echo "🚀 Starting MT5 Bridge Server for Wing Zero"
echo ""
echo "📋 Prerequisites:"
echo "   ✓ Python 3.8+ installed"
echo "   ✓ MetaTrader 5 terminal running (Windows/Wine)"
echo "   ✓ Required packages installed"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found! Please install Python 3.8+"
    exit 1
fi

# Check if requirements are installed
echo "📦 Checking dependencies..."
if ! python3 -c "import MetaTrader5" &> /dev/null; then
    echo "📥 Installing required packages..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install packages"
        exit 1
    fi
fi

echo "✅ Dependencies ready"
echo ""
echo "🔄 Starting MT5 Bridge Server..."
echo "📡 Server will be available at: http://localhost:6542"
echo "🌐 Wing Zero can connect to this endpoint"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo ""

python3 mt5_bridge_server.py