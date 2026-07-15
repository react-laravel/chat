import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FilePreview } from '@/app/chat/components/message-input/FilePreview'
import type { UploadedFile } from '@/app/chat/types/messageInput'

const mockImageFile: UploadedFile = {
  file: new File([''], 'test.png', { type: 'image/png' }),
  preview: 'data:image/png;base64,abc123',
  type: 'image',
}

const mockGenericFile: UploadedFile = {
  file: new File(['content'], 'document.pdf', { type: 'application/pdf' }),
  preview: '',
  type: 'file',
}

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

describe('FilePreview', () => {
  it('returns null when files array is empty', () => {
    const { container } = render(<FilePreview files={[]} onRemove={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders image preview', () => {
    const { container } = render(<FilePreview files={[mockImageFile]} onRemove={vi.fn()} />)
    const image = container.querySelector('img')
    expect(image).toBeTruthy()
    expect(image?.getAttribute('src')).toBe('data:image/png;base64,abc123')
  })

  it('renders generic file preview', () => {
    const { getByText } = render(<FilePreview files={[mockGenericFile]} onRemove={vi.fn()} />)
    expect(getByText('document.pdf')).toBeInTheDocument()
  })

  it('calls onRemove when remove button is clicked', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(<FilePreview files={[mockImageFile]} onRemove={onRemove} />)

    const removeButton = screen.getByRole('button', { name: /remove file/i })
    await user.click(removeButton)
    expect(onRemove).toHaveBeenCalledWith(0)
  })

  it('renders multiple files', () => {
    const files = [mockImageFile, mockGenericFile]
    const { container } = render(<FilePreview files={files} onRemove={vi.fn()} />)
    const removeButtons = container.querySelectorAll('button')
    expect(removeButtons.length).toBe(2)
  })

  it('calls onRemove with correct index for second file', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    const files = [mockImageFile, mockGenericFile]
    render(<FilePreview files={files} onRemove={onRemove} />)

    const removeButtons = screen.getAllByRole('button', { name: /remove file/i })
    await user.click(removeButtons[1])
    expect(onRemove).toHaveBeenCalledWith(1)
  })
})
