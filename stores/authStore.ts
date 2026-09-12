import { create } from 'zustand'
import { prepareChatSession, clearChatSession } from './chatSession'
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
  signedOut: boolean
  restoreSession: () => Promise<ChatUser | null>
  exchangeTicket: (ticket: string, context?: EmbedContext) => Promise<ChatUser>
  logout: () => Promise<void>
  beginLogin: (context?: EmbedContext) => void
}

function loginUrl(context?: EmbedContext): string {
  const accountUrl = (process.env.NEXT_PUBLIC_ACCOUNT_URL || 'https://next.dogeow.com').replace(
    /\/$/,
    ''
  )
  return `${accountUrl}/auth/sso/chat?return_to=${encodeURIComponent(window.location.href)}`
}

let sessionRequestId = 0

const useAuthStore = create<AuthState>(set => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  signedOut: false,

  restoreSession: async () => {
    const requestId = ++sessionRequestId
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem('chat-signed-out') === 'true') {
        set({ user: null, isAuthenticated: false, loading: false, signedOut: true })
        return null
      }
    } catch {}
    set({ loading: true })
    try {
      const user = await apiRequest<ChatUser>('/user', 'GET', undefined, {
        suppressUnauthorizedRedirect: true,
      })
      if (requestId !== sessionRequestId) return user
      await prepareChatSession(user.id, () => requestId === sessionRequestId)
      if (requestId !== sessionRequestId) return user
      set({ user, isAuthenticated: true, loading: false, signedOut: false })
      return user
    } catch (error) {
      if (requestId !== sessionRequestId) return null
      if (error instanceof ApiError && error.status === 401) {
        set({ user: null, isAuthenticated: false, loading: false })
        return null
      }
      set({ loading: false })
      throw error
    }
  },

  exchangeTicket: async (ticket, context) => {
    try {
      sessionStorage.removeItem('chat-signed-out')
    } catch {}
    set({ signedOut: false })
    const requestId = ++sessionRequestId
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
      if (requestId !== sessionRequestId) return user
      await prepareChatSession(user.id, () => requestId === sessionRequestId)
      if (requestId !== sessionRequestId) return user
      set({ user, isAuthenticated: true, loading: false, signedOut: false })
      return user
    } catch (error) {
      if (requestId === sessionRequestId)
        set({ user: null, isAuthenticated: false, loading: false })
      throw error
    }
  },

  logout: async () => {
    const requestId = ++sessionRequestId
    try {
      await apiRequest('/auth/logout', 'POST', undefined, { suppressUnauthorizedRedirect: true })
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) throw error
    }
    if (requestId !== sessionRequestId) return
    await clearChatSession(() => requestId === sessionRequestId)
    if (requestId !== sessionRequestId) return
    try {
      sessionStorage.setItem('chat-signed-out', 'true')
    } catch {}
    set({ user: null, isAuthenticated: false, loading: false, signedOut: true })
  },

  beginLogin: context => {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.removeItem('chat-signed-out')
    } catch {}
    set({ signedOut: false })
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
