import { createMiddleware } from "@tanstack/react-start";

/**
 * Client-side middleware that attaches the Supabase bearer token to serverFn
 * RPCs. Unlike the generated `attachSupabaseAuth`, this version never throws:
 * if the Supabase browser client cannot be constructed (e.g. a build shipped
 * without the public env vars) or the session lookup fails, the request still
 * goes out anonymously instead of breaking every page navigation.
 */
export const attachSupabaseAuthSafe = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    let token: string | undefined;
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    } catch (error) {
      console.warn("[auth] Could not read Supabase session; continuing anonymously.", error);
    }
    return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
  },
);
