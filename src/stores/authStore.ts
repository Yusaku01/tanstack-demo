import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  displayName: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })

          const data = await response.json()

          if (response.ok) {
            set({ user: data.user, isAuthenticated: true, isLoading: false })
            return { success: true }
          } else {
            set({ isLoading: false })
            return { success: false, error: data.error }
          }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: 'Network error occurred' }
        }
      },

      register: async (email, password, displayName) => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, displayName }),
          })

          const data = await response.json()

          if (response.ok) {
            set({ isLoading: false })
            return { success: true }
          } else {
            set({ isLoading: false })
            return { success: false, error: data.error }
          }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: 'Network error occurred' }
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
          })
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      },

      checkAuth: async () => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/auth/me')

          if (response.ok) {
            const data = await response.json()
            set({ user: data.user, isAuthenticated: true, isLoading: false })
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false })
          }
        } catch (error) {
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)