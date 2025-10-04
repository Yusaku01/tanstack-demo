import { createFileRoute, Navigate } from '@tanstack/react-router'
import RegisterForm from '../components/RegisterForm'
import { useAuthStore } from '../stores/authStore'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const { isAuthenticated } = useAuthStore()

  // Redirect to home if already logged in
  if (isAuthenticated) {
    return <Navigate to="/" />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <RegisterForm />
    </div>
  )
}