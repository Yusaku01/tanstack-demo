import { createFileRoute } from '@tanstack/react-router'
import {
  createUser,
  getUserByEmail,
  validateInput,
  rateLimiter,
  addSecurityHeaders,
  handleApiError,
  SecurityError,
  type ValidationRule
} from '../utils/auth'
import { createEnvironmentAdapter } from '../utils/environment'

export const Route = createFileRoute('/api/auth/register')({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        try {
          const env = createEnvironmentAdapter(context)
          const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'

          // Rate limiting - 5 registration attempts per hour per IP
          const rateLimitKey = `register:${clientIP}`
          const isAllowed = await rateLimiter.checkRate(rateLimitKey, 5, 60 * 60 * 1000)

          if (!isAllowed) {
            const remainingTime = rateLimiter.getRemainingTime(rateLimitKey)
            throw new SecurityError(
              'RATE_LIMIT_EXCEEDED',
              429,
              `Too many registration attempts. Try again in ${Math.ceil(remainingTime / 60000)} minutes.`
            )
          }

          const requestData = await request.json()
          const { email, password, displayName } = requestData

          // Enhanced validation
          const validationRules: ValidationRule[] = [
            {
              field: 'email',
              required: true,
              type: 'email',
              maxLength: 255
            },
            {
              field: 'password',
              required: true,
              minLength: 12,
              maxLength: 128,
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
            },
            {
              field: 'displayName',
              required: true,
              minLength: 2,
              maxLength: 100,
              pattern: /^[a-zA-Z0-9\s\-_.]+$/
            }
          ]

          const validation = validateInput(requestData, validationRules)
          if (!validation.isValid) {
            throw new SecurityError(
              'VALIDATION_ERROR',
              400,
              'Invalid input data',
              validation.errors.join(', ')
            )
          }

          // Check if user already exists
          const existingUser = await getUserByEmail(env.db, email.toLowerCase().trim())
          if (existingUser) {
            throw new SecurityError(
              'USER_EXISTS',
              409,
              'An account with this email already exists'
            )
          }

          // Create new user
          const user = await createUser(env.db, email.toLowerCase().trim(), password, displayName.trim())
          if (!user) {
            throw new SecurityError(
              'USER_CREATION_FAILED',
              500,
              'Failed to create user account'
            )
          }

          return addSecurityHeaders(new Response(
            JSON.stringify({
              message: 'User created successfully',
              user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name
              }
            }),
            {
              status: 201,
              headers: { 'Content-Type': 'application/json' }
            }
          ))
        } catch (error) {
          return handleApiError(error, request)
        }
      },
    },
  },
})