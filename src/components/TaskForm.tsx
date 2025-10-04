import { useState, useEffect, useRef } from 'react'
import { Task, useTaskStore, CreateTaskData, UpdateTaskData } from '../stores/taskStore'

interface TaskFormProps {
  task?: Task | null
  onClose: () => void
  onSubmit?: () => void
}

export default function TaskForm({ task, onClose, onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})

  const { createTask, updateTask, isLoading } = useTaskStore()

  const modalRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const firstFocusableElementRef = useRef<HTMLElement>(null)
  const lastFocusableElementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority)
      setDueDate(task.due_date ? task.due_date.split('T')[0] : '')
    } else {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setDueDate('')
    }
    setError('')
    setFieldErrors({})
  }, [task])

  // Focus management
  useEffect(() => {
    const focusableElements = modalRef.current?.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="email"], input[type="password"], input[type="date"], select'
    )

    if (focusableElements && focusableElements.length > 0) {
      firstFocusableElementRef.current = focusableElements[0] as HTMLElement
      lastFocusableElementRef.current = focusableElements[focusableElements.length - 1] as HTMLElement
    }

    // Focus the title input when modal opens
    const timer = setTimeout(() => {
      titleRef.current?.focus()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key === 'Tab') {
        if (!firstFocusableElementRef.current || !lastFocusableElementRef.current) return

        if (event.shiftKey) {
          // Shift + Tab: moving backwards
          if (document.activeElement === firstFocusableElementRef.current) {
            event.preventDefault()
            lastFocusableElementRef.current?.focus()
          }
        } else {
          // Tab: moving forwards
          if (document.activeElement === lastFocusableElementRef.current) {
            event.preventDefault()
            firstFocusableElementRef.current?.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const validateField = (field: string, value: string) => {
    const errors = { ...fieldErrors }

    switch (field) {
      case 'title':
        if (!value.trim()) {
          errors.title = 'Title is required'
        } else if (value.trim().length < 3) {
          errors.title = 'Title must be at least 3 characters'
        } else if (value.trim().length > 100) {
          errors.title = 'Title must be less than 100 characters'
        } else {
          delete errors.title
        }
        break

      case 'description':
        if (value && value.length > 500) {
          errors.description = 'Description must be less than 500 characters'
        } else {
          delete errors.description
        }
        break

      case 'dueDate':
        if (value) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const selectedDate = new Date(value)

          if (selectedDate < today) {
            errors.dueDate = 'Due date cannot be in the past'
          } else {
            delete errors.dueDate
          }
        } else {
          delete errors.dueDate
        }
        break
    }

    setFieldErrors(errors)
    return !errors[field]
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTitle(value)
    if (fieldErrors.title) {
      validateField('title', value)
    }
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setDescription(value)
    if (fieldErrors.description) {
      validateField('description', value)
    }
  }

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDueDate(value)
    if (fieldErrors.dueDate || value) {
      validateField('dueDate', value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate all fields
    const titleValid = validateField('title', title)
    const descriptionValid = validateField('description', description)
    const dueDateValid = validateField('dueDate', dueDate)

    if (!titleValid || !descriptionValid || !dueDateValid) {
      // Focus first invalid field
      if (!titleValid) titleRef.current?.focus()
      return
    }

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate || undefined,
    }

    let result
    try {
      if (task) {
        // Update existing task
        result = await updateTask(task.id, taskData as UpdateTaskData)
      } else {
        // Create new task
        result = await createTask(taskData as CreateTaskData)
      }

      if (result.success) {
        onSubmit?.()
        onClose()
      } else {
        setError(result.error || `Failed to ${task ? 'update' : 'create'} task`)
        titleRef.current?.focus()
      }
    } catch (error) {
      setError(`Failed to ${task ? 'update' : 'create'} task`)
      titleRef.current?.focus()
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const hasErrors = Object.keys(fieldErrors).length > 0 || !!error
  const today = new Date().toISOString().split('T')[0]

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-title"
      aria-describedby={error ? "form-error" : undefined}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 id="form-title" className="text-xl font-semibold text-gray-900">
              {task ? 'Edit Task' : 'Create New Task'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:scale-110 active:scale-95"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
          {error && (
            <div
              id="form-error"
              className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md"
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500" aria-label="required">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              id="title"
              value={title}
              onChange={handleTitleChange}
              onBlur={() => title && validateField('title', title)}
              className={`w-full px-4 py-3 border rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                fieldErrors.title
                  ? 'border-red-300 bg-red-50 shake'
                  : 'border-gray-300 hover:border-gray-400 focus:shadow-sm'
              }`}
              required
              aria-invalid={fieldErrors.title ? 'true' : 'false'}
              aria-describedby={fieldErrors.title ? 'title-error' : 'title-help'}
              placeholder="Enter task title"
              maxLength={100}
            />
            {fieldErrors.title ? (
              <p id="title-error" className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">
                {fieldErrors.title}
              </p>
            ) : (
              <p id="title-help" className="mt-1 text-sm text-gray-500">
                {title.length}/100 characters
              </p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              onBlur={() => description && validateField('description', description)}
              rows={4}
              className={`w-full px-4 py-3 border rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical ${
                fieldErrors.description
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400 focus:shadow-sm'
              }`}
              aria-invalid={fieldErrors.description ? 'true' : 'false'}
              aria-describedby={fieldErrors.description ? 'description-error' : 'description-help'}
              placeholder="Add a detailed description (optional)"
              maxLength={500}
            />
            {fieldErrors.description ? (
              <p id="description-error" className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">
                {fieldErrors.description}
              </p>
            ) : (
              <p id="description-help" className="mt-1 text-sm text-gray-500">
                {description.length}/500 characters
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-4 py-3 border border-gray-300 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 focus:shadow-sm"
                aria-describedby="priority-help"
              >
                <option value="low">🟢 Low Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="high">🔴 High Priority</option>
              </select>
              <p id="priority-help" className="mt-1 text-sm text-gray-500">
                Set the task importance level
              </p>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={handleDueDateChange}
                onBlur={() => dueDate && validateField('dueDate', dueDate)}
                min={today}
                className={`w-full px-4 py-3 border rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  fieldErrors.dueDate
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-gray-400 focus:shadow-sm'
                }`}
                aria-invalid={fieldErrors.dueDate ? 'true' : 'false'}
                aria-describedby={fieldErrors.dueDate ? 'dueDate-error' : 'dueDate-help'}
              />
              {fieldErrors.dueDate ? (
                <p id="dueDate-error" className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">
                  {fieldErrors.dueDate}
                </p>
              ) : (
                <p id="dueDate-help" className="mt-1 text-sm text-gray-500">
                  Optional deadline for the task
                </p>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 -mb-6 px-6 py-4 flex gap-3 justify-end rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || hasErrors}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium active:scale-95 shadow-sm hover:shadow-md"
              aria-describedby={isLoading ? "submit-status" : undefined}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {task ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                task ? 'Update Task' : 'Create Task'
              )}
            </button>

            {isLoading && (
              <span id="submit-status" className="sr-only" aria-live="polite">
                {task ? 'Updating your task, please wait...' : 'Creating your task, please wait...'}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}