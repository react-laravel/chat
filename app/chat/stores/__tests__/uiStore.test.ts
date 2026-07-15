import { describe, expect, it, beforeEach } from 'vitest'
import { useChatUIStore } from '../uiStore'

describe('uiStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useChatUIStore.setState({
      isRoomListOpen: false,
      isUsersListOpen: false,
    })
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useChatUIStore.getState()
      expect(state.isRoomListOpen).toBe(false)
      expect(state.isUsersListOpen).toBe(false)
    })
  })

  describe('setRoomListOpen', () => {
    it('should open room list', () => {
      useChatUIStore.getState().setRoomListOpen(true)
      expect(useChatUIStore.getState().isRoomListOpen).toBe(true)
    })

    it('should close room list', () => {
      useChatUIStore.getState().setRoomListOpen(true)
      useChatUIStore.getState().setRoomListOpen(false)
      expect(useChatUIStore.getState().isRoomListOpen).toBe(false)
    })
  })

  describe('setUsersListOpen', () => {
    it('should open users list', () => {
      useChatUIStore.getState().setUsersListOpen(true)
      expect(useChatUIStore.getState().isUsersListOpen).toBe(true)
    })

    it('should close users list', () => {
      useChatUIStore.getState().setUsersListOpen(true)
      useChatUIStore.getState().setUsersListOpen(false)
      expect(useChatUIStore.getState().isUsersListOpen).toBe(false)
    })
  })

  describe('toggleRoomList', () => {
    it('should toggle room list from false to true', () => {
      useChatUIStore.getState().toggleRoomList()
      expect(useChatUIStore.getState().isRoomListOpen).toBe(true)
    })

    it('should toggle room list from true to false', () => {
      useChatUIStore.getState().setRoomListOpen(true)
      useChatUIStore.getState().toggleRoomList()
      expect(useChatUIStore.getState().isRoomListOpen).toBe(false)
    })

    it('should toggle multiple times', () => {
      useChatUIStore.getState().toggleRoomList()
      expect(useChatUIStore.getState().isRoomListOpen).toBe(true)
      useChatUIStore.getState().toggleRoomList()
      expect(useChatUIStore.getState().isRoomListOpen).toBe(false)
      useChatUIStore.getState().toggleRoomList()
      expect(useChatUIStore.getState().isRoomListOpen).toBe(true)
    })
  })

  describe('toggleUsersList', () => {
    it('should toggle users list from false to true', () => {
      useChatUIStore.getState().toggleUsersList()
      expect(useChatUIStore.getState().isUsersListOpen).toBe(true)
    })

    it('should toggle users list from true to false', () => {
      useChatUIStore.getState().setUsersListOpen(true)
      useChatUIStore.getState().toggleUsersList()
      expect(useChatUIStore.getState().isUsersListOpen).toBe(false)
    })
  })

  describe('independent toggles', () => {
    it('should toggle room list without affecting users list', () => {
      useChatUIStore.getState().setUsersListOpen(true)
      useChatUIStore.getState().toggleRoomList()
      expect(useChatUIStore.getState().isRoomListOpen).toBe(true)
      expect(useChatUIStore.getState().isUsersListOpen).toBe(true)
    })

    it('should toggle users list without affecting room list', () => {
      useChatUIStore.getState().setRoomListOpen(true)
      useChatUIStore.getState().toggleUsersList()
      expect(useChatUIStore.getState().isRoomListOpen).toBe(true)
      expect(useChatUIStore.getState().isUsersListOpen).toBe(true)
    })
  })
})
