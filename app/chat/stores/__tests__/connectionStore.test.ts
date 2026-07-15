import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useConnectionStore } from '../connectionStore'

describe('connectionStore', () => {
  beforeEach(() => {
    // Reset to initial state
    useConnectionStore.setState({
      isConnected: false,
      connectionStatus: 'disconnected',
      isUserMuted: false,
      muteUntil: null,
      muteReason: null,
    })
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useConnectionStore.getState()
      expect(state.isConnected).toBe(false)
      expect(state.connectionStatus).toBe('disconnected')
      expect(state.isUserMuted).toBe(false)
      expect(state.muteUntil).toBeNull()
      expect(state.muteReason).toBeNull()
    })
  })

  describe('setConnectionStatus', () => {
    it('should set status to connecting', () => {
      useConnectionStore.getState().setConnectionStatus('connecting')
      expect(useConnectionStore.getState().connectionStatus).toBe('connecting')
      expect(useConnectionStore.getState().isConnected).toBe(false)
    })

    it('should set isConnected to true when connected', () => {
      useConnectionStore.getState().setConnectionStatus('connected')
      expect(useConnectionStore.getState().isConnected).toBe(true)
    })

    it('should set isConnected to false when disconnected', () => {
      // First connect
      useConnectionStore.getState().setConnectionStatus('connected')
      expect(useConnectionStore.getState().isConnected).toBe(true)

      // Then disconnect
      useConnectionStore.getState().setConnectionStatus('disconnected')
      expect(useConnectionStore.getState().isConnected).toBe(false)
    })
  })

  describe('setConnected', () => {
    it('should set connected to true', () => {
      useConnectionStore.getState().setConnected(true)
      expect(useConnectionStore.getState().isConnected).toBe(true)
      expect(useConnectionStore.getState().connectionStatus).toBe('connected')
    })

    it('should set connected to false', () => {
      useConnectionStore.getState().setConnected(false)
      expect(useConnectionStore.getState().isConnected).toBe(false)
      expect(useConnectionStore.getState().connectionStatus).toBe('disconnected')
    })
  })

  describe('updateMuteStatus', () => {
    it('should update mute status with until and reason', () => {
      const until = new Date(Date.now() + 3600000).toISOString()
      useConnectionStore.getState().updateMuteStatus(true, until, 'spamming')
      expect(useConnectionStore.getState().isUserMuted).toBe(true)
      expect(useConnectionStore.getState().muteUntil).toBe(until)
      expect(useConnectionStore.getState().muteReason).toBe('spamming')
    })

    it('should clear mute status', () => {
      const until = new Date(Date.now() + 3600000).toISOString()
      useConnectionStore.getState().updateMuteStatus(true, until, 'spamming')
      expect(useConnectionStore.getState().isUserMuted).toBe(true)

      useConnectionStore.getState().updateMuteStatus(false)
      expect(useConnectionStore.getState().isUserMuted).toBe(false)
      expect(useConnectionStore.getState().muteUntil).toBeNull()
      expect(useConnectionStore.getState().muteReason).toBeNull()
    })

    it('should convert undefined until/reason to null', () => {
      useConnectionStore.getState().updateMuteStatus(true, undefined, undefined)
      expect(useConnectionStore.getState().muteUntil).toBeNull()
      expect(useConnectionStore.getState().muteReason).toBeNull()
    })
  })

  describe('checkMuteStatus', () => {
    it('should return false when not muted', () => {
      expect(useConnectionStore.getState().checkMuteStatus()).toBe(false)
    })

    it('should return true when muted without expiry', () => {
      useConnectionStore.getState().updateMuteStatus(true, undefined, 'spamming')
      expect(useConnectionStore.getState().checkMuteStatus()).toBe(true)
    })

    it('should return true when muted with future expiry', () => {
      const future = new Date(Date.now() + 3600000).toISOString()
      useConnectionStore.getState().updateMuteStatus(true, future, 'spamming')
      expect(useConnectionStore.getState().checkMuteStatus()).toBe(true)
    })

    it('should auto-unmute when expiry has passed', () => {
      const past = new Date(Date.now() - 3600000).toISOString()
      useConnectionStore.getState().updateMuteStatus(true, past, 'spamming')
      expect(useConnectionStore.getState().checkMuteStatus()).toBe(false)
      // Should also clear the mute state
      expect(useConnectionStore.getState().isUserMuted).toBe(false)
      expect(useConnectionStore.getState().muteUntil).toBeNull()
    })
  })
})
