interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular'
  width?: string | number
  height?: string | number
  lines?: number
  animate?: boolean
}

export default function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  lines = 1,
  animate = true
}: SkeletonProps) {
  const baseClasses = `bg-gray-200 ${animate ? 'animate-pulse' : ''} ${className}`

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} h-4 rounded ${
              index === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
            style={{ width: index === lines - 1 ? undefined : width, height }}
          />
        ))}
      </div>
    )
  }

  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full'
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]}`}
      style={{
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'text' ? undefined : width)
      }}
    />
  )
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <Skeleton width="70%" height="20px" />
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width="24px" height="24px" />
          <Skeleton variant="rectangular" width="24px" height="24px" />
        </div>
      </div>

      <Skeleton lines={2} className="mb-3" />

      <div className="flex gap-2 mb-3">
        <Skeleton variant="rectangular" width="80px" height="24px" />
        <Skeleton variant="rectangular" width="60px" height="24px" />
      </div>

      <div className="flex justify-between items-center">
        <Skeleton width="100px" height="12px" />
        <Skeleton width="80px" height="12px" />
      </div>
    </div>
  )
}

export function TaskListSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <Skeleton width="200px" height="36px" className="mb-2" />
          <Skeleton width="150px" height="16px" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton variant="rectangular" width="40px" height="40px" />
          <Skeleton variant="rectangular" width="120px" height="40px" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-4">
        <Skeleton height="40px" />
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Skeleton width="100px" height="16px" className="mb-2" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} variant="rectangular" width="80px" height="32px" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton width="60px" height="16px" className="mb-2" />
            <Skeleton variant="rectangular" width="192px" height="32px" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <TaskCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}