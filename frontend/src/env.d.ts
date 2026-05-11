/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_FORGEPOINT_SERVER_URL?: string;
  readonly PUBLIC_FORGEPOINT_OPERATOR_CODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
