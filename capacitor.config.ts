import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d1c16d36000a4f68b5d7e4b44e539a30',
  appName: 'chat-to-app-magic-67',
  webDir: 'dist',
  server: {
    url: 'https://d1c16d36-000a-4f68-b5d7-e4b44e539a30.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false
    }
  }
};

export default config;