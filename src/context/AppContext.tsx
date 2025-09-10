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
  const [state, setState] = useState<AppState>({
    user: null,
    config: null,
    loading: true
  });

  const refreshConfig = async () => {
    setState(s => ({ ...s, loading: true }));
    try {
      const cfg = await loadConfig();
      setState(s => ({ ...s, config: cfg, loading: false }));
    } catch (err: unknown) {
      console.error('Failed to load config', err);
      setState(s => ({ ...s, loading: false }));
    }
  };

  useEffect(() => {
    // 1) Seed the registry from static config if empty, then load config
    seedRegistryFromStatic()
      .finally(() => {
        void refreshConfig();
      });

    // 2) Wire auth events
    const onLogin = (data: unknown) => {
      const payload = (data as any)?.payload ?? data;
      const user: User | null = payload ?? null;
      setState(s => ({ ...s, user }));
    };
    const onLogout = () => setState(s => ({ ...s, user: null }));

    eventBus.on('auth:login', onLogin);
    eventBus.on('auth:logout', onLogout);

    return () => {
      eventBus.off('auth:login', onLogin);
      eventBus.off('auth:logout', onLogout);
    };
  }, []);

  const setUser = (user: User | null) => setState(s => ({ ...s, user }));

  const value = useMemo(
    () => ({ state, setUser, refreshConfig }),
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
