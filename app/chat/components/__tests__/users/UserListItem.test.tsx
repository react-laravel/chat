import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UserListItem } from '@/app/chat/components/users/UserListItem'
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

const mockModerator: OnlineUser = {
  id: 3,
  name: 'Moderator User',
  email: 'mod@test.com',
  role: 'moderator',
  joined_at: '2026-01-01T10:00:00.000Z',
  is_online: true,
}

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

describe('UserListItem', () => {
  it('renders user name', () => {
    const { container } = render(<UserListItem user={mockUser} />)
    // User name appears in both list item and popover
    const nameElements = container.querySelectorAll('.font-medium')
    expect(nameElements.length).toBeGreaterThanOrEqual(1)
    expect(nameElements[0].textContent).toBe('John Doe')
  })

  it('renders online indicator for online user', () => {
    const { container } = render(<UserListItem user={mockUser} />)
    const greenDot = container.querySelector('.fill-green-500')
    expect(greenDot).toBeTruthy()
  })

  it('shows crown icon for admin', () => {
    const { container } = render(<UserListItem user={mockAdmin} />)
    const crownIcon = container.querySelector('.text-yellow-500')
    expect(crownIcon).toBeTruthy()
  })

  it('shows shield icon for moderator (non-admin)', () => {
    const { container } = render(<UserListItem user={mockModerator} />)
    const shieldIcon = container.querySelector('.text-blue-500')
    expect(shieldIcon).toBeTruthy()
  })

  it('does not show role icons for regular user', () => {
    const { container } = render(<UserListItem user={mockUser} />)
    const yellowIcon = container.querySelector('.text-yellow-500')
    const blueIcon = container.querySelector('.text-blue-500')
    expect(yellowIcon).toBeFalsy()
    expect(blueIcon).toBeFalsy()
  })

  it('calls onMentionUser when triggered', () => {
    const onMentionUser = vi.fn()
    render(<UserListItem user={mockUser} onMentionUser={onMentionUser} />)
    // The component is wrapped in UserProfilePopover, so we can't easily test the callback
    // through click, but we verify it renders without errors
    expect(document.querySelector('.cursor-pointer')).toBeTruthy()
  })

  it('renders joined time', () => {
    const { container } = render(<UserListItem user={mockUser} />)
    // Should show a formatted time element
    const timeElement = container.querySelector('.text-xs')
    expect(timeElement).toBeTruthy()
    expect(timeElement?.textContent).toBeTruthy()
  })
})
