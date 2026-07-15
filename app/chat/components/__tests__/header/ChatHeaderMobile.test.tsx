import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ChatHeaderMobile } from '../../header/ChatHeaderMobile'
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

describe('ChatHeaderMobile', () => {
  const defaultProps = {
    room: mockRoom,
    showBackButton: false,
    isConnected: true,
    connectionStatus: 'connected' as const,
    onlineCount: 5,
    onOpenNotificationSettings: vi.fn(),
  }

  it('renders room name', () => {
    const { getByText } = render(<ChatHeaderMobile {...defaultProps} />)
    expect(getByText('General Chat')).toBeInTheDocument()
  })

  it('renders connecting status with animation', () => {
    const { container } = render(
      <ChatHeaderMobile {...defaultProps} connectionStatus="connecting" isConnected={false} />
    )
    const statusDot = container.querySelector('.animate-pulse')
    expect(statusDot).toBeTruthy()
  })

  it('renders without an online count badge in compact mobile header', () => {
    const { container } = render(<ChatHeaderMobile {...defaultProps} onlineCount={5} />)
    expect(container.textContent).toContain('General Chat')
  })

  it('renders room list button when onOpenRoomList is provided', () => {
    const onOpenRoomList = vi.fn()
    const { getByRole } = render(
      <ChatHeaderMobile {...defaultProps} onOpenRoomList={onOpenRoomList} />
    )
    expect(getByRole('button', { name: /Open room list/ })).toBeInTheDocument()
  })

  it('renders users list button when onOpenUsersList is provided', () => {
    const onOpenUsersList = vi.fn()
    const { getByRole } = render(
      <ChatHeaderMobile {...defaultProps} onOpenUsersList={onOpenUsersList} />
    )
    expect(getByRole('button', { name: /Open users list/ })).toBeInTheDocument()
  })

  it('calls onOpenRoomList when room list button is clicked', async () => {
    const user = userEvent.setup()
    const onOpenRoomList = vi.fn()
    render(<ChatHeaderMobile {...defaultProps} onOpenRoomList={onOpenRoomList} />)

    await user.click(screen.getByRole('button', { name: /Open room list/ }))
    expect(onOpenRoomList).toHaveBeenCalledTimes(1)
  })

  it('calls onOpenUsersList when users list button is clicked', async () => {
    const user = userEvent.setup()
    const onOpenUsersList = vi.fn()
    render(<ChatHeaderMobile {...defaultProps} onOpenUsersList={onOpenUsersList} />)

    await user.click(screen.getByRole('button', { name: /Open users list/ }))
    expect(onOpenUsersList).toHaveBeenCalledTimes(1)
  })

  it('renders back button when showBackButton is true', () => {
    const onBack = vi.fn()
    const { getByRole } = render(
      <ChatHeaderMobile {...defaultProps} showBackButton onBack={onBack} />
    )
    expect(getByRole('button', { name: /返回/ })).toBeInTheDocument()
  })

  it('renders notification settings button', () => {
    const { getByRole } = render(<ChatHeaderMobile {...defaultProps} />)
    expect(getByRole('button', { name: /通知设置/ })).toBeInTheDocument()
  })
})
