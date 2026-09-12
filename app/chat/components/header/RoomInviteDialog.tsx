'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Copy, Link2, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiRequest, post, del } from '@/lib/api'
import { toast } from '@/components/ui/use-toast'
import type { ChatRoom } from '../../types'

type Invite = { id: number; expires_at: string; max_uses: number | null; uses_count: number }

export function RoomInviteDialog({
  room,
  open,
  onOpenChange,
}: {
  room: ChatRoom
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [hours, setHours] = useState('168')
  const [maxUses, setMaxUses] = useState('unlimited')
  const [link, setLink] = useState('')
  const [busy, setBusy] = useState(false)
  const endpoint = `/chat/rooms/${room.id}/invites`
  const { data, error, mutate, isLoading } = useSWR<{ invites: Invite[] }>(
    open ? endpoint : null,
    apiRequest,
    { revalidateOnFocus: false }
  )
  const create = async () => {
    if (busy) return
    setBusy(true)
    try {
      const result = await post<{ token: string; invite: Invite }>(endpoint, {
        expires_in_hours: Number(hours),
        max_uses: maxUses === 'unlimited' ? null : Number(maxUses),
      })
      const url = new URL('/chat', window.location.origin)
      url.searchParams.set('invite', result.token)
      setLink(url.toString())
      await mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '生成邀请失败')
    } finally {
      setBusy(false)
    }
  }
  const revoke = async (id: number) => {
    setBusy(true)
    try {
      await del(`${endpoint}/${id}`)
      setLink('')
      await mutate()
      toast.success('邀请已撤销')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '撤销失败')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>邀请加入 {room.name}</DialogTitle>
          <DialogDescription>
            {room.is_private
              ? '受邀成员登录后才能进入这个私有房间。'
              : '分享邀请链接，让朋友加入讨论。'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground" htmlFor="invite-expiry">
              有效期
            </label>
            <Select value={hours} onValueChange={setHours}>
              <SelectTrigger id="invite-expiry">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">1 天</SelectItem>
                <SelectItem value="168">7 天</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground" htmlFor="invite-uses">
              可加入人数
            </label>
            <Select value={maxUses} onValueChange={setMaxUses}>
              <SelectTrigger id="invite-uses">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unlimited">不限人数</SelectItem>
                <SelectItem value="1">1 人</SelectItem>
                <SelectItem value="10">10 人</SelectItem>
                <SelectItem value="100">100 人</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={() => void create()} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          生成邀请链接
        </Button>
        {link && (
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="mb-2 text-xs text-muted-foreground">
              复制并保存此链接，然后发送给想邀请的人。
            </p>
            <div className="flex gap-2">
              <Input
                value={link}
                readOnly
                aria-label="邀请链接"
                onFocus={event => event.target.select()}
                className="min-w-0 text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                aria-label="复制邀请链接"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(link)
                    toast.success('邀请链接已复制')
                  } catch {
                    toast.error('请选中链接后手动复制')
                  }
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        <div className="space-y-2 border-t pt-4">
          <h3 className="text-sm font-medium">有效邀请</h3>
          {isLoading && <p className="text-sm text-muted-foreground">加载中…</p>}
          {error && (
            <div role="alert" className="flex items-center justify-between text-sm">
              <span>加载邀请失败</span>
              <Button variant="ghost" size="sm" onClick={() => void mutate()}>
                重试
              </Button>
            </div>
          )}
          {!isLoading && !error && data?.invites.length === 0 && (
            <p className="text-sm text-muted-foreground">还没有有效邀请。</p>
          )}
          <div className="max-h-52 space-y-2 overflow-y-auto">
            {data?.invites.map(invite => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div className="text-xs">
                  <p>
                    已加入 {invite.uses_count}
                    {invite.max_uses ? ` / ${invite.max_uses}` : ''} 人
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {new Date(invite.expires_at).toLocaleString()} 到期
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void revoke(invite.id)}
                >
                  撤销
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
