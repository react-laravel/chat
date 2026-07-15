import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  ErrorFallback,
  NetworkErrorFallback,
  AuthErrorFallback,
  ServerErrorFallback,
} from '../ErrorFallback'
import type { ChatApiError } from '@/lib/api/chat-error-handler'

describe('ErrorFallback', () => {
  it('returns null when error is null', () => {
    const { container } = render(<ErrorFallback error={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders error message for unknown error type', () => {
    const error = new Error('Something went wrong') as ChatApiError
    const { getByText } = render(<ErrorFallback error={error} />)
    expect(getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders retry button when retryable', () => {
    const onRetry = vi.fn()
    const error = new Error('Network error') as ChatApiError
    const { getByRole } = render(<ErrorFallback error={error} onRetry={onRetry} />)
    expect(getByRole('button', { name: '重试' })).toBeInTheDocument()
  })

  it('calls onRetry when retry button clicked', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const error = new Error('Network error') as ChatApiError
    const { getByRole } = render(<ErrorFallback error={error} onRetry={onRetry} />)

    await user.click(getByRole('button', { name: '重试' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('calls onClearError when close button clicked', async () => {
    const user = userEvent.setup()
    const onClearError = vi.fn()
    const error = new Error('Network error') as ChatApiError
    const { getByRole } = render(
      <ErrorFallback error={error} onRetry={vi.fn()} onClearError={onClearError} />
    )

    await user.click(getByRole('button', { name: '关闭' }))
    expect(onClearError).toHaveBeenCalledTimes(1)
  })

  it('renders login button for authentication errors', () => {
    const error = {
      ...new Error('Auth error'),
      type: 'authentication',
      retryable: false,
    } as ChatApiError
    const { getByRole } = render(<ErrorFallback error={error} />)
    expect(getByRole('button', { name: '登录' })).toBeInTheDocument()
  })

  it('renders refresh button for network errors', () => {
    const error = {
      ...new Error('Network error'),
      type: 'network',
      retryable: true,
    } as ChatApiError
    const { getByRole } = render(<ErrorFallback error={error} />)
    expect(getByRole('button', { name: '刷新页面' })).toBeInTheDocument()
  })

  it('renders minimal variant', () => {
    const error = new Error('Quick error') as ChatApiError
    const { getByText } = render(<ErrorFallback error={error} variant="minimal" />)
    expect(getByText('Quick error')).toBeInTheDocument()
  })

  it('renders inline variant', () => {
    const error = new Error('Inline error') as ChatApiError
    const { getByText } = render(<ErrorFallback error={error} variant="inline" />)
    expect(getByText('Inline error')).toBeInTheDocument()
  })
})

describe('NetworkErrorFallback', () => {
  it('renders with network error type', () => {
    const { getByText } = render(<NetworkErrorFallback />)
    expect(getByText('无法连接到聊天服务器')).toBeInTheDocument()
  })
})

describe('AuthErrorFallback', () => {
  it('renders with authentication error type', () => {
    const { getByText } = render(<AuthErrorFallback />)
    expect(getByText('需要身份验证才能访问聊天功能')).toBeInTheDocument()
  })
})

describe('ServerErrorFallback', () => {
  it('renders with server error type', () => {
    const { getByText } = render(<ServerErrorFallback />)
    expect(getByText('聊天服务器暂时不可用')).toBeInTheDocument()
  })
})
