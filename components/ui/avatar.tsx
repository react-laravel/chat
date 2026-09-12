import * as React from 'react'
import { cn } from '@/lib/helpers'
import Image from 'next/image'

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  )
)
Avatar.displayName = 'Avatar'

const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, alt = '', src, width, height, onError, onLoad, ...props }, ref) => {
    const [failedSrc, setFailedSrc] = React.useState<string | null>(null)

    // 确保 src 存在，否则不渲染 Image 组件
    if (!src || failedSrc === src) {
      return null
    }

    const srcString = typeof src === 'string' ? src : ''

    if (!srcString) {
      return null
    }

    return (
      <Image
        ref={ref}
        className={cn('absolute inset-0 z-10 aspect-square h-full w-full object-cover', className)}
        alt={alt}
        src={srcString}
        unoptimized
        width={Number(width) || 40}
        height={Number(height) || 40}
        onLoad={onLoad}
        onError={event => {
          setFailedSrc(srcString)
          onError?.(event)
        }}
        {...props}
      />
    )
  }
)
AvatarImage.displayName = 'AvatarImage'

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-muted flex h-full w-full items-center justify-center rounded-full',
        className
      )}
      {...props}
    />
  )
)
AvatarFallback.displayName = 'AvatarFallback'

export { Avatar, AvatarImage, AvatarFallback }
