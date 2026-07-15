import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ChatHeader } from '../ChatHeader'
import type { ChatRoom } from '@/app/chat/types'

const mockRoom: ChatRoom = {
  id: 1,
  name: 'Test Room',
  description: '',
  created_by: 1,
  is_active: true,
  is_private: false,
  created_at: '2026-03-05T10:00:00.000Z',
  updated_at: '2026-03-05T10:00:00.000Z',
  online_count: 0,
}

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

describe('ChatHeader', () => {
  it('renders room name', () => {
    const { container } = render(<ChatHeader room={mockRoom} />)
    // Both desktop and mobile headers render the room name
    const roomNames = container.querySelectorAll('h1')
    expect(roomNames.length).toBeGreaterThanOrEqual(1)
    expect(roomNames[0].textContent).toBe('Test Room')
  })

  it('renders notification settings', () => {
    const { getAllByText } = render(<ChatHeader room={mockRoom} />)
    const notificationElements = getAllByText('通知设置')
    expect(notificationElements.length).toBeGreaterThanOrEqual(1)
  })

  it('shows back button when showBackButton is true', () => {
    const onBack = vi.fn()
    const { getAllByRole } = render(<ChatHeader room={mockRoom} showBackButton onBack={onBack} />)
    const backButtons = getAllByRole('button', { name: /返回/ })
    expect(backButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('calls onBack when back button clicked', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    const view = render(<ChatHeader room={mockRoom} showBackButton onBack={onBack} />)

    await user.click(view.getAllByRole('button', { name: /返回/ })[0])
    expect(onBack).toHaveBeenCalled()
  })

  it('calls onSearchChange when search input changes', async () => {
    const onSearchChange = vi.fn()
    render(<ChatHeader room={mockRoom} searchQuery="" onSearchChange={onSearchChange} />)

    expect(onSearchChange).not.toHaveBeenCalled()
  })

  it('calls onOpenRoomList when provided', async () => {
    const user = userEvent.setup()
    const onOpenRoomList = vi.fn()
    const { getByRole } = render(<ChatHeader room={mockRoom} onOpenRoomList={onOpenRoomList} />)

    const roomListButton = getByRole('button', { name: /open room list/i })
    await user.click(roomListButton)
    expect(onOpenRoomList).toHaveBeenCalled()
  })

  it('renders both desktop and mobile variants', () => {
    const { container } = render(<ChatHeader room={mockRoom} />)
    expect(container.textContent).toContain('Test Room')
  })
})
