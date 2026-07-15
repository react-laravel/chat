'use client'

import { useCallback, useRef, useEffect, useState } from 'react'
import { logger } from '@/lib/logger'

interface VirtualizationConfig {
  itemHeight: number // Approximate height of each message item
  containerHeight: number // Height of the scrollable container
  bufferSize?: number // Number of items to render outside viewport
  overscan?: number // Extra items to render for smoother scrolling
}

interface VirtualizedRange {
  startIndex: number
  endIndex: number
  visibleCount: number
}

/**
 * Custom hook for message virtualization using Intersection Observer
 * Optimizes rendering of large message lists by only rendering visible items
 *
 * Ideal for chat applications where:
 * - Users scroll up to load history
 * - New messages appear at the bottom
 * - Lists can have 1000+ messages
 */
export function useMessageVirtualization(
  totalItems: number,
  config: VirtualizationConfig
) {
  const [virtualRange, setVirtualRange] = useState<VirtualizedRange>({
    startIndex: Math.max(0, totalItems - 50), // Start near the end
    endIndex: totalItems,
    visibleCount: 50,
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef(0)
  const isAutoScrollingRef = useRef(false)
  const sentinelRefs = useRef<Map<number, IntersectionObserver>>(new Map())

  const {
    itemHeight,
    containerHeight,
    bufferSize = 10,
    overscan = 5,
  } = config

  // Calculate visible range based on scroll position
  const updateVirtualRange = useCallback(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const scrollTop = container.scrollTop
    const scrollHeight = container.scrollHeight

    // Calculate which items are visible
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2
    const endIndex = Math.min(totalItems, startIndex + visibleCount + bufferSize)

    setVirtualRange({
      startIndex,
      endIndex,
      visibleCount,
    })

    scrollPositionRef.current = scrollTop
  }, [itemHeight, containerHeight, bufferSize, overscan, totalItems])

  // Handle scroll events with debouncing
  const handleScroll = useCallback(() => {
    if (isAutoScrollingRef.current) return
    updateVirtualRange()
  }, [updateVirtualRange])

  // Setup scroll listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scrollListener = () => {
      const throttledHandle = () => handleScroll()
      requestAnimationFrame(throttledHandle)
    }

    container.addEventListener('scroll', scrollListener, { passive: true })
    return () => container.removeEventListener('scroll', scrollListener)
  }, [handleScroll])

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((smooth = false) => {
    if (!containerRef.current) return

    isAutoScrollingRef.current = true
    const container = containerRef.current

    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    })

    // Reset flag after scroll completes
    setTimeout(() => {
      isAutoScrollingRef.current = false
      updateVirtualRange()
    }, 100)
  }, [updateVirtualRange])

  // Auto-scroll to top (load more history)
  const scrollToTop = useCallback(() => {
    if (!containerRef.current) return

    isAutoScrollingRef.current = true
    const container = containerRef.current

    container.scrollTo({
      top: 0,
      behavior: 'auto',
    })

    setTimeout(() => {
      isAutoScrollingRef.current = false
      updateVirtualRange()
    }, 100)
  }, [updateVirtualRange])

  // Detect if user is near bottom (for auto-scroll on new messages)
  const isNearBottom = useCallback(() => {
    if (!containerRef.current) return false

    const container = containerRef.current
    const threshold = itemHeight * 5 // Within 5 messages of bottom
    return container.scrollHeight - (container.scrollTop + container.clientHeight) < threshold
  }, [itemHeight])

  // Calculate offsets for virtualized rendering
  const offsetY = virtualRange.startIndex * itemHeight
  const offsetHeight = (virtualRange.endIndex - virtualRange.startIndex) * itemHeight

  logger.debug('Message virtualization:', {
    totalItems,
    startIndex: virtualRange.startIndex,
    endIndex: virtualRange.endIndex,
    renderedCount: virtualRange.endIndex - virtualRange.startIndex,
    percentRendered: `${Math.round((((virtualRange.endIndex - virtualRange.startIndex) / totalItems) * 100))}%`,
  })

  return {
    containerRef,
    virtualRange,
    offsetY,
    offsetHeight,
    scrollToBottom,
    scrollToTop,
    isNearBottom,
    visibleItemCount: virtualRange.endIndex - virtualRange.startIndex,
  }
}
