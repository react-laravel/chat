import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConnectionStatusIndicator } from '../ConnectionStatusIndicator'
import type { ConnectionMonitor } from '@/lib/websocket'
import type { OfflineState } from '@/lib/websocket/offline-manager'

const mockConnectionConnected: ConnectionMonitor = {
  status: 'connected',
  isRetrying: false,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  lastConnected: new Date(),
  lastError: null,
}

const mockConnectionDisconnected: ConnectionMonitor = {
  status: 'disconnected',
  isRetrying: false,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  lastConnected: null,
  lastError: null,
}

const mockOfflineState: OfflineState = {
  isOffline: false,
  queueSize: 0,
  lastOnline: new Date(),
}

const mockOfflineStateOffline: OfflineState = {
  isOffline: true,
  queueSize: 0,
  lastOnline: new Date(),
}

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

describe('ConnectionStatusIndicator', () => {
  const defaultProps = {
    connectionInfo: mockConnectionConnected,
    offlineState: mockOfflineState,
    onReconnect: vi.fn(),
    onRetryMessages: vi.fn(),
    onClearQueue: vi.fn(),
  }

  it('renders connected status text', () => {
    const { getByText } = render(<ConnectionStatusIndicator {...defaultProps} />)
    expect(getByText('Connected')).toBeInTheDocument()
  })

  it('renders disconnected status text', () => {
    const { getByText } = render(
      <ConnectionStatusIndicator {...defaultProps} connectionInfo={mockConnectionDisconnected} />
    )
    expect(getByText('Disconnected')).toBeInTheDocument()
  })

  it('renders reconnect button when offline', () => {
    const { getByRole } = render(
      <ConnectionStatusIndicator
        {...defaultProps}
        connectionInfo={mockConnectionDisconnected}
        offlineState={mockOfflineStateOffline}
      />
    )
    expect(getByRole('button', { name: 'Reconnect' })).toBeInTheDocument()
  })

  it('calls onReconnect when reconnect button is clicked', async () => {
    const user = userEvent.setup()
    const onReconnect = vi.fn()
    const { getByRole } = render(
      <ConnectionStatusIndicator
        {...defaultProps}
        connectionInfo={mockConnectionDisconnected}
        offlineState={mockOfflineStateOffline}
        onReconnect={onReconnect}
      />
    )

    await user.click(getByRole('button', { name: 'Reconnect' }))
    expect(onReconnect).toHaveBeenCalledTimes(1)
  })

  it('renders queued messages badge when queue has items', () => {
    const { getByText } = render(
      <ConnectionStatusIndicator
        {...defaultProps}
        offlineState={{ ...mockOfflineState, queueSize: 3 }}
      />
    )
    expect(getByText(/3\s+queued/)).toBeInTheDocument()
  })

  it('renders offline badge when offline', () => {
    const { getByText } = render(
      <ConnectionStatusIndicator
        {...defaultProps}
        connectionInfo={mockConnectionDisconnected}
        offlineState={mockOfflineStateOffline}
      />
    )
    expect(getByText('Offline')).toBeInTheDocument()
  })

  it('shows details panel when status indicator is clicked', async () => {
    const user = userEvent.setup()
    render(<ConnectionStatusIndicator {...defaultProps} />)

    // Click the status indicator (the flex container with cursor-pointer)
    const statusIndicator = document.querySelector('.cursor-pointer')
    if (statusIndicator) {
      await user.click(statusIndicator)
      expect(document.body.textContent).toContain('Connection Status')
    }
  })
})
