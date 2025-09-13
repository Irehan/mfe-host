import React, { useEffect, useMemo, useState } from 'react';
import { eventBus } from '../utils/eventBus';
import { moduleLoader } from '../utils/moduleLoader';
import type { MicroFrontendConfig } from '../types/types';

type RemoteConfig = {
  url: string;
  scope: string;
  module: string;
  name?: string;
  displayName?: string;
  routes?: string[];
  roles?: string[];
};

type RemoteModuleProps = {
  config: RemoteConfig;
  user?: any;
  fallbackComponent?: React.ComponentType;
  [key: string]: any;
};

const DefaultFallback: React.FC = () => (
  <div style={{ padding: 16 }}>
    <h3>Module is loading…</h3>
  </div>
);

const RemoteModule: React.FC<RemoteModuleProps> = (props) => {
  const { config, user, fallbackComponent: Fallback = DefaultFallback, ...restProps } = props;

  const [LoadedComponent, setLoadedComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const key = useMemo(() => `${config?.scope}/${config?.module}`, [config?.scope, config?.module]);

  useEffect(() => {
    if (!config) return;
    console.log('📦 RemoteModule effect triggered for', key);
    const mfConfig: MicroFrontendConfig = {
      name: config.name ?? config.scope, 
      displayName: config.displayName ?? config.name ?? config.scope,
      scope: config.scope,
      url: config.url,
      module: config.module,
      routes: config.routes ?? [],
      roles: config.roles ?? [],
    };

    let cancelled = false;

    (async () => {
      try {
        console.log('🚀 Loading remote module:', key);
        const Module: any = await moduleLoader.loadModule(mfConfig);
        const Component: React.ComponentType<any> = Module?.default ?? Module;
        if (!Component) {
          throw new Error(`Loaded ${key} but did not find a React component export`);
        }

        if (!cancelled) {
          setLoadedComponent(() => Component);
          setError(null);
          try {
            (window as any)?.eventBus?.emit?.('module:loaded', { payload: key });
          } catch {}
        }
      } catch (err: any) {
        console.error('❌ Failed to load remote module', key, err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoadedComponent(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [key, config?.url, config?.scope, config?.module, config?.name, config?.displayName, config?.routes, config?.roles]);

  const handleLogin = (u: any) => {
    try {
      console.log('🔐 RemoteModule: Login handler called with:', u);
      (window as any)?.eventBus?.emit?.('auth:login', { payload: u });
      (props as any)?.onLogin?.(u);
    } catch (err) {
      console.error('❌ Login callback error:', err);
    }
  };

  const handleLogout = () => {
    try {
      console.log('🔓 RemoteModule: Logout handler called');
      (window as any)?.eventBus?.emit?.('auth:logout');
      (props as any)?.onLogout?.();
    } catch (err) {
      console.error('❌ Logout callback error:', err);
    }
  };

  if (error) {
    return (
      <div className="remote-error" style={{ padding: 16 }}>
        <h3>Module failed to load</h3>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{String(error.message || error)}</pre>
      </div>
    );
  }

  if (!LoadedComponent) {
    return <Fallback />;
  }

  const isAuthLogin = config?.module === './Login' && config?.scope === 'authApp';
  const isAuthProfile = config?.module === './UserProfile' && config?.scope === 'authApp';

  const injectedProps = {
    ...restProps,
    ...(user ? { user } : {}),
    ...(isAuthLogin ? { onLogin: handleLogin } : {}),
    ...(isAuthProfile ? { onLogout: handleLogout } : {}),
  };

  console.log('🎯 Rendering', config?.module, 'with props:', Object.keys(injectedProps));

  const Cmp = LoadedComponent;
  return <Cmp {...injectedProps} />;
};

export default RemoteModule;
