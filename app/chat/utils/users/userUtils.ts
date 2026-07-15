/**
 * 用户工具函数
 */
import type { OnlineUser } from '@/app/chat/types'

export type UserRole = 'admin' | 'moderator' | 'user'

/**
 * 用户角色判断工具函数
 * 提供判断用户是否为管理员、版主的方法
 *
 * SECURITY: 角色必须从服务器提供的 role 字段获取，不能通过 email 推断
 * 之前的实现使用 email.includes('admin') 存在 privilege escalation 漏洞
 */
export const userRoleUtils = {
  /**
   * 判断用户是否为管理员
   * @param user - 在线用户对象
   * @returns 是否为管理员（基于 role 字段）
   */
  isAdmin: (user: OnlineUser): boolean => {
    return user.role === 'admin'
  },

  /**
   * 判断用户是否为版主
   * @param user - 在线用户对象
   * @returns 是否为版主（基于 role 字段）
   */
  isModerator: (user: OnlineUser): boolean => {
    return user.role === 'moderator' || user.role === 'admin'
  },

  /**
   * 获取用户角色
   * @param user - 在线用户对象
   * @returns 用户角色
   */
  getUserRole: (user: OnlineUser): UserRole => {
    if (user.role === 'admin') return 'admin'
    if (user.role === 'moderator') return 'moderator'
    return 'user'
  },
}

/**
 * 时间格式化工具函数
 */
export const formatJoinedDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

/**
 * 获取用户名首字母
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
