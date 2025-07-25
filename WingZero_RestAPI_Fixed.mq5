//+------------------------------------------------------------------+
//|                                           WingZero_RestAPI_Fixed.mq5 |
//|                                  Copyright 2024, WingZero Trading |
//|                                             https://wingzero.ai |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, WingZero Trading"
#property link      "https://wingzero.ai"
#property version   "1.00"

#include <Trade\Trade.mqh>
#include <JAson.mqh>

// Input parameters
input string ServerURL = "http://localhost:6542";
input int ServerPort = 6542;
input string AuthToken = "wingzero_2024_api_key";
input bool EnableTrading = true;
input double MaxRiskPercent = 2.0;

// Global variables
CTrade trade;
int socketHandle = INVALID_HANDLE;
bool isConnected = false;
datetime lastPing = 0;
int pingInterval = 30; // seconds

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("WingZero RestAPI EA - Initializing...");
   
   // Initialize trading
   trade.SetExpertMagicNumber(12345);
   trade.SetDeviationInPoints(10);
   
   // Start web server
   if(!StartWebServer())
   {
      Print("Failed to start web server");
      return INIT_FAILED;
   }
   
   Print("WingZero RestAPI EA - Initialized successfully");
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   StopWebServer();
   Print("WingZero RestAPI EA - Deinitialized");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Handle incoming requests
   HandleWebRequests();
   
   // Send ping every 30 seconds
   if(TimeCurrent() - lastPing > pingInterval)
   {
      SendPing();
      lastPing = TimeCurrent();
   }
}

//+------------------------------------------------------------------+
//| Start web server                                                |
//+------------------------------------------------------------------+
bool StartWebServer()
{
   // Create socket for web server
   socketHandle = SocketCreate();
   if(socketHandle == INVALID_HANDLE)
   {
      Print("Failed to create socket");
      return false;
   }
   
   // Bind to port
   if(!SocketBind(socketHandle, ServerPort))
   {
      Print("Failed to bind to port ", ServerPort);
      SocketClose(socketHandle);
      return false;
   }
   
   // Start listening
   if(!SocketListen(socketHandle))
   {
      Print("Failed to start listening");
      SocketClose(socketHandle);
      return false;
   }
   
   isConnected = true;
   Print("Web server started on port ", ServerPort);
   return true;
}

//+------------------------------------------------------------------+
//| Stop web server                                                 |
//+------------------------------------------------------------------+
void StopWebServer()
{
   if(socketHandle != INVALID_HANDLE)
   {
      SocketClose(socketHandle);
      socketHandle = INVALID_HANDLE;
   }
   isConnected = false;
}

//+------------------------------------------------------------------+
//| Handle web requests                                              |
//+------------------------------------------------------------------+
void HandleWebRequests()
{
   if(!isConnected || socketHandle == INVALID_HANDLE)
      return;
      
   // Accept incoming connections
   int clientSocket = SocketAccept(socketHandle, 1000);
   if(clientSocket == INVALID_HANDLE)
      return;
      
   // Read request
   string request = "";
   char buffer[1024];
   int bytesRead = SocketRead(clientSocket, buffer, 1024, 1000);
   
   if(bytesRead > 0)
   {
      request = CharArrayToString(buffer, 0, bytesRead);
      string response = ProcessRequest(request);
      
      // Send response
      string httpResponse = "HTTP/1.1 200 OK\r\n";
      httpResponse += "Content-Type: application/json\r\n";
      httpResponse += "Access-Control-Allow-Origin: *\r\n";
      httpResponse += "Access-Control-Allow-Methods: GET, POST, PUT, DELETE\r\n";
      httpResponse += "Access-Control-Allow-Headers: Content-Type, Authorization\r\n";
      httpResponse += "Content-Length: " + IntegerToString(StringLen(response)) + "\r\n";
      httpResponse += "\r\n";
      httpResponse += response;
      
      char responseBuffer[];
      StringToCharArray(httpResponse, responseBuffer);
      SocketSend(clientSocket, responseBuffer, ArraySize(responseBuffer));
   }
   
   SocketClose(clientSocket);
}

//+------------------------------------------------------------------+
//| Process HTTP request                                             |
//+------------------------------------------------------------------+
string ProcessRequest(string request)
{
   string lines[];
   int lineCount = StringSplit(request, '\n', lines);
   
   if(lineCount == 0)
      return CreateErrorResponse("Invalid request");
      
   string requestLine = lines[0];
   string parts[];
   StringSplit(requestLine, ' ', parts);
   
   if(ArraySize(parts) < 3)
      return CreateErrorResponse("Invalid request format");
      
   string method = parts[0];
   string path = parts[1];
   
   // Route requests
   if(path == "/api/account/info")
      return GetAccountInfo();
   else if(path == "/api/positions")
      return GetPositions();
   else if(path == "/api/orders" && method == "POST")
      return PlaceOrder(request);
   else if(StringFind(path, "/api/orders/") == 0 && method == "DELETE")
      return CloseOrder(path);
   else if(path == "/api/ping")
      return CreateSuccessResponse("pong");
   else
      return CreateErrorResponse("Endpoint not found");
}

