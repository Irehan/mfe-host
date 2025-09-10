/// <reference types="vite/client" />

/**
 * IMPORTANT: We only augment Vite's env with our own keys.
 * We do NOT redeclare ImportMeta or ImportMetaEnv (that would erase DEV/PROD/BASE_URL).
 */
interface ImportMetaEnv {
  readonly VITE_REGISTRY_URL?: string;
  // add more VITE_* variables here as needed
}
