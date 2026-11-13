import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-middleware";

export const getAdminPromoCards = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data, error } = await db.from("promo_cards").select("*").order("sort_order").order("created_at");
    if (error) throw new Error("Could not load promo cards.");
    return data ?? [];
  });

export const savePromoCard = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({
    id: z.string().uuid().optional(),
    image_url: z.string().trim().min(1).max(1000),
    link_url: z.string().trim().max(500).nullable().optional().refine((value) => !value || (/^\/(?!\/|\\)/.test(value) && !/[\u0000-\u001f]/.test(value)) || /^https?:\/\//i.test(value), "Use a site path or HTTP(S) link."),
    sort_order: z.number().int().min(0).max(999),
    is_active: z.boolean(),
  }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const row = { ...rest, link_url: rest.link_url?.trim() || null };
    const { error } = id
      ? await db.from("promo_cards").update(row).eq("id", id)
      : await db.from("promo_cards").insert(row);
    if (error) throw new Error("Could not save the promo card.");
    return { ok: true as const };
  });

export const deletePromoCard = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { error } = await db.from("promo_cards").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete the promo card.");
    return { ok: true as const };
  });

export const reorderPromoCards = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ ids: z.array(z.string().uuid()).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    for (const [index, id] of data.ids.entries()) {
      const { error } = await db.from("promo_cards").update({ sort_order: 10000 + index }).eq("id", id);
      if (error) throw new Error("Could not reorder promo cards.");
    }
    for (const [sort_order, id] of data.ids.entries()) {
      const { error } = await db.from("promo_cards").update({ sort_order }).eq("id", id);
      if (error) throw new Error("Could not reorder promo cards.");
    }
    return { ok: true as const };
  });