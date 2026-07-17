import { env } from '../config/env';

let accessTokenInMemory: string | null = null;

function readAccessBackup(): string | null {
  try {
    return sessionStorage.getItem(env.tokenStorageKey);
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return accessTokenInMemory ?? readAccessBackup();
}

export function setAccessToken(token: string): void {
  accessTokenInMemory = token;
  try {
    sessionStorage.setItem(env.tokenStorageKey, token);
  } catch {
    void 0;
  }
}

export function clearAccessToken(): void {
  accessTokenInMemory = null;
  try {
    sessionStorage.removeItem(env.tokenStorageKey);
  } catch {
    void 0;
  }
}

export function clearAllTokens(): void {
  clearAccessToken();
  try {
    localStorage.removeItem(env.refreshTokenStorageKey);
    localStorage.removeItem(env.tokenStorageKey);
  } catch {
    void 0;
  }
}
