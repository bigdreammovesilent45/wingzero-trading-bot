#!/usr/bin/env python3
"""
MT5 Bridge Server
A Python-based REST API bridge for MetaTrader 5 integration with Wing Zero
"""

import MetaTrader5 as mt5
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import threading
import time
import json
import logging
from datetime import datetime, timedelta
import hmac
import hashlib
import base64
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = 'wingzero-mt5-bridge-2024'
CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])
socketio = SocketIO(app, cors_allowed_origins=["http://localhost:3000", "http://localhost:5173"])

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MT5Bridge:
    def __init__(self):
        self.connected = False
        self.account_info = None
        self.symbols = []
        self.market_data = {}
        self.positions = []
        self.orders = []
        self.data_thread = None
        self.running = False
        
    def connect(self, login=None, password=None, server=None):
        """Connect to MT5 terminal"""
        try:
            if not mt5.initialize():
                logger.error("MT5 initialization failed")
                return False
                
            # If credentials provided, try to login
            if login and password and server:
                if not mt5.login(login=int(login), password=password, server=server):
                    logger.error(f"Failed to login to account {login}")
                    return False
                    
            # Get account info
            account_info = mt5.account_info()
            if account_info is None:
                logger.error("Failed to get account info")
                return False
                
            self.account_info = account_info._asdict()
            self.connected = True
            
            # Get available symbols
            symbols = mt5.symbols_get()
            if symbols:
                self.symbols = [symbol.name for symbol in symbols[:50]]  # Limit to 50 symbols
            
            logger.info(f"Connected to MT5 account {self.account_info['login']}")
            return True
            
        except Exception as e:
            logger.error(f"Connection error: {str(e)}")
            return False
    
    def disconnect(self):
        """Disconnect from MT5"""
        self.running = False
        if self.data_thread:
            self.data_thread.join()
        mt5.shutdown()
        self.connected = False
        logger.info("Disconnected from MT5")
    
    def get_account_info(self):
        """Get current account information"""
        if not self.connected:
            return None
            
        try:
            account_info = mt5.account_info()
            if account_info:
                self.account_info = account_info._asdict()
                return self.account_info
        except Exception as e:
            logger.error(f"Error getting account info: {str(e)}")
        return None
    
    def get_positions(self):
        """Get open positions"""
        if not self.connected:
            return []
            
        try:
            positions = mt5.positions_get()
            if positions:
                self.positions = [pos._asdict() for pos in positions]
                return self.positions
        except Exception as e:
            logger.error(f"Error getting positions: {str(e)}")
        return []
    
    def get_orders(self):
        """Get pending orders"""
        if not self.connected:
            return []
            
        try:
            orders = mt5.orders_get()
            if orders:
                self.orders = [order._asdict() for order in orders]
                return self.orders
        except Exception as e:
            logger.error(f"Error getting orders: {str(e)}")
        return []
    
    def place_order(self, symbol, order_type, volume, price=None, sl=None, tp=None, comment="WingZero"):
        """Place a new order"""
        if not self.connected:
            return {"error": "Not connected to MT5"}
            
        try:
            # Get symbol info
            symbol_info = mt5.symbol_info(symbol)
            if symbol_info is None:
                return {"error": f"Symbol {symbol} not found"}
            
            # Get current price if not provided
            if price is None:
                tick = mt5.symbol_info_tick(symbol)
                if tick is None:
                    return {"error": f"Failed to get price for {symbol}"}
                price = tick.ask if order_type == mt5.ORDER_TYPE_BUY else tick.bid
            
            # Prepare request
            request = {
                "action": mt5.TRADE_ACTION_DEAL,
                "symbol": symbol,
                "volume": volume,
                "type": order_type,
                "price": price,
                "sl": sl,
                "tp": tp,
                "comment": comment,
                "type_time": mt5.ORDER_TIME_GTC,
                "type_filling": mt5.ORDER_FILLING_IOC,
            }
            
            # Send order
            result = mt5.order_send(request)
            if result.retcode != mt5.TRADE_RETCODE_DONE:
                return {"error": f"Order failed: {result.comment}"}
                
            return {
                "success": True,
                "order_id": result.order,
                "retcode": result.retcode,
                "comment": result.comment
            }
            
        except Exception as e:
            logger.error(f"Error placing order: {str(e)}")
            return {"error": str(e)}
    
    def close_position(self, ticket):
        """Close a position by ticket"""
        if not self.connected:
            return {"error": "Not connected to MT5"}
            
        try:
            # Get position info
            position = mt5.positions_get(ticket=ticket)
            if not position:
                return {"error": f"Position {ticket} not found"}
                
            position = position[0]
            
            # Determine close order type
            close_type = mt5.ORDER_TYPE_SELL if position.type == mt5.POSITION_TYPE_BUY else mt5.ORDER_TYPE_BUY
            
            # Get current price
            tick = mt5.symbol_info_tick(position.symbol)
            if tick is None:
                return {"error": f"Failed to get price for {position.symbol}"}
                
            price = tick.bid if close_type == mt5.ORDER_TYPE_SELL else tick.ask
            
            # Prepare close request
            request = {
                "action": mt5.TRADE_ACTION_DEAL,
                "symbol": position.symbol,
                "volume": position.volume,
                "type": close_type,
                "position": ticket,
                "price": price,
                "comment": "WingZero Close",
                "type_time": mt5.ORDER_TIME_GTC,
                "type_filling": mt5.ORDER_FILLING_IOC,
            }
            
            # Send close order
            result = mt5.order_send(request)
            if result.retcode != mt5.TRADE_RETCODE_DONE:
                return {"error": f"Close failed: {result.comment}"}
                
            return {
                "success": True,
                "order_id": result.order,
                "retcode": result.retcode
            }
            
        except Exception as e:
            logger.error(f"Error closing position: {str(e)}")
            return {"error": str(e)}
    
    def get_market_data(self, symbol):
        """Get current market data for symbol"""
        if not self.connected:
            return None
            
        try:
            tick = mt5.symbol_info_tick(symbol)
            if tick:
                return {
                    "symbol": symbol,
                    "bid": tick.bid,
                    "ask": tick.ask,
                    "spread": tick.ask - tick.bid,
                    "timestamp": tick.time * 1000,  # Convert to milliseconds
                    "volume": tick.volume_real
                }
        except Exception as e:
            logger.error(f"Error getting market data for {symbol}: {str(e)}")
        return None
    
    def start_data_stream(self):
        """Start real-time data streaming"""
        if self.running:
            return
            
        self.running = True
        self.data_thread = threading.Thread(target=self._data_stream_worker)
        self.data_thread.start()
        logger.info("Started data stream")
    
    def _data_stream_worker(self):
        """Worker thread for real-time data streaming"""
        major_pairs = ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD"]
        
        while self.running and self.connected:
            try:
                # Update market data
                for symbol in major_pairs:
                    data = self.get_market_data(symbol)
                    if data:
                        self.market_data[symbol] = data
                        # Emit to WebSocket clients
                        socketio.emit('market_data', data)
                
                # Update positions and account info periodically
                if int(time.time()) % 5 == 0:  # Every 5 seconds
                    positions = self.get_positions()
                    account = self.get_account_info()
                    
                    socketio.emit('positions_update', positions)
                    socketio.emit('account_update', account)
                
                time.sleep(1)  # Update every second
                
            except Exception as e:
                logger.error(f"Data stream error: {str(e)}")
                time.sleep(5)

