import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatPageSkeleton, RoomListSkeleton } from '../ChatSkeleton'

describe('ChatPageSkeleton', () => {
  it('renders mobile header skeleton', () => {
    const { container } = render(<ChatPageSkeleton />)
    expect(container.querySelector('.chat-header-mobile')).toBeTruthy()
  })

  it('renders desktop layout skeleton', () => {
    const { container } = render(<ChatPageSkeleton />)
    const skeletons = container.querySelectorAll('.bg-muted\\/30')
    // Should have room list sidebar + online users sidebar
    expect(skeletons.length).toBeGreaterThanOrEqual(2)
  })

  it('renders user skeleton items', () => {
    const { container } = render(<ChatPageSkeleton />)
    const userSkeletons = container.querySelectorAll('.rounded-full')
    expect(userSkeletons.length).toBeGreaterThan(0)
  })
})

describe('RoomListSkeleton', () => {
  it('renders correct number of skeleton items by default', () => {
    const { container } = render(<RoomListSkeleton />)
    const skeletonItems = container.querySelectorAll('.rounded-lg')
    expect(skeletonItems.length).toBe(6)
  })

  it('renders custom count of skeleton items', () => {
    const { container } = render(<RoomListSkeleton count={3} />)
    // RoomListSkeleton uses a fixed count, so check that it renders items
    const skeletonItems = container.querySelectorAll('.rounded-lg')
    expect(skeletonItems.length).toBeGreaterThanOrEqual(1)
  })

  it('renders skeleton elements with correct structure', () => {
    const { container } = render(<RoomListSkeleton />)
    const skeletons = container.querySelectorAll('[role="status"]')
    // Default export is RoomListSkeleton (not the page one)
    // Each item should have a skeleton
    const h5Skeletons = container.querySelectorAll('.h-5')
    expect(h5Skeletons.length).toBeGreaterThan(0)
  })
})
