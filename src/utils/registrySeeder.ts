import type { MicroFrontendConfig, RegistryResponse } from './configLoader';
import { REGISTRY_URL, hasRegistry } from './configLoader';

async function getRegistry(): Promise<RegistryResponse | null> {
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

async function getStaticConfig(): Promise<RegistryResponse | null> {
  try {
    const r = await fetch('/config.json', { cache: 'no-store' });
    if (!r.ok) return null;
    const json = (await r.json()) as RegistryResponse;
    if (!Array.isArray(json?.microFrontends)) return null;
    return json;
  } catch {
    return null;
  }
}

/** Auto-seed the registry from /config.json if empty and registry is enabled */
export async function seedRegistryFromStatic(): Promise<void> {
  if (!hasRegistry()) {
    console.log('ℹ️ Registry not configured; skipping seed.');
    return;
  }

  const reg = await getRegistry();
  if (reg && reg.microFrontends?.length) {
    console.log('🧩 Registry already populated; skipping seed.');
    return;
  }

  const stat = await getStaticConfig();
  if (!stat || !stat.microFrontends?.length) {
    console.warn('⚠️ No static config to seed from, skipping.');
    return;
  }

  try {
    await Promise.all(
      stat.microFrontends.map((mfe: MicroFrontendConfig) =>
        fetch(REGISTRY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mfe),
        })
      )
    );
    console.log('🌱 Seeded registry from static config.json');
  } catch (err) {
    console.warn('⚠️ Failed to seed registry:', err);
  }
}
