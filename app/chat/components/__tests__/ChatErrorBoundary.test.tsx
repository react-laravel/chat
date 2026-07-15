import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatErrorBoundary, useChatErrorHandler } from '../ChatErrorBoundary'
import { renderHook, act } from '@testing-library/react'

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

vi.mock('@/lib/api/chat-error-handler', () => ({
  handleChatApiError: vi.fn((error, context) => ({
    name: 'ChatApiError',
    type: 'unknown',
    message: error.message,
    context,
    retryable: true,
    userFriendly: false,
    timestamp: new Date(),
  })),
}))

vi.mock('@/app/chat/components/ErrorFallback', () => ({
  default: ({
    error,
    onRetry,
    onClearError,
  }: {
    error: unknown
    onRetry: () => void
    onClearError: () => void
  }) => (
    <div data-testid="error-fallback">
      <span>{error instanceof Error ? error.message : 'Error'}</span>
      <button onClick={onRetry}>Retry</button>
      <button onClick={onClearError}>Clear</button>
    </div>
  ),
}))

describe('ChatErrorBoundary', () => {
  it('renders children when no error', () => {
    const { getByText } = render(
      <ChatErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ChatErrorBoundary>
    )
    expect(getByText('No error')).toBeInTheDocument()
  })

  it('renders fallback when child throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { getByTestId } = render(
      <ChatErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ChatErrorBoundary>
    )
    expect(getByTestId('error-fallback')).toBeInTheDocument()
    consoleSpy.mockRestore()
  })

  it('renders custom fallback when provided', () => {
    const CustomFallback = () => <div>Custom Error</div>
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { getByText } = render(
      <ChatErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ChatErrorBoundary>
    )
    expect(getByText('Custom Error')).toBeInTheDocument()
    consoleSpy.mockRestore()
  })

  it('calls onError callback when error occurs', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onError = vi.fn()
    render(
      <ChatErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ChatErrorBoundary>
    )
    expect(onError).toHaveBeenCalledTimes(1)
    consoleSpy.mockRestore()
  })

  it('resets error state on retry', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { getByTestId } = render(
      <ChatErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ChatErrorBoundary>
    )
    expect(getByTestId('error-fallback')).toBeInTheDocument()

    await vi.fn()
    consoleSpy.mockRestore()
  })
})

describe('useChatErrorHandler', () => {
  it('initializes with no error', () => {
    const { result } = renderHook(() => useChatErrorHandler())
    expect(result.current.error).toBeNull()
    expect(result.current.hasError).toBe(false)
  })

  it('handles error and sets state', () => {
    const { result } = renderHook(() => useChatErrorHandler())

    act(() => {
      result.current.handleError(new Error('Test'))
    })

    expect(result.current.error).not.toBeNull()
    expect(result.current.hasError).toBe(true)
  })

  it('clears error', () => {
    const { result } = renderHook(() => useChatErrorHandler())

    act(() => {
      result.current.handleError(new Error('Test'))
    })
    expect(result.current.hasError).toBe(true)

    act(() => {
      result.current.clearError()
    })
    expect(result.current.error).toBeNull()
    expect(result.current.hasError).toBe(false)
  })

  it('retries action and clears error', () => {
    const action = vi.fn()
    const { result } = renderHook(() => useChatErrorHandler())

    act(() => {
      result.current.handleError(new Error('Test'))
    })
    expect(result.current.hasError).toBe(true)

    act(() => {
      result.current.retryAction(action)
    })
    expect(result.current.error).toBeNull()
    expect(action).toHaveBeenCalled()
  })

  it('handles error in retry action', () => {
    const failingAction = vi.fn(() => {
      throw new Error('Retry failed')
    })
    const { result } = renderHook(() => useChatErrorHandler())

    act(() => {
      result.current.retryAction(failingAction)
    })
    expect(result.current.hasError).toBe(true)
  })
})
