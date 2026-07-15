import { describe, expect, it, vi } from 'vitest'
import {
  getSafeStorage,
  loadFavoriteRooms,
  saveFavoriteRooms,
  loadRecentRooms,
  saveRecentRooms,
} from '@/app/chat/components/room-list/utils/storage'

describe('getSafeStorage', () => {
  it('returns localStorage when available', () => {
    const storage = getSafeStorage()
    expect(storage).not.toBeNull()
    expect(storage).toBe(window.localStorage)
  })
})

describe('loadFavoriteRooms', () => {
  it('returns empty set when no stored data', () => {
    localStorage.getItem = vi.fn(() => null)
    const result = loadFavoriteRooms()
    expect(result).toEqual(new Set())
  })

  it('returns set from stored JSON', () => {
    localStorage.getItem = vi.fn(() => JSON.stringify([1, 2, 3]))
    const result = loadFavoriteRooms()
    expect(result).toEqual(new Set([1, 2, 3]))
  })

  it('returns empty set on parse error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.getItem = vi.fn(() => 'not-json')
    const result = loadFavoriteRooms()
    expect(result).toEqual(new Set())
    consoleSpy.mockRestore()
  })

  it('returns empty set when storage is unavailable', () => {
    const originalGetItem = localStorage.getItem
    localStorage.getItem = vi.fn(() => {
      throw new Error('Storage disabled')
    })
    const result = loadFavoriteRooms()
    expect(result).toEqual(new Set())
    localStorage.getItem = originalGetItem
  })
})

describe('saveFavoriteRooms', () => {
  it('saves favorites to localStorage', () => {
    const setItemSpy = vi.spyOn(localStorage, 'setItem')
    const favorites = new Set([1, 2, 3])
    saveFavoriteRooms(favorites)
    expect(setItemSpy).toHaveBeenCalledWith('chat-favorite-rooms', JSON.stringify([1, 2, 3]))
    setItemSpy.mockRestore()
  })

  it('handles empty set', () => {
    const setItemSpy = vi.spyOn(localStorage, 'setItem')
    saveFavoriteRooms(new Set())
    expect(setItemSpy).toHaveBeenCalledWith('chat-favorite-rooms', JSON.stringify([]))
    setItemSpy.mockRestore()
  })
})

describe('loadRecentRooms', () => {
  it('returns empty array when no stored data', () => {
    localStorage.getItem = vi.fn(() => null)
    expect(loadRecentRooms()).toEqual([])
  })

  it('returns array from stored JSON', () => {
    localStorage.getItem = vi.fn(() => JSON.stringify([5, 3, 1]))
    expect(loadRecentRooms()).toEqual([5, 3, 1])
  })
})

describe('saveRecentRooms', () => {
  it('saves recent rooms to localStorage', () => {
    const setItemSpy = vi.spyOn(localStorage, 'setItem')
    saveRecentRooms([1, 2, 3])
    expect(setItemSpy).toHaveBeenCalledWith('chat-recent-rooms', JSON.stringify([1, 2, 3]))
    setItemSpy.mockRestore()
  })
})
