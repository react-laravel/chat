'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { post } from '@/lib/api'
import { toast } from '@/components/ui/use-toast'
import type { ChatMessage } from '../../types'

export const REPORT_TYPES: Record<string, string> = {
  spam: '垃圾广告',
  harassment: '骚扰行为',
  inappropriate_content: '不当内容',
  hate_speech: '仇恨言论',
  violence: '暴力威胁',
  sexual_content: '色情内容',
  misinformation: '不实信息',
  other: '其他问题',
}

export function ReportMessageDialog({
  message,
  open,
  onOpenChange,
}: {
  message: ChatMessage
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [type, setType] = useState('spam')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <Dialog open={open} onOpenChange={value => !busy && onOpenChange(value)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>举报消息</DialogTitle>
          <DialogDescription>举报将提交给房间管理员处理。</DialogDescription>
        </DialogHeader>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger aria-label="举报类型">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(REPORT_TYPES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          value={reason}
          onChange={event => setReason(event.target.value)}
          maxLength={500}
          placeholder="补充说明（可选）"
          aria-label="举报说明"
        />
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await post(`/chat/reports/rooms/${message.room_id}/messages/${message.id}`, {
                  report_type: type,
                  reason: reason.trim() || undefined,
                })
                toast.success('举报已提交')
                setReason('')
                onOpenChange(false)
              } catch (error) {
                toast.error(error instanceof Error ? error.message : '提交失败，请重试')
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? '提交中…' : '提交举报'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
