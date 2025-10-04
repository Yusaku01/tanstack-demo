import { forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  children: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    const baseClasses = `
      inline-flex items-center justify-center gap-2 font-medium rounded-lg
      transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      active:scale-95 transform-gpu
    `.trim().replace(/\s+/g, ' ')

    const variantClasses = {
      primary: `
        bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500
        shadow-sm hover:shadow-md disabled:hover:bg-blue-600
      `,
      secondary: `
        bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500
        shadow-sm hover:shadow-md disabled:hover:bg-gray-100
      `,
      danger: `
        bg-red-600 text-white hover:bg-red-700 focus:ring-red-500
        shadow-sm hover:shadow-md disabled:hover:bg-red-600
      `,
      ghost: `
        text-gray-700 hover:bg-gray-100 focus:ring-gray-500
        disabled:hover:bg-transparent
      `,
      outline: `
        border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500
        shadow-sm hover:shadow-md disabled:hover:bg-transparent
      `
    }

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base'
    }

    const widthClasses = fullWidth ? 'w-full' : ''

    const classes = `
      ${baseClasses}
      ${variantClasses[variant].trim().replace(/\s+/g, ' ')}
      ${sizeClasses[size]}
      ${widthClasses}
      ${className}
    `.trim().replace(/\s+/g, ' ')

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return
      onClick?.(e)
    }

    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        className={classes}
        disabled={isDisabled}
        onClick={handleClick}
        aria-describedby={loading ? 'loading-state' : undefined}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
            <span id="loading-state" className="sr-only" aria-live="polite">
              Loading, please wait...
            </span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button

// Icon components for common use cases
export const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </svg>
)

export const EditIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
)

export const DeleteIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
)

export const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
)