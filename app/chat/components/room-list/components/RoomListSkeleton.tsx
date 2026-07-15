import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/helpers'

/**
 * Skeleton loader for RoomListItem
 * Displays placeholder while room list is loading
 */
export function RoomListSkeleton() {
  return (
    <div
      className={cn(
        'group hover:bg-accent/50 w-full rounded-lg p-3 text-left transition-colors',
        'focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none'
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading room..."
    >
      <div className="flex items-start justify-between gap-2">
        {/* Left side: icon + room name + badges */}
        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Icon + name row */}
          <div className="flex items-center gap-2">
            {/* Hash icon placeholder */}
            <div className="h-4 w-4 shrink-0 rounded bg-muted" />

            {/* Room name placeholder */}
            <Skeleton className="h-4 w-24" />

            {/* Optional lock/favorite badges */}
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-muted" />
              <div className="h-3 w-3 rounded bg-muted" />
            </div>
          </div>

          {/* Description placeholder (optional) */}
          <Skeleton className="h-3 w-32" />
        </div>

        {/* Right side: user count */}
        <div className="flex items-center gap-1 text-xs">
          {/* Users icon placeholder */}
          <div className="h-3 w-3 shrink-0 rounded bg-muted" />

          {/* Count placeholder */}
          <Skeleton className="h-3 w-4" />
        </div>
      </div>
    </div>
  )
}
