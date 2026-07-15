import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ChatPage from '../page'

const mocks = vi.hoisted(() => {
  const chatStoreState = {
    currentRoom: null as { id: number; name: string } | null,
    rooms: [] as Array<{ id: number; name: string }>,
    retryLastAction: vi.fn(),
    clearError: vi.fn(),
    error: null,
    clearAllOnlineUsers: vi.fn(),
    setConnectionStatus: vi.fn(),
    addMessage: vi.fn(),
    updateMuteStatus: vi.fn(),
    updateRoomOnlineCount: vi.fn(),
    setTyping: vi.fn(),
    loadRooms: vi.fn(() => Promise.resolve()),
    loadOnlineUsers: vi.fn(() => Promise.resolve()),
    connectionStatus: 'disconnected',
  }

  const authState = {
    isAuthenticated: true,
    loading: false,
    token: 'mock-token',
    user: { id: 1 },
  }

  const webSocketState = {
    connect: vi.fn(() => Promise.resolve(true)),
    disconnect: vi.fn(() => Promise.resolve()),
    joinRoom: vi.fn(() => Promise.resolve()),
    reconnect: vi.fn(),
    retryFailedMessages: vi.fn(),
    clearOfflineQueue: vi.fn(),
    sendTyping: vi.fn(),
    sendMessage: vi.fn(() => Promise.resolve({ success: true })),
    offlineState: {
      isOffline: false,
      lastOnline: null,
      queuedMessages: [],
      queueSize: 0,
      maxQueueSize: 100,
    },
    connectionInfo: {
      status: 'disconnected',
      lastConnected: null,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      lastError: null,
      isRetrying: false,
    },
  }

  return {
    chatStoreState,
    authState,
    webSocketState,
    push: vi.fn(),
  }
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
  }),
}))

vi.mock('@/app/chat/chatStore', () => {
  const store = Object.assign(
    vi.fn(() => mocks.chatStoreState),
    {
      getState: () => mocks.chatStoreState,
    }
  )
  return {
    __esModule: true,
    default: store,
  }
})

vi.mock('@/stores/authStore', () => {
  const store = Object.assign(
    vi.fn(() => mocks.authState),
    {
      getState: () => mocks.authState,
    }
  )
  return {
    __esModule: true,
    default: store,
  }
})

vi.mock('@/hooks/useChatWebSocket', () => ({
  useChatWebSocket: vi.fn(() => mocks.webSocketState),
}))

vi.mock('../components', () => ({
  MessageList: ({ roomId }: { roomId: number }) => <div>message-list-{roomId}</div>,
  MessageInput: ({ roomId, isConnected }: { roomId: number; isConnected: boolean }) => (
    <div>{`message-input-${roomId}-${isConnected ? 'connected' : 'disconnected'}`}</div>
  ),
  ChatHeader: ({ room }: { room: { name: string } }) => <div>{`header-${room.name}`}</div>,
  ChatSidebar: ({ type, connectionInfo }: { type: string; connectionInfo: { status: string } }) => (
    <div>{`sidebar-${type}-${connectionInfo.status}`}</div>
  ),
  MobileSheets: () => <div>mobile-sheets</div>,
  ChatErrorHandler: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ChatWelcome: () => <div>chat-welcome</div>,
  ChatPageSkeleton: () => <div>chat-page-skeleton</div>,
}))

vi.mock('../components/ChatErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useChatErrorHandler: () => ({
    error: null,
    handleError: vi.fn(),
    clearError: vi.fn(),
    retryAction: vi.fn(),
  }),
}))

describe('ChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.authState.isAuthenticated = true
    mocks.authState.loading = false
    mocks.chatStoreState.currentRoom = null
    mocks.chatStoreState.rooms = []
    mocks.chatStoreState.connectionStatus = 'disconnected'
    mocks.webSocketState.connectionInfo = {
      status: 'disconnected',
      lastConnected: null,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      lastError: null,
      isRetrying: false,
    }
  })

  it('renders a skeleton while auth state is loading', () => {
    mocks.authState.loading = true

    render(<ChatPage />)

    expect(screen.getByText('chat-page-skeleton')).toBeInTheDocument()
  })

  it('renders nothing when the user is not authenticated', () => {
    mocks.authState.isAuthenticated = false

    const { container } = render(<ChatPage />)

    expect(container).toBeEmptyDOMElement()
  })

  it('loads rooms and renders the welcome state when no room is selected', async () => {
    render(<ChatPage />)

    await waitFor(() => {
      expect(mocks.chatStoreState.loadRooms).toHaveBeenCalled()
      expect(mocks.webSocketState.connect).toHaveBeenCalled()
    })

    expect(screen.getByText('chat-welcome')).toBeInTheDocument()
    expect(screen.getByText('sidebar-rooms-disconnected')).toBeInTheDocument()
    expect(screen.getByText('sidebar-users-disconnected')).toBeInTheDocument()
  })

  it('renders the active room layout and passes connected state to message input', () => {
    mocks.chatStoreState.currentRoom = { id: 7, name: 'General' }
    mocks.chatStoreState.rooms = [{ id: 7, name: 'General' }]
    mocks.webSocketState.connectionInfo = {
      status: 'connected',
      lastConnected: null,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      lastError: null,
      isRetrying: false,
    }

    render(<ChatPage />)

    expect(screen.getAllByText('header-General')).toHaveLength(2)
    expect(screen.getByText('message-list-7')).toBeInTheDocument()
    expect(screen.getByText('message-input-7-connected')).toBeInTheDocument()
  })

  it('joins the current room when websocket connection is already established', async () => {
    mocks.chatStoreState.currentRoom = { id: 9, name: 'Raid' }
    mocks.chatStoreState.rooms = [{ id: 9, name: 'Raid' }]
    mocks.webSocketState.connectionInfo = {
      status: 'connected',
      lastConnected: null,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      lastError: null,
      isRetrying: false,
    }

    render(<ChatPage />)

    await waitFor(() => {
      expect(mocks.webSocketState.joinRoom).toHaveBeenCalledWith('9')
    })
  })
})
