import { readPersistedAuthToken } from '@/lib/utils/authStorage'

export function getAuthTokenFromStorage(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return readPersistedAuthToken(window.localStorage)
  } catch (error) {
    console.warn('Failed to read auth token from storage:', error)
  }

  return null
}
