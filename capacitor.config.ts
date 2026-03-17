import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.vdf_ambulance.app',
  appName: 'VDF Ambulance',
  webDir: 'out',
  server: {
    url: 'https://dev.vdf-ambulance.fr',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
