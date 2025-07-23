# MT4 Bridge Setup Guide

## Option 1: Free MT4 WebAPI (Recommended)
**CPlugin WebAPI** - Professional solution with REST API and WebSocket support

### Installation Steps:
1. **Download MT4 WebAPI**
   - Visit: https://m2.mywebapi.com/
   - Download the MT4 WebAPI plugin
   - Install it in your MT4 terminal

2. **Configure the Bridge**
   - Default port: 8080
   - WebSocket endpoint: ws://localhost:8080/mt4/stream
   - REST API: http://localhost:8080/api/

3. **Install Expert Advisor**
   - Copy the EA file to: `MT4/MQL4/Experts/`
   - Attach the EA to any chart
   - Enable "Allow DLL imports" and "Allow live trading"

## Option 2: Algomojo Bridge (Alternative)
**Algomojo MT4 Bridge** - Commercial solution with video tutorials

### Installation Steps:
1. **Download from Algomojo**
   - Visit: https://docs.algomojo.com/docs/modules/metatrader/mt4-bridge
   - Follow their video tutorial
   - Install the bridge software

2. **Configure Connection**
   - Set server URL to: http://localhost:8080
   - Configure API endpoints for your app

## Configuration in Your App

After installing the bridge:

1. **Go to Settings page**
2. **Configure MT4 Connection:**
   - Server URL: `http://localhost:8080`
   - Account: Your MT4 account number
   - Server: `MetaQuotes-Demo`
3. **Test Connection**
4. **Start Wing Zero Trading Engine**

## Troubleshooting

### Common Issues:
- **Port 8080 in use**: Change to port 8081 or 8082
- **Firewall blocking**: Allow MT4 and bridge through Windows Firewall
- **MT4 not allowing DLL**: Enable "Allow DLL imports" in MT4 options
- **Expert Advisor not active**: Make sure EA is running on a chart

### Verification Steps:
1. Check if bridge is running: Open http://localhost:8080 in browser
2. Test API endpoint: http://localhost:8080/api/account/info
3. Verify WebSocket: ws://localhost:8080/mt4/stream

## Next Steps
1. Install one of the bridges above
2. Configure your MT4 terminal
3. Return to the app and test connection
4. Start trading with Wing Zero!