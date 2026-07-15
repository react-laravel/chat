/**
 * 消息相关状态管理
 * 2026-03-20 AI refactor: extracted duplicated toPagination to lib/utils/pagination.ts
 */
import { create } from 'zustand'
import type { ChatMessage, MessagePagination } from '../types'
import chatCache from '@/lib/cache/chat-cache'
import { get as apiGet } from '@/lib/api'
import { handleChatApiError } from '@/lib/api/chat-error-handler'
import { toPagination, type JsonApiPaginatedResponse } from '@/lib/utils/pagination'

interface MessageState {
  messages: Record<string, ChatMessage[]>
  messagesPagination: Record<string, MessagePagination>
  isLoading: boolean
  error: Error | null
}

interface MessageActions {
  addMessage: (roomId: number, message: ChatMessage) => void
  loadMessages: (roomId: number, page?: number) => Promise<void>
  loadMoreMessages: (roomId: number) => Promise<void>
  clearMessages: (roomId: number) => void
}

export type MessageStore = MessageState & MessageActions

export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: {},
  messagesPagination: {},
  isLoading: false,
  error: null,

  addMessage: (roomId, message) => {
    const roomKey = roomId.toString()
    const currentMessages = get().messages[roomKey] ?? []

    const messageExists = currentMessages.some(m => m.id === message.id)
    if (messageExists) {
      console.log('消息已存在，跳过:', message.id)
      return
    }

    chatCache.addMessageToCache(roomKey, message)

    set(prevState => ({
      messages: {
        ...prevState.messages,
        [roomKey]: [...(prevState.messages[roomKey] ?? []), message],
      },
    }))
  },

  loadMessages: async (roomId, page = 1) => {
    const roomKey = roomId.toString()

    if (page === 1) {
      const cached = chatCache.getCachedMessages(roomKey)
      if (cached) {
        console.log('使用缓存的消息')
        set(state => ({
          messages: {
            ...state.messages,
            [roomKey]: cached.messages,
          },
          messagesPagination: {
            ...state.messagesPagination,
            [roomKey]: cached.pagination as MessagePagination,
          },
          isLoading: false,
        }))
        return
      }
    }

    set({ isLoading: true, error: null })
    try {
      const response = await apiGet<JsonApiPaginatedResponse<ChatMessage>>(
        `/chat/rooms/${roomId}/messages?page=${page}`
      )
      const paginationData = toPagination(response)

      if (page === 1) {
        chatCache.cacheMessages(roomKey, response.data, paginationData)
      }

      set(state => ({
        messages: {
          ...state.messages,
          [roomKey]: response.data,
        },
        messagesPagination: {
          ...state.messagesPagination,
          [roomKey]: paginationData,
        },
        isLoading: false,
      }))
    } catch (error) {
      const chatError = handleChatApiError(error, '加载消息失败', {
        showToast: true,
        retryable: true,
      })
      set({
        error: chatError,
        isLoading: false,
      })
      throw chatError
    }
  },

  loadMoreMessages: async roomId => {
    const roomKey = roomId.toString()
    const currentPagination = get().messagesPagination[roomKey]

    if (!currentPagination || !currentPagination.has_more) {
      return
    }

    const nextPage = currentPagination.current_page + 1

    try {
      const response = await apiGet<JsonApiPaginatedResponse<ChatMessage>>(
        `/chat/rooms/${roomId}/messages?page=${nextPage}`
      )
      const paginationData = toPagination(response)

      set(state => {
        const currentMessages = state.messages[roomKey] ?? []

        return {
          messages: {
            ...state.messages,
            [roomKey]: [...response.data, ...currentMessages],
          },
          messagesPagination: {
            ...state.messagesPagination,
            [roomKey]: paginationData,
          },
          error: null,
        }
      })
    } catch (error) {
      const chatError = handleChatApiError(error, '加载更多消息失败', {
        showToast: true,
        retryable: true,
      })
      set({ error: chatError })
      throw chatError
    }
  },

  clearMessages: roomId => {
    set(state => {
      const newState = { ...state }
      const roomKey = roomId.toString()

      delete newState.messages[roomKey]
      delete newState.messagesPagination[roomKey]

      return newState
    })
  },
}))
