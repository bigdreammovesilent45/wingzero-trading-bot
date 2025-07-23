import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from './useLocalStorage';

interface NotificationConfig {
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  pushoverToken?: string;
  twilioConfig?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
    toNumber: string;
  };
  emailConfig?: {
    smtpHost: string;
    smtpPort: number;
    username: string;
    password: string;
    fromEmail: string;
    toEmail: string;
  };
}

export const useNotifications = () => {
  const [config] = useLocalStorage<NotificationConfig>('notification_config', {
    pushEnabled: true,
    smsEnabled: false,
    emailEnabled: false
  });
  const { toast } = useToast();

  const sendPushNotification = useCallback(async (title: string, message: string) => {
    if (!config.pushEnabled || !config.pushoverToken) {
      console.log('Push notifications disabled or not configured');
      return false;
    }

    try {
      // Simulate push notification
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title,
        description: message,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }, [config.pushEnabled, config.pushoverToken, toast]);

  const sendSMSNotification = useCallback(async (message: string) => {
    if (!config.smsEnabled || !config.twilioConfig) {
      console.log('SMS notifications disabled or not configured');
      return false;
    }

    try {
      // Simulate SMS sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "SMS Sent",
        description: "Notification sent via SMS",
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
      toast({
        title: "SMS Failed",
        description: "Failed to send SMS notification",
        variant: "destructive",
      });
      return false;
    }
  }, [config.smsEnabled, config.twilioConfig, toast]);

  const sendEmailNotification = useCallback(async (subject: string, body: string) => {
    if (!config.emailEnabled || !config.emailConfig) {
      console.log('Email notifications disabled or not configured');
      return false;
    }

    try {
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Email Sent",
        description: "Notification sent via email",
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      toast({
        title: "Email Failed",
        description: "Failed to send email notification",
        variant: "destructive",
      });
      return false;
    }
  }, [config.emailEnabled, config.emailConfig, toast]);

  const notifyWithdrawalTriggered = useCallback(async (amount: number) => {
    const title = "Withdrawal Triggered";
    const message = `Automatic withdrawal of $${amount.toFixed(2)} has been initiated`;
    
    await Promise.all([
      sendPushNotification(title, message),
      sendSMSNotification(message),
      sendEmailNotification(title, message)
    ]);
  }, [sendPushNotification, sendSMSNotification, sendEmailNotification]);

  const notifyThresholdMet = useCallback(async (type: string, value: number) => {
    const title = "Threshold Alert";
    const message = `${type} threshold of $${value.toFixed(2)} has been met`;
    
    await Promise.all([
      sendPushNotification(title, message),
      sendSMSNotification(message),
      sendEmailNotification(title, message)
    ]);
  }, [sendPushNotification, sendSMSNotification, sendEmailNotification]);

  return {
    config,
    sendPushNotification,
    sendSMSNotification,
    sendEmailNotification,
    notifyWithdrawalTriggered,
    notifyThresholdMet
  };
};