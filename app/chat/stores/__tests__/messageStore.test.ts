import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'

// Use vi.hoisted() so mocks are available when vi.mock() factories run
const mockChatCache = vi.hoisted(() => ({
  getCachedMessages: vi.fn(),
  cacheMessages: vi.fn(),
  addMessageToCache: vi.fn(),
}))

const mockApiGet = vi.hoisted(() => vi.fn())
const mockHandleChatApiError = vi.hoisted(() =>
  vi.fn((error, context) => {
    const err = new Error(context || 'Error')
    return err
  })
)

vi.mock('@/lib/api', () => ({
  get: (...args) => mockApiGet(...args),
}))

vi.mock('@/lib/api/chat-error-handler', () => ({
  handleChatApiError: mockHandleChatApiError,
}))

vi.mock('@/lib/cache/chat-cache', () => ({
  default: mockChatCache,
}))

// Import after mocks
import { useMessageStore } from '../messageStore'

const createMockMessage = (id: number, roomId: number): any => ({
  id,
  room_id: roomId,
  user_id: 1,
  message: `Message ${id}`,
  message_type: 'text',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user: { id: 1, name: 'Alice', email: 'alice@example.com' },
})

const createMockPagination = (hasMore = true, currentPage = 1): any => ({
  current_page: currentPage,
  has_more: hasMore,
  total: 10,
  per_page: 10,
})

