import { describe, expect, it, vi } from 'vitest'
import { useRoomPreferences } from '@/app/chat/components/room-list/hooks/useRoomPreferences'
import { renderHook, act } from '@testing-library/react'

describe('useRoomPreferences', () => {
  it('initializes with empty favorite and recent rooms', () => {
    localStorage.getItem = vi.fn(() => null)
    const { result } = renderHook(() => useRoomPreferences())
    expect(result.current.favoriteRooms.size).toBe(0)
    expect(result.current.recentRooms).toEqual([])
  })

  it('toggles favorite room', () => {
    localStorage.getItem = vi.fn(() => null)
    const { result } = renderHook(() => useRoomPreferences())

    act(() => {
      result.current.toggleFavorite(1)
    })
    expect(result.current.favoriteRooms.has(1)).toBe(true)

    act(() => {
      result.current.toggleFavorite(1)
    })
    expect(result.current.favoriteRooms.has(1)).toBe(false)
  })

  it('adds recent room', () => {
    localStorage.getItem = vi.fn(() => null)
    const { result } = renderHook(() => useRoomPreferences())

    act(() => {
      result.current.addRecentRoom(1)
    })
    expect(result.current.recentRooms).toContain(1)

    act(() => {
      result.current.addRecentRoom(2)
    })
    expect(result.current.recentRooms).toEqual([2, 1])
  })

  it('moves existing room to front of recent list', () => {
    localStorage.getItem = vi.fn(() => null)
    const { result } = renderHook(() => useRoomPreferences())

    act(() => {
      result.current.addRecentRoom(1)
      result.current.addRecentRoom(2)
    })

    act(() => {
      result.current.addRecentRoom(1)
    })
    expect(result.current.recentRooms).toEqual([1, 2])
  })

  it('limits recent rooms to 10', () => {
    localStorage.getItem = vi.fn(() => null)
    const { result } = renderHook(() => useRoomPreferences())

    for (let i = 1; i <= 15; i++) {
      act(() => {
        result.current.addRecentRoom(i)
      })
    }

    expect(result.current.recentRooms.length).toBeLessThanOrEqual(10)
  })
})
