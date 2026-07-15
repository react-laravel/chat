/**
 * Shared pagination utilities - extracted to resolve DRY violation
 * Previously duplicated in chatStore.ts and messageStore.ts
 */

export type JsonApiPaginatedResponse<T> = {
  data: T[]
  meta?: {
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
  }
  links?: {
    next?: string | null
  }
}

export type MessagePagination = {
  data: unknown[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  has_more: boolean
}

/**
 * Convert a JSON:API paginated response to internal MessagePagination format.
 * Previously duplicated in chatStore.ts and messageStore.ts.
 */
export function toPagination<T>(
  response: JsonApiPaginatedResponse<T>
): Omit<MessagePagination, 'data'> & { data: T[] } {
  const meta = response.meta ?? {}
  const currentPage = meta.current_page ?? 1
  const lastPage = meta.last_page ?? currentPage

  return {
    data: response.data,
    current_page: currentPage,
    last_page: lastPage,
    per_page: meta.per_page ?? response.data.length,
    total: meta.total ?? response.data.length,
    has_more: Boolean(response.links?.next) || currentPage < lastPage,
  }
}
