// Environment adapter for cross-platform compatibility
export interface EnvironmentAdapter {
  db: D1Database
  kv: KVNamespace
  jwtSecret: string
  environment: string
}

interface MemoryUser {
  id: string
  email: string
  password_hash: string
  display_name: string
  created_at: string
  updated_at: string
  is_active: boolean
}

interface MemoryTask {
  id: string
  user_id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  created_at: string
  updated_at: string
  order_index: number
}

// Memory-based implementation for development
class MemoryStatement {
  private statement: string
  private bindings: any[] = []

  constructor(
    statement: string,
    private users: Map<string, MemoryUser>,
    private tasks: Map<string, MemoryTask>,
    private sessions: Map<string, string>
  ) {
    this.statement = statement.toLowerCase().trim()
  }

  bind(...values: any[]): MemoryStatement {
    this.bindings = values
    return this
  }

  async first<T = any>(): Promise<T | null> {
    const result = await this.execute()
    return result[0] || null
  }

  async all<T = any>(): Promise<{ results: T[] }> {
    const results = await this.execute()
    return { results }
  }

  async run(): Promise<void> {
    await this.execute()
  }

  private async execute(): Promise<any[]> {
    // Simple SQL parsing for development
    if (this.statement.includes('insert into users')) {
      const [id, email, passwordHash, displayName] = this.bindings
      const now = new Date().toISOString()
      const user: MemoryUser = {
        id,
        email,
        password_hash: passwordHash,
        display_name: displayName,
        created_at: now,
        updated_at: now,
        is_active: true
      }
      this.users.set(id, user)
      return [user]
    }

    if (this.statement.includes('select') && this.statement.includes('users')) {
      if (this.statement.includes('where email = ?')) {
        const [email] = this.bindings
        const user = Array.from(this.users.values()).find(u => u.email === email)
        return user ? [user] : []
      }
      if (this.statement.includes('where id = ?')) {
        const [id] = this.bindings
        const user = this.users.get(id)
        return user ? [user] : []
      }
    }

    if (this.statement.includes('insert into tasks')) {
      const [id, userId, title, description, priority, dueDate, createdAt, updatedAt] = this.bindings
      const task: MemoryTask = {
        id,
        user_id: userId,
        title,
        description,
        status: 'pending',
        priority: priority || 'medium',
        due_date: dueDate,
        created_at: createdAt,
        updated_at: updatedAt,
        order_index: 0
      }
      this.tasks.set(id, task)
      return [task]
    }

    if (this.statement.includes('select') && this.statement.includes('tasks')) {
      if (this.statement.includes('where user_id = ?')) {
        const [userId] = this.bindings
        const userTasks = Array.from(this.tasks.values()).filter(t => t.user_id === userId)
        return userTasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }
      if (this.statement.includes('where id = ?')) {
        const [id] = this.bindings
        const task = this.tasks.get(id)
        return task ? [task] : []
      }
    }

    if (this.statement.includes('update tasks')) {
      const taskId = this.bindings[this.bindings.length - 2]
      const task = this.tasks.get(taskId)
      if (task) {
        // Parse UPDATE statement and apply changes
        // SQL format: UPDATE tasks SET field1 = ?, field2 = ?, ... WHERE id = ? AND user_id = ?
        const setClause = this.statement.match(/set\s+(.+?)\s+where/i)?.[1]
        if (setClause) {
          const fields = setClause.split(',').map(f => f.trim().split('=')[0].trim())

          // Apply updates based on field order
          fields.forEach((field, index) => {
            const value = this.bindings[index]
            switch (field) {
              case 'title':
                task.title = value
                break
              case 'description':
                task.description = value
                break
              case 'status':
                task.status = value
                break
              case 'priority':
                task.priority = value
                break
              case 'due_date':
                task.due_date = value
                break
              case 'order_index':
                task.order_index = value
                break
              case 'updated_at':
                task.updated_at = value
                break
            }
          })
        }

        this.tasks.set(taskId, task)
        return [task]
      }
    }

    if (this.statement.includes('delete from tasks')) {
      const [taskId] = this.bindings.slice(-2, -1)
      this.tasks.delete(taskId)
      return []
    }

    return []
  }
}

class MemoryDatabase implements D1Database {
  private users = new Map<string, MemoryUser>()
  private tasks = new Map<string, MemoryTask>()
  private sessions = new Map<string, string>()

  constructor() {
    // Seed development data
    this.seedData()
  }

  prepare(statement: string) {
    return new MemoryStatement(statement, this.users, this.tasks, this.sessions)
  }

  private seedData() {
    // Create demo user
    const demoUser: MemoryUser = {
      id: 'demo-user-1',
      email: 'demo@example.com',
      // This is a hashed version of "password123"
      password_hash: 'b3a8e0e1f9ab1bfe3a36f231f676f78bb30a519d2b21e6c530c0eee8ebb4a5d0',
      display_name: 'Demo User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true
    }
    this.users.set(demoUser.id, demoUser)

    // Create demo tasks
    const demoTask: MemoryTask = {
      id: 'demo-task-1',
      user_id: 'demo-user-1',
      title: 'Welcome to TodoApp',
      description: 'This is your first task! Edit or delete it to get started.',
      status: 'pending',
      priority: 'medium',
      due_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      order_index: 0
    }
    this.tasks.set(demoTask.id, demoTask)
  }
}

class MemoryKV implements KVNamespace {
  private store = new Map<string, { value: string; expires?: number }>()

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key)
    if (!item) return null

    if (item.expires && Date.now() > item.expires) {
      this.store.delete(key)
      return null
    }

    return item.value
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    const item: { value: string; expires?: number } = { value }

    if (options?.expirationTtl) {
      item.expires = Date.now() + (options.expirationTtl * 1000)
    }

    this.store.set(key, item)
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }
}

// Singleton instances for development
let developmentDB: MemoryDatabase | null = null
let developmentKV: MemoryKV | null = null

// Development environment adapter
function createDevelopmentAdapter(): EnvironmentAdapter {
  // Use singleton instances to persist data across requests
  if (!developmentDB) {
    developmentDB = new MemoryDatabase()
  }
  if (!developmentKV) {
    developmentKV = new MemoryKV()
  }

  return {
    db: developmentDB,
    kv: developmentKV,
    jwtSecret: process.env.JWT_SECRET || 'development-jwt-secret-change-in-production',
    environment: 'development'
  }
}

// Main environment adapter function
export function createEnvironmentAdapter(context: any): EnvironmentAdapter {
  // Cloudflare Workers environment
  if (context?.cloudflare?.env) {
    return {
      db: context.cloudflare.env.DB,
      kv: context.cloudflare.env.KV,
      jwtSecret: context.cloudflare.env.JWT_SECRET,
      environment: context.cloudflare.env.ENVIRONMENT || 'production'
    }
  }

  // Development environment
  return createDevelopmentAdapter()
}

// API handler wrapper for consistent environment handling
export function createApiHandler(
  handler: (env: EnvironmentAdapter, request: Request) => Promise<Response>
) {
  return async ({ request, context }: any) => {
    try {
      const env = createEnvironmentAdapter(context)
      return await handler(env, request)
    } catch (error) {
      // Use the proper error handler from auth utils
      const { handleApiError } = await import('./auth')
      return handleApiError(error, request)
    }
  }
}