export const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

export function getApiBaseUrl(): string {
  return API_URL
}

export function isIpAddress(host: string): boolean {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(':')
}
