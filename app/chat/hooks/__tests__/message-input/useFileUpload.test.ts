import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFileUpload } from '@/app/chat/hooks/message-input/useFileUpload'

const { mockToastError } = vi.hoisted(() => {
  const mockToastError = vi.fn()
  return { mockToastError }
})

// Mock the toast module
vi.mock('@/components/ui/use-toast', () => ({
  toast: {
    error: mockToastError,
  },
}))

// Mock useTranslation
const mockT = vi.fn((key: string, fallback: string) => {
  const map: Record<string, string> = {
    'chat.too_many_files': 'Too many files. Maximum 5 files allowed.',
    'chat.file_too_large': 'File {name} is too large. Maximum size is 5 MB.',
    'chat.invalid_filename': 'Invalid filename: {name}',
    'chat.file_processing_error': 'Error processing file {name}',
    'chat.file_limit_reached': 'File limit reached. Maximum 5 files allowed.',
  }
  return map[key] || fallback.replace('{name}', 'file').replace('{size}', '5 MB')
})
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: mockT }),
}))

// Mock the file utility functions
vi.mock('@/app/chat/utils/message-input/utils', () => ({
  validateFileSize: vi.fn(() => true),
  isImageFile: vi.fn(() => false),
  createFilePreview: vi.fn(async () => 'data:image/png;base64,abc'),
  sanitizeFileName: (name: string) => name.replace(/[^\w\s.-]/g, '').trim(),
  formatFileSize: (bytes: number) => `${bytes / (1024 * 1024)} MB`,
}))

