import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Hash } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useTranslation } from '@/hooks/useTranslation'
import type { ChatRoom, OnlineUser } from '@/app/chat/types'

interface RoomInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room: ChatRoom
  roomOnlineUsers: OnlineUser[]
  onlineCount: number
  onMembers?: () => void
  onReports?: () => void
  onInvite?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export const RoomInfoDialog = memo<RoomInfoDialogProps>(
  ({
    open,
    onOpenChange,
    room,
    roomOnlineUsers,
    onlineCount,
    onMembers,
    onReports,
    onInvite,
    onEdit,
    onDelete,
  }) => {
    const { t } = useTranslation()

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              {room.name}
            </DialogTitle>
            {room.description && <DialogDescription>{room.description}</DialogDescription>}
          </DialogHeader>
          <div className="space-y-4">
            <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {room.is_private ? '私有房间 · 仅受邀成员可以访问' : '公开房间 · 社区成员可以加入'}
            </p>
            {(onInvite || onEdit || onDelete) && (
              <div className="flex flex-wrap gap-2">
                {onInvite && (
                  <Button size="sm" onClick={onInvite}>
                    邀请成员
                  </Button>
                )}
                {onMembers && (
                  <Button variant="outline" size="sm" onClick={onMembers}>
                    成员管理
                  </Button>
                )}
                {onReports && (
                  <Button variant="outline" size="sm" onClick={onReports}>
                    举报处理
                  </Button>
                )}
                {onEdit && (
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    编辑房间
                  </Button>
                )}
                {onDelete && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
                    删除房间
                  </Button>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{onlineCount}</div>
                <div className="text-muted-foreground text-sm">
                  {t('chat.room_info.online_users', '在线用户')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {new Date(room.created_at).toLocaleDateString()}
                </div>
                <div className="text-muted-foreground text-sm">
                  {t('chat.room_info.created', '创建时间')}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-2 font-medium">{t('chat.room_info.online_users', '在线用户')}</h4>
              <div className="max-h-32 overflow-y-auto">
                {roomOnlineUsers.length > 0 ? (
                  <div className="space-y-1">
                    {roomOnlineUsers.map(user => (
                      <div key={user.id} className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span>{user.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {t('chat.room_info.no_users_online', '当前没有用户在线')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
)

RoomInfoDialog.displayName = 'RoomInfoDialog'
