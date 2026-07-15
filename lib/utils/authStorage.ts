export const AUTH_STORAGE_KEY = 'auth-storage'
export const LEGACY_AUTH_TOKEN_KEY = 'auth-token'
// GitHub OAuth 一次性 state 的 sessionStorage key，用于回调校验防 CSRF
export const GITHUB_OAUTH_STATE_KEY = 'github-oauth-state'

export interface AuthTokenStorage {
  getItem(key: string): string | null
  removeItem(key: string): void
}

interface PersistedAuthState {
  state?: {
    token?: unknown
  }
}

export function readPersistedAuthToken(storage: AuthTokenStorage): string | null {
  const persistedAuth = storage.getItem(AUTH_STORAGE_KEY)
  if (persistedAuth) {
    try {
      const parsed = JSON.parse(persistedAuth) as PersistedAuthState
      if (typeof parsed.state?.token === 'string' && parsed.state.token.length > 0) {
        return parsed.state.token
      }
    } catch {
      // ignore malformed persisted auth payload
    }
  }

  const legacyToken = storage.getItem(LEGACY_AUTH_TOKEN_KEY)
  if (typeof legacyToken === 'string' && legacyToken.length > 0) {
    return legacyToken
  }

  return null
}

export function removeLegacyAuthToken(storage: AuthTokenStorage): void {
  storage.removeItem(LEGACY_AUTH_TOKEN_KEY)
}
