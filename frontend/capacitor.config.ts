import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tongxiao.app',
  appName: 'TongXiao',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    proxy: {
      '/api': {
        target: 'https://good-luck-lct.icu',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug'
      }
    }
  }
};

export default config;