import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMessageSearch } from '../useMessageSearch'

const createMessage = (id: number, text: string, userName: string): any => ({
  id,
  room_id: 1,
  user_id: 1,
  message: text,
  message_type: 'text',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user: { id: 1, name: userName, email: 'test@test.com' },
})

describe('useMessageSearch', () => {
  const messages = [
    createMessage(1, 'Hello world', 'Alice'),
    createMessage(2, 'Good morning', 'Bob'),
    createMessage(3, 'Hello everyone', 'Charlie'),
    createMessage(4, 'Good night', 'Alice'),
    createMessage(5, 'Another message', 'Bob'),
  ]

  describe('initial state', () => {
    it('should have empty search query', () => {
      const { result } = renderHook(() => useMessageSearch(messages))
      expect(result.current.searchQuery).toBe('')
    })

    it('should have isOpen false', () => {
      const { result } = renderHook(() => useMessageSearch(messages))
      expect(result.current.isOpen).toBe(false)
    })

    it('should have empty visibleMessages', () => {
      const { result } = renderHook(() => useMessageSearch(messages))
      expect(result.current.visibleMessages).toEqual([])
    })

    it('should have hasMore false with empty search', () => {
      const { result } = renderHook(() => useMessageSearch(messages))
      expect(result.current.hasMore).toBe(false)
    })
  })

  describe('setSearchQuery', () => {
    it('should update search query', () => {
      const { result } = renderHook(() => useMessageSearch(messages))

      act(() => {
        result.current.setSearchQuery('hello')
      })

      expect(result.current.searchQuery).toBe('hello')
    })

    it('should reset visibleCount when search query changes', () => {
      const { result } = renderHook(() => useMessageSearch(messages))

      act(() => {
        result.current.setSearchQuery('hello')
      })

      // After search, visibleCount resets to PAGE_SIZE (50)
      expect(result.current.hasMore).toBe(false) // only 2 results, less than 50
    })
  })

  describe('filtering', () => {
    it('should filter messages by message content', () => {
      const { result } = renderHook(() => useMessageSearch(messages))

      act(() => {
        result.current.setSearchQuery('Hello')
      })

      expect(result.current.visibleMessages).toHaveLength(2)
      expect(result.current.visibleMessages[0].id).toBe(1)
      expect(result.current.visibleMessages[1].id).toBe(3)
    })

    it('should filter messages by user name', () => {
      const { result } = renderHook(() => useMessageSearch(messages))

      act(() => {
        result.current.setSearchQuery('Alice')
      })

      expect(result.current.visibleMessages).toHaveLength(2)
      expect(result.current.visibleMessages[0].user.name).toBe('Alice')
      expect(result.current.visibleMessages[1].user.name).toBe('Alice')
    })

    it('should be case-insensitive', () => {
      const { result } = renderHook(() => useMessageSearch(messages))

      act(() => {
        result.current.setSearchQuery('HELLO')
      })

      expect(result.current.visibleMessages).toHaveLength(2)
    })

    it('should return empty for no matches', () => {
      const { result } = renderHook(() => useMessageSearch(messages))

      act(() => {
        result.current.setSearchQuery('nonexistent')
      })

      expect(result.current.visibleMessages).toHaveLength(0)
    })

    it('should return empty for whitespace-only query', () => {
      const { result } = renderHook(() => useMessageSearch(messages))

      act(() => {
        result.current.setSearchQuery('   ')
      })

      expect(result.current.visibleMessages).toEqual([])
    })
  })

  describe('loadMore', () => {
    it('should increase visible messages', () => {
      // Create enough messages to test pagination
      const manyMessages = Array.from({ length: 60 }, (_, i) =>
        createMessage(i + 1, `Message ${i + 1}`, `User${i + 1}`)
      )

      const { result } = renderHook(() => useMessageSearch(manyMessages))

      act(() => {
        result.current.setSearchQuery('Message')
      })

      expect(result.current.visibleMessages).toHaveLength(50)
      expect(result.current.hasMore).toBe(true)

      act(() => {
        result.current.loadMore()
      })

      expect(result.current.visibleMessages).toHaveLength(60)
      expect(result.current.hasMore).toBe(false)
    })

    it('should not exceed total messages', () => {
      const fewMessages = [createMessage(1, 'Hello', 'Alice'), createMessage(2, 'World', 'Bob')]

      const { result } = renderHook(() => useMessageSearch(fewMessages))

      act(() => {
        result.current.setSearchQuery('Hello')
      })

      act(() => {
        result.current.loadMore()
      })

      expect(result.current.visibleMessages).toHaveLength(1)
    })
  })

  describe('handleMessageSelect', () => {
    it('should call onMessageSelect and close', () => {
      const onMessageSelect = vi.fn()
      const { result } = renderHook(() => useMessageSearch(messages, onMessageSelect))

      act(() => {
        result.current.setSearchQuery('Hello')
      })

      act(() => {
        result.current.handleMessageSelect(1)
      })

      expect(onMessageSelect).toHaveBeenCalledWith(1)
      expect(result.current.isOpen).toBe(false)
      expect(result.current.searchQuery).toBe('')
    })

    it('should work without onMessageSelect callback', () => {
      const { result } = renderHook(() => useMessageSearch(messages))

      act(() => {
        result.current.setSearchQuery('Hello')
      })

      // Should not throw
      act(() => {
        result.current.handleMessageSelect(1)
      })

      expect(result.current.isOpen).toBe(false)
    })
  })

  describe('setIsOpen', () => {
    it('should toggle open state', () => {
      const { result } = renderHook(() => useMessageSearch(messages))

      act(() => {
        result.current.setIsOpen(true)
      })
      expect(result.current.isOpen).toBe(true)

      act(() => {
        result.current.setIsOpen(false)
      })
      expect(result.current.isOpen).toBe(false)
    })
  })
})
