import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { OdooConfig } from '../api/odoo';
import { attendanceCheckIn, attendanceCheckOut } from '../api/odoo';

const KEY = 'odhr_offline_queue';

type AttendanceAction = {
  kind: 'checkin' | 'checkout';
  payload: { lat?: number; lng?: number; manual?: boolean; reason?: string | null };
  ts: number;
};

type Queue = AttendanceAction[];

async function getQueue(): Promise<Queue> {
  try {
    if (Platform.OS === 'web') {
      const s = window.localStorage.getItem(KEY);
      return s ? (JSON.parse(s) as Queue) : [];
    }
    const s = await SecureStore.getItemAsync(KEY);
    return s ? (JSON.parse(s) as Queue) : [];
  } catch {
    return [];
  }
}

async function setQueue(q: Queue) {
  const s = JSON.stringify(q);
  try {
    if (Platform.OS === 'web') {
      window.localStorage.setItem(KEY, s);
      return;
    }
    await SecureStore.setItemAsync(KEY, s);
  } catch {}
}

export async function enqueueAttendanceAction(a: AttendanceAction) {
  const q = await getQueue();
  q.push(a);
  await setQueue(q);
}

export async function flushAttendanceQueue(cfg: OdooConfig) {
  const q = await getQueue();
  if (!q.length) return;
  const remaining: Queue = [];
  for (const item of q) {
    try {
      if (item.kind === 'checkin') {
        await attendanceCheckIn(cfg, item.payload);
      } else {
        await attendanceCheckOut(cfg, item.payload);
      }
    } catch {
      remaining.push(item);
    }
  }
  await setQueue(remaining);
}
