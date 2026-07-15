import type Echo from 'laravel-echo'

/** 私有「输入中」频道包装：监听 whisper + 发送 whisper */
export type TypingChannelWrapper = {
  stopListening: () => void
  whisper: (payload: { id: number; name: string }) => void
}

export type RoomListChannelWrapper = {
  listen: (event: string, callback: (data: unknown) => void) => void
  stopListening: () => void
  channel: ReturnType<Echo<'reverb'>['channel']>
}

/**
 * 创建「输入中」私有频道，用于监听和发送 typing whisper
 */
export const createTypingChannel = (
  echoInstance: Echo<'reverb'>,
  roomId: string,
  onTyping: (data: { id: number; name: string }) => void
): TypingChannelWrapper => {
  const channel = echoInstance.private(`chat.room.${roomId}.typing`)

  channel.listenForWhisper('typing', (data: unknown) => {
    const payload = data as { id?: number; name?: string }
    if (payload && typeof payload.id === 'number') {
      onTyping({ id: payload.id, name: typeof payload.name === 'string' ? payload.name : '' })
    }
  })

  return {
    stopListening: () => {
      try {
        channel.stopListeningForWhisper('typing')
        echoInstance.leave(`chat.room.${roomId}.typing`)
      } catch (e) {
        console.warn('WebSocket: Error leaving typing channel', e)
      }
    },
    whisper: (payload: { id: number; name: string }) => {
      try {
        channel.whisper('typing', payload)
      } catch (e) {
        console.warn('WebSocket: Error sending typing whisper', e)
      }
    },
  }
}

/**
 * 创建频道包装器，合并消息频道和用户状态频道
 */
export const createChannelWrapper = (
  echoInstance: Echo<'reverb'>,
  roomId: string
): {
  listen: (event: string, callback: (data: unknown) => void) => void
  bind: (event: string, callback: (data?: unknown) => void) => void
  stopListening: (event?: string, callback?: () => void) => void
  channel: ReturnType<Echo<'reverb'>['channel']>
  roomEventChannel: ReturnType<Echo<'reverb'>['channel']>
} => {
  const channel = echoInstance.channel(`chat.room.${roomId}`)
  console.log('WebSocket: Created channel for room', roomId, 'channel:', channel)

  if (!channel) {
    throw new Error(`Failed to create channel for room ${roomId}`)
  }

  const roomEventChannel = echoInstance.channel(`chat-room-${roomId}`)
  console.log('WebSocket: ✅ 房间人数频道创建成功')

  return {
    listen: (event: string, callback: (data: unknown) => void) => {
      try {
        if (event === '.user.joined.room' || event === '.user.left.room') {
          roomEventChannel.listen(event, callback)
          return
        }

        if (event.includes('message') || event.includes('MessageSent') || event === '.') {
          channel.listen(event, callback)
          return
        }

        channel.listen(event, callback)
      } catch (error) {
        console.error('WebSocket: Error listening to event', event, ':', error)
      }
    },
    bind: (event: string, callback: (data?: unknown) => void) => {
      try {
        channel.listen(event, callback)
        roomEventChannel.listen(event, callback)
      } catch (error) {
        console.error('WebSocket: Error binding to event', event, ':', error)
      }
    },
    stopListening: (event?: string, callback?: () => void) => {
      try {
        if (event && callback) {
          channel.stopListening(event, callback)
          roomEventChannel.stopListening(event, callback)
        } else if (event) {
          console.log('WebSocket: Cannot stop listening without callback, event:', event)
        } else {
          try {
            channel.stopListening('*', () => {})
            roomEventChannel.stopListening('*', () => {})
          } catch {
            console.warn('WebSocket: Using alternative cleanup method')
          }
        }
      } catch (error) {
        console.error('WebSocket: Error stopping channels:', error)
      }
    },
    channel,
    roomEventChannel,
  }
}

export const createRoomListChannel = (echoInstance: Echo<'reverb'>): RoomListChannelWrapper => {
  const channel = echoInstance.channel('chat-rooms-list')

  return {
    listen: (event: string, callback: (data: unknown) => void) => {
      try {
        channel.listen(event, callback)
      } catch (error) {
        console.error('WebSocket: Error listening to room list event', event, ':', error)
      }
    },
    stopListening: () => {
      try {
        echoInstance.leave('chat-rooms-list')
      } catch (error) {
        console.error('WebSocket: Error leaving room list channel:', error)
      }
    },
    channel,
  }
}

/**
 * 设置房间事件监听器
 */
export const setupRoomEventListeners = (
  channelWrapper: ReturnType<typeof createChannelWrapper>,
  roomId: string,
  onMessage?: (data: unknown) => void
): void => {
  if (!channelWrapper || typeof channelWrapper.listen !== 'function') {
    console.error('WebSocket: Channel reference is invalid - missing listen method')
    return
  }

  console.log('WebSocket: Setting up event listeners for room', roomId)

  const safeOnMessage = (data: unknown, type: string = 'message') => {
    if (onMessage && data) onMessage({ type, ...data })
  }

  channelWrapper.listen('.message.sent', (data: unknown) => {
    const typedData = data as { message?: unknown }
    if (typedData?.message) safeOnMessage({ message: typedData.message }, 'message')
  })

  channelWrapper.listen('.user.joined', (data: unknown) => safeOnMessage(data, 'user_joined'))
  channelWrapper.listen('.user.left', (data: unknown) => safeOnMessage(data, 'user_left'))

  channelWrapper.listen('Chat\\MessageSent', (data: unknown) => {
    const typedData = data as { message?: unknown }
    if (typedData?.message) safeOnMessage({ message: typedData.message }, 'message')
  })

  channelWrapper.listen('.', (data: unknown) => {
    const typedData = data as { message?: unknown }
    if (typedData?.message) {
      safeOnMessage({ message: typedData.message }, 'message')
    }
  })

  // 绑定系统事件
  if (typeof channelWrapper.bind === 'function') {
    channelWrapper.bind('pusher:subscription_succeeded', () => {
      console.log('WebSocket: Subscription succeeded for room', roomId)
    })
    channelWrapper.bind('pusher:subscription_error', () => {
      console.error('WebSocket: Subscription error for room', roomId)
    })
  }
}

export const setupRoomListEventListeners = (
  channelWrapper: RoomListChannelWrapper,
  onMessage?: (data: unknown) => void
): void => {
  if (!onMessage) {
    return
  }

  const safeOnMessage = (data: unknown, type: 'user.joined.room' | 'user.left.room') => {
    if (data) {
      onMessage({ type, ...data })
    }
  }

  channelWrapper.listen('.user.joined.room', (data: unknown) => {
    safeOnMessage(data, 'user.joined.room')
  })
  channelWrapper.listen('.user.left.room', (data: unknown) => {
    safeOnMessage(data, 'user.left.room')
  })
}
