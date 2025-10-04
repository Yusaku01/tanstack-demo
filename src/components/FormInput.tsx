import { forwardRef, useState } from 'react'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helpText?: string
  icon?: React.ReactNode
  showCharacterCount?: boolean
  maxLength?: number
  required?: boolean
  onValueChange?: (value: string) => void
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      error,
      helpText,
      icon,
      showCharacterCount,
      maxLength,
      required,
      onValueChange,
      className = '',
      onChange,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setHasValue(!!value)
      onValueChange?.(value)
      onChange?.(e)
    }

    const inputId = props.id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`
    const errorId = `${inputId}-error`
    const helpId = `${inputId}-help`

    const getLabelClasses = () => {
      const baseClasses = 'absolute left-3 transition-all duration-200 pointer-events-none'

      if (isFocused || hasValue) {
        return `${baseClasses} -top-2 text-xs bg-white px-1 text-blue-600 font-medium`
      }

      return `${baseClasses} top-3 text-gray-500`
    }

    const getInputClasses = () => {
      const baseClasses = `
        w-full px-4 py-3 border rounded-lg
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        hover:border-gray-400
        ${icon ? 'pl-12' : ''}
        ${error ? 'border-red-300 bg-red-50 shake' : 'border-gray-300'}
        ${className}
      `.trim().replace(/\s+/g, ' ')

      return baseClasses
    }

    return (
      <div className="relative">
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-3 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={getInputClasses()}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={handleChange}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? errorId : helpText ? helpId : undefined
            }
            maxLength={maxLength}
            {...props}
          />

          <label
            htmlFor={inputId}
            className={getLabelClasses()}
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        </div>

        {/* Error message */}
        {error && (
          <div
            id={errorId}
            className="mt-2 flex items-center gap-2 text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Help text and character count */}
        {(helpText || showCharacterCount) && !error && (
          <div id={helpId} className="mt-2 flex items-center justify-between">
            {helpText && (
              <p className="text-sm text-gray-500">{helpText}</p>
            )}
            {showCharacterCount && maxLength && (
              <p className="text-sm text-gray-400 ml-auto">
                {(props.value as string)?.length || 0}/{maxLength}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

export default FormInput