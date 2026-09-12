import React, { memo } from 'react'
import { ArrowLeft, Settings, Users, Hash, Search, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/hooks/useTranslation'
import type { ChatRoom } from '@/app/chat/types'

interface ChatHeaderDesktopProps {
  room: ChatRoom
  showBackButton: boolean
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected'
  onlineCount: number
  onBack?: () => void
  onOpenUsersList?: () => void
  onSearch?: () => void
  onOpenRoomInfo?: () => void
  onOpenNotificationSettings: () => void
}

export const ChatHeaderDesktop = memo<ChatHeaderDesktopProps>(
  ({
    room,
    showBackButton,
    isConnected,
    connectionStatus,
    onlineCount,
    onBack,
    onOpenUsersList,
    onOpenNotificationSettings,
    onSearch,
    onOpenRoomInfo,
  }) => {
    const { t } = useTranslation()

    return (
      <div className="bg-background hidden items-center justify-between min-h-16 min-w-0 gap-3 border-b px-5 py-3 lg:flex">
        {/* 左侧 - 导航和房间信息 */}
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">{t('chat.go_back', '返回')}</span>
            </Button>
          )}
        </div>

        {/* 中间 - 房间详情 */}
        <div className="flex min-w-0 flex-1">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-3">
              <Hash className="text-muted-foreground h-4 w-4" />
              <button
                type="button"
                onClick={onOpenRoomInfo}
                className="flex min-w-0 items-center gap-1 rounded-md text-left hover:text-primary"
                aria-label={`房间信息：${room.name}`}
              >
                <h1 className="truncate font-semibold">{room.name}</h1>
                <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
              </button>
              <div className="flex items-center gap-1 text-xs">
                <div
                  className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : connectionStatus === 'connecting' ? 'animate-pulse bg-amber-500' : 'bg-red-500'}`}
                />
                <span className="text-muted-foreground">
                  {connectionStatus === 'connected'
                    ? t('chat.connected', '已连接')
                    : connectionStatus === 'connecting'
                      ? t('chat.connecting', '连接中…')
                      : t('chat.disconnected', '已断开')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧 - 操作按钮 */}
        <div className="flex items-center gap-2">
          {/* 在线用户数量 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenUsersList}
            className="gap-1.5"
            aria-label="打开用户列表"
          >
            <Users className="text-muted-foreground h-4 w-4" />
            <Badge variant="secondary" className="text-xs">
              {onlineCount}
            </Badge>
          </Button>
          {onSearch && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSearch}
              aria-label="搜索消息"
              title="搜索消息（⌘ / Ctrl + K）"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onOpenNotificationSettings}>
            <Settings className="h-4 w-4" />
            <span className="sr-only">{t('chat.notification_settings', '通知设置')}</span>
          </Button>
        </div>
      </div>
    )
  }
)

ChatHeaderDesktop.displayName = 'ChatHeaderDesktop'
