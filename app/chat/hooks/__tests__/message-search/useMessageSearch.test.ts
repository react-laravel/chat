import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMessageSearch } from '@/app/chat/hooks/message-search/useMessageSearch'

const createMessage = (id: number, message: string, userName: string = 'TestUser'): unknown => ({
  id,
  room_id: 1,
  user_id: 1,
  message,
  message_type: 'text',
  created_at: '2026-03-05T10:00:00.000Z',
  updated_at: '2026-03-05T10:00:00.000Z',
  user: { id: 1, name: userName, email: 'test@test.com' },
})

describe('useMessageSearch', () => {
  it('initializes with default values', () => {
    const messages = [createMessage(1, 'hello'), createMessage(2, 'world')] as any[]
    const { result } = renderHook(() => useMessageSearch(messages))
    expect(result.current.searchQuery).toBe('')
    expect(result.current.isOpen).toBe(false)
    expect(result.current.visibleMessages).toEqual([])
    expect(result.current.hasMore).toBe(false)
  })

  it('filters messages by content', () => {
    const messages = [
      createMessage(1, 'hello world', 'Alice'),
      createMessage(2, 'goodbye world', 'Bob'),
    ] as any[]
    const { result } = renderHook(() => useMessageSearch(messages))

    act(() => {
      result.current.setSearchQuery('hello')
    })

    expect(result.current.visibleMessages).toHaveLength(1)
    expect(result.current.visibleMessages[0].message).toBe('hello world')
  })

  it('filters messages by user name', () => {
    const messages = [createMessage(1, 'hello', 'Alice'), createMessage(2, 'hello', 'Bob')] as any[]
    const { result } = renderHook(() => useMessageSearch(messages))

    act(() => {
      result.current.setSearchQuery('Alice')
    })

    expect(result.current.visibleMessages).toHaveLength(1)
    expect((result.current.visibleMessages[0] as any).user.name).toBe('Alice')
  })

  it('is case insensitive', () => {
    const messages = [createMessage(1, 'HELLO world', 'Alice')] as any[]
    const { result } = renderHook(() => useMessageSearch(messages))

    act(() => {
      result.current.setSearchQuery('hello')
    })

    expect(result.current.visibleMessages).toHaveLength(1)
  })

  it('returns empty array when no matches', () => {
    const messages = [createMessage(1, 'hello', 'Alice')] as any[]
    const { result } = renderHook(() => useMessageSearch(messages))

    act(() => {
      result.current.setSearchQuery('zzz')
    })

    expect(result.current.visibleMessages).toEqual([])
  })

  it('resets visible count when search query changes', () => {
    const messages = Array.from({ length: 60 }, (_, i) =>
      createMessage(i + 1, `message ${i + 1}`)
    ) as any[]
    const { result } = renderHook(() => useMessageSearch(messages))

    act(() => {
      result.current.setSearchQuery('message')
    })

    expect(result.current.visibleMessages.length).toBeLessThanOrEqual(50)

    act(() => {
      result.current.setSearchQuery('message 1')
    })

    expect(result.current.visibleMessages.length).toBeLessThanOrEqual(50)
  })

  it('loads more messages', () => {
    const messages = Array.from({ length: 60 }, (_, i) =>
      createMessage(i + 1, `message ${i + 1}`)
    ) as any[]
    const { result } = renderHook(() => useMessageSearch(messages))

    act(() => {
      result.current.setSearchQuery('message')
    })

    const initialCount = result.current.visibleMessages.length

    act(() => {
      result.current.loadMore()
    })

    expect(result.current.visibleMessages.length).toBeGreaterThan(initialCount)
  })

  it('indicates hasMore when there are more results', () => {
    const messages = Array.from({ length: 60 }, (_, i) =>
      createMessage(i + 1, `message ${i + 1}`)
    ) as any[]
    const { result } = renderHook(() => useMessageSearch(messages))

    act(() => {
      result.current.setSearchQuery('message')
    })

    expect(result.current.hasMore).toBe(true)
  })

  it('closes and resets on message select', () => {
    const onMessageSelect = vi.fn()
    const messages = [createMessage(1, 'hello', 'Alice')] as any[]
    const { result } = renderHook(() => useMessageSearch(messages, onMessageSelect))

    act(() => {
      result.current.setSearchQuery('hello')
    })

    act(() => {
      result.current.handleMessageSelect(1)
    })

    expect(result.current.isOpen).toBe(false)
    expect(result.current.searchQuery).toBe('')
    expect(onMessageSelect).toHaveBeenCalledWith(1)
  })

  it('allows opening and closing the search', () => {
    const messages: any[] = []
    const { result } = renderHook(() => useMessageSearch(messages))

    expect(result.current.isOpen).toBe(false)

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
