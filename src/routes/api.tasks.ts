import { createFileRoute } from '@tanstack/react-router'
import { verifyJWT, getUserById } from '../utils/auth'
import { createEnvironmentAdapter } from '../utils/environment'

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

async function authenticateRequest(request: Request, env: any) {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) {
    return null
  }

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)

  const token = cookies['auth-token']
  if (!token) {
    return null
  }

  const payload = await verifyJWT(token, env.jwtSecret)
  if (!payload) {
    return null
  }

  return await getUserById(env.db, payload.userId)
}

export const Route = createFileRoute('/api/tasks')({
  server: {
    handlers: {
      // Get all tasks for the user
      GET: async ({ request, context }) => {
        try {
          const env = createEnvironmentAdapter(context)
          const user = await authenticateRequest(request, env)

          if (!user) {
            return new Response(
              JSON.stringify({ error: 'Unauthorized' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const tasks = await env.db.prepare(`
            SELECT * FROM tasks
            WHERE user_id = ?
            ORDER BY order_index ASC, created_at DESC
          `).bind(user.id).all()

          return new Response(
            JSON.stringify({ tasks: tasks.results }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          console.error('Get tasks error:', error)
          return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }
      },

      // Create a new task
      POST: async ({ request, context }) => {
        try {
          const env = createEnvironmentAdapter(context)
          const user = await authenticateRequest(request, env)

          if (!user) {
            return new Response(
              JSON.stringify({ error: 'Unauthorized' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const { title, description, priority = 'medium', due_date } = await request.json()

          if (!title) {
            return new Response(
              JSON.stringify({ error: 'Title is required' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const id = crypto.randomUUID()
          const now = new Date().toISOString()

          await env.db.prepare(`
            INSERT INTO tasks (id, user_id, title, description, priority, due_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(id, user.id, title, description || null, priority, due_date || null, now, now).run()

          const task = await env.db.prepare(`
            SELECT * FROM tasks WHERE id = ?
          `).bind(id).first<Task>()

          return new Response(
            JSON.stringify({ task }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          console.error('Create task error:', error)
          return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }
      },

      // Update a task
      PUT: async ({ request, context }) => {
        try {
          const env = createEnvironmentAdapter(context)
          const user = await authenticateRequest(request, env)

          if (!user) {
            return new Response(
              JSON.stringify({ error: 'Unauthorized' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const url = new URL(request.url)
          const taskId = url.searchParams.get('id')

          if (!taskId) {
            return new Response(
              JSON.stringify({ error: 'Task ID is required' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const { title, description, status, priority, due_date, order_index } = await request.json()

          // Verify task ownership
          const existingTask = await env.db.prepare(`
            SELECT * FROM tasks WHERE id = ? AND user_id = ?
          `).bind(taskId, user.id).first()

          if (!existingTask) {
            return new Response(
              JSON.stringify({ error: 'Task not found' }),
              { status: 404, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const now = new Date().toISOString()
          const updates = []
          const values = []

          if (title !== undefined) {
            updates.push('title = ?')
            values.push(title)
          }
          if (description !== undefined) {
            updates.push('description = ?')
            values.push(description)
          }
          if (status !== undefined) {
            updates.push('status = ?')
            values.push(status)
          }
          if (priority !== undefined) {
            updates.push('priority = ?')
            values.push(priority)
          }
          if (due_date !== undefined) {
            updates.push('due_date = ?')
            values.push(due_date)
          }
          if (order_index !== undefined) {
            updates.push('order_index = ?')
            values.push(order_index)
          }

          updates.push('updated_at = ?')
          values.push(now, taskId, user.id)

          await env.db.prepare(`
            UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?
          `).bind(...values).run()

          const updatedTask = await env.db.prepare(`
            SELECT * FROM tasks WHERE id = ?
          `).bind(taskId).first<Task>()

          return new Response(
            JSON.stringify({ task: updatedTask }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          console.error('Update task error:', error)
          return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }
      },

      // Delete a task
      DELETE: async ({ request, context }) => {
        try {
          const env = createEnvironmentAdapter(context)
          const user = await authenticateRequest(request, env)

          if (!user) {
            return new Response(
              JSON.stringify({ error: 'Unauthorized' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const url = new URL(request.url)
          const taskId = url.searchParams.get('id')

          if (!taskId) {
            return new Response(
              JSON.stringify({ error: 'Task ID is required' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
          }

          // Verify task ownership
          const existingTask = await env.db.prepare(`
            SELECT * FROM tasks WHERE id = ? AND user_id = ?
          `).bind(taskId, user.id).first()

          if (!existingTask) {
            return new Response(
              JSON.stringify({ error: 'Task not found' }),
              { status: 404, headers: { 'Content-Type': 'application/json' } }
            )
          }

          await env.db.prepare(`
            DELETE FROM tasks WHERE id = ? AND user_id = ?
          `).bind(taskId, user.id).run()

          return new Response(
            JSON.stringify({ message: 'Task deleted successfully' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          console.error('Delete task error:', error)
          return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }
      },
    },
  },
})