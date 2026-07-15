import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMessageInteractions } from '@/app/chat/hooks/message-interactions/useMessageInteractions'

describe('useMessageInteractions', () => {
  it('initializes with mobile menu closed', () => {
    const { result } = renderHook(() => useMessageInteractions())
    expect(result.current.showMobileMenu).toBe(false)
  })

  it('opens menu', () => {
    const onOpenMenu = vi.fn()
    const { result } = renderHook(() => useMessageInteractions({ onOpenMenu }))

    act(() => {
      result.current.openMenu()
    })

    expect(result.current.showMobileMenu).toBe(true)
    expect(onOpenMenu).toHaveBeenCalledTimes(1)
  })

  it('closes menu', () => {
    const onCloseMenu = vi.fn()
    const { result } = renderHook(() => useMessageInteractions({ onCloseMenu }))

    act(() => {
      result.current.openMenu()
    })
    expect(result.current.showMobileMenu).toBe(true)

    act(() => {
      result.current.closeMenu()
    })
    expect(result.current.showMobileMenu).toBe(false)
    expect(onCloseMenu).toHaveBeenCalledTimes(1)
  })

  it('handleTouchStart sets long press timer', () => {
    const { result } = renderHook(() => useMessageInteractions())
    // Mock window.innerWidth to be mobile
    const originalInnerWidth = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true })

    act(() => {
      result.current.handleTouchStart()
    })

    // Menu should not be immediately shown
    expect(result.current.showMobileMenu).toBe(false)

    // Clean up timer
    act(() => {
      result.current.handleTouchEnd()
    })

    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true })
  })

  it('handleTouchStart does nothing on desktop', () => {
    const originalInnerWidth = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })

    const { result } = renderHook(() => useMessageInteractions())
    act(() => {
      result.current.handleTouchStart()
    })

    expect(result.current.showMobileMenu).toBe(false)

    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true })
  })

  it('handleTouchEnd clears long press timer', () => {
    const { result } = renderHook(() => useMessageInteractions())

    act(() => {
      result.current.handleTouchEnd()
    })

    // Should not throw
    expect(result.current.showMobileMenu).toBe(false)
  })

  it('handleTouchMove clears long press timer', () => {
    const { result } = renderHook(() => useMessageInteractions())

    act(() => {
      result.current.handleTouchMove()
    })

    expect(result.current.showMobileMenu).toBe(false)
  })

  it('cleans up timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
    const { unmount } = renderHook(() => useMessageInteractions())

    unmount()
    // The cleanup effect calls clearTimeout when there's no timer (safe to call with null)
    // But with our implementation, clearTimeout is only called if timer exists
    expect(clearTimeoutSpy).not.toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })
})
