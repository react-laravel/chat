import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import { AuthBootstrap } from '@/components/AuthBootstrap'
import './globals.css'

export const metadata: Metadata = {
  title: 'DogeOW Chat',
  description: '可嵌入 DogeOW 子站的独立实时聊天服务',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#171717' },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthBootstrap />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
