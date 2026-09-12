import { expect, it } from 'vitest'
import useChatStore from '@/app/chat/chatStore'
import { prepareChatSession, clearChatSession } from '../chatSession'

it('isolates and restores each account without overwriting its saved room state', async () => {
  await prepareChatSession(1001)
  useChatStore.getState().setRooms([
    {
      id: 7,
      name: 'Private A',
      created_by: 1001,
      is_active: true,
      created_at: '',
      updated_at: '',
    },
  ])
  await prepareChatSession(1002)
  expect(useChatStore.getState().rooms).toEqual([])
  useChatStore
    .getState()
    .setRooms([
      { id: 8, name: 'Room B', created_by: 1002, is_active: true, created_at: '', updated_at: '' },
    ])
  await prepareChatSession(1001)
  expect(useChatStore.getState().rooms.map(room => room.name)).toEqual(['Private A'])
  await clearChatSession()
  expect(useChatStore.getState().rooms).toEqual([])
  await prepareChatSession(1002)
  expect(useChatStore.getState().rooms.map(room => room.name)).toEqual(['Room B'])
})
