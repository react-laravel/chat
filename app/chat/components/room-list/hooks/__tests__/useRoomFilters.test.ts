import { describe, expect, it, vi } from 'vitest'
import { useRoomFilters } from '../useRoomFilters'
import { renderHook } from '@testing-library/react'
import type { ChatRoom } from '@/app/chat/types'

vi.mock('@/app/chat/chatStore', () => ({
  default: () => ({
    getRoomUnreadCount: vi.fn(() => 0),
  }),
}))

const createRoom = (overrides: Partial<ChatRoom> = {}): ChatRoom => ({
  id: 1,
  name: 'Test Room',
  description: 'A test room',
  created_by: 1,
  is_active: true,
  is_private: false,
  created_at: '2026-03-05T10:00:00.000Z',
  updated_at: '2026-03-05T10:00:00.000Z',
  online_count: 0,
  ...overrides,
})

describe('useRoomFilters', () => {
  const baseProps = {
    rooms: [
      createRoom({ id: 1, name: 'Alpha' }),
      createRoom({ id: 2, name: 'Beta', description: 'Beta room' }),
    ],
    searchQuery: '',
    filterType: 'all' as const,
    favoriteRooms: new Set<number>() as Set<number>,
    recentRooms: [] as number[],
  }

  it('returns all rooms when no filter is applied', () => {
    const { result } = renderHook(() => useRoomFilters(baseProps))
    expect(result.current).toHaveLength(2)
  })

  it('filters rooms by search query matching name', () => {
    const { result } = renderHook(() => useRoomFilters({ ...baseProps, searchQuery: 'alpha' }))
    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('Alpha')
  })

  it('filters rooms by search query matching description', () => {
    const { result } = renderHook(() => useRoomFilters({ ...baseProps, searchQuery: 'beta room' }))
    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('Beta')
  })

  it('returns empty array when search query matches nothing', () => {
    const { result } = renderHook(() =>
      useRoomFilters({ ...baseProps, searchQuery: 'nonexistent' })
    )
    expect(result.current).toHaveLength(0)
  })

  it('is case insensitive for search', () => {
    const { result } = renderHook(() => useRoomFilters({ ...baseProps, searchQuery: 'ALPHA' }))
    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('Alpha')
  })

  it('filters by favorites', () => {
    const favorites = new Set<number>([1])
    const { result } = renderHook(() =>
      useRoomFilters({ ...baseProps, filterType: 'favorites', favoriteRooms: favorites })
    )
    expect(result.current).toHaveLength(1)
    expect(result.current[0].id).toBe(1)
  })

  it('filters by recent rooms', () => {
    const recent = [2]
    const { result } = renderHook(() =>
      useRoomFilters({ ...baseProps, filterType: 'recent', recentRooms: recent })
    )
    expect(result.current).toHaveLength(1)
    expect(result.current[0].id).toBe(2)
  })

  it('sorts recent rooms by recency order', () => {
    const rooms = [
      createRoom({ id: 1, name: 'First' }),
      createRoom({ id: 2, name: 'Second' }),
      createRoom({ id: 3, name: 'Third' }),
    ]
    const recent = [3, 1]
    const { result } = renderHook(() =>
      useRoomFilters({
        rooms,
        searchQuery: '',
        filterType: 'recent',
        favoriteRooms: new Set(),
        recentRooms: recent,
      })
    )
    expect(result.current.map(r => r.id)).toEqual([3, 1])
  })

  it('returns empty array when rooms is not an array', () => {
    const { result } = renderHook(() =>
      useRoomFilters({ ...baseProps, rooms: null as unknown as ChatRoom[] })
    )
    expect(result.current).toEqual([])
  })
})
