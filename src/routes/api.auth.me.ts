import { createFileRoute } from '@tanstack/react-router'
import {
  verifyJWT,
  getUserById,
  getSessionUser,
  addSecurityHeaders,
  handleApiError,
  SecurityError
} from '../utils/auth'
import { createEnvironmentAdapter } from '../utils/environment'

export const Route = createFileRoute('/api/auth/me')({
  server: {
    handlers: {
      GET: async ({ request, context }) => {
        try {
          const env = createEnvironmentAdapter(context)

          // Get token from cookie
          const cookieHeader = request.headers.get('Cookie')
          if (!cookieHeader) {
            throw new SecurityError(
              'NO_AUTH_COOKIE',
              401,
              'Authentication required'
            )
          }

          const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=')
            acc[key] = value
            return acc
          }, {} as Record<string, string>)

          const token = cookies['auth-token']
          if (!token) {
            throw new SecurityError(
              'NO_AUTH_TOKEN',
              401,
              'Authentication required'
            )
          }

          // Verify JWT token
          const payload = await verifyJWT(token, env.jwtSecret)
          if (!payload) {
            throw new SecurityError(
              'INVALID_TOKEN',
              401,
              'Invalid or expired authentication token'
            )
          }

          // Verify session still exists in KV
          const sessionUserId = await getSessionUser(env.kv, token)
          if (!sessionUserId || sessionUserId !== payload.userId) {
            throw new SecurityError(
              'SESSION_NOT_FOUND',
              401,
              'Session has expired'
            )
          }

          // Get user from database
          const user = await getUserById(env.db, payload.userId)
          if (!user) {
            throw new SecurityError(
              'USER_NOT_FOUND',
              404,
              'User account not found'
            )
          }

          // Check if user is still active
          if (!user.is_active) {
            throw new SecurityError(
              'USER_DEACTIVATED',
              403,
              'User account has been deactivated'
            )
          }

          return addSecurityHeaders(new Response(
            JSON.stringify({
              user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
                createdAt: user.created_at,
                updatedAt: user.updated_at
              }
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, private'
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