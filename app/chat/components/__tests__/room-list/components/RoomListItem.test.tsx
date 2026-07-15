import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RoomListItem } from '@/app/chat/components/room-list/components/RoomListItem'
import type { ChatRoom } from '@/app/chat/types'

const mockRoom: ChatRoom = {
  id: 1,
  name: 'General',
  description: 'Main room',
  created_by: 1,
  is_active: true,
  is_private: false,
  created_at: '2026-03-05T10:00:00.000Z',
  updated_at: '2026-03-05T10:00:00.000Z',
  online_count: 3,
}

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

describe('RoomListItem', () => {
  it('renders room name', () => {
    const { getByText } = render(
      <RoomListItem
        room={mockRoom}
        isActive={false}
        isFavorite={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(getByText('General')).toBeInTheDocument()
  })

  it('renders online count', () => {
    const { getByText } = render(
      <RoomListItem
        room={mockRoom}
        isActive={false}
        isFavorite={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(getByText('3')).toBeInTheDocument()
  })

  it('renders lock icon for private room', () => {
    const privateRoom = { ...mockRoom, is_private: true }
    const { container } = render(
      <RoomListItem
        room={privateRoom}
        isActive={false}
        isFavorite={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    // Lock icon should be present
    const lockIcon = container.querySelector('[aria-label]')
    expect(lockIcon).toBeTruthy()
  })

  it('renders star icon when favorite', () => {
    const { container } = render(
      <RoomListItem
        room={mockRoom}
        isActive={false}
        isFavorite={true}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    const starIcons = container.querySelectorAll('.fill-current')
    expect(starIcons.length).toBeGreaterThan(0)
  })

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const view = render(
      <RoomListItem
        room={mockRoom}
        isActive={false}
        isFavorite={false}
        onSelect={onSelect}
        onToggleFavorite={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    await user.click(view.getByText('General'))
    expect(onSelect).toHaveBeenCalledWith(mockRoom)
  })

  it('applies active styling when isActive is true', () => {
    const { container } = render(
      <RoomListItem
        room={mockRoom}
        isActive={true}
        isFavorite={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    const activeElement = container.querySelector('[role="button"]')
    expect(activeElement).toBeTruthy()
    // Active state applies background styling
    expect(activeElement?.className).toContain('bg-accent')
  })
})