describe('useFileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToastError.mockClear()
    mockT.mockClear()
  })

  it('initializes with empty uploaded files', () => {
    const { result } = renderHook(() => useFileUpload())
    expect(result.current.uploadedFiles).toEqual([])
  })

  it('returns upload, remove, and clear functions', () => {
    const { result } = renderHook(() => useFileUpload())
    expect(typeof result.current.handleFileUpload).toBe('function')
    expect(typeof result.current.removeFile).toBe('function')
    expect(typeof result.current.clearFiles).toBe('function')
  })

  it('ignores empty file arrays', async () => {
    const { result } = renderHook(() => useFileUpload())

    await act(async () => {
      await result.current.handleFileUpload([])
    })

    expect(result.current.uploadedFiles).toEqual([])
  })

  it('rejects more than 5 files with error toast', async () => {
    const { result } = renderHook(() => useFileUpload())
    const files = Array.from(
      { length: 6 },
      (_, i) => new File(['content'], `file${i}.txt`, { type: 'text/plain' })
    )

    await act(async () => {
      await result.current.handleFileUpload(files)
    })

    expect(result.current.uploadedFiles).toEqual([])
    expect(mockToastError).toHaveBeenCalled()
  })

  it('rejects files that are too large', async () => {
    const { result } = renderHook(() => useFileUpload())
    const largeContent = new Array(6 * 1024 * 1024).fill('a').join('')
    const largeFile = new File([largeContent], 'large.txt', { type: 'text/plain' })

    // Override validateFileSize to return false for this file
    const { validateFileSize } = await import('@/app/chat/utils/message-input/utils')
    vi.mocked(validateFileSize).mockReturnValueOnce(false)

    await act(async () => {
      await result.current.handleFileUpload([largeFile])
    })

    expect(result.current.uploadedFiles).toEqual([])
    expect(mockToastError).toHaveBeenCalled()
  })

  it('successfully uploads a valid small file', async () => {
    const { result } = renderHook(() => useFileUpload())
    const smallFile = new File(['content'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      await result.current.handleFileUpload([smallFile])
    })

    expect(result.current.uploadedFiles).toHaveLength(1)
    expect(result.current.uploadedFiles[0].file.name).toBe('test.txt')
    expect(result.current.uploadedFiles[0].type).toBe('file')
    expect(result.current.uploadedFiles[0].preview).toBe('')
  })

  it('successfully uploads an image file with preview', async () => {
    const { result } = renderHook(() => useFileUpload())
    const imageFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' })

    // Override isImageFile mock for this test
    const { isImageFile } = await import('@/app/chat/utils/message-input/utils')
    vi.mocked(isImageFile).mockReturnValueOnce(true)

    await act(async () => {
      await result.current.handleFileUpload([imageFile])
    })

    expect(result.current.uploadedFiles).toHaveLength(1)
    expect(result.current.uploadedFiles[0].type).toBe('image')
    expect(result.current.uploadedFiles[0].preview).toBeTruthy()
  })

  it('removes file by index from non-empty list', async () => {
    const { result } = renderHook(() => useFileUpload())
    const file1 = new File(['c1'], 'a.txt', { type: 'text/plain' })
    const file2 = new File(['c2'], 'b.txt', { type: 'text/plain' })

    await act(async () => {
      await result.current.handleFileUpload([file1, file2])
    })

    expect(result.current.uploadedFiles).toHaveLength(2)

    await act(async () => {
      result.current.removeFile(0)
    })

    expect(result.current.uploadedFiles).toHaveLength(1)
    expect(result.current.uploadedFiles[0].file.name).toBe('b.txt')
  })

  it('clears all files', async () => {
    const { result } = renderHook(() => useFileUpload())
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      await result.current.handleFileUpload([file])
    })

    expect(result.current.uploadedFiles).toHaveLength(1)

    await act(async () => {
      result.current.clearFiles()
    })

    expect(result.current.uploadedFiles).toEqual([])
  })

  it('rejects upload when file limit would be exceeded', async () => {
    const { result } = renderHook(() => useFileUpload())
    // Upload 4 files first
    const initialFiles = Array.from(
      { length: 4 },
      (_, i) => new File(['content'], `file${i}.txt`, { type: 'text/plain' })
    )

    await act(async () => {
      await result.current.handleFileUpload(initialFiles)
    })

    expect(result.current.uploadedFiles).toHaveLength(4)

    // Try to add 2 more (total would be 6 > 5)
    const moreFiles = [
      new File(['c'], 'extra1.txt', { type: 'text/plain' }),
      new File(['c'], 'extra2.txt', { type: 'text/plain' }),
    ]

    await act(async () => {
      await result.current.handleFileUpload(moreFiles)
    })

    expect(result.current.uploadedFiles).toHaveLength(4)
    expect(mockToastError).toHaveBeenCalled()
  })

  it('accumulates files across multiple uploads up to the limit', async () => {
    const { result } = renderHook(() => useFileUpload())

    // Upload 3 files
    const batch1 = Array.from(
      { length: 3 },
      (_, i) => new File(['c'], `f${i}.txt`, { type: 'text/plain' })
    )
    await act(async () => {
      await result.current.handleFileUpload(batch1)
    })

    expect(result.current.uploadedFiles).toHaveLength(3)

    // Upload 2 more (total 5)
    const batch2 = Array.from(
      { length: 2 },
      (_, i) => new File(['c'], `g${i}.txt`, { type: 'text/plain' })
    )
    await act(async () => {
      await result.current.handleFileUpload(batch2)
    })

    expect(result.current.uploadedFiles).toHaveLength(5)
  })

  it('removeFile is a no-op on empty list', async () => {
    const { result } = renderHook(() => useFileUpload())

    await act(async () => {
      result.current.removeFile(0)
    })

    expect(result.current.uploadedFiles).toEqual([])
  })

  it('shows error toast for invalid filename', async () => {
    const { result } = renderHook(() => useFileUpload())
    // File with name that becomes empty after sanitization
    const file = new File(['content'], '!!!', { type: 'text/plain' })

    await act(async () => {
      await result.current.handleFileUpload([file])
    })

    expect(result.current.uploadedFiles).toEqual([])
    expect(mockToastError).toHaveBeenCalled()
  })
})
