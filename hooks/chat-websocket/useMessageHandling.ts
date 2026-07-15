/**
 * WebSocket 消息处理 Hook
 */
import { useCallback } from 'react'
import { getAuthManager } from '@/lib/websocket'
import { authenticatedBrowserFetch } from '@/lib/api/browser-auth'
import { API_URL } from '@/lib/api/url'

export const useMessageHandling = () => {
  const sendMessage = useCallback(async (roomId: string, message: string): Promise<boolean> => {
    try {
      const authManager = getAuthManager()
      const token = authManager.getToken()

      const response = await authenticatedBrowserFetch(
        `${API_URL}/api/chat/rooms/${roomId}/messages`,
        {
          method: 'POST',
          token,
          body: JSON.stringify({ message }),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('发送消息失败:', error)
      return false
    }
  }, [])

  return {
    sendMessage,
  }
}
