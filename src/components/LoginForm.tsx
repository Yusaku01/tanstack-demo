import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Link } from '@tanstack/react-router'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{email?: string; password?: string}>({})
  const { login, isLoading } = useAuthStore()

  const emailRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    // Focus email input on mount
    emailRef.current?.focus()
  }, [])

  const validateField = (field: 'email' | 'password', value: string) => {
    const errors = { ...fieldErrors }

    if (field === 'email') {
      if (!value) {
        errors.email = 'Email is required'
      } else if (!/\S+@\S+\.\S+/.test(value)) {
        errors.email = 'Please enter a valid email address'
      } else {
        delete errors.email
      }
    }

    if (field === 'password') {
      if (!value) {
        errors.password = 'Password is required'
      } else if (value.length < 6) {
        errors.password = 'Password must be at least 6 characters'
      } else {
        delete errors.password
      }
    }

    setFieldErrors(errors)
    return !errors[field]
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
    if (value && fieldErrors.password) {
      validateField('password', value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate all fields
    const emailValid = validateField('email', email)
    const passwordValid = validateField('password', password)

    if (!emailValid || !passwordValid) {
      return
    }

    const result = await login(email, password)
    if (!result.success) {
      setError(result.error || 'Login failed. Please check your credentials and try again.')
      // Focus back to email field for retry
      emailRef.current?.focus()
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const hasErrors = Object.keys(fieldErrors).length > 0 || !!error

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Sign in to your account
      </h1>

      <form
        ref={formRef}
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
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email address
          </label>
          <input
            ref={emailRef}
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
            <p
              id="email-error"
              className="mt-1 text-sm text-red-600"
              role="alert"
              aria-live="polite"
            >
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
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
              autoComplete="current-password"
              aria-invalid={fieldErrors.password ? 'true' : 'false'}
              aria-describedby={fieldErrors.password ? 'password-error' : 'password-help'}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
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
          {fieldErrors.password && (
            <p
              id="password-error"
              className="mt-1 text-sm text-red-600"
              role="alert"
              aria-live="polite"
            >
              {fieldErrors.password}
            </p>
          )}
          {!fieldErrors.password && (
            <p
              id="password-help"
              className="mt-1 text-sm text-gray-500"
            >
              Your password should be at least 6 characters long
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
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </button>

        {isLoading && (
          <span id="loading-status" className="sr-only" aria-live="polite">
            Signing you in, please wait...
          </span>
        )}
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:underline"
          >
            Create one now
          </Link>
        </p>
      </div>
    </div>
  )
}