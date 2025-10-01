// Custom environment types
// Add any additional environment variables or bindings here
// that are not covered by Wrangler's generated types

declare module "@tanstack/react-start" {
  interface Register {
    Env: Env;
  }
}

// Example custom bindings (uncomment as needed):
// declare global {
//   interface CloudflareEnv {
//     MY_CUSTOM_VAR: string;
//     MY_KV_NAMESPACE: KVNamespace;
//     MY_R2_BUCKET: R2Bucket;
//   }
// }