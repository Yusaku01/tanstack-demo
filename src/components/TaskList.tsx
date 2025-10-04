import { useState, useEffect, useRef } from 'react'
import { useTaskStore, Task } from '../stores/taskStore'
import TaskCard from './TaskCard'
import TaskForm from './TaskForm'
import { TaskListSkeleton } from './Skeleton'

type FilterType = 'all' | 'pending' | 'in_progress' | 'completed'
type SortType = 'created' | 'due_date' | 'priority' | 'title'

export default function TaskList() {
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('created')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCompactView, setIsCompactView] = useState(false)

  const { tasks, isLoading, error, fetchTasks, getTasksByStatus } = useTaskStore()

  const searchRef = useRef<HTMLInputElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in form elements
      if (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return
      }

      switch (event.key) {
        case 'n':
        case 'N':
          if (!showForm) {
            event.preventDefault()
            setShowForm(true)
            setEditingTask(null)
          }
          break

        case '/':
          event.preventDefault()
          searchRef.current?.focus()
          break

        case 'Escape':
          if (showForm) {
            setShowForm(false)
            setEditingTask(null)
            addButtonRef.current?.focus()
          } else if (searchQuery) {
            setSearchQuery('')
            searchRef.current?.blur()
          }
          break

        case '1':
        case '2':
        case '3':
        case '4':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            const filters: FilterType[] = ['all', 'pending', 'in_progress', 'completed']
            setFilter(filters[parseInt(event.key) - 1] || 'all')
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showForm, searchQuery])

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingTask(null)
  }

  const handleFormSubmit = () => {
    fetchTasks() // Refresh tasks after create/update
  }

  const getFilteredAndSortedTasks = () => {
    let filteredTasks = filter === 'all' ? tasks : getTasksByStatus(filter)

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      )
    }

    // Sort tasks
    return filteredTasks.sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()

        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]

        case 'title':
          return a.title.localeCompare(b.title)

        case 'created':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
  }

  const filteredTasks = getFilteredAndSortedTasks()

  const getTaskCount = (status: FilterType) => {
    if (status === 'all') return tasks.length
    return getTasksByStatus(status).length
  }

  const getFilterLabel = (filterType: FilterType) => {
    const labels = {
      all: 'All Tasks',
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed'
    }
    return labels[filterType]
  }

  const getSortLabel = (sortType: SortType) => {
    const labels = {
      created: 'Created Date',
      due_date: 'Due Date',
      priority: 'Priority',
      title: 'Title'
    }
    return labels[sortType]
  }

  const clearSearch = () => {
    setSearchQuery('')
    searchRef.current?.focus()
  }

  if (isLoading && tasks.length === 0) {
    return <TaskListSkeleton />
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600 mt-1">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCompactView(!isCompactView)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 active:scale-95"
            aria-label={`Switch to ${isCompactView ? 'card' : 'compact'} view`}
            title={`${isCompactView ? 'Card' : 'Compact'} view`}
          >
            {isCompactView ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            )}
          </button>

          <button
            ref={addButtonRef}
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium flex items-center gap-2 active:scale-95 shadow-sm hover:shadow-md"
            aria-label="Create new task (keyboard shortcut: N)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md" role="alert">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Error loading tasks</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <label htmlFor="search" className="sr-only">Search tasks</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={searchRef}
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
              placeholder="Search tasks... (keyboard shortcut: /)"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter Tasks
            </label>
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="Task status filters">
              {(['all', 'pending', 'in_progress', 'completed'] as const).map((status, index) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-2 text-sm rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-95 ${
                    filter === status
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                  }`}
                  role="tab"
                  aria-selected={filter === status}
                  aria-label={`${getFilterLabel(status)} (keyboard shortcut: ${index + 1})`}
                >
                  {getFilterLabel(status)}
                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-white bg-opacity-25">
                    {getTaskCount(status)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="sm:w-48">
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-gray-400"
            >
              <option value="created">📅 {getSortLabel('created')}</option>
              <option value="due_date">⏰ {getSortLabel('due_date')}</option>
              <option value="priority">🎯 {getSortLabel('priority')}</option>
              <option value="title">🔤 {getSortLabel('title')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mb-4 text-xs text-gray-500 flex flex-wrap gap-4">
        <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">N</kbd> New task</span>
        <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">/</kbd> Search</span>
        <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">1-4</kbd> Filter tabs</span>
        <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">Esc</kbd> Cancel</span>
      </div>

      {/* Tasks Display */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 mb-4 text-gray-300">
            {searchQuery ? (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            ) : (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery
              ? `No tasks match "${searchQuery}"`
              : filter === 'all'
                ? 'No tasks yet'
                : `No ${getFilterLabel(filter).toLowerCase()} tasks`
            }
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery
              ? 'Try adjusting your search terms or clearing the search.'
              : filter === 'all'
                ? 'Create your first task to get started with organizing your work.'
                : 'Try a different filter or create a new task.'
            }
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium active:scale-95 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Task
            </button>
          )}
        </div>
      ) : (
        <div className={`grid gap-4 ${isCompactView ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEditTask}
            />
          ))}
        </div>
      )}

      {/* Loading indicator for refresh */}
      {isLoading && tasks.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Refreshing...
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  )
}