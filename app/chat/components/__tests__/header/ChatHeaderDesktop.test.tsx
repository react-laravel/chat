import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatHeaderDesktop } from '../../header/ChatHeaderDesktop'
import type { ChatRoom } from '@/app/chat/types'

const mockRoom: ChatRoom = {
  id: 1,
  name: 'General Chat',
  description: 'Main discussion room',
  created_by: 1,
  is_active: true,
  is_private: false,
  created_at: '2026-03-05T10:00:00.000Z',
  updated_at: '2026-03-05T10:00:00.000Z',
  online_count: 5,
}

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

describe('ChatHeaderDesktop', () => {
  const defaultProps = {
    room: mockRoom,
    showBackButton: false,
    isConnected: true,
    connectionStatus: 'connected' as const,
    onlineCount: 5,
    onOpenNotificationSettings: vi.fn(),
  }

  it('renders room name', () => {
    const { getByText } = render(<ChatHeaderDesktop {...defaultProps} />)
    expect(getByText('General Chat')).toBeInTheDocument()
  })

  it('renders connection status as connected', () => {
    const { getByText } = render(<ChatHeaderDesktop {...defaultProps} />)
    expect(getByText(/已连接/)).toBeInTheDocument()
  })

  it('renders disconnected status', () => {
    const { getByText } = render(
      <ChatHeaderDesktop {...defaultProps} connectionStatus="disconnected" isConnected={false} />
    )
    expect(getByText(/已断开/)).toBeInTheDocument()
  })

  it('renders online count badge', () => {
    const { getByText } = render(<ChatHeaderDesktop {...defaultProps} onlineCount={5} />)
    expect(getByText('5')).toBeInTheDocument()
  })

  it('renders back button when showBackButton is true', () => {
    const onBack = vi.fn()
    const { getByRole } = render(
      <ChatHeaderDesktop {...defaultProps} showBackButton onBack={onBack} />
    )
    expect(getByRole('button', { name: /返回/ })).toBeInTheDocument()
  })

  it('does not render back button when showBackButton is false', () => {
    const { queryByRole } = render(<ChatHeaderDesktop {...defaultProps} showBackButton={false} />)
    expect(queryByRole('button', { name: /返回/ })).not.toBeInTheDocument()
  })

  it('renders notification settings button', () => {
    const { getByRole } = render(<ChatHeaderDesktop {...defaultProps} />)
    expect(getByRole('button', { name: /通知设置/ })).toBeInTheDocument()
  })
})
