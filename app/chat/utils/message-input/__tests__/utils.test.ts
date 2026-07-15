import { describe, expect, it } from 'vitest'
import {
  validateFileSize,
  isImageFile,
  sanitizeFileName,
  formatFileSize,
  getDraftKey,
  truncateMessage,
} from '../utils'
import { MAX_FILE_SIZE } from '../constants'

describe('validateFileSize', () => {
  it('returns true for a file within the size limit', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    expect(validateFileSize(file)).toBe(true)
  })

  it('returns true for a file exactly at the size limit', () => {
    const content = new Array(MAX_FILE_SIZE).fill('a').join('')
    const file = new File([content], 'exact.txt', { type: 'text/plain' })
    expect(validateFileSize(file)).toBe(true)
  })

  it('returns false for a file exceeding the size limit', () => {
    const content = new Array(MAX_FILE_SIZE + 1).fill('a').join('')
    const file = new File([content], 'toolarge.txt', { type: 'text/plain' })
    expect(validateFileSize(file)).toBe(false)
  })

  it('returns true for an empty file', () => {
    const file = new File([], 'empty.txt', { type: 'text/plain' })
    expect(validateFileSize(file)).toBe(true)
  })
})

describe('isImageFile', () => {
  it.each(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])('returns true for %s', type => {
    const file = new File([''], 'test', { type })
    expect(isImageFile(file)).toBe(true)
  })

  it('returns false for a plain text file', () => {
    expect(isImageFile(new File([''], 'a.txt', { type: 'text/plain' }))).toBe(false)
  })

  it('returns false for a PDF', () => {
    expect(isImageFile(new File([''], 'a.pdf', { type: 'application/pdf' }))).toBe(false)
  })

  it('returns false for an empty type', () => {
    expect(isImageFile(new File([''], 'a', { type: '' }))).toBe(false)
  })
})

describe('sanitizeFileName', () => {
  it('removes special characters like angle brackets', () => {
    expect(sanitizeFileName('file<name>.txt')).toBe('filename.txt')
  })

  it('keeps alphanumeric, dots, hyphens, underscores, and spaces', () => {
    expect(sanitizeFileName('my file-123_v2.jpg')).toBe('my file-123_v2.jpg')
  })

  it('trims whitespace', () => {
    expect(sanitizeFileName('  spaced  ')).toBe('spaced')
  })

  it('returns empty string for only special characters', () => {
    expect(sanitizeFileName('!!!@###')).toBe('')
  })

  it('returns empty string for empty input', () => {
    expect(sanitizeFileName('')).toBe('')
  })
})

describe('formatFileSize', () => {
  it('formats 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes')
  })

  it('formats raw bytes', () => {
    expect(formatFileSize(500)).toBe('500 Bytes')
  })

  it('formats 1 KB', () => {
    expect(formatFileSize(1024)).toBe('1 KB')
  })

  it('formats 1 MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB')
  })

  it('formats 1 GB', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
  })

  it('formats fractional kilobytes', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })

  it('formats 5 MB', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB')
  })
})

describe('getDraftKey', () => {
  it('generates correct draft key for room 1', () => {
    expect(getDraftKey(1)).toBe('chat-draft-1')
  })

  it('generates correct draft key for room 42', () => {
    expect(getDraftKey(42)).toBe('chat-draft-42')
  })
})

describe('truncateMessage', () => {
  it('returns original message when under max length', () => {
    expect(truncateMessage('hello', 50)).toBe('hello')
  })

  it('truncates message exceeding max length with ellipsis', () => {
    const long = 'a'.repeat(60)
    const result = truncateMessage(long, 50)
    expect(result).toBe('a'.repeat(50) + '...')
    expect(result.length).toBe(53)
  })

  it('uses default max length of 50', () => {
    const long = 'a'.repeat(51)
    const result = truncateMessage(long)
    expect(result).toBe('a'.repeat(50) + '...')
  })

  it('does not truncate at exact boundary', () => {
    const exact = 'a'.repeat(50)
    expect(truncateMessage(exact, 50)).toBe(exact)
  })

  it('handles empty string', () => {
    expect(truncateMessage('', 10)).toBe('')
  })
})
