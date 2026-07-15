import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UserProfilePopover } from '@/app/chat/components/users/UserProfilePopover'
import type { OnlineUser } from '@/app/chat/types'

const mockUser: OnlineUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@test.com',
  role: 'user',
  joined_at: '2026-01-01T10:00:00.000Z',
  is_online: true,
}

const mockAdmin: OnlineUser = {
  id: 2,
  name: 'Admin User',
  email: 'admin@test.com',
  role: 'admin',
  joined_at: '2026-01-01T10:00:00.000Z',
  is_online: true,
}

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

describe('UserProfilePopover', () => {
  it('renders children', () => {
    const { getByText } = render(
      <UserProfilePopover user={mockUser}>
        <button>Click me</button>
      </UserProfilePopover>
    )
    expect(getByText('Click me')).toBeInTheDocument()
  })

  it('renders user name in popover content', () => {
    const { getByText } = render(
      <UserProfilePopover user={mockUser}>
        <span>Trigger</span>
      </UserProfilePopover>
    )
    expect(getByText('John Doe')).toBeInTheDocument()
  })

  it('renders user email', () => {
    const { getByText } = render(
      <UserProfilePopover user={mockUser}>
        <span>Trigger</span>
      </UserProfilePopover>
    )
    expect(getByText('john@test.com')).toBeInTheDocument()
  })

  it('shows online badge', () => {
    const { getByText } = render(
      <UserProfilePopover user={mockUser}>
        <span>Trigger</span>
      </UserProfilePopover>
    )
    expect(getByText('Online')).toBeInTheDocument()
  })

  it('shows offline badge for offline user', () => {
    const offlineUser = { ...mockUser, is_online: false }
    const { getByText } = render(
      <UserProfilePopover user={offlineUser}>
        <span>Trigger</span>
      </UserProfilePopover>
    )
    expect(getByText('Offline')).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    const { getByRole } = render(
      <UserProfilePopover user={mockUser}>
        <span>Trigger</span>
      </UserProfilePopover>
    )
    expect(getByRole('button', { name: 'Message' })).toBeInTheDocument()
    expect(getByRole('button', { name: 'Mention' })).toBeInTheDocument()
    expect(getByRole('button', { name: 'Block' })).toBeInTheDocument()
    expect(getByRole('button', { name: 'Report' })).toBeInTheDocument()
  })

  it('calls onDirectMessage when Message button clicked', async () => {
    const user = userEvent.setup()
    const onDirectMessage = vi.fn()
    const view = render(
      <UserProfilePopover user={mockUser} onDirectMessage={onDirectMessage}>
        <span>Trigger</span>
      </UserProfilePopover>
    )

    await user.click(view.getByRole('button', { name: 'Message' }))
    expect(onDirectMessage).toHaveBeenCalledWith(1)
  })

  it('shows crown icon for admin', () => {
    const { container } = render(
      <UserProfilePopover user={mockAdmin}>
        <span>Trigger</span>
      </UserProfilePopover>
    )
    const crownIcon = container.querySelector('.text-yellow-500')
    expect(crownIcon).toBeTruthy()
  })
})
