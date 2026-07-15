import { API_URL } from './url'
import {
  createBrowserRequestHeaders,
  ensureCsrfCookie,
  executeBrowserRequestWithCsrf,
  getXsrfTokenFromCookie,
} from './browser-request'

export { getXsrfTokenFromCookie }

export const ensureBrowserCsrfCookie = ensureCsrfCookie

interface AuthenticatedBrowserFetchInit extends RequestInit {
  token?: string | null
}

export async function authenticatedBrowserFetch(
  input: RequestInfo | URL,
  init: AuthenticatedBrowserFetchInit = {},
  retryOnCsrfMismatch = true
): Promise<Response> {
  const { token, headers: rawHeaders, method = 'GET', body, ...rest } = init
  const normalizedMethod = method.toUpperCase()

  const executeRequest = () =>
    fetch(input, {
      ...rest,
      method: normalizedMethod,
      body,
      headers: createBrowserRequestHeaders({
        method: normalizedMethod,
        headers: rawHeaders,
        token,
        isFormData: body instanceof FormData,
        xsrfToken: getXsrfTokenFromCookie(),
      }),
      credentials: 'include',
    })

  return executeBrowserRequestWithCsrf(normalizedMethod, executeRequest, retryOnCsrfMismatch)
}
