import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMessageInputHandlers } from '@/app/chat/hooks/message-input/useMessageInputHandlers'
import type React from 'react'

const createMockParams = (overrides: Record<string, unknown> = {}): unknown => ({
  roomId: 1,
  message: '',
  handleInputChange: vi.fn(),
  setMessage: vi.fn(),
  replyTarget: null,
  onCancelReply: vi.fn(),
  mentionSuggestions: [],
  selectedMentionIndex: 0,
  showMentions: false,
  checkForMentions: vi.fn(),
  insertMention: vi.fn(),
  handleMentionNavigation: vi.fn(),
  handleSendMessage: vi.fn(),
  sendMessage: vi.fn(async () => ({ success: true })),
  isConnected: true,
  checkMuteStatus: vi.fn(() => false),
  muteUntil: null,
  t: (key: string, fallback?: string) => fallback ?? key,
  fileInputRef: { current: null } as React.RefObject<HTMLInputElement | null>,
  textareaRef: { current: null } as React.RefObject<HTMLTextAreaElement | null>,
  handleFileUpload: vi.fn(async () => {}),
  inputContainerRef: { current: null } as React.RefObject<HTMLDivElement | null>,
  ...overrides,
})

describe('useMessageInputHandlers', () => {
  it('returns handler functions', () => {
    const { result } = renderHook(() =>
      useMessageInputHandlers(createMockParams() as Parameters<typeof useMessageInputHandlers>[0])
    )

    expect(typeof result.current.handleFileInputChange).toBe('function')
    expect(typeof result.current.handleTextareaChange).toBe('function')
    expect(typeof result.current.handleMentionSelect).toBe('function')
    expect(typeof result.current.handleKeyDown).toBe('function')
    expect(typeof result.current.scrollToBottom).toBe('function')
  })

  it('handleTextareaChange calls handleInputChange and checkForMentions', () => {
    const handleInputChange = vi.fn()
    const checkForMentions = vi.fn()
    const params = createMockParams({
      handleInputChange,
      checkForMentions,
    }) as Parameters<typeof useMessageInputHandlers>[0]

    const { result } = renderHook(() => useMessageInputHandlers(params))

    const mockEvent = {
      target: {
        value: 'hello',
        selectionStart: 5,
      },
    } as React.ChangeEvent<HTMLTextAreaElement>

    act(() => {
      result.current.handleTextareaChange(mockEvent)
    })

    expect(handleInputChange).toHaveBeenCalledWith('hello')
    expect(checkForMentions).toHaveBeenCalledWith('hello', 5)
  })

  it('handleKeyDown sends message on Enter without Shift', () => {
    const handleSendMessage = vi.fn()
    const params = createMockParams({
      handleSendMessage,
      showMentions: false,
    }) as Parameters<typeof useMessageInputHandlers>[0]

    const { result } = renderHook(() => useMessageInputHandlers(params))

    const enterEvent = {
      key: 'Enter',
      shiftKey: false,
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent<HTMLTextAreaElement>

    act(() => {
      result.current.handleKeyDown(enterEvent)
    })

    expect(handleSendMessage).toHaveBeenCalled()
  })

  it('handleKeyDown does not send on Shift+Enter', () => {
    const handleSendMessage = vi.fn()
    const params = createMockParams({
      handleSendMessage,
      showMentions: false,
    }) as Parameters<typeof useMessageInputHandlers>[0]

    const { result } = renderHook(() => useMessageInputHandlers(params))

    const shiftEnterEvent = {
      key: 'Enter',
      shiftKey: true,
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent<HTMLTextAreaElement>

    act(() => {
      result.current.handleKeyDown(shiftEnterEvent)
    })

    expect(handleSendMessage).not.toHaveBeenCalled()
  })

  it('handleKeyDown cancels reply on Escape', () => {
    const onCancelReply = vi.fn()
    const params = createMockParams({
      replyTarget: { id: 1, user: { name: 'Alice' }, message: 'original' },
      onCancelReply,
      showMentions: false,
    }) as Parameters<typeof useMessageInputHandlers>[0]

    const { result } = renderHook(() => useMessageInputHandlers(params))

    const escapeEvent = {
      key: 'Escape',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent<HTMLTextAreaElement>

    act(() => {
      result.current.handleKeyDown(escapeEvent)
    })

    expect(onCancelReply).toHaveBeenCalled()
  })

  it('handleKeyDown navigates mentions with ArrowDown', () => {
    const handleMentionNavigation = vi.fn(() => true)
    const params = createMockParams({
      showMentions: true,
      mentionSuggestions: [{ id: 1, name: 'Alice', email: 'a@t.com' }],
      handleMentionNavigation,
    }) as Parameters<typeof useMessageInputHandlers>[0]

    const { result } = renderHook(() => useMessageInputHandlers(params))

    const arrowDownEvent = {
      key: 'ArrowDown',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent<HTMLTextAreaElement>

    act(() => {
      result.current.handleKeyDown(arrowDownEvent)
    })

    expect(handleMentionNavigation).toHaveBeenCalledWith('ArrowDown')
  })

  it('scrollToBottom scrolls container to bottom', () => {
    const scrollTo = vi.fn()
    const params = createMockParams({
      scrollContainerRef: {
        current: {
          scrollTo,
          scrollHeight: 500,
        },
      } as unknown as React.RefObject<HTMLElement | null>,
    }) as Parameters<typeof useMessageInputHandlers>[0]

    const { result } = renderHook(() => useMessageInputHandlers(params))

    act(() => {
      result.current.scrollToBottom()
    })

    expect(scrollTo).toHaveBeenCalledWith({
      top: 500,
      behavior: 'smooth',
    })
  })
})
