import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useMessageInput } from '../useMessageInput'
import { TYPING_TIMEOUT } from '@/app/chat/utils/message-input/constants'

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

vi.mock('@/components/ui/use-toast', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

vi.mock('@/app/chat/chatStore', () => ({
  default: () => ({
    currentRoom: { id: 1, name: 'Test Room' },
    checkMuteStatus: () => false,
    muteUntil: null,
  }),
}))

const localStorageMock = window.localStorage as unknown as {
  getItem: ReturnType<typeof vi.fn>
  setItem: ReturnType<typeof vi.fn>
  removeItem: ReturnType<typeof vi.fn>
}

describe('useMessageInput draft isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('preserves old room draft and loads new room draft when room changes', async () => {
    const storage = new Map<string, string>([['chat-draft-2', 'Room 2 draft']])

    localStorageMock.getItem.mockImplementation((key: string) => storage.get(key) ?? null)
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      storage.set(key, value)
    })
    localStorageMock.removeItem.mockImplementation((key: string) => {
      storage.delete(key)
    })

    const sendMessage = vi.fn(async () => ({ success: true as const }))

    const { result, rerender } = renderHook(
      ({ roomId }: { roomId: number }) =>
        useMessageInput({
          roomId,
          sendMessage,
          isConnected: true,
          replyingTo: undefined,
          onCancelReply: undefined,
        }),
      {
        initialProps: { roomId: 1 },
      }
    )

    act(() => {
      result.current.handleInputChange('Room 1 draft')
    })

    await act(async () => {
      rerender({ roomId: 2 })
    })

    expect(result.current.message).toBe('Room 2 draft')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('chat-draft-1', 'Room 1 draft')
    expect(localStorageMock.setItem).not.toHaveBeenCalledWith('chat-draft-2', 'Room 1 draft')
    expect(storage.get('chat-draft-1')).toBe('Room 1 draft')
  })
})

describe('useMessageInput typing callbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('calls typing start on each input change and typing stop after timeout', () => {
    const sendMessage = vi.fn(async () => ({ success: true as const }))
    const onTypingStart = vi.fn()
    const onTypingStop = vi.fn()

    const { result } = renderHook(() =>
      useMessageInput({
        roomId: 1,
        sendMessage,
        isConnected: true,
        replyingTo: undefined,
        onCancelReply: undefined,
        onTypingStart,
        onTypingStop,
      })
    )

    act(() => {
      result.current.handleInputChange('hello')
      result.current.handleInputChange('hello again')
    })

    expect(onTypingStart).toHaveBeenCalledTimes(2)

    act(() => {
      vi.advanceTimersByTime(TYPING_TIMEOUT)
    })

    expect(onTypingStop).toHaveBeenCalledTimes(1)
  })

  it('calls typing stop when message is sent before timeout', async () => {
    const sendMessage = vi.fn(async () => ({ success: true as const }))
    const onTypingStart = vi.fn()
    const onTypingStop = vi.fn()

    const { result } = renderHook(() =>
      useMessageInput({
        roomId: 1,
        sendMessage,
        isConnected: true,
        replyingTo: undefined,
        onCancelReply: undefined,
        onTypingStart,
        onTypingStop,
      })
    )

    act(() => {
      result.current.handleInputChange('hello')
    })

    await act(async () => {
      await result.current.handleSendMessage()
    })

    expect(onTypingStart).toHaveBeenCalledTimes(1)
    expect(onTypingStop).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(TYPING_TIMEOUT)
    })

    expect(onTypingStop).toHaveBeenCalledTimes(1)
  })
})

describe('useMessageInput idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('should block duplicate unacknowledged sends within the idempotency window', async () => {
    const sendMessage = vi.fn(async () => ({ success: false as const, errorMessage: 'failed' }))

    const { result } = renderHook(() =>
      useMessageInput({
        roomId: 1,
        sendMessage,
        isConnected: true,
        replyingTo: undefined,
        onCancelReply: undefined,
      })
    )

    // Set a message
    act(() => {
      result.current.handleInputChange('Test message')
    })

    // Send the message
    await act(async () => {
      await result.current.handleSendMessage()
    })

    // Should have called sendMessage once
    expect(sendMessage).toHaveBeenCalledTimes(1)

    // Try to send the same message again while the previous attempt is still unacknowledged
    await act(async () => {
      await result.current.handleSendMessage()
    })

    // Should NOT call sendMessage again due to idempotency
    expect(sendMessage).toHaveBeenCalledTimes(1)

    // Advance time past the idempotency window
    act(() => {
      vi.advanceTimersByTime(6000) // 5 seconds + buffer
    })

    // Try sending again after window expires
    await act(async () => {
      await result.current.handleSendMessage()
    })

    // Should allow the send now
    expect(sendMessage).toHaveBeenCalledTimes(2)
  })

  it('should allow different messages to be sent', async () => {
    const sendMessage = vi.fn(async () => ({ success: true as const }))

    const { result } = renderHook(() =>
      useMessageInput({
        roomId: 1,
        sendMessage,
        isConnected: true,
        replyingTo: undefined,
        onCancelReply: undefined,
      })
    )

    // Send first message
    act(() => {
      result.current.handleInputChange('First message')
    })

    await act(async () => {
      await result.current.handleSendMessage()
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)

    // Clear and send second message
    act(() => {
      result.current.handleInputChange('Second message')
    })

    await act(async () => {
      await result.current.handleSendMessage()
    })

    // Should allow second message
    expect(sendMessage).toHaveBeenCalledTimes(2)
  })

  it('should allow re-sending the same message after a successful acknowledgement', async () => {
    const sendMessage = vi.fn(async () => ({ success: true as const }))

    const { result } = renderHook(() =>
      useMessageInput({
        roomId: 1,
        sendMessage,
        isConnected: true,
        replyingTo: undefined,
        onCancelReply: undefined,
      })
    )

    act(() => {
      result.current.handleInputChange('Repeatable message')
    })

    await act(async () => {
      await result.current.handleSendMessage()
    })

    act(() => {
      result.current.handleInputChange('Repeatable message')
    })

    await act(async () => {
      await result.current.handleSendMessage()
    })

    expect(sendMessage).toHaveBeenCalledTimes(2)
    expect(sendMessage).toHaveBeenNthCalledWith(1, '1', 'Repeatable message')
    expect(sendMessage).toHaveBeenNthCalledWith(2, '1', 'Repeatable message')
  })
})
