//+------------------------------------------------------------------+
//| WingZero_RestAPI_Fixed.mq5 |
//| Copyright 2024, WingZero Trading |
//| https://wingzero.ai |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, WingZero Trading"
#property link "https://wingzero.ai"
#property version "1.00"

#include <Trade\Trade.mqh>
#include <Object.mqh>

// Input parameters
input string ServerURL = "http://localhost:6542";
input int ServerPort = 6542;
input string AuthToken = "wingzero_2024_api_key";
input bool EnableTrading = true;
input double MaxRiskPercent = 2.0;

// Global variables
CTrade trade;
datetime lastPing = 0;
int pingInterval = 30; // seconds

//+------------------------------------------------------------------+
//| Simple JSON-like response builder |
//+------------------------------------------------------------------+
class SimpleJSON
{
private:
   string m_data;
   
public:
   SimpleJSON() { m_data = "{"; }
   
   void AddString(string key, string value)
   {
      if(StringLen(m_data) > 1) m_data += ",";
      m_data += "\"" + key + "\":\"" + value + "\"";
   }
   
   void AddDouble(string key, double value)
   {
      if(StringLen(m_data) > 1) m_data += ",";
      m_data += "\"" + key + "\":" + DoubleToString(value, 2);
   }
   
   void AddLong(string key, long value)
   {
      if(StringLen(m_data) > 1) m_data += ",";
      m_data += "\"" + key + "\":" + IntegerToString(value);
   }
   
   void AddBool(string key, bool value)
   {
      if(StringLen(m_data) > 1) m_data += ",";
      m_data += "\"" + key + "\":" + (value ? "true" : "false");
   }
   
   string ToString()
   {
      return m_data + "}";
   }
};

//+------------------------------------------------------------------+
//| Expert initialization function |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("WingZero RestAPI EA - Initializing...");
   
   // Initialize trading
   trade.SetExpertMagicNumber(12345);
   trade.SetDeviationInPoints(10);
   
   Print("WingZero RestAPI EA - Initialized successfully");
   Print("Note: Full web server functionality requires additional MT5 libraries");
   
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("WingZero RestAPI EA - Deinitialized");
}

//+------------------------------------------------------------------+
//| Expert tick function |
//+------------------------------------------------------------------+
void OnTick()
{
   // Send ping every 30 seconds
   if(TimeCurrent() - lastPing > pingInterval)
   {
      SendPing();
      lastPing = TimeCurrent();
   }
   
   // Process any pending requests (placeholder for actual implementation)
   ProcessPendingRequests();
}

//+------------------------------------------------------------------+
//| Process pending requests (placeholder) |
//+------------------------------------------------------------------+
void ProcessPendingRequests()
{
   // This would handle incoming HTTP requests
   // Implementation depends on available MT5 networking libraries
}

//+------------------------------------------------------------------+
//| Get account information |
//+------------------------------------------------------------------+
string GetAccountInfo()
{
   SimpleJSON json;
   
   json.AddDouble("balance", AccountInfoDouble(ACCOUNT_BALANCE));
   json.AddDouble("equity", AccountInfoDouble(ACCOUNT_EQUITY));
   json.AddDouble("profit", AccountInfoDouble(ACCOUNT_PROFIT));
   json.AddDouble("margin", AccountInfoDouble(ACCOUNT_MARGIN));
   json.AddDouble("free_margin", AccountInfoDouble(ACCOUNT_MARGIN_FREE));
   json.AddDouble("margin_level", AccountInfoDouble(ACCOUNT_MARGIN_LEVEL));
   json.AddString("currency", AccountInfoString(ACCOUNT_CURRENCY));
   json.AddLong("leverage", AccountInfoInteger(ACCOUNT_LEVERAGE));
   json.AddString("timestamp", TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS));
   
   return CreateDataResponse(json.ToString());
}

