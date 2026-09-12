'use client'

import { Copy, MoreVertical, Reply, Heart, ThumbsUp, Laugh } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/helpers'
import type { ChatMessage } from '../types'

interface MessageInteractionsProps {
  message: ChatMessage
  onReply?: (message: ChatMessage) => void
  onReact?: (messageId: number, emoji: string) => void
  className?: string
}

export function MessageInteractions({
  message,
  onReply,
  onReact,
  className,
}: MessageInteractionsProps) {
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.message)
      toast.success('消息已复制')
    } catch {
      toast.error('复制失败，请选择消息文字后复制')
    }
  }

  return (
    <div className={className}>
      {Boolean(message.reactions?.length) && (
        <div className="mt-1 flex flex-wrap gap-1">
          {message.reactions?.map(reaction => (
            <button
              key={reaction.emoji}
              type="button"
              disabled={!onReact}
              onClick={() => onReact?.(message.id, reaction.emoji)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs',
                reaction.userReacted && 'bg-primary/10 border-primary/20'
              )}
            >
              <span>{reaction.emoji}</span>
              <span>{reaction.count}</span>
            </button>
          ))}
        </div>
      )}
      <div className="absolute right-1 top-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/message:opacity-100 sm:focus-within:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              aria-label="消息操作"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {onReact && (
              <>
                <DropdownMenuItem onClick={() => onReact(message.id, '👍')}>
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  点赞
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onReact(message.id, '❤️')}>
                  <Heart className="mr-2 h-4 w-4" />
                  爱心
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onReact(message.id, '😂')}>
                  <Laugh className="mr-2 h-4 w-4" />
                  大笑
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {onReply && (
              <DropdownMenuItem onClick={() => onReply(message)}>
                <Reply className="mr-2 h-4 w-4" />
                回复
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleCopyMessage}>
              <Copy className="mr-2 h-4 w-4" />
              复制消息
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
