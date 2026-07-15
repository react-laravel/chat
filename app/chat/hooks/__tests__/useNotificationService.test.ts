import { describe, expect, it, vi } from 'vitest'
import { useNotificationService } from '@/app/chat/hooks/useNotificationService'
import { renderHook } from '@testing-library/react'
import NotificationService from '@/lib/services/notificationService'

vi.mock('@/lib/services/notificationService', () => ({
  default: {
    getInstance: vi.fn(() => ({
      isNotificationSupported: vi.fn(() => true),
      showNotification: vi.fn(),
      playSound: vi.fn(),
    })),
  },
}))

describe('useNotificationService', () => {
  it('returns getNotificationService function', () => {
    const { result } = renderHook(() => useNotificationService())
    expect(typeof result.current.getNotificationService).toBe('function')
  })

  it('returns same notification service instance on multiple calls', () => {
    const { result } = renderHook(() => useNotificationService())
    const instance1 = result.current.getNotificationService()
    const instance2 = result.current.getNotificationService()
    expect(instance1).toBe(instance2)
  })

  it('creates notification service with correct methods', () => {
    const { result } = renderHook(() => useNotificationService())
    const service = result.current.getNotificationService()
    expect(typeof service.isNotificationSupported).toBe('function')
    expect(typeof service.showNotification).toBe('function')
    expect(typeof service.playSound).toBe('function')
  })
})
