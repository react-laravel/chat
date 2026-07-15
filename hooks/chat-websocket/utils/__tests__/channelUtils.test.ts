import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createChannelWrapper,
  createRoomListChannel,
  setupRoomEventListeners,
  setupRoomListEventListeners,
} from '../channelUtils'

type Listener = (data: unknown) => void

const createMockChannel = () => ({
  listen: vi.fn(),
  stopListening: vi.fn(),
})

describe('channelUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('subscribes to room message and room count channels', () => {
    const roomChannel = createMockChannel()
    const roomCountChannel = createMockChannel()
    const echoInstance = {
      channel: vi.fn().mockReturnValueOnce(roomChannel).mockReturnValueOnce(roomCountChannel),
    }

    const wrapper = createChannelWrapper(echoInstance as never, '7')

    expect(echoInstance.channel).toHaveBeenNthCalledWith(1, 'chat.room.7')
    expect(echoInstance.channel).toHaveBeenNthCalledWith(2, 'chat-room-7')
    expect(wrapper.channel).toBe(roomChannel)
  })

  it('forwards room message events to the chat page handler', () => {
    const listeners = new Map<string, Listener>()
    const channelWrapper = {
      listen: vi.fn((event: string, callback: Listener) => {
        listeners.set(event, callback)
      }),
      bind: vi.fn(),
      stopListening: vi.fn(),
      channel: createMockChannel(),
      roomEventChannel: createMockChannel(),
    }
    const onMessage = vi.fn()

    setupRoomEventListeners(
      channelWrapper as unknown as ReturnType<typeof createChannelWrapper>,
      '7',
      onMessage
    )

    expect(listeners.has('.message.sent')).toBe(true)

    listeners.get('.message.sent')?.({ message: { id: 99, room_id: 7 } })

    expect(onMessage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'message', message: { id: 99, room_id: 7 } })
    )
  })

  it('subscribes to the global room list channel', () => {
    const roomListChannel = createMockChannel()
    const echoInstance = {
      channel: vi.fn().mockReturnValue(roomListChannel),
    }

    const wrapper = createRoomListChannel(echoInstance as never)

    expect(echoInstance.channel).toHaveBeenCalledWith('chat-rooms-list')
    expect(wrapper.channel).toBe(roomListChannel)
  })

  it('forwards global room count events to the chat page handler', () => {
    const listeners = new Map<string, Listener>()
    const channelWrapper = {
      listen: vi.fn((event: string, callback: Listener) => {
        listeners.set(event, callback)
      }),
      stopListening: vi.fn(),
      channel: createMockChannel(),
    }
    const onMessage = vi.fn()

    setupRoomListEventListeners(
      channelWrapper as unknown as ReturnType<typeof createRoomListChannel>,
      onMessage
    )

    expect(listeners.has('.user.joined.room')).toBe(true)
    expect(listeners.has('.user.left.room')).toBe(true)

    listeners.get('.user.joined.room')?.({ room_id: 7, online_count: 3 })
    listeners.get('.user.left.room')?.({ room_id: 7, online_count: 2 })

    expect(onMessage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'user.joined.room', room_id: 7, online_count: 3 })
    )
    expect(onMessage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: 'user.left.room', room_id: 7, online_count: 2 })
    )
  })
})