//+------------------------------------------------------------------+
//| Get open positions |
//+------------------------------------------------------------------+
string GetPositions()
{
   string positions = "[";
   
   for(int i = 0; i < PositionsTotal(); i++)
   {
     
      {
         if(i > 0) positions += ",";
         
         SimpleJSON pos;
         pos.AddLong("ticket", PositionGetInteger(POSITION_TICKET));
         pos.AddString("symbol", PositionGetString(POSITION_SYMBOL));
         pos.AddString("type", PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? "buy" : "sell");
         pos.AddDouble("volume", PositionGetDouble(POSITION_VOLUME));
         pos.AddDouble("price_open", PositionGetDouble(POSITION_PRICE_OPEN));
         pos.AddDouble("price_current", PositionGetDouble(POSITION_PRICE_CURRENT));
         pos.AddDouble("profit", PositionGetDouble(POSITION_PROFIT));
         pos.AddDouble("swap", PositionGetDouble(POSITION_SWAP));
         pos.AddString("time", TimeToString((datetime)PositionGetInteger(POSITION_TIME), TIME_DATE|TIME_SECONDS));
         
         positions += pos.ToString();
      }
   }
   
   positions += "]";
   
   SimpleJSON json;
   json.AddString("positions", positions);
   json.AddLong("count", PositionsTotal());
   
   return CreateDataResponse(json.ToString());
}

//+------------------------------------------------------------------+
//| Place order |
//+------------------------------------------------------------------+
string PlaceOrder(string symbol, string type, double volume, double stopLoss, double takeProfit)
{
   if(!EnableTrading)
      return CreateErrorResponse("Trading is disabled");
   
   if(symbol == "" || volume <= 0)
      return CreateErrorResponse("Invalid order parameters");
   
   // Execute trade
   bool result = false;
   if(type == "buy")
      result = trade.Buy(volume, symbol, 0, stopLoss, takeProfit);
   else if(type == "sell")
      result = trade.Sell(volume, symbol, 0, stopLoss, takeProfit);
   else
      return CreateErrorResponse("Invalid order type");
   
   if(result)
   {
      SimpleJSON response;
      response.AddLong("ticket", trade.ResultOrder());
      response.AddString("symbol", symbol);
      response.AddString("type", type);
      response.AddDouble("volume", volume);
      response.AddString("status", "executed");
      
      return CreateDataResponse(response.ToString());
   }
   else
   {
      return CreateErrorResponse("Failed to place order: " + IntegerToString(trade.ResultRetcode()));
   }
}

//+------------------------------------------------------------------+
//| Close order |
//+------------------------------------------------------------------+
string CloseOrder(ulong ticket)
{
   if(ticket <= 0)
      return CreateErrorResponse("Invalid ticket number");
   
   bool result = trade.PositionClose(ticket);
   
   if(result)
   {
      SimpleJSON response;
      response.AddLong("ticket", ticket);
      response.AddString("status", "closed");
      
      return CreateDataResponse(response.ToString());
   }
   else
   {
      return CreateErrorResponse("Failed to close position: " + IntegerToString(trade.ResultRetcode()));
   }
}

//+------------------------------------------------------------------+
//| Send ping to keep connection alive |
//+------------------------------------------------------------------+
void SendPing()
{
   Print("Ping sent at ", TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS));
}

//+------------------------------------------------------------------+
//| Create success response |
//+------------------------------------------------------------------+
string CreateSuccessResponse(string message)
{
   SimpleJSON json;
   json.AddBool("success", true);
   json.AddString("message", message);
   json.AddString("timestamp", TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS));
   
   return json.ToString();
}

//+------------------------------------------------------------------+
//| Create data response |
//+------------------------------------------------------------------+
string CreateDataResponse(string data)
{
   string response = "{\"success\":true,\"data\":" + data + ",\"timestamp\":\"" + 
                    TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\"}";
   return response;
}

//+------------------------------------------------------------------+
//| Create error response |
//+------------------------------------------------------------------+
string CreateErrorResponse(string error)
{
   SimpleJSON json;
   json.AddBool("success", false);
   json.AddString("error", error);
   json.AddString("timestamp", TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS));
   
   return json.ToString();
}

//+------------------------------------------------------------------+
//| Public function to get account info (for external calls) |
//+------------------------------------------------------------------+
string GetAccountInfoPublic()
{
   return GetAccountInfo();
}

//+------------------------------------------------------------------+
//| Public function to get positions (for external calls) |
//+------------------------------------------------------------------+
string GetPositionsPublic()
{
   return GetPositions();
}

