/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPSCRIPT_URL?: string
  readonly VITE_PIX_KEY?: string
  readonly VITE_PAYPAL_ME?: string
  readonly VITE_REVOLUT_ME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
