import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { UserAvatar } from '@/app/chat/components/users/UserAvatar'
import type { OnlineUser } from '@/app/chat/types'

const mockUser: OnlineUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@test.com',
  joined_at: '2026-01-01T00:00:00Z',
  is_online: true,
}

vi.mock('@/hooks/useAvatarImage', () => ({
  useAvatarImage: () => ({
    src: null,
    onError: vi.fn(),
    onLoad: vi.fn(),
  }),
}))

describe('UserAvatar', () => {
  it('renders with default size', () => {
    const { container } = render(<UserAvatar user={mockUser} />)
    const avatar = container.querySelector('[class*="h-10"][class*="w-10"]')
    expect(avatar).toBeTruthy()
  })

  it('renders with sm size', () => {
    const { container } = render(<UserAvatar user={mockUser} size="sm" />)
    const avatar = container.querySelector('[class*="h-8"][class*="w-8"]')
    expect(avatar).toBeTruthy()
  })

  it('renders with lg size', () => {
    const { container } = render(<UserAvatar user={mockUser} size="lg" />)
    const avatar = container.querySelector('[class*="h-12"][class*="w-12"]')
    expect(avatar).toBeTruthy()
  })

  it('renders fallback initials', () => {
    const { getByText } = render(<UserAvatar user={mockUser} />)
    expect(getByText('JD')).toBeInTheDocument()
  })

  it('renders single initial for single-word name', () => {
    const singleNameUser = { ...mockUser, name: 'Alice' }
    const { getByText } = render(<UserAvatar user={singleNameUser} />)
    expect(getByText('A')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<UserAvatar user={mockUser} className="custom-class" />)
    const avatar = container.querySelector('.custom-class')
    expect(avatar).toBeTruthy()
  })
})
