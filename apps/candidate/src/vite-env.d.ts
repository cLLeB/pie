/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PIE_SERVER?: string;
  readonly VITE_PIE_TENANT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
