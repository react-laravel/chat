'use client'

import { Search, Reply, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { ChatMessage } from '../../types'
import { useRoomMessageSearch } from '../../hooks/message-search/useRoomMessageSearch'
import { MessageAttachments } from '../MessageAttachments'
import { messageText } from '../../utils/message-text'

interface MessageSearchProps {
  roomId: number
  roomName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onReply?: (message: ChatMessage) => void
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return (
    <>
      {text.split(new RegExp(`(${escaped})`, 'gi')).map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="rounded bg-primary/20 px-0.5 text-foreground">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

export function MessageSearchDialog({
  roomId,
  roomName,
  open,
  onOpenChange,
  onReply,
}: MessageSearchProps) {
  const search = useRoomMessageSearch(roomId, open)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-4 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>搜索消息</DialogTitle>
          <DialogDescription>搜索「{roomName}」中的完整聊天记录。</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            maxLength={200}
            value={search.query}
            onChange={event => search.setQuery(event.target.value)}
            placeholder="输入消息内容或成员名称"
            aria-label="搜索聊天记录"
            className="pl-9"
          />
        </div>
        {!search.query.trim() ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <Search className="mx-auto mb-3 h-8 w-8 opacity-40" />
            找回重要的讨论与灵感
          </div>
        ) : (
          <>
            <div
              className="flex items-center justify-between text-xs text-muted-foreground"
              role="status"
            >
              <span>{search.loading ? '搜索中…' : `找到 ${search.total} 条消息`}</span>
              {search.loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            {search.error && (
              <div
                role="alert"
                className="flex items-center justify-between rounded-lg bg-destructive/5 p-3 text-sm"
              >
                <span>{search.error}</span>
                <Button variant="outline" size="sm" onClick={() => void search.retry()}>
                  重试
                </Button>
              </div>
            )}
            <div className="min-h-0 space-y-3 overflow-y-auto">
              {search.results.map(message => (
                <article key={message.id} className="group rounded-xl border p-3 sm:p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">
                      <Highlight text={message.user.name} query={search.query} />
                    </span>
                    <time className="shrink-0 text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleString()}
                    </time>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">
                    <Highlight text={messageText(message.message)} query={search.query} />
                  </p>
                  <MessageAttachments attachments={message.attachments ?? []} />
                  {onReply && message.message_type === 'text' && (
                    <div className="mt-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => {
                          onReply({ ...message, message: messageText(message.message) })
                          onOpenChange(false)
                        }}
                      >
                        <Reply className="h-3.5 w-3.5" />
                        回复这条消息
                      </Button>
                    </div>
                  )}
                </article>
              ))}
              {!search.loading && !search.error && search.results.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  没有找到匹配的消息，试试其他关键词。
                </p>
              )}
              {search.hasMore && (
                <div className="flex justify-center py-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={search.loading}
                    onClick={() => void search.loadMore()}
                  >
                    加载更多结果
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
