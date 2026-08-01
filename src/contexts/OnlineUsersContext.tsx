import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '../lib/api';

export interface OnlineUser {
  user_id: string | null;
  country?: string;
  username?: string;
  online_at: string;
}

interface OnlineUsersContextValue {
  onlineUsers: OnlineUser[];
  onlineCount: number;
  usersByCountry: Map<string, OnlineUser[]>;
}

const OnlineUsersContext = createContext<OnlineUsersContextValue | undefined>(undefined);

const POLL_INTERVAL_MS = 20_000;

export function OnlineUsersProvider({ children }: { children: ReactNode }) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [usersByCountry, setUsersByCountry] = useState<Map<string, OnlineUser[]>>(new Map());

  const fetchOnlineUsers = useCallback(async () => {
    try {
      const data = await api.get<{ count: number; users: OnlineUser[] }>('/online-users');
      setOnlineUsers(data.users);

      const countryMap = new Map<string, OnlineUser[]>();
      data.users.forEach((u) => {
        const country = u.country || 'UNKNOWN';
        const existing = countryMap.get(country) || [];
        existing.push(u);
        countryMap.set(country, existing);
      });
      setUsersByCountry(countryMap);
    } catch (err) {
      console.error('Error fetching online users:', err);
    }
  }, []);

  useEffect(() => {
    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchOnlineUsers]);

  const value: OnlineUsersContextValue = {
    onlineUsers,
    onlineCount: onlineUsers.length,
    usersByCountry,
  };

  return (
    <OnlineUsersContext.Provider value={value}>
      {children}
    </OnlineUsersContext.Provider>
  );
}

export function useOnlineUsers() {
  const context = useContext(OnlineUsersContext);
  if (context === undefined) {
    throw new Error('useOnlineUsers must be used within an OnlineUsersProvider');
  }
  return context;
}