//+------------------------------------------------------------------+
//| Public function to place order (for external calls) |
//+------------------------------------------------------------------+
string PlaceOrderPublic(string symbol, string type, double volume, double stopLoss = 0, double takeProfit = 0)
{
   return PlaceOrder(symbol, type, volume, stopLoss, takeProfit);
}

//+------------------------------------------------------------------+
//| Public function to close order (for external calls) |
//+------------------------------------------------------------------+
string CloseOrderPublic(ulong ticket)
{
   return CloseOrder(ticket);
}      if(StringLen(m_data) > 1) m_data += ",";
      m_data += "\"" + key + "\":\"" + value + "\"";
   }
   
   void AddDouble(const string key, const double value)
   {
      if(StringLen(m_data) > 1) m_data += ",";
      m_data += "\"" + key + "\":" + DoubleToString(value, 2);
   }
   
   void AddLong(const string key, const long value)
   {
      if(StringLen(m_data) > 1) m_data += ",";
      m_data += "\"" + key + "\":" + IntegerToString(value);
   }
   
   void AddBool(const string key, const bool value)
   {
      if(StringLen(m_data) > 1) m_data += ",";
      m_data += "\"" + key + "\":" + (value ? "true" : "false");
   }
   
   string ToString() const
   {
      return m_data + "}";
   }
};

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("WingZero RestAPI EA - Initializing...");
   
   // Initialize trading
   trade.SetExpertMagicNumber(12345);
   trade.SetDeviationInPoints(10);
   
   Print("WingZero RestAPI EA - Initialized successfully");
   Print("Server URL: ", ServerURL, ":", IntegerToString(ServerPort));
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("WingZero RestAPI EA - Deinitialized. Reason: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Send ping every 30 seconds
   if(TimeCurrent() - lastPing > pingInterval)
   {
      SendPing();
      lastPing = TimeCurrent();
   }
   
   // Process any pending requests (placeholder for actual implementation)
   ProcessPendingRequests();
}

//+------------------------------------------------------------------+
//| Process pending requests (placeholder)                          |
//+------------------------------------------------------------------+
void ProcessPendingRequests()
{
   // This would handle incoming HTTP requests
   // Implementation depends on available MT5 networking libraries
}

//+------------------------------------------------------------------+
//| Get account information                                          |
//+------------------------------------------------------------------+
string GetAccountInfo()
{
   SimpleJSON json;
   
   json.AddDouble("balance", AccountInfoDouble(ACCOUNT_BALANCE));
   json.AddDouble("equity", AccountInfoDouble(ACCOUNT_EQUITY));
   json.AddDouble("profit", AccountInfoDouble(ACCOUNT_PROFIT));
   json.AddDouble("margin", AccountInfoDouble(ACCOUNT_MARGIN));
   json.AddDouble("free_margin", AccountInfoDouble(ACCOUNT_FREEMARGIN));
   json.AddDouble("margin_level", AccountInfoDouble(ACCOUNT_MARGIN_LEVEL));
   json.AddString("currency", AccountInfoString(ACCOUNT_CURRENCY));
   json.AddLong("leverage", AccountInfoInteger(ACCOUNT_LEVERAGE));
   json.AddString("timestamp", TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS));
   
   return CreateDataResponse(json.ToString());
}

//+------------------------------------------------------------------+
//| Get open positions                                               |
//+------------------------------------------------------------------+
string GetPositions()
{
   string positions = "[";
   int totalPositions = PositionsTotal();
   
   for(int i = 0; i < totalPositions; i++)
   {
      if(PositionSelectByIndex(i))
      {
         if(i > 0) positions += ",";
         
         SimpleJSON pos;
         pos.AddLong("ticket", PositionGetInteger(POSITION_TICKET));
         pos.AddString("symbol", PositionGetString(POSITION_SYMBOL));
         pos.AddString("type", PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? "buy" : "sell");
         pos.AddDouble("volume", PositionGetDouble(POSITION_VOLUME));
         pos.AddDouble("price_open", PositionGetDouble(POSITION_PRICE_OPEN));
         pos.AddDouble("price_current", PositionGetDouble(POSITION_PRICE_CURRENT));
         pos.AddDouble("profit", PositionGetDouble(POSITION_PROFIT));
         pos.AddDouble("swap", PositionGetDouble(POSITION_SWAP));
         pos.AddDouble("commission", PositionGetDouble(POSITION_COMMISSION));
         pos.AddString("time", TimeToString((datetime)PositionGetInteger(POSITION_TIME), TIME_DATE|TIME_SECONDS));
         
         positions += pos.ToString();
      }
   }
   
   positions += "]";
   return CreateDataResponse(positions);
}

