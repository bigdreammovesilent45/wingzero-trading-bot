/**
 * Windsurf Integration Hook
 * 
 * This hook provides Windsurf with a safe way to integrate with the UI
 * and access Cursor's services through React components.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { windsurfServiceManager } from '../services/WindsurfServiceManager';
import { windsurfConfig } from '../config/windsurf.config';
import { WindsurfEvent } from '../interfaces/cursor-integration';

export interface WindsurfIntegrationState {
  isInitialized: boolean;
  isRunning: boolean;
  services: { [name: string]: { running: boolean; healthy: boolean } };
  cursorIntegration: boolean;
  config: any;
  error: string | null;
}

export interface WindsurfIntegrationActions {
  initialize: () => Promise<void>;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  emitEvent: (event: Omit<WindsurfEvent, 'source' | 'timestamp'>) => void;
  updateConfig: (updates: any) => void;
  getService: (name: string) => any;
  getHealthStatus: () => Promise<any>;
}

export function useWindsurfIntegration(): [WindsurfIntegrationState, WindsurfIntegrationActions] {
  const [state, setState] = useState<WindsurfIntegrationState>({
    isInitialized: false,
    isRunning: false,
    services: {},
    cursorIntegration: false,
    config: windsurfConfig.getConfig(),
    error: null,
  });
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize Windsurf integration
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Get Cursor's services from the global scope or context
      // These should be injected by Cursor's main application
      const tradingBrain = (window as any).__CURSOR_SERVICES__?.tradingBrain;
      const marketDataService = (window as any).__CURSOR_SERVICES__?.marketDataService;
      const riskManager = (window as any).__CURSOR_SERVICES__?.riskManager;
      const orderManager = (window as any).__CURSOR_SERVICES__?.orderManager;
      const strategyManager = (window as any).__CURSOR_SERVICES__?.strategyManager;
      
      if (!tradingBrain || !marketDataService || !riskManager || !orderManager || !strategyManager) {
        throw new Error('Cursor services not available. Windsurf integration requires Cursor services to be initialized first.');
      }
      
      // Initialize Windsurf service manager
      await windsurfServiceManager.initialize(
        tradingBrain,
        marketDataService,
        riskManager,
        orderManager,
        strategyManager
      );
      
      // Subscribe to events
      const unsubscribe = windsurfServiceManager.subscribeToEvents((event) => {
        console.log('Windsurf received event:', event);
        // Handle events as needed
      });
      
      if (unsubscribe) {
        unsubscribeRef.current = unsubscribe;
      }
      
      // Update state
      setState(prev => ({
        ...prev,
        isInitialized: true,
        cursorIntegration: true,
      }));
      
      // Start health monitoring
      startHealthMonitoring();
      
    } catch (error) {
      console.error('Failed to initialize Windsurf integration:', error);
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
    }
  }, []);
  
  // Start Windsurf services
  const start = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      if (!state.isInitialized) {
        throw new Error('Windsurf integration must be initialized before starting');
      }
      
      await windsurfServiceManager.start();
      
      setState(prev => ({
        ...prev,
        isRunning: true,
      }));
      
    } catch (error) {
      console.error('Failed to start Windsurf services:', error);
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
    }
  }, [state.isInitialized]);
  
  // Stop Windsurf services
  const stop = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await windsurfServiceManager.stop();
      
      setState(prev => ({
        ...prev,
        isRunning: false,
      }));
      
    } catch (error) {
      console.error('Failed to stop Windsurf services:', error);
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
    }
  }, []);
  
  // Emit Windsurf event
  const emitEvent = useCallback((event: Omit<WindsurfEvent, 'source' | 'timestamp'>) => {
    windsurfServiceManager.emitEvent(event);
  }, []);
  
  // Update configuration
  const updateConfig = useCallback((updates: any) => {
    windsurfConfig.updateConfig(updates);
    setState(prev => ({
      ...prev,
      config: windsurfConfig.getConfig(),
    }));
  }, []);
  
  // Get service by name
  const getService = useCallback((name: string) => {
    return windsurfServiceManager.getService(name);
  }, []);
  
  // Get health status
  const getHealthStatus = useCallback(async () => {
    return await windsurfServiceManager.getHealthStatus();
  }, []);
  
  // Start health monitoring
  const startHealthMonitoring = useCallback(() => {
    const interval = windsurfConfig.getIntegrationConfig().healthCheckInterval;
    
    healthCheckIntervalRef.current = setInterval(async () => {
      try {
        const health = await windsurfServiceManager.getHealthStatus();
        const serviceStatus = windsurfServiceManager.getServiceStatus();
        
        setState(prev => ({
          ...prev,
          isRunning: serviceStatus.runningServices > 0,
          services: health.services,
          cursorIntegration: health.cursorIntegration,
        }));
        
      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, interval);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Unsubscribe from events
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      // Clear health check interval
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
      
      // Cleanup Windsurf service manager
      windsurfServiceManager.cleanup();
    };
  }, []);
  
  // Auto-initialize if configured
  useEffect(() => {
    if (windsurfConfig.getIntegrationConfig().autoStart && !state.isInitialized) {
      initialize();
    }
  }, [initialize, state.isInitialized]);
  
  const actions: WindsurfIntegrationActions = {
    initialize,
    start,
    stop,
    emitEvent,
    updateConfig,
    getService,
    getHealthStatus,
  };
  
  return [state, actions];
}

// Hook for accessing Windsurf configuration
export function useWindsurfConfig() {
  const [config, setConfig] = useState(windsurfConfig.getConfig());
  
  const updateConfig = useCallback((updates: any) => {
    windsurfConfig.updateConfig(updates);
    setConfig(windsurfConfig.getConfig());
  }, []);
  
  const isFeatureEnabled = useCallback((feature: keyof typeof config.features) => {
    return windsurfConfig.isFeatureEnabled(feature);
  }, []);
  
  const isAIEnabled = useCallback(() => {
    return windsurfConfig.isAIEnabled();
  }, []);
  
  const isEnterpriseEnabled = useCallback(() => {
    return windsurfConfig.isEnterpriseEnabled();
  }, []);
  
  return {
    config,
    updateConfig,
    isFeatureEnabled,
    isAIEnabled,
    isEnterpriseEnabled,
  };
}

// Hook for Windsurf events
export function useWindsurfEvents() {
  const [events, setEvents] = useState<WindsurfEvent[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  const subscribe = useCallback(() => {
    if (isSubscribed) return;
    
    const unsubscribe = windsurfServiceManager.subscribeToEvents((event) => {
      setEvents(prev => [...prev, event]);
    });
    
    if (unsubscribe) {
      setIsSubscribed(true);
      return unsubscribe;
    }
    
    return null;
  }, [isSubscribed]);
  
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);
  
  useEffect(() => {
    const unsubscribe = subscribe();
    return () => {
      if (unsubscribe) {
        unsubscribe();
        setIsSubscribed(false);
      }
    };
  }, [subscribe]);
  
  return {
    events,
    isSubscribed,
    clearEvents,
  };
}

// Hook for Windsurf service status
export function useWindsurfServiceStatus() {
  const [status, setStatus] = useState({
    initialized: false,
    serviceCount: 0,
    runningServices: 0,
  });
  
  useEffect(() => {
    const updateStatus = () => {
      const serviceStatus = windsurfServiceManager.getServiceStatus();
      setStatus(serviceStatus);
    };
    
    // Update immediately
    updateStatus();
    
    // Update periodically
    const interval = setInterval(updateStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return status;
}