'use client'

import { useState } from 'react'
import { Copy, MoreHorizontal, Reply, Pencil, Trash2, Flag, SmilePlus, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import useAuthStore from '@/stores/authStore'
import useChatStore from '../chatStore'
import { cn } from '@/lib/helpers'
import { ReportMessageDialog } from './moderation/ReportMessageDialog'
import { useMessageActions } from '../hooks/useMessageActions'
import { messageText } from '../utils/message-text'
import type { ChatMessage } from '../types'

interface MessageInteractionsProps {
  message: ChatMessage
  onReply?: (message: ChatMessage) => void
  onReact?: (messageId: number, emoji: string) => void
  className?: string
}

const REACTIONS = ['👍', '❤️', '😂', '🎉', '👀', '🙏']

export function MessageInteractions({
  message,
  onReply,
  onReact,
  className,
}: MessageInteractionsProps) {
  const user = useAuthStore(state => state.user)
  const ownerId = useChatStore(state =>
    state.currentRoom?.id === message.room_id ? state.currentRoom.created_by : null
  )
  const [reportOpen, setReportOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [reactionsOpen, setReactionsOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const actions = useMessageActions(message)
  const isOwn = user?.id === message.user_id
  const canDelete = Boolean(user && (isOwn || user.is_admin || ownerId === user.id))
  const reacted = (emoji: string) => {
    const reaction = message.reactions?.find(item => item.emoji === emoji)
    return reaction?.user_ids
      ? reaction.user_ids.includes(user?.id ?? -1)
      : Boolean(reaction?.userReacted)
  }
  const react = async (emoji: string) => {
    setReactionsOpen(false)
    if (onReact) onReact(message.id, emoji)
    else await actions.react(emoji, reacted(emoji))
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(messageText(message.message))
      toast.success('消息已复制')
    } catch {
      toast.error('复制失败，请选择消息文字后复制')
    }
  }
  const save = async () => {
    if (await actions.edit(draft.trim())) setEditOpen(false)
  }

  return (
    <div className={className}>
      {Boolean(message.reactions?.length) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {message.reactions?.map(reaction => (
            <button
              key={reaction.emoji}
              type="button"
              disabled={actions.busy}
              aria-pressed={reacted(reaction.emoji)}
              aria-label={`${reaction.emoji} ${reaction.count}`}
              onClick={() => void react(reaction.emoji)}
              className={cn(
                'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
                reacted(reaction.emoji)
                  ? 'border-primary/30 bg-primary/10'
                  : 'bg-background/80 hover:bg-muted'
              )}
            >
              <span>{reaction.emoji}</span>
              <span className="tabular-nums">{reaction.count}</span>
            </button>
          ))}
        </div>
      )}
      <div className="absolute right-1 top-1 flex rounded-md bg-background/90 opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-hover/message:opacity-100 sm:focus-within:opacity-100">
        {message.message_type === 'text' && (
          <Popover open={reactionsOpen} onOpenChange={setReactionsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={actions.busy}
                className="hidden h-7 w-7 sm:inline-flex"
                aria-label="添加回应"
              >
                <SmilePlus className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="flex w-auto gap-1 p-1.5">
              {REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className="rounded-md p-2 text-xl hover:bg-muted"
                  aria-label={`回应 ${emoji}`}
                  onClick={() => void react(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              aria-label="消息操作"
              disabled={actions.busy}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {onReply && (
              <DropdownMenuItem onClick={() => onReply(message)}>
                <Reply className="mr-2 h-4 w-4" />
                回复
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={copy}>
              <Copy className="mr-2 h-4 w-4" />
              复制消息
            </DropdownMenuItem>
            {message.message_type === 'text' && (
              <>
                <DropdownMenuSeparator />
                <div className="flex justify-between px-1 py-1">
                  {REACTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      className="rounded p-1 hover:bg-muted"
                      aria-label={`回应 ${emoji}`}
                      onClick={() => void react(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            )}
            {isOwn && message.message_type === 'text' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setDraft(messageText(message.message))
                    setEditOpen(true)
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  编辑消息
                </DropdownMenuItem>
              </>
            )}
            {!isOwn && message.message_type === 'text' && (
              <DropdownMenuItem onClick={() => setReportOpen(true)}>
                <Flag className="mr-2 h-4 w-4" />
                举报消息
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除消息
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ReportMessageDialog message={message} open={reportOpen} onOpenChange={setReportOpen} />
      <Dialog open={editOpen} onOpenChange={open => !actions.busy && setEditOpen(open)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑消息</DialogTitle>
            <DialogDescription>修改会同步给房间内的所有成员。</DialogDescription>
          </DialogHeader>
          <Textarea
            aria-label="编辑消息内容"
            autoFocus
            value={draft}
            onChange={event => setDraft(event.target.value)}
            maxLength={1000}
            className="min-h-32 resize-y"
            disabled={actions.busy}
            onKeyDown={event => {
              if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault()
                if (draft.trim() || message.attachments?.length) void save()
              }
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>⌘ / Ctrl + Enter 保存</span>
            <span>{draft.length} / 1000</span>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={actions.busy} onClick={() => setEditOpen(false)}>
              取消
            </Button>
            <Button
              disabled={actions.busy || (!draft.trim() && !message.attachments?.length)}
              onClick={() => void save()}
            >
              {actions.busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteOpen} onOpenChange={open => !actions.busy && setDeleteOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除这条消息？</AlertDialogTitle>
            <AlertDialogDescription>
              消息将从房间中移除，其他成员的引用会显示“原消息已删除”。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actions.busy}>取消</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={actions.busy}
              onClick={async () => {
                if (await actions.remove()) setDeleteOpen(false)
              }}
            >
              {actions.busy ? '删除中…' : '删除消息'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function MessageThread({ replies }: { replies: ChatMessage[] }) {
  if (replies.length === 0) return null

  return (
    <div className="border-muted mt-2 ml-8 space-y-2 border-l-2 pl-4">
      <div className="text-muted-foreground mb-2 text-xs">
        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
      </div>
      {replies.slice(0, 3).map(reply => (
        <div key={reply.id} className="text-sm">
          <span className="font-medium">{reply.user.name}:</span>{' '}
          <span className="text-muted-foreground">{reply.message}</span>
        </div>
      ))}
      {replies.length > 3 && (
        <button className="text-primary text-xs hover:underline">
          View {replies.length - 3} more replies
        </button>
      )}
    </div>
  )
}
