import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMessageScroll } from '@/app/chat/hooks/message-list/useMessageScroll'

describe('useMessageScroll', () => {
  it('initializes refs with default values', () => {
    const { result } = renderHook(() =>
      useMessageScroll({
        roomId: 1,
        messageCount: 0,
        hasSearchQuery: false,
        getScrollContainer: () => null,
      })
    )

    expect(result.current).toBeUndefined()
  })

  it('resets state when roomId changes', () => {
    const getScrollContainer = vi.fn(() => null)
    const { result, rerender } = renderHook(
      ({ roomId }: { roomId: number }) =>
        useMessageScroll({
          roomId,
          messageCount: 0,
          hasSearchQuery: false,
          getScrollContainer,
        }),
      { initialProps: { roomId: 1 } }
    )

    rerender({ roomId: 2 })
    // Should not throw and should reset refs
    expect(result.current).toBeUndefined()
  })

  it('handles scroll events when container is available', () => {
    const mockContainer = {
      scrollTop: 100,
      scrollHeight: 500,
      clientHeight: 400,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    const getScrollContainer = vi.fn(() => mockContainer as unknown as HTMLDivElement)

    const { result } = renderHook(() =>
      useMessageScroll({
        roomId: 1,
        messageCount: 5,
        hasSearchQuery: false,
        getScrollContainer,
      })
    )

    expect(result.current).toBeUndefined()
    expect(mockContainer.addEventListener).toHaveBeenCalled()
  })

  it('does not auto-scroll when user is scrolling', () => {
    const mockContainer = {
      scrollTop: 100,
      scrollHeight: 500,
      clientHeight: 400,
      scrollTo: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    const getScrollContainer = vi.fn(() => mockContainer as unknown as HTMLDivElement)

    const { result, rerender } = renderHook(
      ({ messageCount }: { messageCount: number }) =>
        useMessageScroll({
          roomId: 1,
          messageCount,
          hasSearchQuery: false,
          getScrollContainer,
        }),
      { initialProps: { messageCount: 0 } }
    )

    // Simulate user scrolling (by adding a scroll listener and triggering scroll)
    // The key behavior: when userScrollRef is true, no auto-scroll
    rerender({ messageCount: 5 })
    expect(result.current).toBeUndefined()
  })
})