//+------------------------------------------------------------------+
//| Place order                                                      |
//+------------------------------------------------------------------+
string PlaceOrder(const string symbol, const string type, const double volume, const double stopLoss = 0, const double takeProfit = 0)
{
   if(!EnableTrading)
      return CreateErrorResponse("Trading is disabled");
   
   if(symbol == "" || volume <= 0)
      return CreateErrorResponse("Invalid order parameters");
   
   // Execute trade
   bool result = false;
   if(type == "buy")
      result = trade.Buy(volume, symbol, 0, stopLoss, takeProfit);
   else if(type == "sell")
      result = trade.Sell(volume, symbol, 0, stopLoss, takeProfit);
   else
      return CreateErrorResponse("Invalid order type");
   
   if(result)
   {
      SimpleJSON response;
      response.AddLong("ticket", trade.ResultOrder());
      response.AddString("symbol", symbol);
      response.AddString("type", type);
      response.AddDouble("volume", volume);
      response.AddString("status", "executed");
      
      return CreateDataResponse(response.ToString());
   }
   else
   {
      return CreateErrorResponse("Failed to place order. Error: " + IntegerToString(trade.ResultRetcode()));
   }
}

//+------------------------------------------------------------------+
//| Close order                                                      |
//+------------------------------------------------------------------+
string CloseOrder(const ulong ticket)
{
   if(ticket <= 0)
      return CreateErrorResponse("Invalid ticket number");
   
   bool result = trade.PositionClose(ticket);
   
   if(result)
   {
      SimpleJSON response;
      response.AddLong("ticket", (long)ticket);
      response.AddString("status", "closed");
      
      return CreateDataResponse(response.ToString());
   }
   else
   {
      return CreateErrorResponse("Failed to close position. Error: " + IntegerToString(trade.ResultRetcode()));
   }
}

//+------------------------------------------------------------------+
//| Send ping to keep connection alive                               |
//+------------------------------------------------------------------+
void SendPing()
{
   Print("Ping sent at ", TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS));
}

//+------------------------------------------------------------------+
//| Create data response                                             |
//+------------------------------------------------------------------+
string CreateDataResponse(const string data)
{
   string response = "{\"success\":true,\"data\":" + data + ",\"timestamp\":\"" + 
                    TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\"}";
   return response;
}

//+------------------------------------------------------------------+
//| Create error response                                            |
//+------------------------------------------------------------------+
string CreateErrorResponse(const string error)
{
   SimpleJSON json;
   json.AddBool("success", false);
   json.AddString("error", error);
   json.AddString("timestamp", TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS));
   
   return json.ToString();
}

//+------------------------------------------------------------------+
//| Public function to get account info (for external calls)        |
//+------------------------------------------------------------------+
string GetAccountInfoPublic()
{
   return GetAccountInfo();
}

//+------------------------------------------------------------------+
//| Public function to get positions (for external calls)           |
//+------------------------------------------------------------------+
string GetPositionsPublic()
{
   return GetPositions();
}

//+------------------------------------------------------------------+
//| Public function to place order (for external calls)             |
//+------------------------------------------------------------------+
string PlaceOrderPublic(const string symbol, const string type, const double volume, const double stopLoss = 0, const double takeProfit = 0)
{
   return PlaceOrder(symbol, type, volume, stopLoss, takeProfit);
}

//+------------------------------------------------------------------+
//| Public function to close order (for external calls)             |
//+------------------------------------------------------------------+
string CloseOrderPublic(const ulong ticket)
{
   return CloseOrder(ticket);
}
