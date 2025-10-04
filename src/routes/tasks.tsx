import { createFileRoute, Navigate } from '@tanstack/react-router'
import TaskList from '../components/TaskList'
import { useAuthStore } from '../stores/authStore'

export const Route = createFileRoute('/tasks')({
  component: TasksPage,
})

function TasksPage() {
  const { isAuthenticated } = useAuthStore()

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TaskList />
    </div>
  )
}