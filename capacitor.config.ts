import { CapacitorConfig } from '@capacitor/cli';

const testAppId = 'ca-app-pub-3940256099942544~3347511713';
const useLive = process.env.ADMOB_USE_LIVE === 'true' && Boolean(process.env.ADMOB_APP_ID);
const admobAppId = useLive ? process.env.ADMOB_APP_ID! : testAppId;

const config: CapacitorConfig = {
  appId: 'com.tetrix.game',
  appName: 'TETRIX',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    AdMob: {
      // Google's sample app id unless ADMOB_USE_LIVE=true and ADMOB_APP_ID are set.
      appId: admobAppId,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#07071a',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#07071a',
    },
  },
  android: {
    backgroundColor: '#07071a',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: !useLive,
  },
};

export default config;
