import { create } from 'zustand'

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  created_at: string
  updated_at: string
  order_index: number
}

export interface CreateTaskData {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  due_date?: string
}

export interface UpdateTaskData {
  title?: string
  description?: string
  status?: 'pending' | 'in_progress' | 'completed'
  priority?: 'low' | 'medium' | 'high'
  due_date?: string
  order_index?: number
}

interface TaskState {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  setTasks: (tasks: Task[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  fetchTasks: () => Promise<void>
  createTask: (data: CreateTaskData) => Promise<{ success: boolean; error?: string }>
  updateTask: (id: string, data: UpdateTaskData) => Promise<{ success: boolean; error?: string }>
  deleteTask: (id: string) => Promise<{ success: boolean; error?: string }>
  getTasksByStatus: (status: Task['status']) => Task[]
  getTasksByPriority: (priority: Task['priority']) => Task[]
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  setTasks: (tasks) => set({ tasks }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  fetchTasks: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/tasks')

      if (!response.ok) {
        if (response.status === 401) {
          set({ isLoading: false, error: 'Please log in to view tasks' })
          return
        }
        throw new Error('Failed to fetch tasks')
      }

      const data = await response.json()
      set({ tasks: data.tasks || [], isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tasks'
      })
    }
  },

  createTask: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        const currentTasks = get().tasks
        set({
          tasks: [...currentTasks, result.task],
          isLoading: false
        })
        return { success: true }
      } else {
        set({ isLoading: false })
        return { success: false, error: result.error }
      }
    } catch (error) {
      set({ isLoading: false })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create task'
      }
    }
  },

  updateTask: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/tasks?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        const currentTasks = get().tasks
        const updatedTasks = currentTasks.map(task =>
          task.id === id ? result.task : task
        )
        set({
          tasks: updatedTasks,
          isLoading: false
        })
        return { success: true }
      } else {
        set({ isLoading: false })
        return { success: false, error: result.error }
      }
    } catch (error) {
      set({ isLoading: false })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update task'
      }
    }
  },

  deleteTask: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/tasks?id=${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        const currentTasks = get().tasks
        const filteredTasks = currentTasks.filter(task => task.id !== id)
        set({
          tasks: filteredTasks,
          isLoading: false
        })
        return { success: true }
      } else {
        set({ isLoading: false })
        return { success: false, error: result.error }
      }
    } catch (error) {
      set({ isLoading: false })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete task'
      }
    }
  },

  getTasksByStatus: (status) => {
    const { tasks } = get()
    return tasks.filter(task => task.status === status)
  },

  getTasksByPriority: (priority) => {
    const { tasks } = get()
    return tasks.filter(task => task.priority === priority)
  },
}))