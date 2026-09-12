'use client'

import { useState } from 'react'
import { ChevronDown, LogOut, Loader2 } from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/use-toast'

export function AccountMenu() {
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const [busy, setBusy] = useState(false)
  if (!user) return null
  return (
    <div className="border-t p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-11 w-full justify-start gap-2 px-2"
            aria-label="账户菜单"
            disabled={busy}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-foreground">
              {user.name.slice(0, 1)}
            </span>
            <span className="min-w-0 flex-1 truncate text-left text-sm">{user.name}</span>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-52">
          <DropdownMenuItem
            onClick={async () => {
              setBusy(true)
              try {
                await logout()
              } catch (error) {
                toast.error(error instanceof Error ? error.message : '退出登录失败')
              } finally {
                setBusy(false)
              }
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
