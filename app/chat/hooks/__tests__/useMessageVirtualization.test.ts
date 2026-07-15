import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMessageVirtualization } from '@/app/chat/hooks/useMessageVirtualization'

describe('useMessageVirtualization', () => {
  it('initializes with correct default state', () => {
    const { result } = renderHook(() =>
      useMessageVirtualization(100, {
        itemHeight: 50,
        containerHeight: 500,
        bufferSize: 10,
        overscan: 5,
      })
    )

    expect(result.current.virtualRange.startIndex).toBeGreaterThanOrEqual(0)
    expect(result.current.virtualRange.endIndex).toBe(100)
    expect(result.current.visibleItemCount).toBeLessThanOrEqual(100)
  })

  it('calculates correct offsets', () => {
    const { result } = renderHook(() =>
      useMessageVirtualization(100, {
        itemHeight: 50,
        containerHeight: 500,
      })
    )

    expect(result.current.offsetY).toBe(result.current.virtualRange.startIndex * 50)
    expect(result.current.offsetHeight).toBe(
      (result.current.virtualRange.endIndex - result.current.virtualRange.startIndex) * 50
    )
  })

  it('returns scrollToBottom and scrollToTop functions', () => {
    const { result } = renderHook(() =>
      useMessageVirtualization(10, {
        itemHeight: 50,
        containerHeight: 500,
      })
    )

    expect(typeof result.current.scrollToBottom).toBe('function')
    expect(typeof result.current.scrollToTop).toBe('function')
  })

  it('scrollToBottom does nothing without container', () => {
    const { result } = renderHook(() =>
      useMessageVirtualization(10, {
        itemHeight: 50,
        containerHeight: 500,
      })
    )

    expect(() => result.current.scrollToBottom()).not.toThrow()
    expect(() => result.current.scrollToBottom(true)).not.toThrow()
  })

  it('scrollToTop does nothing without container', () => {
    const { result } = renderHook(() =>
      useMessageVirtualization(10, {
        itemHeight: 50,
        containerHeight: 500,
      })
    )

    expect(() => result.current.scrollToTop()).not.toThrow()
  })

  it('returns isNearBottom function', () => {
    const { result } = renderHook(() =>
      useMessageVirtualization(10, {
        itemHeight: 50,
        containerHeight: 500,
      })
    )

    expect(typeof result.current.isNearBottom).toBe('function')
  })

  it('isNearBottom returns false without container', () => {
    const { result } = renderHook(() =>
      useMessageVirtualization(10, {
        itemHeight: 50,
        containerHeight: 500,
      })
    )

    expect(result.current.isNearBottom()).toBe(false)
  })

  it('returns containerRef', () => {
    const { result } = renderHook(() =>
      useMessageVirtualization(10, {
        itemHeight: 50,
        containerHeight: 500,
      })
    )

    expect(result.current.containerRef).toBeDefined()
    expect(result.current.containerRef.current).toBeNull()
  })
})
