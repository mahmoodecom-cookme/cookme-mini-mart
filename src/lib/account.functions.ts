import { createServerFn, createMiddleware } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) throw new Error("Unauthorized: admin only");
    return next({ context });
  });

export const getAccount = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    return { email: data.user?.email ?? "", lastSignIn: data.user?.last_sign_in_at ?? null };
  });

export const updateCredentials = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(160).optional(),
        password: z.string().min(8).max(72).optional(),
      })
      .refine((v) => v.email || v.password, "Nothing to update")
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload: { email?: string; password?: string } = {};
    if (data.email) payload.email = data.email;
    if (data.password) payload.password = data.password;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, payload);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
