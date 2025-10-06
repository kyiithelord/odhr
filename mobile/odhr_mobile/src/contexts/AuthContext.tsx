import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { getCredentials, saveCredentials, clearCredentials } from '../services/storage';
import type { OdooConfig, Me } from '../api/odoo';
import { whoAmI } from '../api/odoo';
import { CONFIG } from '../config';
import { initNotificationHandlers, registerForPushNotificationsAsync } from '../services/notifications';
import { flushAttendanceQueue } from '../services/offline';

export type AuthState = {
  loading: boolean;
  me: Me | null;
  cfg: OdooConfig | null;
};

export type AuthContextType = AuthState & {
  signIn: (params: { login: string; apiKey: string; baseUrl?: string }) => Promise<boolean>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  hasRole: (...roles: Me['roles']) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ loading: true, me: null, cfg: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { login, apiKey, baseUrl } = await getCredentials();
      if (login && apiKey) {
        const cfg: OdooConfig = {
          login,
          apiKey,
          baseUrl: (baseUrl || CONFIG.API_BASE_URL).replace(/\/?\?.*$/, ''),
          db: new URL(baseUrl || CONFIG.API_BASE_URL).searchParams.get('db') || 'odhr',
        };
        const me = await whoAmI(cfg);
        setState({ loading: false, me, cfg });
        // Side effects on successful auth
        try {
          await initNotificationHandlers();
          await registerForPushNotificationsAsync(cfg);
        } catch {}
        try {
          await flushAttendanceQueue(cfg);
        } catch {}
        return;
      }
      setState({ loading: false, me: null, cfg: null });
    } catch (e: any) {
      console.warn('Auth bootstrap failed:', e?.message || e);
      setState({ loading: false, me: null, cfg: null });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const signIn = useCallback(async ({ login, apiKey, baseUrl }: { login: string; apiKey: string; baseUrl?: string }) => {
    try {
      await saveCredentials(login, apiKey, baseUrl || CONFIG.API_BASE_URL);
      await load();
      return true;
    } catch (e: any) {
      Alert.alert('Sign-in failed', e?.message || 'Unknown error');
      return false;
    }
  }, [load]);

  const signOut = useCallback(async () => {
    await clearCredentials();
    setState({ loading: false, me: null, cfg: null });
  }, []);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const hasRole = useCallback((...roles: Me['roles']) => {
    if (!state.me) return false;
    return state.me.roles.some((r) => roles.includes(r));
  }, [state.me]);

  const value = useMemo<AuthContextType>(() => ({ ...state, signIn, signOut, refresh, hasRole }), [state, signIn, signOut, refresh, hasRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
