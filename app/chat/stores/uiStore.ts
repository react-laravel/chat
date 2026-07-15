import { create } from 'zustand'

interface ChatUIState {
  isRoomListOpen: boolean
  isUsersListOpen: boolean
  setRoomListOpen: (open: boolean) => void
  setUsersListOpen: (open: boolean) => void
  toggleRoomList: () => void
  toggleUsersList: () => void
}

export const useChatUIStore = create<ChatUIState>(set => ({
  isRoomListOpen: false,
  isUsersListOpen: false,
  setRoomListOpen: open => set({ isRoomListOpen: open }),
  setUsersListOpen: open => set({ isUsersListOpen: open }),
  toggleRoomList: () => set(state => ({ isRoomListOpen: !state.isRoomListOpen })),
  toggleUsersList: () => set(state => ({ isUsersListOpen: !state.isUsersListOpen })),
}))
