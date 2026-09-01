import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { attachSupabaseAuthSafe } from "@/lib/supabase-auth-middleware";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    console.error(error);
    // Server functions rely on TanStack's RPC error serialization. Returning an
    // HTML error page here makes ordinary validation/auth errors unreadable by
    // the client and incorrectly trips the root page error boundary.
    throw error;
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuthSafe],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
