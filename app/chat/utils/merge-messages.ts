import type { ChatMessage } from '../types'

/** Merge HTTP history and realtime events without duplicates or reversed pages. */
export function mergeMessages(...groups: ChatMessage[][]): ChatMessage[] {
  const messages = new Map<number, ChatMessage>()
  for (const group of groups) for (const message of group) messages.set(message.id, message)
  return [...messages.values()].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id - b.id
  )
}
