'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { apiRequest, post } from '@/lib/api'
import { toast } from '@/components/ui/use-toast'
import useChatStore from '../../chatStore'
import { REPORT_TYPES } from './ReportMessageDialog'
import { MessageAttachments } from '../MessageAttachments'
import type { ChatAttachment } from '../../types'
import { messageText } from '../../utils/message-text'

type Report = {
  id: number
  room_id: number
  report_type: string
  reason: string | null
  status: string
  reporter: { name: string }
  message: {
    id: number
    message: string
    user: { name: string }
    attachments?: ChatAttachment[]
  } | null
}

export function ReportsDialog({
  roomId,
  open,
  onOpenChange,
}: {
  roomId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const { data, error, isLoading, mutate } = useSWR<{
    reports: Report[]
    pagination: { current_page: number; last_page: number; total: number }
  }>(
    open ? `/chat/reports/rooms/${roomId}?status=pending&page[number]=${page}` : null,
    apiRequest,
    { revalidateOnFocus: false }
  )
  const review = async (report: Report, action: 'resolve' | 'dismiss', remove = false) => {
    setBusy(true)
    try {
      await post(`/chat/reports/${report.id}/review`, { action, delete_message: remove })
      if (remove && report.message) useChatStore.getState().removeMessage(roomId, report.message.id)
      await mutate()
      toast.success('举报已处理')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '处理失败')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>待处理举报</DialogTitle>
          <DialogDescription>查看成员反馈，维护房间的交流秩序。</DialogDescription>
        </DialogHeader>
        {error && (
          <div role="alert" className="flex justify-between text-sm">
            <span>加载举报失败</span>
            <Button size="sm" variant="ghost" onClick={() => void mutate()}>
              重试
            </Button>
          </div>
        )}
        {isLoading && (
          <p role="status" className="py-8 text-center text-sm text-muted-foreground">
            加载中…
          </p>
        )}
        <div className="min-h-0 space-y-3 overflow-y-auto">
          {data?.reports.map(report => (
            <article key={report.id} className="rounded-xl border p-4">
              <div className="flex justify-between gap-2 text-sm">
                <strong>{REPORT_TYPES[report.report_type] ?? report.report_type}</strong>
                <span className="text-xs text-muted-foreground">
                  来自 {report.reporter?.name ?? '成员'}
                </span>
              </div>
              <blockquote className="my-3 border-l-2 border-primary/30 pl-3 text-sm leading-6">
                <span className="font-medium">{report.message?.user?.name ?? '消息已删除'}</span>
                <p className="whitespace-pre-wrap break-words text-muted-foreground">
                  {report.message ? messageText(report.message.message) : ''}
                </p>
              </blockquote>
              {report.message?.attachments && (
                <MessageAttachments attachments={report.message.attachments} />
              )}
              {report.reason && (
                <p className="mb-3 text-xs text-muted-foreground">{report.reason}</p>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void review(report, 'dismiss')}
                >
                  忽略举报
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void review(report, 'resolve')}
                >
                  标记已处理
                </Button>
                {report.message && (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => void review(report, 'resolve', true)}
                  >
                    删除消息并处理
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
        {!isLoading && !error && !data?.reports.length && (
          <p className="py-10 text-center text-sm text-muted-foreground">当前没有待处理举报</p>
        )}
        {data && data.pagination.last_page > 1 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(value => value - 1)}
            >
              上一页
            </Button>
            <span className="text-xs text-muted-foreground">
              {page} / {data.pagination.last_page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.last_page}
              onClick={() => setPage(value => value + 1)}
            >
              下一页
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
