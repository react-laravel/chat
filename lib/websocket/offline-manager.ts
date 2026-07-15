import { getAuthTokenFromStorage } from '@/lib/utils/storage'
import { authenticatedBrowserFetch } from '@/lib/api/browser-auth'
import { API_URL } from '@/lib/api/url'

/**
 * Storage keys for offline queue
 */
const STORAGE_KEY = 'chat-offline-queue'

/**
 * Extract storage operations to reduce OfflineManager complexity
 */
function loadQueueFromStorage(): QueuedMessage[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.map((msg: unknown) => ({
        ...(msg as QueuedMessage),
        timestamp: new Date((msg as QueuedMessage).timestamp),
      }))
    }
  } catch (error) {
    console.warn('Failed to load offline queue from storage:', error)
  }
  return []
}

function saveQueueToStorage(queuedMessages: QueuedMessage[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queuedMessages))
  } catch (error) {
    console.warn('Failed to save offline queue to storage:', error)
  }
}

export interface QueuedMessage {
  id: string
  roomId: string
  message: string
  timestamp: Date
  retryCount: number
  maxRetries: number
}

export interface OfflineState {
  isOffline: boolean
  lastOnline: Date | null
  queuedMessages: QueuedMessage[]
  queueSize: number
  maxQueueSize: number
}

export interface OfflineManagerOptions {
  maxQueueSize?: number
  maxRetries?: number
  onOffline?: () => void
  onOnline?: () => void
  onMessageQueued?: (message: QueuedMessage) => void
  onMessageSent?: (message: QueuedMessage) => void
  onMessageFailed?: (message: QueuedMessage, error: unknown) => void
  onQueueFull?: () => void
}

class OfflineManager {
  private isOffline = false
  private lastOnline: Date | null = null
  private queuedMessages: QueuedMessage[] = []
  private maxQueueSize: number
  private maxRetries: number
  private listeners: Array<(state: OfflineState) => void> = []
  private networkListener: (() => void) | null = null

  constructor(private options: OfflineManagerOptions = {}) {
    this.maxQueueSize = options.maxQueueSize || 100
    this.maxRetries = options.maxRetries || 3

    this.setupNetworkListeners()
    this.queuedMessages = loadQueueFromStorage()
  }

  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      if (this.isOffline) {
        this.setOnlineStatus(true)
        this.processQueuedMessages()
      }
    }

    const handleOffline = () => {
      this.setOnlineStatus(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial status
    this.setOnlineStatus(navigator.onLine)

    this.networkListener = () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  private setOnlineStatus(online: boolean): void {
    const wasOffline = this.isOffline
    this.isOffline = !online

    if (online) {
      this.lastOnline = new Date()
      if (wasOffline && this.options.onOnline) {
        this.options.onOnline()
      }
    } else {
      if (!wasOffline && this.options.onOffline) {
        this.options.onOffline()
      }
    }

    this.notifyListeners()
  }

  public queueMessage(roomId: string, message: string): QueuedMessage {
    // Check if queue is full
    if (this.queuedMessages.length >= this.maxQueueSize) {
      // Remove oldest message to make room
      // const removedMessage = this.queuedMessages.shift()
      this.queuedMessages.shift()
      if (this.options.onQueueFull) {
        this.options.onQueueFull()
      }
    }

    const queuedMessage: QueuedMessage = {
      id: this.generateMessageId(),
      roomId,
      message,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: this.maxRetries,
    }

    this.queuedMessages.push(queuedMessage)
    this.persistQueue()

    if (this.options.onMessageQueued) {
      this.options.onMessageQueued(queuedMessage)
    }

    this.notifyListeners()
    return queuedMessage
  }

  public async processQueuedMessages(): Promise<void> {
    if (this.isOffline || this.queuedMessages.length === 0) {
      return
    }

    // Process messages in order
    const messagesToProcess = [...this.queuedMessages]

    for (const queuedMessage of messagesToProcess) {
      try {
        await this.sendQueuedMessage(queuedMessage)
        this.removeFromQueue(queuedMessage.id)

        if (this.options.onMessageSent) {
          this.options.onMessageSent(queuedMessage)
        }
      } catch (error) {
        queuedMessage.retryCount++

        if (queuedMessage.retryCount >= queuedMessage.maxRetries) {
          this.removeFromQueue(queuedMessage.id)

          if (this.options.onMessageFailed) {
            this.options.onMessageFailed(queuedMessage, error)
          }
        }
      }
    }

    this.persistQueue()
    this.notifyListeners()
  }

  private async sendQueuedMessage(queuedMessage: QueuedMessage): Promise<void> {
    const token = this.getAuthToken()

    const response = await authenticatedBrowserFetch(
      `${API_URL}/api/chat/rooms/${queuedMessage.roomId}/messages`,
      {
        method: 'POST',
        token,
        body: JSON.stringify({ message: queuedMessage.message }),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`)
    }
  }

  private getAuthToken(): string | null {
    // Use shared utility for getting auth token
    return getAuthTokenFromStorage()
  }

  private removeFromQueue(messageId: string): void {
    this.queuedMessages = this.queuedMessages.filter(msg => msg.id !== messageId)
  }

  private generateMessageId(): string {
    return `queued_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private persistQueue(): void {
    saveQueueToStorage(this.queuedMessages)
  }

  public getState(): OfflineState {
    return {
      isOffline: this.isOffline,
      lastOnline: this.lastOnline,
      queuedMessages: [...this.queuedMessages],
      queueSize: this.queuedMessages.length,
      maxQueueSize: this.maxQueueSize,
    }
  }

  public clearQueue(): void {
    this.queuedMessages = []
    this.persistQueue()
    this.notifyListeners()
  }

  public retryFailedMessages(): void {
    // Reset retry count for all messages and try again
    this.queuedMessages.forEach(msg => {
      msg.retryCount = 0
    })
    this.processQueuedMessages()
  }

  public subscribe(listener: (state: OfflineState) => void): () => void {
    this.listeners.push(listener)

    // Immediately notify with current state
    listener(this.getState())

    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(): void {
    const state = this.getState()
    this.listeners.forEach(listener => listener(state))
  }

  public destroy(): void {
    if (this.networkListener) {
      this.networkListener()
      this.networkListener = null
    }
    this.listeners = []
  }
}

export default OfflineManager
