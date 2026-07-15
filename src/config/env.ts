
function readString(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.trim().toLowerCase() === 'true';
}

export const env = {
  apiBaseUrl: readString(import.meta.env.VITE_API_BASE_URL, 'http://localhost:3000/api/v1'),
  apiVersion: readString(import.meta.env.VITE_API_VERSION, 'v1'),

  appPlatform: readString(import.meta.env.VITE_APP_PLATFORM, 'web') as 'web' | 'mobile',
  appName: readString(import.meta.env.VITE_APP_NAME, 'Oasys School Dashboard'),
  appVersion: readString(import.meta.env.VITE_APP_VERSION, '0.0.0'),

  tokenStorageKey: readString(import.meta.env.VITE_TOKEN_STORAGE_KEY, 'oasys_access_token'),
  refreshTokenStorageKey: readString(import.meta.env.VITE_REFRESH_TOKEN_STORAGE_KEY, 'oasys_refresh_token'),

  tokenExpiryBufferMs: readNumber(import.meta.env.VITE_TOKEN_EXPIRY_BUFFER_MS, 60_000),

  defaultPageSize: readNumber(import.meta.env.VITE_DEFAULT_PAGE_SIZE, 20),
  maxPageSize: readNumber(import.meta.env.VITE_MAX_PAGE_SIZE, 100),

  enableParentRegistrationPage: readBool(import.meta.env.VITE_ENABLE_PARENT_REGISTRATION_PAGE, true),
  enableAnalytics: readBool(import.meta.env.VITE_ENABLE_ANALYTICS, false),

  sentryDsn: readString(import.meta.env.VITE_SENTRY_DSN, ''),
} as const;

export type AppEnv = typeof env;
