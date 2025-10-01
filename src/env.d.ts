export {};

declare global {
  interface Env {
    // Example KV namespace binding
    // MY_KV_NAMESPACE: KVNamespace;

    // Example Durable Object binding
    // MY_DURABLE_OBJECT: DurableObjectNamespace;

    // Example R2 bucket binding
    // MY_BUCKET: R2Bucket;

    // Example D1 database binding
    // MY_DATABASE: D1Database;

    // Example Queue binding
    // MY_QUEUE: Queue;

    // Example Service binding
    // MY_SERVICE: Fetcher;

    // Example environment variables
    // MY_VARIABLE: string;
  }
}
