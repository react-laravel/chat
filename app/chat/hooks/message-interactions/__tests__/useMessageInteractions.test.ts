import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMessageInteractions } from '../useMessageInteractions'

describe('useMessageInteractions', () => {
  beforeEach(() => {
    // Default to mobile width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should have showMobileMenu false', () => {
      const { result } = renderHook(() => useMessageInteractions())
      expect(result.current.showMobileMenu).toBe(false)
    })
  })

  describe('openMenu', () => {
    it('should set showMobileMenu to true', () => {
      const { result } = renderHook(() => useMessageInteractions())

      act(() => {
        result.current.openMenu()
      })

      expect(result.current.showMobileMenu).toBe(true)
    })

    it('should call onOpenMenu callback', () => {
      const onOpenMenu = vi.fn()
      const { result } = renderHook(() => useMessageInteractions({ onOpenMenu }))

      act(() => {
        result.current.openMenu()
      })

      expect(onOpenMenu).toHaveBeenCalledTimes(1)
    })

    it('should work without onOpenMenu callback', () => {
      const { result } = renderHook(() => useMessageInteractions())

      // Should not throw
      act(() => {
        result.current.openMenu()
      })

      expect(result.current.showMobileMenu).toBe(true)
    })
  })

  describe('closeMenu', () => {
    it('should set showMobileMenu to false', () => {
      const { result } = renderHook(() => useMessageInteractions())

      act(() => {
        result.current.openMenu()
      })
      expect(result.current.showMobileMenu).toBe(true)

      act(() => {
        result.current.closeMenu()
      })

      expect(result.current.showMobileMenu).toBe(false)
    })

    it('should call onCloseMenu callback', () => {
      const onCloseMenu = vi.fn()
      const { result } = renderHook(() => useMessageInteractions({ onCloseMenu }))

      act(() => {
        result.current.openMenu()
      })

      act(() => {
        result.current.closeMenu()
      })

      expect(onCloseMenu).toHaveBeenCalledTimes(1)
    })
  })

  describe('handleTouchStart', () => {
    it('should not trigger on desktop (width > 768)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      const { result } = renderHook(() => useMessageInteractions())

      act(() => {
        result.current.handleTouchStart()
      })

      // Menu should stay closed on desktop
      expect(result.current.showMobileMenu).toBe(false)
    })

    it('should open menu after 500ms long press on mobile', () => {
      const { result } = renderHook(() => useMessageInteractions())

      act(() => {
        result.current.handleTouchStart()
      })

      // Menu should not open immediately
      expect(result.current.showMobileMenu).toBe(false)

      // Advance timers past 500ms
      act(() => {
        vi.advanceTimersByTime(600)
      })

      expect(result.current.showMobileMenu).toBe(true)
    })

    it('should not trigger if touch ends before 500ms', () => {
      const { result } = renderHook(() => useMessageInteractions())

      act(() => {
        result.current.handleTouchStart()
      })

      // End touch before 500ms
      act(() => {
        vi.advanceTimersByTime(200)
        result.current.handleTouchEnd()
      })

      expect(result.current.showMobileMenu).toBe(false)
    })

    it('should trigger vibrate on mobile when supported', () => {
      const vibrateMock = vi.fn()
      Object.defineProperty(navigator, 'vibrate', {
        writable: true,
        configurable: true,
        value: vibrateMock,
      })

      const { result } = renderHook(() => useMessageInteractions())

      act(() => {
        result.current.handleTouchStart()
      })

      act(() => {
        vi.advanceTimersByTime(600)
      })

      expect(vibrateMock).toHaveBeenCalledWith(50)
    })
  })

  describe('handleTouchEnd', () => {
    it('should clear long press timer', () => {
      const { result } = renderHook(() => useMessageInteractions())

      act(() => {
        result.current.handleTouchStart()
      })

      act(() => {
        result.current.handleTouchEnd()
      })

      // Even after advancing timers, menu should not open
      act(() => {
        vi.advanceTimersByTime(600)
      })

      expect(result.current.showMobileMenu).toBe(false)
    })
  })

  describe('handleTouchMove', () => {
    it('should clear long press timer', () => {
      const { result } = renderHook(() => useMessageInteractions())

      act(() => {
        result.current.handleTouchStart()
      })

      act(() => {
        result.current.handleTouchMove()
      })

      act(() => {
        vi.advanceTimersByTime(600)
      })

      expect(result.current.showMobileMenu).toBe(false)
    })
  })

  describe('cleanup', () => {
    it('should clear timer on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      const { unmount, result } = renderHook(() => useMessageInteractions())

      act(() => {
        result.current.handleTouchStart()
      })

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
      clearTimeoutSpy.mockRestore()
    })
  })
})
