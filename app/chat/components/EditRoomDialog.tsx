'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { roomFormSchema } from '../utils/room-form-schema'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { put } from '@/lib/api'
import { toast } from '@/components/ui/use-toast'
import useChatStore from '@/app/chat/chatStore'
import type { ChatRoom } from '../types'
import { useTranslation } from '@/hooks/useTranslation'

const editRoomSchema = roomFormSchema

type EditRoomFormData = z.infer<typeof editRoomSchema>

interface EditRoomDialogProps {
  room: ChatRoom
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditRoomDialog({ room, open, onOpenChange }: EditRoomDialogProps) {
  const { t } = useTranslation()
  const { loadRooms } = useChatStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<EditRoomFormData>({
    resolver: zodResolver(editRoomSchema),
    defaultValues: {
      name: room.name,
      description: room.description ?? '',
      is_private: room.is_private ?? false,
    },
  })

  // Reset form when room changes
  useEffect(() => {
    form.reset({
      name: room.name,
      description: room.description ?? '',
      is_private: room.is_private ?? false,
    })
  }, [room, form])

  const onSubmit = async (data: EditRoomFormData) => {
    setIsSubmitting(true)

    try {
      const response = await put<{ room: ChatRoom }>(`/chat/rooms/${room.id}`, {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        is_private: data.is_private ?? false,
      })

      if (response?.room) {
        const state = useChatStore.getState()
        state.setRooms(
          state.rooms.map(item => (item.id === room.id ? { ...item, ...response.room } : item))
        )
      } else {
        await loadRooms()
      }
      toast.success('房间已更新')

      // Close dialog
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新房间失败，请重试')
      // Error is handled by the API helper and will be displayed as a toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen)
      if (!newOpen) {
        form.reset()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('chat.edit_room', '编辑聊天房间')}</DialogTitle>
          <DialogDescription>
            {t('chat.edit_room_description', '更新房间名称和描述。更改将显示给所有成员。')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., General Discussion"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('chat.room_name_hint', '最多20个字符，汉字按2个计算')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this room is for..."
                      className="min-h-[80px]"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('chat.room_description_hint', '可选，最多500个字符')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_private"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t('chat.private_room', '私有房间')}
                    </FormLabel>
                    <FormDescription>
                      {t('chat.private_room_hint', '仅成员可见，其他人无法加入')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Update Room
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
