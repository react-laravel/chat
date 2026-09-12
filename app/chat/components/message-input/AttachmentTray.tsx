'use client'

import { FileText, Loader2, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { useRoomAttachments } from '../../hooks/message-input/useRoomAttachments'

export function formatFileSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.ceil(bytes / 1024))} KB`
}

export function AttachmentTray({
  attachments,
}: {
  attachments: ReturnType<typeof useRoomAttachments>
}) {
  if (!attachments.files.length && !attachments.uploads.length && !attachments.error) return null
  return (
    <div className="mb-3 space-y-2">
      {attachments.error && (
        <div role="alert" className="flex items-center justify-between text-xs text-destructive">
          <span>附件草稿加载失败</span>
          <Button size="sm" variant="ghost" onClick={() => void attachments.refresh()}>
            重试
          </Button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {attachments.files.map(file => (
          <div
            key={file.id}
            className="flex max-w-full items-center gap-2 rounded-lg border bg-muted/25 py-2 pl-3 pr-1"
          >
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="max-w-44 truncate text-xs font-medium">{file.name}</p>
              <p className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              aria-label={`移除 ${file.name}`}
              onClick={() => void attachments.remove(file.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {attachments.uploads.map(task => (
          <div
            key={task.id}
            className="flex max-w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs"
            role={task.error ? 'alert' : 'status'}
          >
            {!task.error && <Loader2 className="h-4 w-4 animate-spin" />}
            <div className="min-w-0">
              <p className="max-w-44 truncate">{task.file.name}</p>
              {task.error && <p className="max-w-56 text-destructive">{task.error}</p>}
            </div>
            {task.error && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label={`重试上传 ${task.file.name}`}
                  onClick={() => void attachments.retry(task)}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label={`取消上传 ${task.file.name}`}
                  onClick={() => attachments.dismiss(task.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
