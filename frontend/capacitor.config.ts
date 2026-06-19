import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tongxiao.app',
  appName: 'TongXiao',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;