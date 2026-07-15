import { API_URL } from './url'

const SAFE_HTTP_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

let csrfCookiePromise: Promise<void> | null = null

export function isSafeHttpMethod(method: string): boolean {
  return SAFE_HTTP_METHODS.has(method.toUpperCase())
}

export function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function getXsrfTokenFromCookie(): string | null {
  return getCookieValue('XSRF-TOKEN')
}

export async function ensureCsrfCookie(force = false): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  if (!force && getXsrfTokenFromCookie()) {
    return
  }

  if (!csrfCookiePromise) {
    csrfCookiePromise = fetch(`${API_URL}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('获取 CSRF Cookie 失败')
        }
      })
      .finally(() => {
        csrfCookiePromise = null
      })
  }

  await csrfCookiePromise
}

interface CreateBrowserRequestHeadersOptions {
  method: string
  headers?: HeadersInit
  token?: string | null
  isFormData?: boolean
  xsrfToken?: string | null
  socketId?: string | null
}

export function createBrowserRequestHeaders({
  method,
  headers: rawHeaders,
  token,
  isFormData = false,
  xsrfToken,
  socketId,
}: CreateBrowserRequestHeadersOptions): Headers {
  const normalizedMethod = method.toUpperCase()
  const headers = new Headers(rawHeaders)

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  if (!headers.has('X-Requested-With')) {
    headers.set('X-Requested-With', 'XMLHttpRequest')
  }

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (!isSafeHttpMethod(normalizedMethod) && xsrfToken && !headers.has('X-XSRF-TOKEN')) {
    headers.set('X-XSRF-TOKEN', xsrfToken)
  }

  if (socketId && !headers.has('X-Socket-ID')) {
    headers.set('X-Socket-ID', socketId)
  }

  return headers
}

export async function executeBrowserRequestWithCsrf(
  method: string,
  executeRequest: () => Promise<Response>,
  retryOnCsrfMismatch = true
): Promise<Response> {
  const normalizedMethod = method.toUpperCase()

  if (typeof window !== 'undefined' && !isSafeHttpMethod(normalizedMethod)) {
    await ensureCsrfCookie()
  }

  let response = await executeRequest()

  if (
    retryOnCsrfMismatch &&
    typeof window !== 'undefined' &&
    !isSafeHttpMethod(normalizedMethod) &&
    response.status === 419
  ) {
    await ensureCsrfCookie(true)
    response = await executeRequest()
  }

  return response
}
