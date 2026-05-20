import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tetrix.game',
  appName: 'TETRIX',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // AdMob plugin config
    AdMob: {
      appId: 'ca-app-pub-7225653287350149~8772769864',
    },
    // SplashScreen config
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#07071a',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    // StatusBar
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#07071a',
    },
  },
  android: {
    backgroundColor: '#07071a',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // set true during dev
  },
};

export default config;
