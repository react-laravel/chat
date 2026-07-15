import { create } from 'zustand'
import { ApiError, apiRequest } from '@/lib/api'

export interface ChatUser {
  id: number
  name: string
  email?: string | null
  is_admin: boolean
  permissions: string[]
}

interface EmbedContext {
  clientId: string
  parentOrigin: string
}

interface AuthState {
  user: ChatUser | null
  token: null
  isAuthenticated: boolean
  loading: boolean
  restoreSession: () => Promise<ChatUser | null>
  exchangeTicket: (ticket: string, context?: EmbedContext) => Promise<ChatUser>
  logout: () => Promise<void>
  beginLogin: (context?: EmbedContext) => void
}

function loginUrl(context?: EmbedContext): string {
  const accountUrl = (process.env.NEXT_PUBLIC_ACCOUNT_URL || 'https://next.dogeow.com').replace(/\/$/, '')
  return `${accountUrl}/auth/sso/chat?return_to=${encodeURIComponent(window.location.href)}`
}

const useAuthStore = create<AuthState>(set => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,

  restoreSession: async () => {
    set({ loading: true })
    try {
      const user = await apiRequest<ChatUser>('/user', 'GET', undefined, {
        suppressUnauthorizedRedirect: true,
      })
      set({ user, isAuthenticated: true, loading: false })
      return user
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        set({ user: null, isAuthenticated: false, loading: false })
        return null
      }
      set({ loading: false })
      throw error
    }
  },

  exchangeTicket: async (ticket, context) => {
    set({ loading: true })
    try {
      const user = await apiRequest<ChatUser>(
        '/auth/exchange',
        'POST',
        context
          ? { ticket, client_id: context.clientId, parent_origin: context.parentOrigin }
          : { ticket },
        { suppressUnauthorizedRedirect: true }
      )
      set({ user, isAuthenticated: true, loading: false })
      return user
    } catch (error) {
      set({ user: null, isAuthenticated: false, loading: false })
      throw error
    }
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', 'POST', undefined, { suppressUnauthorizedRedirect: true })
    } finally {
      set({ user: null, isAuthenticated: false, loading: false })
    }
  },

  beginLogin: context => {
    if (typeof window === 'undefined') return
    const target = loginUrl(context)
    if (context) {
      window.open(target, 'dogeow-chat-login', 'popup,width=520,height=720')
      return
    }
    window.location.assign(target)
  },
}))

if (typeof window !== 'undefined') {
  window.addEventListener('chat:unauthorized', () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, loading: false })
  })
}

export default useAuthStore
