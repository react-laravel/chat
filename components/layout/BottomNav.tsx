'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode, MouseEvent } from 'react'
import { cn } from '@/lib/helpers'

export type BottomNavItem = {
  /** Route for navigation. If `onClick` is provided this is treated as the active match key. */
  href: string
  /** Display label below the icon */
  label: string
  /** Icon node, typically a lucide-react icon */
  icon: ReactNode
  /** When true, only consider the path active on exact match */
  exact?: boolean
  /** Optional click handler. When provided, clicking calls this instead of navigating. */
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  /** Disable the item (renders muted, no navigation) */
  disabled?: boolean
  /** Test id */
  testId?: string
}

export interface BottomNavProps {
  items: BottomNavItem[]
  className?: string
  /** Override the active matching for an item (return true to mark active). */
  isActive?: (item: BottomNavItem, pathname: string) => boolean
  ariaLabel?: string
}

const defaultIsActive = (item: BottomNavItem, pathname: string): boolean => {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(item.href + '/')
}

/**
 * Fixed bottom navigation bar (shadcn-styled). Always pinned to the viewport
 * bottom. Each item shows an icon above a label.
 *
 * Pages using this should add `pb-14` (or use the `BOTTOM_NAV_CONTENT_PADDING`
 * constant) on their scrollable content so the bar does not cover the last
 * items.
 */
export function BottomNav({ items, className, isActive, ariaLabel = '页面导航' }: BottomNavProps) {
  const pathname = usePathname()
  const matcher = isActive ?? defaultIsActive

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        'bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-20 border-t shadow-[0_-1px_0_0_rgba(0,0,0,0.04)] backdrop-blur',
        className
      )}
    >
      <ul
        className="mx-auto grid w-full max-w-3xl px-1"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map(item => {
          const active = matcher(item, pathname)
          const itemClasses = cn(
            'group flex h-14 flex-col items-center justify-center gap-0.5 rounded-md text-xs transition-colors',
            active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            item.disabled && 'pointer-events-none opacity-50'
          )

          if (item.onClick) {
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={event => {
                    event.preventDefault()
                    if (item.disabled) return
                    item.onClick?.(event)
                  }}
                  className={itemClasses}
                  data-active={active || undefined}
                  data-testid={item.testId}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="text-[1.05rem] leading-none">{item.icon}</span>
                  <span className="leading-none">{item.label}</span>
                </a>
              </li>
            )
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={itemClasses}
                data-active={active || undefined}
                data-testid={item.testId}
                aria-current={active ? 'page' : undefined}
              >
                <span className="text-[1.05rem] leading-none">{item.icon}</span>
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * Tailwind padding utility to reserve space for the BottomNav. Apply on the
 * scrollable wrapper of pages that render <BottomNav />.
 */
export const BOTTOM_NAV_CONTENT_PADDING = 'pb-14'
