# Wing Zero x S.A.W Trading Platform

A comprehensive trading platform combining Wing Zero automated trading strategies with S.A.W (Smart Automated Withdrawal) system.

## Features

- **Wing Zero Trading Engine**: Advanced algorithmic trading with multiple strategies
- **S.A.W System**: Smart automated withdrawal based on profit thresholds
- **Real-time Market Data**: Live price feeds and market analysis
- **Risk Management**: Advanced risk controls and position management
- **Multi-Broker Support**: MetaTrader 4/5, Interactive Brokers, Alpaca, OANDA

## MetaTrader 4 Setup

This app is configured to work with MetaTrader 4. To connect your MT4 account:

### Prerequisites

1. **MT4 Terminal** with MetaQuotes-Demo server (or your broker's server)
2. **MT4 Bridge Server** - A local server that bridges HTTP/WebSocket to MT4
3. **Expert Advisor** installed in MT4 for API communication

### MT4 Bridge Server Setup

You'll need to run a bridge server locally to communicate with MT4:

```bash
# Example MT4 bridge server (you'll need to install separately)
# Popular options:
# - MT4 Web API by MetaQuotes
# - Custom EA with DLL
# - Third-party MT4 REST API solutions
```

### Configuration

1. **Update Broker Config** in the app settings:
   - Server URL: `http://localhost:8080` (your bridge server)
   - Account: Your MT4 account number
   - Server: `MetaQuotes-Demo`

2. **WebSocket Connection**: 
   - The app connects to `ws://localhost:8080/mt4/stream` for real-time updates

### API Endpoints

The app expects these endpoints from your MT4 bridge:

- `POST /api/connection/test` - Test MT4 connection
- `POST /api/account/info` - Get account information
- `POST /api/positions/open` - Get open positions
- `POST /api/orders/place` - Place new orders
- `POST /api/positions/close` - Close positions
- `POST /api/market/quotes` - Get market data
- `WebSocket /mt4/stream` - Real-time updates

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Mobile App

This app supports mobile deployment using Capacitor:

```bash
# Add mobile platforms
npx cap add ios
npx cap add android

# Sync and run
npx cap sync
npx cap run android  # or ios
```

## Important Notes

⚠️ **Demo Account**: Currently configured for MetaQuotes-Demo server
⚠️ **Bridge Required**: You need an MT4 bridge server running locally
⚠️ **Risk Warning**: This is trading software - use with caution

## Getting Started

1. Set up your MT4 bridge server
2. Configure your account details in Settings
3. Test the connection
4. Start trading with Wing Zero strategies
5. Enable S.A.W for automated withdrawals

For detailed setup instructions, see the in-app help section.

---

## Original Lovable Project

**URL**: https://lovable.dev/projects/5992328c-d50c-4eb0-9d47-716d492a119c

Built with Vite, TypeScript, React, shadcn-ui, and Tailwind CSS.