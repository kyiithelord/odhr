import { Platform } from 'react-native';

// IMPORTANT:
// - Replace YOUR_DB with the database name you created in Odoo.
// - Replace 192.168.1.50 with your PC's LAN IP when testing on a physical device.
// Notes:
// - Android emulator uses 10.0.2.2 to reach host machine.
// - iOS simulator can use localhost.
// - Physical devices must use your machine's LAN IP and be on the same network.

const HOST = Platform.select({
  android: 'http://10.0.2.2:8069',
  ios: 'http://localhost:8069',
  web: 'http://localhost:8069',
  default: 'http://192.168.1.50:8069', // CHANGE ME to your LAN IP if using a real device
});

export const CONFIG = {
  // Keep the db query here; api.ts preserves the query string for all requests.
  API_BASE_URL: `${HOST}/?db=odhr`, // CHANGE YOUR_DB
};