# Global bridge instance
mt5_bridge = MT5Bridge()

# Authentication decorator (optional)
def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Simple API key authentication (implement HMAC for production)
        api_key = request.headers.get('X-API-Key')
        if not api_key or api_key != 'wingzero-api-key':
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function

# REST API Endpoints

@app.route('/api/v1/status', methods=['GET'])
def get_status():
    """Get bridge server status"""
    return jsonify({
        "status": "running",
        "mt5_connected": mt5_bridge.connected,
        "account": mt5_bridge.account_info['login'] if mt5_bridge.account_info else None,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/v1/connect', methods=['POST'])
def connect_mt5():
    """Connect to MT5 terminal"""
    data = request.get_json()
    login = data.get('login')
    password = data.get('password') 
    server = data.get('server')
    
    success = mt5_bridge.connect(login, password, server)
    
    if success:
        # Start data streaming
        mt5_bridge.start_data_stream()
        return jsonify({"success": True, "message": "Connected to MT5"})
    else:
        return jsonify({"error": "Failed to connect to MT5"}), 500

@app.route('/api/v1/disconnect', methods=['POST'])
def disconnect_mt5():
    """Disconnect from MT5"""
    mt5_bridge.disconnect()
    return jsonify({"success": True, "message": "Disconnected from MT5"})

@app.route('/api/v1/account', methods=['GET'])
def get_account():
    """Get account information"""
    if not mt5_bridge.connected:
        return jsonify({"error": "Not connected to MT5"}), 400
        
    account = mt5_bridge.get_account_info()
    if account:
        return jsonify(account)
    else:
        return jsonify({"error": "Failed to get account info"}), 500

@app.route('/api/v1/positions', methods=['GET'])
def get_positions():
    """Get open positions"""
    if not mt5_bridge.connected:
        return jsonify({"error": "Not connected to MT5"}), 400
        
    positions = mt5_bridge.get_positions()
    return jsonify(positions)

@app.route('/api/v1/orders', methods=['GET'])
def get_orders():
    """Get pending orders"""
    if not mt5_bridge.connected:
        return jsonify({"error": "Not connected to MT5"}), 400
        
    orders = mt5_bridge.get_orders()
    return jsonify(orders)

@app.route('/api/v1/orders', methods=['POST'])
def place_order():
    """Place a new order"""
    if not mt5_bridge.connected:
        return jsonify({"error": "Not connected to MT5"}), 400
        
    data = request.get_json()
    symbol = data.get('symbol')
    order_type = data.get('type', 'buy')
    volume = data.get('volume', 0.01)
    price = data.get('price')
    sl = data.get('stop_loss')
    tp = data.get('take_profit')
    comment = data.get('comment', 'WingZero')
    
    # Convert order type
    mt5_order_type = mt5.ORDER_TYPE_BUY if order_type.lower() == 'buy' else mt5.ORDER_TYPE_SELL
    
    result = mt5_bridge.place_order(symbol, mt5_order_type, volume, price, sl, tp, comment)
    
    if "error" in result:
        return jsonify(result), 400
    else:
        return jsonify(result)

@app.route('/api/v1/positions/<int:ticket>/close', methods=['POST'])
def close_position(ticket):
    """Close a position"""
    if not mt5_bridge.connected:
        return jsonify({"error": "Not connected to MT5"}), 400
        
    result = mt5_bridge.close_position(ticket)
    
    if "error" in result:
        return jsonify(result), 400
    else:
        return jsonify(result)

@app.route('/api/v1/symbols', methods=['GET'])
def get_symbols():
    """Get available symbols"""
    if not mt5_bridge.connected:
        return jsonify({"error": "Not connected to MT5"}), 400
        
    return jsonify(mt5_bridge.symbols)

@app.route('/api/v1/market/<symbol>', methods=['GET'])
def get_market_data(symbol):
    """Get market data for symbol"""
    if not mt5_bridge.connected:
        return jsonify({"error": "Not connected to MT5"}), 400
        
    data = mt5_bridge.get_market_data(symbol)
    if data:
        return jsonify(data)
    else:
        return jsonify({"error": f"Failed to get data for {symbol}"}), 404

# WebSocket Events
@socketio.on('connect')
def handle_connect():
    logger.info('Client connected to WebSocket')
    emit('connected', {'status': 'Connected to MT5 Bridge'})

@socketio.on('disconnect')
def handle_disconnect():
    logger.info('Client disconnected from WebSocket')

@socketio.on('subscribe')
def handle_subscribe(data):
    symbol = data.get('symbol')
    logger.info(f'Client subscribed to {symbol}')
    
    # Send current data if available
    if symbol in mt5_bridge.market_data:
        emit('market_data', mt5_bridge.market_data[symbol])

if __name__ == '__main__':
    print("🚀 Starting MT5 Bridge Server...")
    print("📊 This will provide a REST API interface to MetaTrader 5")
    print("🔗 Wing Zero will connect to: http://localhost:6542")
    print("📡 WebSocket available at: ws://localhost:6542")
    print("\n⚡ Starting server...")
    
    # Run the server
    socketio.run(app, host='0.0.0.0', port=6542, debug=False)