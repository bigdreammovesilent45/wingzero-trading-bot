import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export const useWebSocket = (config: WebSocketConfig) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const { toast } = useToast();

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      ws.current = new WebSocket(config.url);
      
      ws.current.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttempts.current = 0;
        toast({
          title: "Connected",
          description: "Real-time connection established",
        });
      };
      
      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
      
      ws.current.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        
        const maxAttempts = config.maxReconnectAttempts || 5;
        if (reconnectAttempts.current < maxAttempts) {
          setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, config.reconnectInterval || 3000);
        } else {
          setError('Connection failed after maximum retry attempts');
          toast({
            title: "Connection Lost",
            description: "Unable to reconnect to real-time data",
            variant: "destructive",
          });
        }
      };
      
      ws.current.onerror = (error) => {
        setError('WebSocket connection error');
        setIsConnecting(false);
      };
    } catch (err) {
      setError('Failed to create WebSocket connection');
      setIsConnecting(false);
    }
  }, [config.url, config.reconnectInterval, config.maxReconnectAttempts, toast]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    lastMessage,
    error,
    sendMessage,
    reconnect: connect,
    disconnect
  };
};