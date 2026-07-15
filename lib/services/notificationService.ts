/**
 * 通知服务
 * 处理浏览器通知、音效和通知权限
 */

// Value Objects for notification parameters (resolves Long Parameter List code smell)
export interface NewMessageNotificationParams {
  roomName: string
  senderName: string
  message: string
  roomId: number
  playSound?: boolean
}

export interface MentionNotificationParams {
  roomName: string
  senderName: string
  message: string
  roomId: number
  messageId: number
  playSound?: boolean
}

export interface UserPresenceNotificationParams {
  roomName: string
  userName: string
  roomId: number
  playSound?: boolean
}

export interface NotificationOptions {
  title: string
  body?: string
  icon?: string
  tag?: string
  silent?: boolean
  requireInteraction?: boolean
  data?: unknown
}

export interface SoundOptions {
  volume?: number
  loop?: boolean
}

class NotificationService {
  private static instance: NotificationService
  private audioContext: AudioContext | null = null
  private soundCache: Map<string, AudioBuffer> = new Map()
  private isInitialized = false

  private constructor() {
    this.initialize()
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  private async initialize() {
    if (this.isInitialized) return

    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        this.audioContext = new AudioContext()
        await this.preloadSounds()
      } catch (error) {
        console.warn('Failed to initialize audio context:', error)
      }
    }

    this.isInitialized = true
  }

  /**
   * 请求浏览器通知权限
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Browser notifications are not supported')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      return 'denied'
    }

    try {
      const permission = await Notification.requestPermission()
      return permission
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return 'denied'
    }
  }

  /**
   * 检查浏览器是否支持并允许通知
   */
  public isNotificationSupported(): boolean {
    return 'Notification' in window && Notification.permission === 'granted'
  }

  /**
   * 显示浏览器通知
   */
  public showNotification(options: NotificationOptions): Notification | null {
    if (!this.isNotificationSupported()) {
      return null
    }

    if (!document.hidden && !options.requireInteraction) {
      return null
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: options.tag,
        silent: options.silent || false,
        requireInteraction: options.requireInteraction || false,
        data: options.data,
      })

      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

      notification.onclick = () => {
        window.focus()
        notification.close()

        if (options.data && typeof options.data === 'object' && 'roomId' in options.data) {
          window.dispatchEvent(
            new CustomEvent('notification-click', {
              detail: options.data,
            })
          )
        }
      }

      return notification
    } catch (error) {
      console.error('Failed to show notification:', error)
      return null
    }
  }

  /**
   * 预加载音效
   */
  private async preloadSounds() {
    if (!this.audioContext) return

    const sounds = [
      { name: 'message', url: '/sounds/message.mp3' },
      { name: 'mention', url: '/sounds/mention.mp3' },
      { name: 'join', url: '/sounds/join.mp3' },
      { name: 'leave', url: '/sounds/leave.mp3' },
    ]

    for (const sound of sounds) {
      try {
        const response = await fetch(sound.url)
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer()
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
          this.soundCache.set(sound.name, audioBuffer)
        }
      } catch (error) {
        console.warn(`Failed to preload sound ${sound.name}:`, error)
      }
    }
  }

  /**
   * 播放音效
   */
  public async playSound(soundName: string, options: SoundOptions = {}): Promise<void> {
    if (!this.audioContext) {
      return
    }

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      if (!this.soundCache.has(soundName)) {
        await this.preloadSounds()
      }

      if (!this.soundCache.has(soundName)) {
        return
      }

      const audioBuffer = this.soundCache.get(soundName)!
      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()

      source.buffer = audioBuffer
      source.loop = options.loop || false
      gainNode.gain.value = options.volume || 0.5

      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      source.start()
    } catch (error) {
      console.error(`Failed to play sound ${soundName}:`, error)
    }
  }

  // DRY: Helper method for showing notification and playing sound
  private showNotificationAndPlaySound(
    showNotificationOptions: NotificationOptions,
    soundName: string,
    soundOptions?: SoundOptions,
    shouldPlaySound = true
  ): void {
    this.showNotification(showNotificationOptions)
    if (shouldPlaySound) {
      this.playSound(soundName, soundOptions)
    }
  }

  /**
   * 创建新消息通知
   */
  public notifyNewMessage(params: NewMessageNotificationParams): void {
    this.showNotificationAndPlaySound(
      {
        title: `New message in ${params.roomName}`,
        body: `${params.senderName}: ${params.message}`,
        tag: `room-${params.roomId}`,
        data: { roomId: params.roomId, type: 'message' },
      },
      'message',
      undefined,
      params.playSound !== false
    )
  }

  /**
   * 创建@提及通知
   */
  public notifyMention(params: MentionNotificationParams): void {
    this.showNotificationAndPlaySound(
      {
        title: `${params.senderName} mentioned you in ${params.roomName}`,
        body: params.message,
        tag: `mention-${params.messageId}`,
        requireInteraction: true,
        data: { roomId: params.roomId, messageId: params.messageId, type: 'mention' },
      },
      'mention',
      undefined,
      params.playSound !== false
    )
  }

  /**
   * 创建用户加入通知
   */
  public notifyUserJoined(params: UserPresenceNotificationParams): void {
    this.showNotificationAndPlaySound(
      {
        title: `${params.userName} joined ${params.roomName}`,
        tag: `join-${params.roomId}-${Date.now()}`,
        silent: true,
        data: { roomId: params.roomId, type: 'user-joined' },
      },
      'join',
      { volume: 0.3 },
      params.playSound !== false
    )
  }

  /**
   * 创建用户离开通知
   */
  public notifyUserLeft(params: UserPresenceNotificationParams): void {
    this.showNotificationAndPlaySound(
      {
        title: `${params.userName} left ${params.roomName}`,
        tag: `leave-${params.roomId}-${Date.now()}`,
        silent: true,
        data: { roomId: params.roomId, type: 'user-left' },
      },
      'leave',
      { volume: 0.3 },
      params.playSound !== false
    )
  }

  /**
   * 清除所有指定标签模式的通知
   */
  public clearNotifications(tagPattern?: string): void {
    console.log(`Clearing notifications with pattern: ${tagPattern}`)
  }

  /**
   * 检查文档是否隐藏（标签页是否处于非激活状态）
   */
  public isTabInactive(): boolean {
    return typeof document !== 'undefined' && document.hidden
  }

  /**
   * 添加可见性变化监听器
   */
  public onVisibilityChange(callback: (isHidden: boolean) => void): () => void {
    if (typeof document === 'undefined') {
      return () => {}
    }

    const handleVisibilityChange = () => {
      callback(document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }
}

export default NotificationService
