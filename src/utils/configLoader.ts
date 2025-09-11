// packages/host/src/utils/configLoader.ts

export type MicroFrontendConfig = {
  name: string;
  displayName: string;
  scope: string;
  url: string;
  routes: string[];
  roles: string[];
  module?: string;
  modules?: string[];
};

export type RegistryResponse = {
  microFrontends: MicroFrontendConfig[];
  updatedAt?: string;
};

/**
 * Resolve the registry URL without using `import.meta` (avoids Webpack warning).
 * Uses EnvironmentPlugin-injected values at build time.
 */
function readRegistryUrl(): string {
  const env = (typeof process !== 'undefined' ? (process as any).env : {}) || {};
  const isDev = String(env.NODE_ENV || '').toLowerCase() !== 'production';

  // Prefer explicitly provided env var
  const fromEnv = env.VITE_REGISTRY_URL as string | undefined;
  if (fromEnv && typeof fromEnv === 'string') return fromEnv;

  // Sensible dev default; empty string disables registry in prod by default
  return isDev ? 'http://localhost:4000/registry' : '';
}

export const REGISTRY_URL = readRegistryUrl();

export const hasRegistry = () =>
  typeof REGISTRY_URL === 'string' &&
  REGISTRY_URL.length > 0 &&
  /^https?:\/\//i.test(REGISTRY_URL);

async function fetchRegistry(): Promise<RegistryResponse | null> {
  if (!hasRegistry()) return null;
  try {
    const r = await fetch(REGISTRY_URL, { cache: 'no-store' });
    if (!r.ok) return null;
    const data = (await r.json()) as RegistryResponse;
    if (!Array.isArray(data?.microFrontends)) return null;
    return data;
  } catch {
    return null;
  }
}

async function fetchStatic(): Promise<RegistryResponse> {
  const r = await fetch('/config.json', { cache: 'no-store' });
  return (await r.json()) as RegistryResponse;
}

function mergeByScope(
  primary: MicroFrontendConfig[],
  fallback: MicroFrontendConfig[]
) {
  const map = new Map<string, MicroFrontendConfig>();
  for (const m of fallback) map.set(m.scope, m);
  for (const m of primary) map.set(m.scope, m); // primary (registry) wins
  return Array.from(map.values());
}

/** Registry → Static → Merge */
export async function loadConfig(): Promise<RegistryResponse> {
  const [reg, stat] = await Promise.all([fetchRegistry(), fetchStatic()]);

  if (!reg || !reg.microFrontends?.length) {
    console.log('📦 Using static config (registry unavailable or empty).');
    return stat;
  }

  const merged = mergeByScope(reg.microFrontends, stat.microFrontends || []);
  const resp: RegistryResponse = {
    microFrontends: merged,
    updatedAt: reg.updatedAt,
  };
  console.log('✅ Using merged config from registry + static:', resp);
  return resp;
}
