'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { MoreHorizontal, Loader2, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { apiRequest, post } from '@/lib/api'
import { toast } from '@/components/ui/use-toast'
import { useDebounce } from '@/hooks/useDebounce'
import useAuthStore from '@/stores/authStore'
import type { ChatRoom } from '../../types'

type Member = {
  id: number
  name: string
  role: string
  is_online: boolean
  is_muted: boolean
  is_banned: boolean
}
type Page = { data: Member[]; current_page: number; last_page: number; total: number }

export function MemberManagementDialog({
  room,
  open,
  onOpenChange,
}: {
  room: ChatRoom
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const userId = useAuthStore(state => state.user?.id)
  const [query, setQuery] = useState('')
  const q = useDebounce(query, 250)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<{ member: Member; action: 'mute' | 'ban' } | null>(null)
  const [duration, setDuration] = useState('60')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const { data, error, isLoading, mutate } = useSWR<Page>(
    open ? `/chat/rooms/${room.id}/members?q=${encodeURIComponent(q)}&page=${page}` : null,
    apiRequest,
    { revalidateOnFocus: false }
  )
  const apply = async (member: Member, action: string) => {
    setBusy(true)
    try {
      await post(`/chat/moderation/rooms/${room.id}/users/${member.id}/${action}`, {
        duration: duration === 'permanent' ? null : Number(duration),
        reason: reason.trim() || undefined,
      })
      setSelected(null)
      setReason('')
      await mutate()
      toast.success('成员权限已更新')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败，请重试')
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85dvh] flex-col sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>成员管理</DialogTitle>
            <DialogDescription>{room.name} · 管理成员的发言与访问权限。</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              aria-label="搜索成员"
              placeholder="搜索成员名称"
              value={query}
              onChange={event => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
          </div>
          {error && (
            <div role="alert" className="flex justify-between text-sm">
              <span>加载成员失败</span>
              <Button size="sm" variant="ghost" onClick={() => void mutate()}>
                重试
              </Button>
            </div>
          )}
          {isLoading && (
            <div role="status" className="py-8 text-center text-sm text-muted-foreground">
              加载中…
            </div>
          )}
          <div className="min-h-0 divide-y overflow-y-auto">
            {data?.data.map(member => (
              <div key={member.id} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm">
                  {member.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {member.is_banned
                      ? '已封禁'
                      : member.is_muted
                        ? '已禁言'
                        : member.role === 'admin'
                          ? '管理员'
                          : member.role === 'moderator'
                            ? '房间创建者'
                            : '成员'}
                  </p>
                </div>
                {member.id !== userId && member.role === 'user' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={busy}
                        aria-label={`管理 ${member.name}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          member.is_muted
                            ? void apply(member, 'unmute')
                            : (setSelected({ member, action: 'mute' }), setDuration('60'))
                        }
                      >
                        {member.is_muted ? '解除禁言' : '禁言'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={!member.is_banned ? 'text-destructive' : ''}
                        onClick={() =>
                          member.is_banned
                            ? void apply(member, 'unban')
                            : (setSelected({ member, action: 'ban' }), setDuration('1440'))
                        }
                      >
                        {member.is_banned ? '解除封禁' : '封禁'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
          {data?.data.length === 0 && !isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">没有找到成员</p>
          )}
          {data && data.last_page > 1 && (
            <div className="flex items-center justify-between border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(value => value - 1)}
              >
                上一页
              </Button>
              <span className="text-xs text-muted-foreground">
                {page} / {data.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.last_page}
                onClick={() => setPage(value => value + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(selected)} onOpenChange={value => !value && !busy && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selected?.action === 'ban' ? '封禁' : '禁言'} {selected?.member.name}
            </DialogTitle>
            <DialogDescription>
              {selected?.action === 'ban'
                ? '该成员将无法继续进入或发言。'
                : '该成员仍可阅读聊天，但暂时不能发送消息。'}
            </DialogDescription>
          </DialogHeader>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger aria-label="限制时长">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 分钟</SelectItem>
              <SelectItem value="60">1 小时</SelectItem>
              <SelectItem value="1440">1 天</SelectItem>
              <SelectItem value="10080">7 天</SelectItem>
              <SelectItem value="permanent">直到手动解除</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            value={reason}
            maxLength={500}
            onChange={event => setReason(event.target.value)}
            placeholder="原因（可选）"
            aria-label="管理原因"
          />
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setSelected(null)}>
              取消
            </Button>
            <Button
              variant={selected?.action === 'ban' ? 'destructive' : 'default'}
              disabled={busy}
              onClick={() => selected && void apply(selected.member, selected.action)}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
