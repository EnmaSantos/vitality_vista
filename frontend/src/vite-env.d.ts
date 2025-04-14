/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  // Add more environment variables as needed
  readonly [key: string]: string | boolean | undefined;
}
