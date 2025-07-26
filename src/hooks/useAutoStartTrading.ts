import { useEffect, useState } from 'react';
import { useBrokerAPI } from '@/hooks/useBrokerAPI';
import { useTradingEngine } from '@/hooks/useTradingEngine';
import { useToast } from '@/hooks/use-toast';

export const useAutoStartTrading = () => {
  const { toast } = useToast();
  const { isConfigured } = useBrokerAPI();
  const { startEngine, isRunning, isOperational } = useTradingEngine();
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  useEffect(() => {
    const autoStartTrading = async () => {
      // Only auto-start once when conditions are met
      if (isConfigured && isOperational && !isRunning && !hasAutoStarted) {
        console.log('🚀 Auto-starting Wing Zero trading on demo account...');
        
        // Add a longer delay for initial setup
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
          await startEngine();
          setHasAutoStarted(true);
          
          toast({
            title: "🚀 Wing Zero Started!",
            description: "Now trading on MT5 demo account with $50,000 balance",
            duration: 5000,
          });
          
          console.log('✅ Wing Zero is now actively trading!');
        } catch (error) {
          console.error('Failed to auto-start trading:', error);
          toast({
            title: "Auto-start Failed",
            description: "Couldn't automatically start trading. Try manual start.",
            variant: "destructive"
          });
        }
      }
    };

    // Longer delay to ensure all systems are ready
    const timer = setTimeout(autoStartTrading, 5000);
    return () => clearTimeout(timer);
  }, [isConfigured, isOperational, isRunning, hasAutoStarted, startEngine, toast]);

  return {
    hasAutoStarted,
    resetAutoStart: () => setHasAutoStarted(false)
  };
};