import { useState, useRef, useEffect } from 'react'
import { Task, useTaskStore } from '../stores/taskStore'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
}

interface ConfirmationModal {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)
  const [confirmModal, setConfirmModal] = useState<ConfirmationModal | null>(null)
  const { updateTask, deleteTask } = useTaskStore()

  const statusDropdownRef = useRef<HTMLDivElement>(null)
  const priorityDropdownRef = useRef<HTMLDivElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false)
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setShowPriorityDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleStatusChange = async (status: Task['status']) => {
    setIsUpdating(true)
    setShowStatusDropdown(false)
    try {
      await updateTask(task.id, { status })
    } catch (error) {
      console.error('Failed to update task status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePriorityChange = async (priority: Task['priority']) => {
    setIsUpdating(true)
    setShowPriorityDropdown(false)
    try {
      await updateTask(task.id, { priority })
    } catch (error) {
      console.error('Failed to update task priority:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteClick = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Task',
      message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      onConfirm: handleDeleteConfirm,
      onCancel: () => {
        setConfirmModal(null)
        deleteButtonRef.current?.focus()
      }
    })
  }

  const handleDeleteConfirm = async () => {
    setConfirmModal(null)
    setIsUpdating(true)
    try {
      await deleteTask(task.id)
    } catch (error) {
      console.error('Failed to delete task:', error)
      setIsUpdating(false)
    }
  }

  const getPriorityConfig = (priority: string) => {
    const configs = {
      high: { label: 'High', color: 'text-red-700 bg-red-50 border-red-200', icon: '🔴' },
      medium: { label: 'Medium', color: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: '🟡' },
      low: { label: 'Low', color: 'text-green-700 bg-green-50 border-green-200', icon: '🟢' }
    }
    return configs[priority as keyof typeof configs] || configs.low
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      completed: { label: 'Completed', color: 'text-green-700 bg-green-50 border-green-200', icon: '✅' },
      in_progress: { label: 'In Progress', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: '🔄' },
      pending: { label: 'Pending', color: 'text-gray-700 bg-gray-50 border-gray-200', icon: '⏳' }
    }
    return configs[status as keyof typeof configs] || configs.pending
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && task.status !== 'completed'
  }

  const priorityConfig = getPriorityConfig(task.priority)
  const statusConfig = getStatusConfig(task.status)

  return (
    <>
      <article
        className={`relative bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${
          isUpdating ? 'opacity-60 pointer-events-none' : ''
        } ${task.status === 'completed' ? 'opacity-75' : ''} group`}
        role="article"
        aria-labelledby={`task-title-${task.id}`}
        aria-describedby={`task-description-${task.id}`}
      >
        {isUpdating && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-10">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3
            id={`task-title-${task.id}`}
            className={`font-semibold text-gray-900 flex-1 pr-2 ${
              task.status === 'completed' ? 'line-through text-gray-500' : ''
            }`}
          >
            {task.title}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit?.(task)}
              disabled={isUpdating}
              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
              aria-label={`Edit task: ${task.title}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              ref={deleteButtonRef}
              onClick={handleDeleteClick}
              disabled={isUpdating}
              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-200 hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
              aria-label={`Delete task: ${task.title}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p
            id={`task-description-${task.id}`}
            className="text-gray-600 text-sm mb-3 leading-relaxed"
          >
            {task.description}
          </p>
        )}

        {/* Status and Priority Controls */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Status Dropdown */}
          <div className="relative" ref={statusDropdownRef}>
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown)
                setShowPriorityDropdown(false)
              }}
              disabled={isUpdating}
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${statusConfig.color} hover:opacity-80 active:scale-95`}
              aria-label={`Change status from ${statusConfig.label}`}
              aria-expanded={showStatusDropdown}
              aria-haspopup="true"
            >
              <span>{statusConfig.icon}</span>
              {statusConfig.label}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showStatusDropdown && (
              <div
                className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-32"
                role="menu"
                aria-label="Status options"
              >
                {([
                  { value: 'pending', label: 'Pending', icon: '⏳' },
                  { value: 'in_progress', label: 'In Progress', icon: '🔄' },
                  { value: 'completed', label: 'Completed', icon: '✅' }
                ] as const).map((status) => (
                  <button
                    key={status.value}
                    onClick={() => handleStatusChange(status.value)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 flex items-center gap-2 transition-colors duration-150 ${
                      task.status === status.value ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                    role="menuitem"
                    aria-current={task.status === status.value ? 'true' : 'false'}
                  >
                    <span>{status.icon}</span>
                    {status.label}
                    {task.status === status.value && (
                      <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority Dropdown */}
          <div className="relative" ref={priorityDropdownRef}>
            <button
              onClick={() => {
                setShowPriorityDropdown(!showPriorityDropdown)
                setShowStatusDropdown(false)
              }}
              disabled={isUpdating}
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${priorityConfig.color} hover:opacity-80 active:scale-95`}
              aria-label={`Change priority from ${priorityConfig.label}`}
              aria-expanded={showPriorityDropdown}
              aria-haspopup="true"
            >
              <span>{priorityConfig.icon}</span>
              {priorityConfig.label}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showPriorityDropdown && (
              <div
                className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-24"
                role="menu"
                aria-label="Priority options"
              >
                {([
                  { value: 'low', label: 'Low', icon: '🟢' },
                  { value: 'medium', label: 'Medium', icon: '🟡' },
                  { value: 'high', label: 'High', icon: '🔴' }
                ] as const).map((priority) => (
                  <button
                    key={priority.value}
                    onClick={() => handlePriorityChange(priority.value)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 flex items-center gap-2 transition-colors duration-150 ${
                      task.priority === priority.value ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                    role="menuitem"
                    aria-current={task.priority === priority.value ? 'true' : 'false'}
                  >
                    <span>{priority.icon}</span>
                    {priority.label}
                    {task.priority === priority.value && (
                      <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer with dates */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Created: {formatDate(task.created_at)}</span>
          {task.due_date && (
            <span
              className={`font-medium ${
                isOverdue(task.due_date) ? 'text-red-600' :
                task.status === 'completed' ? 'text-green-600' : ''
              }`}
              aria-label={`Due date: ${formatDate(task.due_date)}${isOverdue(task.due_date) ? ' (overdue)' : ''}`}
            >
              Due: {formatDate(task.due_date)}
              {isOverdue(task.due_date) && ' (overdue)'}
            </span>
          )}
        </div>
      </article>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-message"
        >
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 id="confirm-title" className="text-lg font-semibold text-gray-900">
                  {confirmModal.title}
                </h3>
              </div>
            </div>

            <p id="confirm-message" className="text-gray-600 mb-6">
              {confirmModal.message}
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={confirmModal.onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 active:scale-95"
                autoFocus
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}