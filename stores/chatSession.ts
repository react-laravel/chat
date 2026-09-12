const suspendedStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }

let activeUserId: number | null = null
let restoration: Promise<void> | null = null

/** Restore account-specific chat state before exposing the authenticated UI. */
export async function prepareChatSession(userId: number, isCurrent: () => boolean = () => true) {
  if (activeUserId === userId && restoration) return restoration
  activeUserId = userId
  restoration = (async () => {
    const { default: chat } = await import('@/app/chat/chatStore')
    if (!isCurrent()) return
    const storage = chat.persist.getOptions().storage
    // Reset in-memory state without overwriting the saved state of either account.
    chat.persist.setOptions({ storage: suspendedStorage })
    chat.getState().reset()
    chat.persist.setOptions({ storage, name: `chat-storage:${userId}` })
    await chat.persist.rehydrate()
  })()
  await restoration
}

export async function clearChatSession(isCurrent: () => boolean = () => true) {
  activeUserId = null
  restoration = null
  const { default: chat } = await import('@/app/chat/chatStore')
  if (!isCurrent()) return
  const storage = chat.persist.getOptions().storage
  chat.persist.setOptions({ storage: suspendedStorage })
  chat.getState().reset()
  chat.persist.setOptions({ storage, name: 'chat-anonymous' })
}
