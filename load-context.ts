/// <reference types="@cloudflare/workers-types" />

import { createContext } from "react-router";

export type Env = {
  DB: D1Database;
  BUCKET: R2Bucket;
  APP_URL: string;
  ADMIN_KEY: string;
};

type CloudflareContext = ReturnType<typeof createContext<{ env: Env; ctx: ExecutionContext }>>;

declare global {
  // eslint-disable-next-line no-var
  var __cloudflare_context: CloudflareContext | undefined;
}

// Stored on globalThis so Vite HMR re-evaluation returns the same key object.
globalThis.__cloudflare_context ??= createContext<{ env: Env; ctx: ExecutionContext }>();
export const cloudflareContext = globalThis.__cloudflare_context;
