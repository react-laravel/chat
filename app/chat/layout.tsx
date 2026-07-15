import type { ReactNode } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function ChatLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}
