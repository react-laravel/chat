import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RoomListSkeleton } from '@/app/chat/components/room-list/components/RoomListSkeleton'

describe('RoomListSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<RoomListSkeleton />)
    expect(container.querySelector('[role="status"]')).toBeTruthy()
  })

  it('renders with aria-busy attribute', () => {
    const { container } = render(<RoomListSkeleton />)
    const statusElement = container.querySelector('[role="status"]')
    expect(statusElement).toHaveAttribute('aria-busy', 'true')
  })

  it('renders with aria-label', () => {
    const { container } = render(<RoomListSkeleton />)
    const statusElement = container.querySelector('[role="status"]')
    expect(statusElement).toHaveAttribute('aria-label', 'Loading room...')
  })
})
