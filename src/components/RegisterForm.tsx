import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Link, useRouter } from '@tanstack/react-router'

interface PasswordStrength {
  score: number
  label: string
  color: string
  suggestions: string[]
}

export default function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})
  const [success, setSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null)
  const { register, isLoading } = useAuthStore()
  const router = useRouter()

  const displayNameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    displayNameRef.current?.focus()
  }, [])

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0
    const suggestions: string[] = []

    if (password.length >= 12) score += 1
    else suggestions.push('Use at least 12 characters')

    if (/[A-Z]/.test(password)) score += 1
    else suggestions.push('Include uppercase letters')

    if (/[a-z]/.test(password)) score += 1
    else suggestions.push('Include lowercase letters')

    if (/\d/.test(password)) score += 1
    else suggestions.push('Include numbers')

    if (/[@$!%*?&]/.test(password)) score += 1
    else suggestions.push('Include special characters (@$!%*?&)')

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']

    return {
      score,
      label: labels[score] || 'Very Weak',
      color: colors[score] || 'bg-red-500',
      suggestions
    }
  }

  const validateField = (field: string, value: string) => {
    const errors = { ...fieldErrors }

    switch (field) {
      case 'displayName':
        if (!value.trim()) {
          errors.displayName = 'Display name is required'
        } else if (value.trim().length < 2) {
          errors.displayName = 'Display name must be at least 2 characters'
        } else if (value.trim().length > 100) {
          errors.displayName = 'Display name must not exceed 100 characters'
        } else if (!/^[a-zA-Z0-9\s\-_.]+$/.test(value.trim())) {
          errors.displayName = 'Display name can only contain letters, numbers, spaces, hyphens, underscores, and periods'
        } else {
          delete errors.displayName
        }
        break

      case 'email':
        if (!value) {
          errors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          errors.email = 'Please enter a valid email address'
        } else {
          delete errors.email
        }
        break

      case 'password':
        if (!value) {
          errors.password = 'Password is required'
        } else if (value.length < 12) {
          errors.password = 'Password must be at least 12 characters'
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(value)) {
          errors.password = 'Password must include uppercase, lowercase, number, and special character (@$!%*?&)'
        } else {
          delete errors.password
        }
        break

      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password'
        } else if (value !== password) {
          errors.confirmPassword = 'Passwords do not match'
        } else {
          delete errors.confirmPassword
        }
        break
    }

    setFieldErrors(errors)
    return !errors[field]
  }

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDisplayName(value)
    if (value && fieldErrors.displayName) {
      validateField('displayName', value)
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (value && fieldErrors.email) {
      validateField('email', value)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)

    if (value) {
      setPasswordStrength(calculatePasswordStrength(value))
      if (fieldErrors.password) {
        validateField('password', value)
      }
      // Re-validate confirm password if it exists
      if (confirmPassword) {
        validateField('confirmPassword', confirmPassword)
      }
    } else {
      setPasswordStrength(null)
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConfirmPassword(value)
    if (value && fieldErrors.confirmPassword) {
      validateField('confirmPassword', value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validate all fields
    const displayNameValid = validateField('displayName', displayName)
    const emailValid = validateField('email', email)
    const passwordValid = validateField('password', password)
    const confirmPasswordValid = validateField('confirmPassword', confirmPassword)

    if (!displayNameValid || !emailValid || !passwordValid || !confirmPasswordValid) {
      return
    }

    const result = await register(email, password, displayName.trim())
    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        router.navigate({ to: '/login' })
      }, 3000)
    } else {
      setError(result.error || 'Registration failed. Please try again.')
      displayNameRef.current?.focus()
    }
  }

  const hasErrors = Object.keys(fieldErrors).length > 0 || !!error

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Created Successfully!</h2>
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            <p>Welcome to TodoApp! You'll be redirected to the login page in a few seconds.</p>
          </div>
          <div className="mt-4">
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:underline"
            >
              Continue to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Create your account
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
        noValidate
        aria-describedby={hasErrors ? "form-errors" : undefined}
      >
        {error && (
          <div
            id="form-errors"
            className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
            Display Name
          </label>
          <input
            ref={displayNameRef}
            type="text"
            id="displayName"
            value={displayName}
            onChange={handleDisplayNameChange}
            onBlur={() => displayName && validateField('displayName', displayName)}
            className={`w-full px-4 py-3 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.displayName
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            required
            autoComplete="name"
            aria-invalid={fieldErrors.displayName ? 'true' : 'false'}
            aria-describedby={fieldErrors.displayName ? 'displayName-error' : undefined}
            placeholder="Enter your display name"
          />
          {fieldErrors.displayName && (
            <p id="displayName-error" className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">
              {fieldErrors.displayName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => email && validateField('email', email)}
            className={`w-full px-4 py-3 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldErrors.email
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            required
            autoComplete="email"
            aria-invalid={fieldErrors.email ? 'true' : 'false'}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            placeholder="Enter your email"
          />
          {fieldErrors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => password && validateField('password', password)}
              className={`w-full px-4 py-3 pr-12 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                fieldErrors.password
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              required
              autoComplete="new-password"
              aria-invalid={fieldErrors.password ? 'true' : 'false'}
              aria-describedby={fieldErrors.password ? 'password-error' : 'password-strength'}
              placeholder="Create a password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {passwordStrength && (
            <div id="password-strength" className="mt-2" aria-live="polite">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600">
                  {passwordStrength.label}
                </span>
              </div>
              {passwordStrength.suggestions.length > 0 && (
                <ul className="text-xs text-gray-600 space-y-1">
                  {passwordStrength.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-center gap-1">
                      <span className="text-gray-400">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {fieldErrors.password && (
            <p id="password-error" className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              onBlur={() => confirmPassword && validateField('confirmPassword', confirmPassword)}
              className={`w-full px-4 py-3 pr-12 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                fieldErrors.confirmPassword
                  ? 'border-red-300 bg-red-50'
                  : confirmPassword && confirmPassword === password
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              required
              autoComplete="new-password"
              aria-invalid={fieldErrors.confirmPassword ? 'true' : 'false'}
              aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p id="confirmPassword-error" className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">
              {fieldErrors.confirmPassword}
            </p>
          )}
          {confirmPassword && confirmPassword === password && !fieldErrors.confirmPassword && (
            <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Passwords match
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || hasErrors}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          aria-describedby={isLoading ? "loading-status" : undefined}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating account...
            </span>
          ) : (
            'Create Account'
          )}
        </button>

        {isLoading && (
          <span id="loading-status" className="sr-only" aria-live="polite">
            Creating your account, please wait...
          </span>
        )}
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}