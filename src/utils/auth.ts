// Types are now defined in env.d.ts

export interface User {
  id: string
  email: string
  display_name: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface AuthUser extends User {
  password_hash: string
}

export interface JWTPayload {
  userId: string
  email: string
  exp: number
  iat: number
}

// Secure password hashing using PBKDF2
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const encoder = new TextEncoder()
  const passwordData = encoder.encode(password)

  const key = await crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  )

  // Combine salt + hash for storage
  const combined = new Uint8Array(salt.length + hashBuffer.byteLength)
  combined.set(salt, 0)
  combined.set(new Uint8Array(hashBuffer), salt.length)

  return Array.from(combined).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    // Extract salt and hash from stored value
    const hashBytes = new Uint8Array(hash.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
    const salt = hashBytes.slice(0, 16)
    const storedHash = hashBytes.slice(16)

    const encoder = new TextEncoder()
    const passwordData = encoder.encode(password)

    const key = await crypto.subtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    )

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      256
    )

    const computedHash = new Uint8Array(hashBuffer)

    // Constant-time comparison
    if (computedHash.length !== storedHash.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < computedHash.length; i++) {
      result |= computedHash[i] ^ storedHash[i]
    }

    return result === 0
  } catch {
    return false
  }
}

// JWT utilities
export async function createJWT(payload: Omit<JWTPayload, 'exp' | 'iat'>, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const jwtPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + (7 * 24 * 60 * 60) // 7 days
  }

  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload))

  const message = `${encodedHeader}.${encodedPayload}`
  const signature = await signMessage(message, secret)

  return `${message}.${signature}`
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.')
    if (!encodedHeader || !encodedPayload || !signature) {
      return null
    }

    const message = `${encodedHeader}.${encodedPayload}`
    const isValid = await verifySignature(message, signature, secret)

    if (!isValid) {
      return null
    }

    const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload))

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

// Helper functions for JWT
async function signMessage(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(message)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, messageData)
  return base64UrlEncode(new Uint8Array(signature))
}

async function verifySignature(message: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(message)
  const signatureData = base64UrlDecode(signature, true)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  return await crypto.subtle.verify('HMAC', key, signatureData, messageData)
}

function base64UrlEncode(data: string | Uint8Array): string {
  const encoder = new TextEncoder()
  const bytes = typeof data === 'string' ? encoder.encode(data) : data
  const base64 = btoa(String.fromCharCode(...bytes))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64UrlDecode(str: string, asArrayBuffer = false): string | Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
  const binary = atob(padded)

  if (asArrayBuffer) {
    return new Uint8Array(binary.split('').map(c => c.charCodeAt(0)))
  }

  return binary
}

// Database operations
export async function createUser(
  db: D1Database,
  email: string,
  password: string,
  displayName: string
): Promise<User | null> {
  try {
    const id = crypto.randomUUID()
    const passwordHash = await hashPassword(password)

    await db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name)
      VALUES (?, ?, ?, ?)
    `).bind(id, email, passwordHash, displayName).run()

    const user = await db.prepare(`
      SELECT id, email, display_name, created_at, updated_at, is_active
      FROM users
      WHERE id = ?
    `).bind(id).first<User>()

    return user || null
  } catch (error) {
    return null
  }
}

export async function getUserByEmail(db: D1Database, email: string): Promise<AuthUser | null> {
  try {
    const user = await db.prepare(`
      SELECT * FROM users WHERE email = ? AND is_active = 1
    `).bind(email).first<AuthUser>()

    return user || null
  } catch {
    return null
  }
}

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
  try {
    const user = await db.prepare(`
      SELECT id, email, display_name, created_at, updated_at, is_active
      FROM users
      WHERE id = ? AND is_active = 1
    `).bind(id).first<User>()

    return user || null
  } catch {
    return null
  }
}

// Session management using KV
export async function createSession(kv: KVNamespace, userId: string, token: string): Promise<void> {
  await kv.put(`session:${token}`, userId, { expirationTtl: 7 * 24 * 60 * 60 }) // 7 days
}

export async function getSessionUser(kv: KVNamespace, token: string): Promise<string | null> {
  return await kv.get(`session:${token}`)
}

export async function deleteSession(kv: KVNamespace, token: string): Promise<void> {
  await kv.delete(`session:${token}`)
}

// Input validation utilities
export interface ValidationRule {
  field: string
  required?: boolean
  type?: 'string' | 'email' | 'number'
  minLength?: number
  maxLength?: number
  pattern?: RegExp
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateInput(data: any, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = []

  for (const rule of rules) {
    const value = data[rule.field]

    if (rule.required && (!value || value.toString().trim() === '')) {
      errors.push(`${rule.field} is required`)
      continue
    }

    if (value) {
      if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${rule.field} must be a valid email`)
      }

      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${rule.field} must be at least ${rule.minLength} characters`)
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${rule.field} must not exceed ${rule.maxLength} characters`)
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${rule.field} format is invalid`)
      }
    }
  }

  return { isValid: errors.length === 0, errors }
}

// Rate limiting
class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>()

  async checkRate(key: string, maxAttempts: number, windowMs: number): Promise<boolean> {
    const now = Date.now()
    const record = this.attempts.get(key)

    if (!record || now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs })
      return true
    }

    if (record.count >= maxAttempts) {
      return false
    }

    record.count++
    return true
  }

  getRemainingTime(key: string): number {
    const record = this.attempts.get(key)
    if (!record) return 0
    return Math.max(0, record.resetTime - Date.now())
  }
}

export const rateLimiter = new RateLimiter()

// Security headers utility
export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers)

  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-XSS-Protection', '1; mode=block')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

// Error handling utility
export class SecurityError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    public userMessage: string,
    public internalMessage?: string
  ) {
    super(internalMessage || userMessage)
  }
}

export function handleApiError(error: any, request: Request): Response {
  const requestId = crypto.randomUUID()

  // Log detailed error for debugging (server-side only)
  console.error(`[${requestId}] API Error:`, {
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString()
  })

  // Return sanitized error to client
  if (error instanceof SecurityError) {
    return addSecurityHeaders(new Response(
      JSON.stringify({
        error: error.userMessage,
        requestId
      }),
      {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    ))
  }

  // Default to generic error
  return addSecurityHeaders(new Response(
    JSON.stringify({
      error: 'Internal server error',
      requestId
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  ))
}