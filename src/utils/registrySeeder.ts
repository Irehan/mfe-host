/**
 * Auto-seed the local plugin registry from the host's static /config.json
 * when the registry is empty. Safe to call at startup; it's idempotent.
 */
type MicroFrontendConfig = {
  name: string;
  displayName: string;
  scope: string;
  url: string;
  routes: string[];
  roles: string[];
  module?: string;
  modules?: string[];
};

type RegistryResponse = {
  microFrontends: MicroFrontendConfig[];
  updatedAt?: string;
};

const REGISTRY_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as any)?.env?.VITE_REGISTRY_URL) ||
  "http://localhost:4000/registry";

async function getRegistry(): Promise<RegistryResponse | null> {
  try {
    const r = await fetch(REGISTRY_URL, { cache: "no-store" });
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
    const r = await fetch("/config.json", { cache: "no-store" });
    if (!r.ok) return null;
    const json = (await r.json()) as RegistryResponse;
    if (!Array.isArray(json?.microFrontends)) return null;
    return json;
  } catch {
    return null;
  }
}

export async function seedRegistryFromStatic(): Promise<void> {
  // 1) If registry is reachable and already has entries, do nothing
  const reg = await getRegistry();
  if (reg && reg.microFrontends?.length) {
    console.log("🧩 Registry already populated; skipping seed.");
    return;
  }

  // 2) Load static config
  const stat = await getStaticConfig();
  if (!stat || !stat.microFrontends?.length) {
    console.warn("⚠️ No static config to seed from, skipping.");
    return;
  }

  // 3) POST each MFE to registry (upsert by scope on the server)
  try {
    await Promise.all(
      stat.microFrontends.map((mfe) =>
        fetch(REGISTRY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mfe),
        })
      )
    );
    console.log("🌱 Seeded registry from static config.json");
  } catch (err: unknown) {
    console.warn("⚠️ Failed to seed registry:", err);
  }
}
