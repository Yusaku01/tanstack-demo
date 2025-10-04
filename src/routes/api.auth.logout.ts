import { createFileRoute } from '@tanstack/react-router'
import { deleteSession, addSecurityHeaders, handleApiError } from '../utils/auth'
import { createEnvironmentAdapter } from '../utils/environment'

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        try {
          const env = createEnvironmentAdapter(context)
          const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'

          // Get token from cookie
          const cookieHeader = request.headers.get('Cookie')
          if (!cookieHeader) {
            return addSecurityHeaders(new Response(
              JSON.stringify({ message: 'No session to logout' }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            ))
          }

          const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=')
            acc[key] = value
            return acc
          }, {} as Record<string, string>)

          const token = cookies['auth-token']
          if (token) {
            // Delete session from KV
            await deleteSession(env.kv, token)
            console.log(`User session ${token.substring(0, 8)}... logged out from IP ${clientIP}`)
          }

          // Environment-aware cookie clearing
          const isProduction = env.environment === 'production'
          const clearCookie = `auth-token=; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Path=/; Max-Age=0`

          return addSecurityHeaders(new Response(
            JSON.stringify({ message: 'Logout successful' }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': clearCookie
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