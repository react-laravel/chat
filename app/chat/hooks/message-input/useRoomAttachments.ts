import { useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { apiRequest, del } from '@/lib/api'
import { toast } from '@/components/ui/use-toast'
import useAuthStore from '@/stores/authStore'
import type { ChatAttachment } from '../../types'

type Upload = { id: string; roomId: number; userId: number; file: File; error?: string }
const EMPTY: ChatAttachment[] = []
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
export const MAX_ATTACHMENTS = 5

export function useRoomAttachments(roomId: number) {
  const userId = useAuthStore(state => state.user?.id)
  const endpoint = `/chat/rooms/${roomId}/attachments`
  const key = [`${endpoint}/drafts`, userId] as const
  const { mutate } = useSWRConfig()
  const { data, error, isLoading } = useSWR<{ attachments: ChatAttachment[] }>(
    userId ? key : null,
    ([url]: readonly [string, number]) => apiRequest(url),
    { revalidateOnFocus: false }
  )
  const [uploads, setUploads] = useState<Upload[]>([])
  const files = data?.attachments ?? EMPTY
  const active = uploads.filter(upload => upload.roomId === roomId && upload.userId === userId)
  const upload = async (task: Upload) => {
    setUploads(items => [
      ...items.filter(item => item.id !== task.id),
      { ...task, error: undefined },
    ])
    const target = [`/chat/rooms/${task.roomId}/attachments/drafts`, task.userId] as const
    try {
      const form = new FormData()
      form.append('file', task.file)
      form.append('upload_id', task.id)
      await apiRequest(`/chat/rooms/${task.roomId}/attachments`, 'POST', form)
      await mutate(target)
      setUploads(items => items.filter(item => item.id !== task.id))
    } catch (error) {
      setUploads(items =>
        items.map(item =>
          item.id === task.id
            ? { ...item, error: error instanceof Error ? error.message : '上传失败' }
            : item
        )
      )
    }
  }
  const add = async (selected: File[]) => {
    if (!userId) return
    const available = MAX_ATTACHMENTS - files.length - active.length
    if (selected.length > available) {
      toast.error(`每条消息最多 ${MAX_ATTACHMENTS} 个附件`)
      return
    }
    for (const file of selected) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error(`${file.name} 超过 10 MB`)
        continue
      }
      await upload({ id: crypto.randomUUID(), roomId, userId, file })
    }
  }
  return {
    files,
    uploads: active,
    busy: isLoading || active.some(task => !task.error),
    error,
    add,
    retry: (task: Upload) => upload(task),
    dismiss: (id: string) => setUploads(items => items.filter(item => item.id !== id)),
    refresh: () => mutate(key),
    remove: async (id: number) => {
      try {
        await del(`${endpoint}/${id}`)
        await mutate(key)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '移除失败')
      }
    },
    sent: (ids: number[]) =>
      mutate(
        key,
        (previous: { attachments: ChatAttachment[] } | undefined) => ({
          attachments: (previous?.attachments ?? []).filter(file => !ids.includes(file.id)),
        }),
        { revalidate: false }
      ),
  }
}
