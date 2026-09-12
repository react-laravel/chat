import { useEffect, useLayoutEffect, useRef } from 'react'

interface UseMessageScrollParams {
  roomId: number
  firstMessageId?: number
  messageCount: number
  hasSearchQuery: boolean
  getScrollContainer: () => HTMLDivElement | null
}

/** Follow new messages only while at the bottom; preserve the anchor when loading history. */
export function useMessageScroll({
  roomId,
  firstMessageId,
  messageCount,
  hasSearchQuery,
  getScrollContainer,
}: UseMessageScrollParams) {
  const pinned = useRef(true)
  const previous = useRef({ roomId, firstMessageId, messageCount: 0, height: 0 })

  useLayoutEffect(() => {
    const container = getScrollContainer()
    if (!container) return
    const last = previous.current
    const switched = last.roomId !== roomId
    const prepended =
      !switched &&
      last.messageCount > 0 &&
      messageCount > last.messageCount &&
      firstMessageId !== last.firstMessageId
    if (switched) pinned.current = true
    if (prepended) {
      container.scrollTop += container.scrollHeight - last.height
      pinned.current = false
    } else if (pinned.current && !hasSearchQuery) {
      container.scrollTop = container.scrollHeight
    }
    previous.current = { roomId, firstMessageId, messageCount, height: container.scrollHeight }
  }, [roomId, firstMessageId, messageCount, hasSearchQuery, getScrollContainer])

  useEffect(() => {
    const container = getScrollContainer()
    if (!container) return
    const onScroll = () => {
      pinned.current = container.scrollHeight - container.scrollTop - container.clientHeight < 50
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    const observer =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => {
            if (pinned.current && !hasSearchQuery) container.scrollTop = container.scrollHeight
            previous.current.height = container.scrollHeight
          })
        : null
    observer?.observe(container)
    if (container.firstElementChild) observer?.observe(container.firstElementChild)
    return () => {
      container.removeEventListener('scroll', onScroll)
      observer?.disconnect()
    }
  }, [getScrollContainer, hasSearchQuery, roomId])
}
