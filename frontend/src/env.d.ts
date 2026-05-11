/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_COMTRYA_SERVER_URL?: string;
  readonly PUBLIC_COMTRYA_OPERATOR_CODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
