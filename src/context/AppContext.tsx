// packages/host/src/context/AppContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadConfig, type RegistryResponse } from '../utils/configLoader';
import { eventBus } from '../utils/eventBus';
import { seedRegistryFromStatic } from '../utils/registrySeeder';

export type User = {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
};

const USER_STORAGE_KEY = 'app.user';

function readUserFromStorage(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // quick sanity checks
    if (parsed && parsed.id && parsed.username && parsed.email && parsed.role) {
      return parsed as User;
    }
  } catch {}
  return null;
}

function writeUserToStorage(user: User | null) {
  try {
    if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_STORAGE_KEY);
  } catch {}
}

type AppState = {
  user: User | null;
  config: RegistryResponse | null;
  loading: boolean;
};

type AppContextValue = {
  state: AppState;
  setUser: (user: User | null) => void;
  refreshConfig: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // 👇 seed user synchronously so routing doesn't bounce to /login on refresh
  const [state, setState] = useState<AppState>({
    user: readUserFromStorage(),   // <— was null
    config: null,
    loading: true
  });

  const refreshConfig = async () => {
    setState(s => ({ ...s, loading: true }));
    try {
      const cfg = await loadConfig();
      setState(s => ({ ...s, config: cfg, loading: false }));
    } catch (err) {
      console.error('Failed to load config', err);
      setState(s => ({ ...s, loading: false }));
    }
  };

  useEffect(() => {
    // 1) Seed registry if needed, then load config
    seedRegistryFromStatic().finally(() => { void refreshConfig(); });

    // 2) Auth events
    const onLogin = (data: unknown) => {
      const payload = (data as any)?.payload ?? data;
      const user: User | null = payload ?? null;
      writeUserToStorage(user);
      setState(s => ({ ...s, user }));
    };
    const onLogout = () => {
      writeUserToStorage(null);
      setState(s => ({ ...s, user: null }));
    };

    eventBus.on('auth:login', onLogin);
    eventBus.on('auth:logout', onLogout);

    return () => {
      eventBus.off('auth:login', onLogin);
      eventBus.off('auth:logout', onLogout);
    };
  }, []);

  const setUser = (user: User | null) => {
    writeUserToStorage(user);
    setState(s => ({ ...s, user }));
  };

  const value = useMemo(() => ({ state, setUser, refreshConfig }), [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