//+------------------------------------------------------------------+
//| Get account information                                          |
//+------------------------------------------------------------------+
string GetAccountInfo()
{
   CJAVal json;
   
   json["balance"] = AccountInfoDouble(ACCOUNT_BALANCE);
   json["equity"] = AccountInfoDouble(ACCOUNT_EQUITY);
   json["profit"] = AccountInfoDouble(ACCOUNT_PROFIT);
   json["margin"] = AccountInfoDouble(ACCOUNT_MARGIN);
   json["free_margin"] = AccountInfoDouble(ACCOUNT_FREEMARGIN);
   json["margin_level"] = AccountInfoDouble(ACCOUNT_MARGIN_LEVEL);
   json["currency"] = AccountInfoString(ACCOUNT_CURRENCY);
   json["leverage"] = AccountInfoInteger(ACCOUNT_LEVERAGE);
   json["timestamp"] = TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS);
   
   return CreateDataResponse(json.Serialize());
}

//+------------------------------------------------------------------+
//| Get open positions                                               |
//+------------------------------------------------------------------+
string GetPositions()
{
   CJAVal json, positions;
   
   for(int i = 0; i < PositionsTotal(); i++)
   {
      if(PositionSelectByIndex(i))
      {
         CJAVal pos;
         pos["ticket"] = PositionGetInteger(POSITION_TICKET);
         pos["symbol"] = PositionGetString(POSITION_SYMBOL);
         pos["type"] = PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? "buy" : "sell";
         pos["volume"] = PositionGetDouble(POSITION_VOLUME);
         pos["price_open"] = PositionGetDouble(POSITION_PRICE_OPEN);
         pos["price_current"] = PositionGetDouble(POSITION_PRICE_CURRENT);
         pos["profit"] = PositionGetDouble(POSITION_PROFIT);
         pos["swap"] = PositionGetDouble(POSITION_SWAP);
         pos["commission"] = PositionGetDouble(POSITION_COMMISSION);
         pos["time"] = TimeToString((datetime)PositionGetInteger(POSITION_TIME), TIME_DATE|TIME_SECONDS);
         
         positions.Add(pos);
      }
   }
   
   json["positions"] = positions;
   json["count"] = positions.Size();
   
   return CreateDataResponse(json.Serialize());
}

//+------------------------------------------------------------------+
//| Place order                                                      |
//+------------------------------------------------------------------+
string PlaceOrder(string request)
{
   if(!EnableTrading)
      return CreateErrorResponse("Trading is disabled");
      
   // Extract JSON from request body
   int bodyStart = StringFind(request, "\r\n\r\n");
   if(bodyStart == -1)
      return CreateErrorResponse("No request body found");
      
   string body = StringSubstr(request, bodyStart + 4);
   
   CJAVal json;
   if(!json.Deserialize(body))
      return CreateErrorResponse("Invalid JSON");
      
   string symbol = json["symbol"].ToStr();
   string type = json["type"].ToStr();
   double volume = json["volume"].ToDbl();
   double stopLoss = json["stop_loss"].ToDbl();
   double takeProfit = json["take_profit"].ToDbl();
   
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
      CJAVal response;
      response["ticket"] = trade.ResultOrder();
      response["symbol"] = symbol;
      response["type"] = type;
      response["volume"] = volume;
      response["status"] = "executed";
      
      return CreateDataResponse(response.Serialize());
   }
   else
   {
      return CreateErrorResponse("Failed to place order: " + IntegerToString(trade.ResultRetcode()));
   }
}

//+------------------------------------------------------------------+
//| Close order                                                      |
//+------------------------------------------------------------------+
string CloseOrder(string path)
{
   // Extract ticket from path: /api/orders/{ticket}
   int lastSlash = StringFindRev(path, "/");
   if(lastSlash == -1)
      return CreateErrorResponse("Invalid order ID");
      
   string ticketStr = StringSubstr(path, lastSlash + 1);
   ulong ticket = StringToInteger(ticketStr);
   
   if(ticket <= 0)
      return CreateErrorResponse("Invalid ticket number");
      
   bool result = trade.PositionClose(ticket);
   
   if(result)
   {
      CJAVal response;
      response["ticket"] = ticket;
      response["status"] = "closed";
      
      return CreateDataResponse(response.Serialize());
   }
   else
   {
      return CreateErrorResponse("Failed to close position: " + IntegerToString(trade.ResultRetcode()));
   }
}

//+------------------------------------------------------------------+
//| Send ping to keep connection alive                               |
//+------------------------------------------------------------------+
void SendPing()
{
   // This would send a ping to the web application
   // For now, just log the ping
   Print("Ping sent at ", TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS));
}

//+------------------------------------------------------------------+
//| Create success response                                          |
//+------------------------------------------------------------------+
string CreateSuccessResponse(string message)
{
   CJAVal json;
   json["success"] = true;
   json["message"] = message;
   json["timestamp"] = TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS);
   
   return json.Serialize();
}

//+------------------------------------------------------------------+
//| Create data response                                             |
//+------------------------------------------------------------------+
string CreateDataResponse(string data)
{
   CJAVal json;
   json["success"] = true;
   json["data"] = data;
   json["timestamp"] = TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS);
   
   return json.Serialize();
}

//+------------------------------------------------------------------+
//| Create error response                                            |
//+------------------------------------------------------------------+
string CreateErrorResponse(string error)
{
   CJAVal json;
   json["success"] = false;
   json["error"] = error;
   json["timestamp"] = TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS);
   
   return json.Serialize();
}
