import { createFileRoute, Navigate } from '@tanstack/react-router'
import LoginForm from '../components/LoginForm'
import { useAuthStore } from '../stores/authStore'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { isAuthenticated } = useAuthStore()

  // Redirect to home if already logged in
  if (isAuthenticated) {
    return <Navigate to="/" />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <LoginForm />
    </div>
  )
}