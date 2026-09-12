import React, { memo } from 'react'
import { Plus, Search, Star, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/hooks/useTranslation'

interface RoomListHeaderProps {
  showHeader: boolean
  searchQuery: string
  filterType: 'all' | 'favorites' | 'recent'
  onSearchChange: (value: string) => void
  onFilterChange: (type: 'all' | 'favorites' | 'recent') => void
  onCreateRoom: () => void
}

export const RoomListHeader = memo<RoomListHeaderProps>(
  ({ showHeader, searchQuery, filterType, onSearchChange, onFilterChange, onCreateRoom }) => {
    const { t } = useTranslation()

    return (
      <div className="space-y-3 border-b p-4">
        {showHeader && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('chat.chat_rooms', 'Chat Rooms')}</h2>
            <Button size="sm" onClick={onCreateRoom}>
              <Plus className="h-4 w-4" />
              {t('chat.create_room', 'Create')}
            </Button>
          </div>
        )}

        {/* 搜索框和新建按钮 */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder={t('chat.search_rooms', 'Search rooms...')}
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          {!showHeader && (
            <Button
              size="sm"
              onClick={onCreateRoom}
              className="h-9 w-9 shrink-0 p-0"
              aria-label={t('chat.create_room', '创建房间')}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 筛选按钮 */}
        <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
          <Button
            variant={filterType === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('all')}
            className="h-8"
          >
            {t('chat.all_rooms', 'All')}
          </Button>
          <Button
            variant={filterType === 'favorites' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('favorites')}
            className="h-8"
          >
            <Star className="mr-1 h-3 w-3" />
            {t('chat.favorites', 'Favorites')}
          </Button>
          <Button
            variant={filterType === 'recent' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('recent')}
            className="h-8"
          >
            <Clock className="mr-1 h-3 w-3" />
            {t('chat.recent', 'Recent')}
          </Button>
        </div>
      </div>
    )
  }
)

RoomListHeader.displayName = 'RoomListHeader'
