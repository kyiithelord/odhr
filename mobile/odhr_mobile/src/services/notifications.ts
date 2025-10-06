import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerDeviceToken, type OdooConfig } from '../api/odoo';

export async function initNotificationHandlers() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

export async function registerForPushNotificationsAsync(cfg: OdooConfig) {
  let status = (await Notifications.getPermissionsAsync()).status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  // For Expo-managed projects, this returns an Expo push token; we can still register it server-side
  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;
  try {
    await registerDeviceToken(cfg, { platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web', token });
  } catch (e) {
    // Non-fatal
    console.warn('Failed to register device token:', e);
  }
  return token;
}