describe('messageStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useMessageStore.setState({
      messages: {},
      messagesPagination: {},
      isLoading: false,
      error: null,
    })
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useMessageStore.getState()
      expect(state.messages).toEqual({})
      expect(state.messagesPagination).toEqual({})
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('addMessage', () => {
    it('should add message to a room', () => {
      const message = createMockMessage(1, 1)
      useMessageStore.getState().addMessage(1, message)
      expect(useMessageStore.getState().messages['1']).toHaveLength(1)
      expect(useMessageStore.getState().messages['1'][0].id).toBe(1)
    })

    it('should append message to existing messages', () => {
      const msg1 = createMockMessage(1, 1)
      const msg2 = createMockMessage(2, 1)
      useMessageStore.getState().addMessage(1, msg1)
      useMessageStore.getState().addMessage(1, msg2)
      expect(useMessageStore.getState().messages['1']).toHaveLength(2)
    })

    it('should not add duplicate messages', () => {
      const message = createMockMessage(1, 1)
      useMessageStore.getState().addMessage(1, message)
      useMessageStore.getState().addMessage(1, message)
      expect(useMessageStore.getState().messages['1']).toHaveLength(1)
    })

    it('should add to different rooms independently', () => {
      const msg1 = createMockMessage(1, 1)
      const msg2 = createMockMessage(2, 2)
      useMessageStore.getState().addMessage(1, msg1)
      useMessageStore.getState().addMessage(2, msg2)
      expect(useMessageStore.getState().messages['1']).toHaveLength(1)
      expect(useMessageStore.getState().messages['2']).toHaveLength(1)
    })
  })

  describe('loadMessages', () => {
    it('should load messages from cache on page 1', async () => {
      const cachedMessages = [createMockMessage(1, 1)]
      const cachedPagination = createMockPagination(false, 1)
      mockChatCache.getCachedMessages.mockReturnValue({
        messages: cachedMessages,
        pagination: cachedPagination,
      })

      await useMessageStore.getState().loadMessages(1, 1)

      expect(mockChatCache.getCachedMessages).toHaveBeenCalledWith('1')
      expect(useMessageStore.getState().messages['1']).toHaveLength(1)
      expect(useMessageStore.getState().isLoading).toBe(false)
      // Should not call API when cache hit
      expect(mockApiGet).not.toHaveBeenCalled()
    })

    it('should fetch from API when no cache on page 1', async () => {
      mockChatCache.getCachedMessages.mockReturnValue(null)
      const apiMessages = [createMockMessage(1, 1), createMockMessage(2, 1)]
      mockApiGet.mockResolvedValue({
        data: apiMessages,
        current_page: 1,
        has_more: true,
        total: 10,
      })

      await useMessageStore.getState().loadMessages(1, 1)

      expect(mockApiGet).toHaveBeenCalledWith('/chat/rooms/1/messages?page=1')
      expect(useMessageStore.getState().messages['1']).toHaveLength(2)
      expect(useMessageStore.getState().isLoading).toBe(false)
    })

    it('should always fetch from API on page > 1', async () => {
      mockChatCache.getCachedMessages.mockReturnValue(null)
      const apiMessages = [createMockMessage(3, 1)]
      mockApiGet.mockResolvedValue({
        data: apiMessages,
        current_page: 2,
        has_more: true,
        total: 10,
      })

      await useMessageStore.getState().loadMessages(1, 2)

      expect(mockApiGet).toHaveBeenCalledWith('/chat/rooms/1/messages?page=2')
      expect(useMessageStore.getState().messages['1']).toHaveLength(1)
    })

    it('should handle API error', async () => {
      mockChatCache.getCachedMessages.mockReturnValue(null)
      mockApiGet.mockRejectedValue(new Error('Network error'))

      await expect(useMessageStore.getState().loadMessages(1, 1)).rejects.toThrow()
      expect(useMessageStore.getState().error).toBeTruthy()
      expect(useMessageStore.getState().isLoading).toBe(false)
    })
  })

  describe('loadMoreMessages', () => {
    it('should load more messages when has_more is true', async () => {
      const initialMessages = [createMockMessage(1, 1)]
      const moreMessages = [createMockMessage(2, 1)]
      useMessageStore.setState({
        messages: { '1': initialMessages },
        messagesPagination: {
          '1': { ...createMockPagination(true, 1), current_page: 1 },
        },
      })

      mockApiGet.mockResolvedValue({
        data: moreMessages,
        current_page: 2,
        has_more: false,
        total: 3,
      })

      await useMessageStore.getState().loadMoreMessages(1)

      // Should prepend new messages
      expect(useMessageStore.getState().messages['1']).toHaveLength(2)
      expect(useMessageStore.getState().messages['1'][0].id).toBe(2)
      expect(useMessageStore.getState().messages['1'][1].id).toBe(1)
    })

    it('should not load more when has_more is false', async () => {
      useMessageStore.setState({
        messages: { '1': [createMockMessage(1, 1)] },
        messagesPagination: {
          '1': { ...createMockPagination(false, 1), current_page: 1 },
        },
      })

      await useMessageStore.getState().loadMoreMessages(1)
      expect(mockApiGet).not.toHaveBeenCalled()
    })

    it('should not load more when no pagination', async () => {
      useMessageStore.setState({
        messages: { '1': [createMockMessage(1, 1)] },
        messagesPagination: {},
      })

      await useMessageStore.getState().loadMoreMessages(1)
      expect(mockApiGet).not.toHaveBeenCalled()
    })

    it('should handle error during load more', async () => {
      useMessageStore.setState({
        messages: { '1': [createMockMessage(1, 1)] },
        messagesPagination: {
          '1': { ...createMockPagination(true, 1), current_page: 1 },
        },
      })

      mockApiGet.mockRejectedValue(new Error('Network error'))

      await expect(useMessageStore.getState().loadMoreMessages(1)).rejects.toThrow()
      expect(useMessageStore.getState().error).toBeTruthy()
    })
  })

  describe('clearMessages', () => {
    it('should clear messages for a room', () => {
      useMessageStore.setState({
        messages: {
          '1': [createMockMessage(1, 1)],
          '2': [createMockMessage(2, 2)],
        },
        messagesPagination: {
          '1': createMockPagination(true, 1),
        },
      })

      useMessageStore.getState().clearMessages(1)
      expect(useMessageStore.getState().messages['1']).toBeUndefined()
      expect(useMessageStore.getState().messagesPagination['1']).toBeUndefined()
      // Other rooms should be unaffected
      expect(useMessageStore.getState().messages['2']).toHaveLength(1)
    })
  })
})
