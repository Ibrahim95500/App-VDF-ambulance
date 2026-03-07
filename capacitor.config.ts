import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vdf.ambulance',
  appName: 'VDF Ambulance',
  webDir: 'out',
  server: {
    url: 'https://dev.vdf-ambulance.fr',
    cleartext: true
  }
};

export default config;
