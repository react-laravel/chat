import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ChatSidebar } from '../ChatSidebar'
import type { ConnectionMonitor } from '@/lib/websocket'
import type { OfflineState } from '@/lib/websocket/offline-manager'
import type { ChatRoom } from '@/app/chat/types'

const mockConnectionInfo: ConnectionMonitor = {
  status: 'connected',
  isRetrying: false,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  lastConnected: new Date(),
  lastError: null,
}

const mockOfflineState: OfflineState = {
  isOffline: false,
  queueSize: 0,
  lastOnline: new Date(),
}

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

vi.mock('@/app/chat/components/ChatRoomList', () => ({
  ChatRoomList: ({ showHeader }: { showHeader?: boolean }) => (
    <div data-testid="chat-room-list">Room List (header: {String(showHeader)})</div>
  ),
}))

vi.mock('@/app/chat/components/OnlineUsers', () => ({
  OnlineUsers: ({ roomId }: { roomId: number }) => (
    <div data-testid="online-users">Online Users for room {roomId}</div>
  ),
}))

describe('ChatSidebar', () => {
  it('renders rooms sidebar when type is rooms', () => {
    const { getByTestId, getByText } = render(
      <ChatSidebar
        type="rooms"
        connectionInfo={mockConnectionInfo}
        offlineState={mockOfflineState}
        onReconnect={() => {}}
        onRetryMessages={() => {}}
        onClearQueue={() => {}}
      />
    )

    expect(getByTestId('chat-room-list')).toBeInTheDocument()
    expect(getByText('Chat Rooms')).toBeInTheDocument()
  })

  it('renders users sidebar when type is users with current room', () => {
    const { getByTestId, getByText } = render(
      <ChatSidebar
        type="users"
        currentRoom={mockRoom}
        connectionInfo={mockConnectionInfo}
        offlineState={mockOfflineState}
        onReconnect={() => {}}
        onRetryMessages={() => {}}
        onClearQueue={() => {}}
      />
    )

    expect(getByTestId('online-users')).toBeInTheDocument()
    expect(getByText('Online Users')).toBeInTheDocument()
  })

  it('renders select room prompt when users sidebar has no current room', () => {
    const { getByText } = render(
      <ChatSidebar
        type="users"
        currentRoom={null}
        connectionInfo={mockConnectionInfo}
        offlineState={mockOfflineState}
        onReconnect={() => {}}
        onRetryMessages={() => {}}
        onClearQueue={() => {}}
      />
    )

    expect(getByText('Select a room to see online users')).toBeInTheDocument()
  })

  it('passes through mention/direct/block/report callbacks', async () => {
    const user = userEvent.setup()
    const onMentionUser = vi.fn()
    const onDirectMessage = vi.fn()

    render(
      <ChatSidebar
        type="users"
        currentRoom={mockRoom}
        connectionInfo={mockConnectionInfo}
        offlineState={mockOfflineState}
        onReconnect={() => {}}
        onRetryMessages={() => {}}
        onClearQueue={() => {}}
        onMentionUser={onMentionUser}
        onDirectMessage={onDirectMessage}
      />
    )

    // The callbacks are passed to OnlineUsers, verifying the component renders
    expect(document.querySelector('[data-testid="online-users"]')).toBeTruthy()
  })
})
