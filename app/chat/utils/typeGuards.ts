import type { ChatMessage, ChatRoom, OnlineUser } from '../types'

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const isOnlineUser = (value: unknown): value is OnlineUser =>
  isRecord(value) && typeof value.id === 'number' && typeof value.name === 'string'

export const isChatMessage = (value: unknown): value is ChatMessage =>
  isRecord(value) && typeof value.id === 'number' && typeof value.message === 'string'

export const isChatRoom = (value: unknown): value is ChatRoom =>
  isRecord(value) && typeof value.id === 'number' && typeof value.name === 'string'

export type ChatRoomsResponse = ChatRoom[] | { rooms?: ChatRoom[] }
export type CreateRoomResponse = ChatRoom | { room?: ChatRoom }
export type RoomUsersResponse = OnlineUser[] | { users?: OnlineUser[]; online_users?: OnlineUser[] }
export type ApiErrorResponse = { message?: string }

export const resolveRoomsResponse = (data: ChatRoomsResponse): ChatRoom[] => {
  if (Array.isArray(data)) {
    return data
  }
  return Array.isArray(data.rooms) ? data.rooms : []
}

export const resolveUsersResponse = (data: RoomUsersResponse): OnlineUser[] => {
  if (Array.isArray(data)) {
    return data
  }
  if (Array.isArray(data.online_users)) {
    return data.online_users
  }
  return Array.isArray(data.users) ? data.users : []
}

export const resolveCreateRoomResponse = (data: CreateRoomResponse): ChatRoom => {
  if (isRecord(data) && 'room' in data && isChatRoom((data as { room?: unknown }).room)) {
    return (data as { room: ChatRoom }).room
  }
  if (isChatRoom(data)) {
    return data
  }
  throw new Error('Invalid create room response payload')
}

export const normalizeIncomingMessage = (value: unknown): ChatMessage | null => {
  if (!isRecord(value)) return null

  // sendMessage API may return { data: ChatMessage, mentions: [] }
  const source = isRecord(value.data) ? value.data : value

  const id = Number(source.id)
  const roomId = Number(source.room_id)
  const userId = Number(source.user_id)

  if (!Number.isFinite(id) || !Number.isFinite(roomId) || !Number.isFinite(userId)) {
    return null
  }

  const createdAt =
    typeof source.created_at === 'string' && source.created_at
      ? source.created_at
      : new Date().toISOString()
  const updatedAt =
    typeof source.updated_at === 'string' && source.updated_at ? source.updated_at : createdAt

  const user = isRecord(source.user) ? source.user : null
  const normalizedUserId = Number(user?.id ?? userId)

  return {
    id,
    room_id: roomId,
    user_id: userId,
    message: typeof source.message === 'string' ? source.message : '',
    message_type: source.message_type === 'system' ? 'system' : 'text',
    created_at: createdAt,
    updated_at: updatedAt,
    user: {
      id: Number.isFinite(normalizedUserId) ? normalizedUserId : userId,
      name: typeof user?.name === 'string' && user.name ? user.name : 'Unknown',
      email: typeof user?.email === 'string' ? user.email : '',
    },
    reactions: Array.isArray(source.reactions)
      ? (source.reactions as ChatMessage['reactions'])
      : undefined,
  }
}
