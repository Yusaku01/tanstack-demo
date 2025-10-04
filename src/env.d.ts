export {};

// Cloudflare Workers types
interface D1Database {
  prepare(statement: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(): Promise<T | null>;
  all<T = any>(): Promise<{ results: T[] }>;
  run(): Promise<void>;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

declare global {
  interface Env {
    // D1 database binding
    DB: D1Database;

    // KV namespace binding
    KV: KVNamespace;

    // JWT secret for authentication
    JWT_SECRET: string;

    // Environment setting
    ENVIRONMENT?: string;
  }
}
