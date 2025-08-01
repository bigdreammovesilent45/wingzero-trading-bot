import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d1c16d36000a4f68b5d7e4b44e539a30',
  appName: 'wing-zero-x-saw',
  webDir: 'dist',
  server: {
    url: 'https://d1c16d36-000a-4f68-b5d7-e4b44e539a30.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#000000",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#000000'
    }
  }
};

export default config;