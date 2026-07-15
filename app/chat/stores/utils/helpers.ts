import useAuthStore from '@/stores/authStore'
import type { ChatMessage, OnlineUser } from '../../types'
import type { ChatState } from '../../chatStore'
import { handleChatApiError, type ChatApiError } from '@/lib/api/chat-error-handler'

/**
 * 获取当前用户ID
 */
export const getCurrentUserId = (): number | null => {
  return useAuthStore.getState().user?.id ?? null
}

/**
 * 检查是否为自己的消息
 */
export const isOwnMessage = (message: ChatMessage): boolean => {
  const currentUserId = getCurrentUserId()
  return currentUserId ? message.user.id === currentUserId : false
}

/**
 * 统一处理聊天API错误，减少重复代码
 * @param error - 捕获的错误
 * @param label - 错误标签（用于日志和提示）
 * @param options - 配置选项
 * @returns 处理后的 ChatApiError
 */
export const handleChatStoreError = (
  error: unknown,
  label: string,
  options?: { showToast?: boolean; retryable?: boolean }
): ChatApiError => {
  const chatError = handleChatApiError(error, label, {
    showToast: options?.showToast ?? true,
    retryable: options?.retryable ?? true,
  })
  return chatError
}

/**
 * 设置错误状态并抛出，用于 async thunk 模式
 * 注意：此函数总是抛出错误，不会正常返回
 */
export const setChatError = (
  set: (partial: Partial<ChatState> | ((state: ChatState) => Partial<ChatState>)) => void,
  error: ChatApiError,
  extraState?: Partial<ChatState>
): never => {
  set({
    error,
    lastError: error,
    ...extraState,
  })
  throw error
}

/**
 * 清理房间数据
 */
export const cleanRoomData = (state: ChatState, roomId: number): Partial<ChatState> => {
  const roomKey = roomId.toString()
  const newState: Partial<ChatState> = {}

  // 清理消息数据
  const newMessages = { ...state.messages }
  delete newMessages[roomKey]
  newState.messages = newMessages

  const newOnlineUsers = { ...state.onlineUsers }
  delete newOnlineUsers[roomKey]
  newState.onlineUsers = newOnlineUsers

  const newMessagesPagination = { ...state.messagesPagination }
  delete newMessagesPagination[roomKey]
  newState.messagesPagination = newMessagesPagination

  // 清理通知数据
  const newNotifications = { ...state.notifications }
  delete newNotifications[roomKey]
  newState.notifications = newNotifications
  newState.mentions = state.mentions.filter(
    (mention: { roomId: number }) => mention.roomId !== roomId
  )

  return newState
}

/**
 * 更新在线用户列表，避免重复
 */
export const addOnlineUserToList = (currentUsers: OnlineUser[], user: OnlineUser): OnlineUser[] => {
  const userExists = currentUsers.some(u => u.id === user.id)
  if (userExists) return currentUsers
  return [...currentUsers, user]
}

/**
 * 从在线用户列表中移除用户
 */
export const removeOnlineUserFromList = (
  currentUsers: OnlineUser[],
  userId: number
): OnlineUser[] => {
  return currentUsers.filter(u => u.id !== userId)
}
