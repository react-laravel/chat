import { describe, expect, it, vi, beforeEach } from 'vitest'
import { getSafeStorage } from '../storage'

describe('storage', () => {
  beforeEach(() => {
    // Reset the mock localStorage
    ;(window.localStorage as unknown as Record<string, unknown>).clear()
  })

  describe('getSafeStorage', () => {
    it('should return localStorage when available', () => {
      const storage = getSafeStorage()
      expect(storage).toBe(window.localStorage)
    })

    it('should return memory storage when localStorage throws', () => {
      const originalSetItem = window.localStorage.setItem
      window.localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError')
      })

      const storage = getSafeStorage()
      expect(storage).not.toBe(window.localStorage)
      // Should still be usable
      expect(typeof storage.setItem).toBe('function')
      expect(typeof storage.getItem).toBe('function')
      expect(typeof storage.removeItem).toBe('function')

      window.localStorage.setItem = originalSetItem
    })

    it('should return memory storage when in non-browser environment', () => {
      const originalWindow = global.window
      // @ts-expect-error - testing non-browser environment
      delete global.window

      const storage = getSafeStorage()
      expect(typeof storage.setItem).toBe('function')
      expect(typeof storage.getItem).toBe('function')

      global.window = originalWindow
    })

    it('memory storage should support get/set/remove', () => {
      // Force memory storage by making localStorage fail
      const originalSetItem = window.localStorage.setItem
      window.localStorage.setItem = vi.fn(() => {
        throw new Error('Storage disabled')
      })

      const storage = getSafeStorage()

      storage.setItem('test-key', 'test-value')
      expect(storage.getItem('test-key')).toBe('test-value')

      storage.removeItem('test-key')
      expect(storage.getItem('test-key')).toBeNull()

      window.localStorage.setItem = originalSetItem
    })

    it('memory storage should return null for missing keys', () => {
      const originalSetItem = window.localStorage.setItem
      window.localStorage.setItem = vi.fn(() => {
        throw new Error('Storage disabled')
      })

      const storage = getSafeStorage()
      expect(storage.getItem('non-existent-key')).toBeNull()

      window.localStorage.setItem = originalSetItem
    })
  })
})
