import { useState } from 'react'
import useSWRInfinite from 'swr/infinite'
import { apiRequest } from '@/lib/api'
import { useDebounce } from '@/hooks/useDebounce'
import useAuthStore from '@/stores/authStore'
import { toPagination, type JsonApiPaginatedResponse } from '@/lib/utils/pagination'
import type { ChatMessage } from '../../types'
import { normalizeIncomingMessage } from '../../utils/typeGuards'

export function useRoomMessageSearch(roomId: number, open: boolean) {
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query.trim(), 300)
  const userId = useAuthStore(state => state.user?.id)
  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite<
    JsonApiPaginatedResponse<ChatMessage>
  >(
    (index, previous) => {
      if (!open || !debounced || !userId || (previous && !toPagination(previous).has_more))
        return null
      return [
        `/chat/rooms/${roomId}/messages/search?q=${encodeURIComponent(debounced)}&page=${index + 1}`,
        userId,
      ]
    },
    ([url]: [string, number]) => apiRequest(url),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  )
  const results =
    query.trim() === debounced
      ? (data ?? [])
          .flatMap(page => page.data)
          .map(normalizeIncomingMessage)
          .filter((message): message is ChatMessage => message !== null)
      : []
  const unique = [...new Map(results.map(message => [message.id, message])).values()]
  const last = data?.at(-1)
  return {
    query,
    setQuery,
    results: unique,
    loading: isLoading || isValidating || query.trim() !== debounced,
    error: error instanceof Error ? error.message : null,
    total: data?.[0] ? toPagination(data[0]).total : 0,
    hasMore: Boolean(last && toPagination(last).has_more),
    loadMore: () => setSize(size + 1),
    retry: () => mutate(),
  }
}
