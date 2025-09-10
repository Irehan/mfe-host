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
 * Safely resolve the registry URL:
 * - Prefer process.env (Webpack EnvironmentPlugin) if available
 * - Fall back to import.meta.env only in DEV
 * - In PROD, default to '' (disabled) unless explicitly configured
 */
function readRegistryUrl(): string {
  const fromProcess =
    typeof process !== 'undefined' &&
    (process as any).env &&
    (process as any).env.VITE_REGISTRY_URL;

  const meta: any =
    typeof import.meta !== 'undefined' ? (import.meta as any) : undefined;

  const isDev = Boolean(meta?.env?.DEV);
  const fromImportMeta = meta?.env?.VITE_REGISTRY_URL;

  if (fromProcess) return String(fromProcess);
  if (isDev && fromImportMeta) return String(fromImportMeta);

  // Dev-only fallback to local registry for convenience
  return isDev ? 'http://localhost:4000/registry' : '';
}

export const REGISTRY_URL = readRegistryUrl();
export const hasRegistry = () =>
  typeof REGISTRY_URL === 'string' && REGISTRY_URL.startsWith('http');

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

function mergeByScope(primary: MicroFrontendConfig[], fallback: MicroFrontendConfig[]) {
  const map = new Map<string, MicroFrontendConfig>();
  for (const m of fallback) map.set(m.scope, m);
  for (const m of primary) map.set(m.scope, m); // primary (registry) wins
  return Array.from(map.values());
}

/** Load config with resilience: Registry -> Static -> Merge */
export async function loadConfig(): Promise<RegistryResponse> {
  const [reg, stat] = await Promise.all([fetchRegistry(), fetchStatic()]);

  if (!reg || !reg.microFrontends?.length) {
    console.log('📦 Using static config (registry unavailable or empty).');
    return stat;
  }

  const merged = mergeByScope(reg.microFrontends, stat.microFrontends || []);
  const resp: RegistryResponse = { microFrontends: merged, updatedAt: reg.updatedAt };
  console.log('✅ Using merged config from registry + static:', resp);
  return resp;
}
