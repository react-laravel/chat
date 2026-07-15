import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  UnreadMessageIndicator,
  useUnreadMessages,
  useScrollPosition,
} from '../UnreadMessageIndicator'
import { renderHook, act } from '@testing-library/react'

describe('UnreadMessageIndicator', () => {
  it('does not render when unread count is 0', () => {
    const { container } = render(
      <UnreadMessageIndicator unreadCount={0} onScrollToBottom={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders when unread count is greater than 0', () => {
    const onScrollToBottom = vi.fn()
    const { getByText } = render(
      <UnreadMessageIndicator unreadCount={5} onScrollToBottom={onScrollToBottom} />
    )
    expect(getByText('5')).toBeInTheDocument()
  })

  it('calls onScrollToBottom when clicked', async () => {
    const user = userEvent.setup()
    const onScrollToBottom = vi.fn()
    const { getByText } = render(
      <UnreadMessageIndicator unreadCount={3} onScrollToBottom={onScrollToBottom} />
    )

    await user.click(getByText('3'))
    expect(onScrollToBottom).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    const { container } = render(
      <UnreadMessageIndicator
        unreadCount={1}
        onScrollToBottom={() => {}}
        className="custom-class"
      />
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('useUnreadMessages', () => {
  it('returns 0 initially', () => {
    const { result } = renderHook(() => useUnreadMessages([], true))
    expect(result.current).toBe(0)
  })

  it('increments count when new messages arrive and not at bottom', () => {
    const { result, rerender } = renderHook(
      ({ messages, isAtBottom }: { messages: unknown[]; isAtBottom: boolean }) =>
        useUnreadMessages(messages, isAtBottom),
      { initialProps: { messages: [], isAtBottom: false } }
    )

    expect(result.current).toBe(0)

    rerender({ messages: [{ id: 1 }, { id: 2 }], isAtBottom: false })
    expect(result.current).toBe(2)
  })

  it('clears count when user is at bottom', () => {
    const { result, rerender } = renderHook(
      ({ messages, isAtBottom }: { messages: unknown[]; isAtBottom: boolean }) =>
        useUnreadMessages(messages, isAtBottom),
      { initialProps: { messages: [], isAtBottom: false } }
    )

    rerender({ messages: [{ id: 1 }, { id: 2 }], isAtBottom: false })
    expect(result.current).toBe(2)

    rerender({ messages: [{ id: 1 }, { id: 2 }], isAtBottom: true })
    expect(result.current).toBe(0)
  })

  it('accumulates unread counts for multiple new messages', () => {
    const { result, rerender } = renderHook(
      ({ messages, isAtBottom }: { messages: unknown[]; isAtBottom: boolean }) =>
        useUnreadMessages(messages, isAtBottom),
      { initialProps: { messages: [{ id: 1 }], isAtBottom: false } }
    )

    rerender({ messages: [{ id: 1 }, { id: 2 }], isAtBottom: false })
    expect(result.current).toBe(1)

    rerender({ messages: [{ id: 1 }, { id: 2 }, { id: 3 }], isAtBottom: false })
    expect(result.current).toBe(2)
  })
})

describe('useScrollPosition', () => {
  it('initializes with isAtBottom and isNearBottom as true', () => {
    const containerRef = { current: null }
    const { result } = renderHook(() =>
      useScrollPosition(containerRef as React.RefObject<HTMLElement | null>)
    )
    expect(result.current.isAtBottom).toBe(true)
    expect(result.current.isNearBottom).toBe(true)
  })
})
