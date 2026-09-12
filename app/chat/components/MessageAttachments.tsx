'use client'

import Image from 'next/image'
import { Download, FileText } from 'lucide-react'
import type { ChatAttachment } from '../types'
import { formatFileSize } from './message-input/AttachmentTray'

export function MessageAttachments({ attachments }: { attachments: ChatAttachment[] }) {
  if (!attachments.length) return null
  return (
    <div className="mt-2 space-y-2">
      {attachments.map(file => (
        <a
          key={file.id}
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block max-w-full overflow-hidden rounded-lg border bg-background/70 transition-colors hover:bg-background"
          aria-label={`下载 ${file.name}`}
        >
          {file.mime_type.startsWith('image/') && (
            <Image
              unoptimized
              src={file.url}
              alt={file.name}
              width={480}
              height={320}
              className="max-h-64 w-auto max-w-full object-contain"
            />
          )}
          <span className="flex items-center gap-2 p-2.5">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block max-w-60 truncate text-xs font-medium">{file.name}</span>
              <span className="block text-[10px] text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
            </span>
            <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </span>
        </a>
      ))}
    </div>
  )
}
