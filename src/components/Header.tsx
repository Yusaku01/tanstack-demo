import { Link } from '@tanstack/react-router'
import { useAuthStore } from '../stores/authStore'
import { useEffect, useState } from 'react'

export default function Header() {
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleLogout = async () => {
    await logout()
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsMenuOpen(false)
    }
  }

  return (
    <header
      className="px-4 py-3 flex items-center justify-between bg-white border-b border-gray-200 shadow-sm"
      role="banner"
    >
      <nav className="flex flex-row items-center gap-6" role="navigation" aria-label="Main navigation">
        <div className="text-xl font-bold text-blue-600">
          <Link
            to="/"
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm"
            aria-label="TodoApp - Go to homepage"
          >
            TodoApp
          </Link>
        </div>

        {isAuthenticated && (
          <div className="hidden sm:flex gap-4">
            <Link
              to="/tasks"
              className="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
              aria-label="View your tasks"
            >
              Tasks
            </Link>
          </div>
        )}
      </nav>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <span className="text-gray-700 hidden sm:inline" aria-label={`Logged in as ${user?.displayName}`}>
              Welcome, <span className="font-medium">{user?.displayName}</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 text-sm font-medium active:scale-95 shadow-sm hover:shadow-md"
              aria-label="Log out of your account"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link
              to="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm font-medium active:scale-95 shadow-sm hover:shadow-md"
              aria-label="Log in to your account"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 text-sm font-medium active:scale-95 shadow-sm hover:shadow-md"
              aria-label="Create a new account"
            >
              Sign Up
            </Link>
          </div>
        )}

        {/* Mobile menu button */}
        {isAuthenticated && (
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            onKeyDown={handleKeyDown}
            className="sm:hidden p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md transition-all duration-200 active:scale-95"
            aria-expanded={isMenuOpen}
            aria-label="Toggle mobile menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Mobile menu */}
      {isMenuOpen && isAuthenticated && (
        <div
          className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg sm:hidden animate-in slide-in-from-top-2 duration-200"
          role="menu"
          aria-label="Mobile navigation menu"
        >
          <div className="px-4 py-2">
            <Link
              to="/tasks"
              className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200 active:scale-95"
              role="menuitem"
              onClick={() => setIsMenuOpen(false)}
            >
              Tasks
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}