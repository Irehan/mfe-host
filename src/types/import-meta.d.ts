// packages/host/src/types/import-meta.d.ts
interface ImportMetaEnv {
  DEV?: boolean;
  VITE_REGISTRY_URL?: string;
}
interface ImportMeta {
  env?: ImportMetaEnv;
}
