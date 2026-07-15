/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_VERSION: string;
  readonly VITE_APP_PLATFORM: 'web' | 'mobile';
  readonly VITE_APP_NAME: string;
  readonly VITE_TOKEN_STORAGE_KEY: string;
  readonly VITE_TOKEN_EXPIRY_BUFFER_MS: string;
  readonly VITE_REFRESH_TOKEN_STORAGE_KEY: string;
  readonly VITE_DEFAULT_PAGE_SIZE: string;
  readonly VITE_MAX_PAGE_SIZE: string;
  readonly VITE_ENABLE_PARENT_REGISTRATION_PAGE: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
