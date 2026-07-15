'use client'

import { ensureCsrfCookie, getXsrfTokenFromCookie } from './browser-request'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ApiRequestError extends ApiError {
  constructor(
    message: string,
    status: number,
    public readonly data?: Record<string, unknown>
  ) {
    super(message, status, data)
    this.name = 'ApiRequestError'
  }
}

interface ApiEnvelope<T> {
  success?: boolean
  message?: string
  data?: T
  errors?: unknown
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function unwrapApiPayload<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data as T
  }
  return payload as T
}

export async function apiRequest<T>(
  endpoint: string,
  method = 'GET',
  data?: unknown,
  options: { suppressUnauthorizedRedirect?: boolean } = {}
): Promise<T> {
  const normalizedMethod = method.toUpperCase()
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  if (!SAFE_METHODS.has(normalizedMethod)) await ensureCsrfCookie()

  const headers = new Headers({
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  })
  const isFormData = data instanceof FormData
  if (!isFormData) headers.set('Content-Type', 'application/json')

  const xsrfToken = getXsrfTokenFromCookie()
  if (!SAFE_METHODS.has(normalizedMethod) && xsrfToken) headers.set('X-XSRF-TOKEN', xsrfToken)

  const response = await fetch(`/api${path}`, {
    method: normalizedMethod,
    credentials: 'include',
    headers,
    body: data === undefined ? undefined : isFormData ? data : JSON.stringify(data),
  })

  let payload: ApiEnvelope<T> | null = null
  if (response.status !== 204) {
    payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null
  }

  if (!response.ok) {
    const error = new ApiRequestError(
      payload?.message || `请求失败 (${response.status})`,
      response.status,
      payload as Record<string, unknown> | undefined
    )
    if (response.status === 401 && !options.suppressUnauthorizedRedirect && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chat:unauthorized'))
    }
    throw error
  }

  return unwrapApiPayload<T>(payload)
}

export const get = <T>(endpoint: string): Promise<T> => apiRequest<T>(endpoint)
export const post = <T>(endpoint: string, data?: unknown): Promise<T> =>
  apiRequest<T>(endpoint, 'POST', data)
export const put = <T>(endpoint: string, data?: unknown): Promise<T> =>
  apiRequest<T>(endpoint, 'PUT', data)
export const patch = <T>(endpoint: string, data?: unknown): Promise<T> =>
  apiRequest<T>(endpoint, 'PATCH', data)
export const del = <T>(endpoint: string, data?: unknown): Promise<T> =>
  apiRequest<T>(endpoint, 'DELETE', data)

