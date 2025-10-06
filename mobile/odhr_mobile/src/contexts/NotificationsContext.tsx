import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

export type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  date: string;
  read?: boolean;
};

export type NotificationsState = {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
};

const Ctx = createContext<NotificationsState | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const value = useMemo(() => ({ unreadCount, setUnreadCount }), [unreadCount]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNotifications() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
