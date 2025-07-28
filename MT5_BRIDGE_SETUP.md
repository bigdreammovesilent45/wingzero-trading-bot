# MT5 Bridge Server Setup Guide

This guide will help you set up the Python-based MT5 Bridge Server for Wing Zero trading integration.

## 🎯 What This Does

The MT5 Bridge Server provides a reliable REST API interface between Wing Zero and MetaTrader 5, replacing the problematic EA approach with a robust Python solution.

## 📋 Prerequisites

1. **Python 3.8+** installed on your system
2. **MetaTrader 5 terminal** installed and running
3. **Active MT5 trading account** (demo or live)
4. **Wing Zero application** running

## 🚀 Quick Start

### Windows Users

1. **Download the files** to a folder (e.g., `C:\WingZero\MT5Bridge\`)

2. **Open Command Prompt** in that folder

3. **Run the startup script**:
   ```cmd
   start_mt5_bridge.bat
   ```

4. **The script will**:
   - Check if Python is installed
   - Install required packages automatically
   - Start the bridge server on `http://localhost:6542`

### Linux/Mac Users

1. **Download the files** to a folder

2. **Make the script executable**:
   ```bash
   chmod +x start_mt5_bridge.sh
   ```

3. **Run the startup script**:
   ```bash
   ./start_mt5_bridge.sh
   ```

## 🔧 Manual Installation

If you prefer manual setup:

1. **Install Python packages**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the server**:
   ```bash
   python mt5_bridge_server.py
   ```

## 🔗 Connecting Wing Zero

1. **Open Wing Zero** in your browser
2. **Go to Wing Zero Dashboard** → **Control Panel**
3. **In Platform Setup**, select **MetaTrader 5**
4. **Configure the connection**:
   - **RestAPI EA URL**: `http://localhost:6542`
   - **MT5 Login**: Your MT5 account number
   - **Password**: Your MT5 password
   - **Server**: Your broker's server name

5. **Click "Connect to Desktop MT5"**

## 📡 API Endpoints

The bridge server provides these endpoints:

- `GET /api/v1/status` - Server and MT5 connection status
- `POST /api/v1/connect` - Connect to MT5 with credentials
- `GET /api/v1/account` - Get account information
- `GET /api/v1/positions` - Get open positions
- `POST /api/v1/orders` - Place new orders
- `GET /api/v1/symbols` - Get available symbols
- `WebSocket /ws` - Real-time data streaming

## 🔧 Configuration

### Environment Variables (Optional)

You can set these environment variables for additional configuration:

```bash
# API Security (optional)
export WINGZERO_API_KEY="your-secure-api-key"

# Server Port (default: 6542)
export BRIDGE_PORT=6542

# CORS Origins (default: localhost:3000,localhost:5173)
export CORS_ORIGINS="http://localhost:3000,http://localhost:5173"
```

### MT5 Terminal Settings

Make sure your MT5 terminal has:

1. **Expert Advisors enabled**:
   - Tools → Options → Expert Advisors
   - ✅ Allow automated trading
   - ✅ Allow DLL imports

2. **Auto Trading enabled**:
   - Click the "Auto Trading" button in MT5 toolbar (should be green)

## 🚨 Troubleshooting

### "MetaTrader5 module not found"
```bash
pip install MetaTrader5==5.0.45
```

### "Failed to connect to MT5"
1. Ensure MT5 terminal is running
2. Check your login credentials
3. Verify server name is correct
4. Make sure auto trading is enabled

### "Connection refused on localhost:6542"
1. Check if the bridge server is running
2. Verify firewall isn't blocking port 6542
3. Try restarting the bridge server

### "Unauthorized" errors
- The bridge includes optional API key authentication
- Check the `require_auth` decorator in the code

## 🔐 Security Notes

For **production use**:

1. **Enable API authentication** by uncommenting the `@require_auth` decorators
2. **Use HTTPS** with proper SSL certificates
3. **Set strong API keys** in environment variables
4. **Restrict CORS origins** to your domain only
5. **Run behind a reverse proxy** (nginx/Apache)

## 🏗️ Architecture

```
Wing Zero App → HTTP/WebSocket → MT5 Bridge Server → MT5 Python API → MetaTrader 5
```

The bridge server:
- ✅ Handles authentication and connection management
- ✅ Provides RESTful API endpoints
- ✅ Streams real-time market data via WebSocket
- ✅ Manages orders and positions
- ✅ Includes error handling and logging

## 📈 Next Steps

Once connected:

1. **Test the connection** in Wing Zero
2. **Configure your trading strategies**
3. **Start with demo account** to test
4. **Monitor logs** for any issues
5. **Scale to live trading** when ready

## 🆘 Support

If you encounter issues:

1. Check the **console logs** in the terminal running the bridge
2. Verify **MT5 terminal** is responding
3. Test the **API endpoints** directly with curl/Postman
4. Review the **MT5 journal** for any errors

---

*This bridge server provides a professional-grade integration between Wing Zero and MetaTrader 5, replacing the unreliable EA approach with a robust Python solution.*