import { createFileRoute } from '@tanstack/react-router'
import {
  getUserByEmail,
  verifyPassword,
  createJWT,
  createSession,
  validateInput,
  rateLimiter,
  addSecurityHeaders,
  handleApiError,
  SecurityError,
  type ValidationRule
} from '../utils/auth'
import { createEnvironmentAdapter } from '../utils/environment'

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        try {
          const env = createEnvironmentAdapter(context)
          const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
          const userAgent = request.headers.get('User-Agent') || 'unknown'

          // Rate limiting - 10 login attempts per 15 minutes per IP
          const rateLimitKey = `login:${clientIP}`
          const isAllowed = await rateLimiter.checkRate(rateLimitKey, 10, 15 * 60 * 1000)

          if (!isAllowed) {
            const remainingTime = rateLimiter.getRemainingTime(rateLimitKey)
            throw new SecurityError(
              'RATE_LIMIT_EXCEEDED',
              429,
              `Too many login attempts. Try again in ${Math.ceil(remainingTime / 60000)} minutes.`
            )
          }

          const requestData = await request.json()
          const { email, password } = requestData

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
              minLength: 1,
              maxLength: 128
            }
          ]

          const validation = validateInput(requestData, validationRules)
          if (!validation.isValid) {
            throw new SecurityError(
              'VALIDATION_ERROR',
              400,
              'Invalid email or password'
            )
          }

          // Get user from database with email rate limiting
          const emailRateLimitKey = `login:email:${email.toLowerCase()}`
          const emailAllowed = await rateLimiter.checkRate(emailRateLimitKey, 5, 15 * 60 * 1000)

          if (!emailAllowed) {
            throw new SecurityError(
              'EMAIL_RATE_LIMIT_EXCEEDED',
              429,
              'Too many attempts for this email. Please try again later.'
            )
          }

          const user = await getUserByEmail(env.db, email.toLowerCase().trim())
          if (!user) {
            // Introduce delay to prevent timing attacks
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500))
            throw new SecurityError(
              'INVALID_CREDENTIALS',
              401,
              'Invalid email or password'
            )
          }

          // Verify password
          const isValidPassword = await verifyPassword(password, user.password_hash)
          if (!isValidPassword) {
            // Introduce delay to prevent timing attacks
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500))
            throw new SecurityError(
              'INVALID_CREDENTIALS',
              401,
              'Invalid email or password'
            )
          }

          // Create JWT token
          const token = await createJWT(
            { userId: user.id, email: user.email },
            env.jwtSecret
          )

          // Create session in KV
          await createSession(env.kv, user.id, token)

          // Environment-aware cookie security
          const isProduction = env.environment === 'production'
          const cookie = `auth-token=${token}; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`

          // Log successful login (without sensitive data)
          console.log(`Successful login for user ${user.id} from IP ${clientIP}`)

          return addSecurityHeaders(new Response(
            JSON.stringify({
              message: 'Login successful',
              user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name
              }
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': cookie
              }
            }
          ))
        } catch (error) {
          return handleApiError(error, request)
        }
      },
    },
  },
})