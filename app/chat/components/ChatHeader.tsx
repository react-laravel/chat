'use client'

import { useState, useEffect } from 'react'
import useAuthStore from '@/stores/authStore'
import { MemberManagementDialog } from './moderation/MemberManagementDialog'
import { ReportsDialog } from './moderation/ReportsDialog'
import { RoomInviteDialog } from './header/RoomInviteDialog'
import { RoomInfoDialog } from './header/RoomInfoDialog'
import { EditRoomDialog } from './EditRoomDialog'
import { DeleteRoomDialog } from './DeleteRoomDialog'
import { MessageSearchDialog } from './message-search/MessageSearchDialog'
import useChatStore from '@/app/chat/chatStore'
import { useOnlineCount } from '@/app/chat/hooks/useOnlineCount'
import { ChatHeaderDesktop } from './header/ChatHeaderDesktop'
import { ChatHeaderMobile } from './header/ChatHeaderMobile'
import { NotificationSettingsDialog } from './header/NotificationSettingsDialog'
import type { ChatRoom, ChatMessage } from '../types'

// 聊天头部组件属性接口
interface ChatHeaderProps {
  room: ChatRoom
  onBack?: () => void
  showBackButton?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  onReply?: (message: ChatMessage) => void
  onOpenRoomList?: () => void
  onOpenUsersList?: () => void
}

export function ChatHeader({
  room,
  onBack,
  showBackButton = false,
  onOpenRoomList,
  onOpenUsersList,
  onReply,
}: ChatHeaderProps) {
  // 从聊天状态管理获取数据
  const {
    onlineUsers,
    connectionStatus,
    isConnected,
    notificationSettings,
    browserNotificationPermission,
    updateNotificationSettings,
    requestBrowserNotificationPermission,
  } = useChatStore()

  // 使用自定义 hooks
  const { onlineCount } = useOnlineCount(room, onlineUsers, isConnected)

  // 对话框状态管理
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false)

  const user = useAuthStore(state => state.user)
  const canManage = Boolean(user && (user.is_admin || room.created_by === user.id))
  const [membersOpen, setMembersOpen] = useState(false)
  const [reportsOpen, setReportsOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(open => !open)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <>
      {/* 桌面端头部 */}
      <ChatHeaderDesktop
        room={room}
        showBackButton={showBackButton}
        isConnected={isConnected}
        connectionStatus={connectionStatus}
        onlineCount={onlineCount}
        onBack={onBack}
        onOpenUsersList={onOpenUsersList}
        onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
        onSearch={() => setSearchOpen(true)}
        onOpenRoomInfo={() => setInfoOpen(true)}
      />

      {/* 移动端头部 */}
      <ChatHeaderMobile
        room={room}
        showBackButton={showBackButton}
        isConnected={isConnected}
        connectionStatus={connectionStatus}
        onlineCount={onlineCount}
        onBack={onBack}
        onOpenRoomList={onOpenRoomList}
        onOpenUsersList={onOpenUsersList}
        onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
        onSearch={() => setSearchOpen(true)}
        onOpenRoomInfo={() => setInfoOpen(true)}
      />

      <MessageSearchDialog
        key={room.id}
        roomId={room.id}
        roomName={room.name}
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onReply={onReply}
      />
      <RoomInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        room={room}
        roomOnlineUsers={onlineUsers[room.id] ?? []}
        onlineCount={onlineCount}
        onMembers={
          canManage
            ? () => {
                setInfoOpen(false)
                setMembersOpen(true)
              }
            : undefined
        }
        onReports={
          canManage
            ? () => {
                setInfoOpen(false)
                setReportsOpen(true)
              }
            : undefined
        }
        onInvite={
          canManage
            ? () => {
                setInfoOpen(false)
                setInviteOpen(true)
              }
            : undefined
        }
        onEdit={
          canManage
            ? () => {
                setInfoOpen(false)
                setEditOpen(true)
              }
            : undefined
        }
        onDelete={
          canManage
            ? () => {
                setInfoOpen(false)
                setDeleteOpen(true)
              }
            : undefined
        }
      />
      {canManage && (
        <>
          <MemberManagementDialog
            key={`members-${room.id}`}
            room={room}
            open={membersOpen}
            onOpenChange={setMembersOpen}
          />
          <ReportsDialog
            key={`reports-${room.id}`}
            roomId={room.id}
            open={reportsOpen}
            onOpenChange={setReportsOpen}
          />
          <RoomInviteDialog
            key={room.id}
            room={room}
            open={inviteOpen}
            onOpenChange={setInviteOpen}
          />
          <EditRoomDialog room={room} open={editOpen} onOpenChange={setEditOpen} />
          <DeleteRoomDialog room={room} open={deleteOpen} onOpenChange={setDeleteOpen} />
        </>
      )}

      {/* 通知设置对话框 */}
      <NotificationSettingsDialog
        open={isNotificationSettingsOpen}
        onOpenChange={setIsNotificationSettingsOpen}
        notificationSettings={notificationSettings}
        browserNotificationPermission={browserNotificationPermission}
        onUpdateNotificationSettings={updateNotificationSettings}
        onRequestBrowserNotificationPermission={requestBrowserNotificationPermission}
      />
    </>
  )
}
