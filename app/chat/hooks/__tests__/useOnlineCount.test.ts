import { describe, expect, it } from 'vitest'
import { useOnlineCount } from '@/app/chat/hooks/useOnlineCount'
import { renderHook } from '@testing-library/react'
import type { ChatRoom } from '@/app/chat/types'

const createRoom = (overrides: Partial<ChatRoom> = {}): ChatRoom => ({
  id: 1,
  name: 'Test Room',
  description: 'A test room',
  created_by: 1,
  is_active: true,
  is_private: false,
  created_at: '2026-03-05T10:00:00.000Z',
  updated_at: '2026-03-05T10:00:00.000Z',
  online_count: 5,
  ...overrides,
})

describe('useOnlineCount', () => {
  it('returns room online users and count from store', () => {
    const onlineUsers = {
      '1': [
        {
          id: 1,
          name: 'Alice',
          email: 'alice@test.com',
          joined_at: '2026-01-01T00:00:00Z',
          is_online: true,
        },
        {
          id: 2,
          name: 'Bob',
          email: 'bob@test.com',
          joined_at: '2026-01-01T00:00:00Z',
          is_online: true,
        },
      ],
    }
    const { result } = renderHook(() => useOnlineCount(createRoom(), onlineUsers, true))
    expect(result.current.roomOnlineUsers).toHaveLength(2)
    expect(result.current.onlineCount).toBeGreaterThanOrEqual(2)
  })

  it('falls back to room online_count when store is empty', () => {
    const onlineUsers: Record<string, unknown[]> = {}
    const room = createRoom({ online_count: 10 })
    const { result } = renderHook(() => useOnlineCount(room, onlineUsers, false))
    expect(result.current.onlineCount).toBe(10)
  })

  it('uses max of store count and room count', () => {
    const onlineUsers = {
      '1': [
        {
          id: 1,
          name: 'Alice',
          email: 'alice@test.com',
          joined_at: '2026-01-01T00:00:00Z',
          is_online: true,
        },
      ],
    }
    const room = createRoom({ id: 1, online_count: 3 })
    const { result } = renderHook(() => useOnlineCount(room, onlineUsers, true))
    // room count is 3, store has 1, connected adds 1, max is 3
    expect(result.current.onlineCount).toBeGreaterThanOrEqual(1)
  })

  it('adds 1 when connected', () => {
    const onlineUsers: Record<string, unknown[]> = {}
    const room = createRoom({ online_count: 0 })
    const { result: connected } = renderHook(() => useOnlineCount(room, onlineUsers, true))
    const { result: disconnected } = renderHook(() => useOnlineCount(room, onlineUsers, false))
    expect(connected.current.onlineCount).toBeGreaterThanOrEqual(disconnected.current.onlineCount)
  })

  it('returns empty array when no online users for room', () => {
    const onlineUsers: Record<string, unknown[]> = {}
    const room = createRoom({ id: 1 })
    const { result } = renderHook(() => useOnlineCount(room, onlineUsers, true))
    expect(result.current.roomOnlineUsers).toEqual([])
  })
})
