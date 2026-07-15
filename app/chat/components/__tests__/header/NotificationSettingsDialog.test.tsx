import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NotificationSettingsDialog } from '../../header/NotificationSettingsDialog'

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

vi.mock('@/app/chat/hooks/useNotificationService', () => ({
  useNotificationService: () => ({
    getNotificationService: () => ({
      isNotificationSupported: vi.fn(() => true),
      showNotification: vi.fn(),
      playSound: vi.fn(),
    }),
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('NotificationSettingsDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    notificationSettings: {
      browserNotifications: true,
      soundNotifications: true,
      mentionNotifications: true,
      roomNotifications: true,
    },
    browserNotificationPermission: 'granted' as NotificationPermission,
    onUpdateNotificationSettings: vi.fn(),
    onRequestBrowserNotificationPermission: vi.fn().mockResolvedValue('granted'),
  }

  it('renders dialog when open', () => {
    const { getByText } = render(<NotificationSettingsDialog {...defaultProps} />)
    expect(getByText('通知设置')).toBeInTheDocument()
  })

  it('shows granted permission status', () => {
    const { getByText } = render(<NotificationSettingsDialog {...defaultProps} />)
    expect(getByText(/已授权/)).toBeInTheDocument()
  })

  it('shows denied permission status', () => {
    const { getByText } = render(
      <NotificationSettingsDialog {...defaultProps} browserNotificationPermission="denied" />
    )
    expect(getByText(/已拒绝/)).toBeInTheDocument()
  })

  it('shows default permission status', () => {
    const { getByText } = render(
      <NotificationSettingsDialog {...defaultProps} browserNotificationPermission="default" />
    )
    expect(getByText(/未请求/)).toBeInTheDocument()
  })

  it('shows test notification button when granted', () => {
    const { getByRole } = render(<NotificationSettingsDialog {...defaultProps} />)
    expect(getByRole('button', { name: '测试通知' })).toBeInTheDocument()
  })

  it('shows request permission button when not granted', () => {
    const { getByRole } = render(
      <NotificationSettingsDialog {...defaultProps} browserNotificationPermission="default" />
    )
    expect(getByRole('button', { name: '请求权限' })).toBeInTheDocument()
  })

  it('shows sound test buttons when soundNotifications is enabled', () => {
    const { getByRole } = render(<NotificationSettingsDialog {...defaultProps} />)
    expect(getByRole('button', { name: '消息' })).toBeInTheDocument()
    expect(getByRole('button', { name: '提及' })).toBeInTheDocument()
    expect(getByRole('button', { name: '加入' })).toBeInTheDocument()
    expect(getByRole('button', { name: '离开' })).toBeInTheDocument()
  })

  it('hides sound test buttons when soundNotifications is disabled', () => {
    const { queryByRole } = render(
      <NotificationSettingsDialog
        {...defaultProps}
        notificationSettings={{ ...defaultProps.notificationSettings, soundNotifications: false }}
      />
    )
    expect(queryByRole('button', { name: '消息' })).not.toBeInTheDocument()
  })

  it('calls onUpdateNotificationSettings when toggling room notifications', async () => {
    const user = userEvent.setup()
    const onUpdateNotificationSettings = vi.fn()
    render(
      <NotificationSettingsDialog
        {...defaultProps}
        onUpdateNotificationSettings={onUpdateNotificationSettings}
      />
    )

    const roomToggle = document.getElementById('room-notifications')
    if (roomToggle) {
      await user.click(roomToggle)
    }
    // The toggle calls onUpdateNotificationSettings
    expect(onUpdateNotificationSettings).toHaveBeenCalled()
  })
})
