import { createServerFn, createMiddleware } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ALL_CONTENT_KEYS } from "@/lib/site-content";

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

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const ACTION_KINDS = [
  "set_setting",
  "set_theme",
  "add_banner",
  "delete_banner",
  "upsert_product",
  "delete_product",
  "add_category",
  "delete_category",
  "set_order_status",
] as const;

const actionSchema = z.object({
  kind: z.enum(ACTION_KINDS),
  summary: z.string().max(300),
  data: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
});
export type AssistantAction = z.infer<typeof actionSchema>;

const messageSchema = z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(6000) });

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "actions"],
  properties: {
    reply: { type: "string" },
    actions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "summary", "data"],
        properties: {
          kind: { type: "string", enum: [...ACTION_KINDS] },
          summary: { type: "string" },
          data: {
            type: "object",
            additionalProperties: false,
            required: ["key", "value", "title", "subtitle", "image_url", "name", "slug", "category", "description", "price", "stock", "id", "order_number", "status", "primary", "background", "secondary"],
            properties: {
              key: { type: ["string", "null"] },
              value: { type: ["string", "null"] },
              title: { type: ["string", "null"] },
              subtitle: { type: ["string", "null"] },
              image_url: { type: ["string", "null"] },
              name: { type: ["string", "null"] },
              slug: { type: ["string", "null"] },
              category: { type: ["string", "null"] },
              description: { type: ["string", "null"] },
              price: { type: ["number", "null"] },
              stock: { type: ["number", "null"] },
              id: { type: ["string", "null"] },
              order_number: { type: ["string", "null"] },
              status: { type: ["string", "null"] },
              primary: { type: ["string", "null"] },
              background: { type: ["string", "null"] },
              secondary: { type: ["string", "null"] },
            },
          },
        },
      },
    },
  },
} as const;

/** Ask the assistant what to do. Nothing is written — it returns a proposal to confirm. */
export const assistantPropose = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ messages: z.array(messageSchema).min(1).max(30) }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured.");
    const db = await admin();

    const [settings, products, categories, banners, orders] = await Promise.all([
      db.from("store_settings").select("key, value"),
      db.from("products").select("id, name, slug, is_active, product_variants(label, price)").limit(120),
      db.from("categories").select("id, name, slug").limit(60),
      db.from("banners").select("id, title, image_url, is_active").limit(30),
      db.from("orders").select("order_number, customer_name, status, total").order("created_at", { ascending: false }).limit(25),
    ]);

    const system = `You are the store assistant for "Cook Me Mini Mart", a Karachi grocery store.
You help the owner change the live website and store data using plain language.
You NEVER apply changes yourself: you return a short reply plus a list of proposed actions the owner confirms.

Available action kinds and the data fields each one uses:
- set_setting { key, value } — edit any storefront text/image/setting. Valid keys: ${ALL_CONTENT_KEYS.join(", ")}.
- set_theme { primary?, background?, secondary? } — CSS colour values, e.g. "oklch(0.55 0.235 28.5)" or "#E31E24".
- add_banner { title, subtitle?, image_url? } — banners form the homepage image slider/carousel automatically.
- delete_banner { id }
- upsert_product { name, slug?, category?, description?, price, stock? }
- delete_product { slug } or { id }
- add_category { name }
- delete_category { slug }
- set_order_status { order_number, status } — status one of pending, confirmed, packing, out_for_delivery, delivered, cancelled.

Rules: only use fields listed above; set unused fields to null. Keep "summary" a single human sentence describing exactly what will change.
If the request needs a code-level change that these actions cannot do, say so plainly and suggest the closest supported change. Return no actions when the owner is only asking a question.

Current store data (JSON):
settings=${JSON.stringify(settings.data ?? [])}
products=${JSON.stringify(products.data ?? [])}
categories=${JSON.stringify(categories.data ?? [])}
banners=${JSON.stringify(banners.data ?? [])}
recent_orders=${JSON.stringify(orders.data ?? [])}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        stream: true,
        store: false,
        instructions: system,
        input: data.messages.map((m) => ({
          role: m.role,
          content: [{ type: m.role === "assistant" ? "output_text" : "input_text", text: m.content }],
        })),
        text: { format: { type: "json_schema", name: "store_change", strict: true, schema: RESPONSE_SCHEMA } },
      }),
    });

    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("The assistant is busy right now. Please try again in a moment.");
      if (res.status === 402) throw new Error("AI credits are exhausted. Please add credits to continue.");
      throw new Error(`Assistant error (${res.status}). ${body.slice(0, 200)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload) as { type?: string; delta?: string };
          if (ev.type === "response.output_text.delta" && typeof ev.delta === "string") text += ev.delta;
        } catch {
          /* ignore partial frames */
        }
      }
    }

    let parsed: { reply: string; actions: AssistantAction[] };
    try {
      const raw = JSON.parse(text) as unknown;
      parsed = z.object({ reply: z.string(), actions: z.array(actionSchema).max(20) }).parse(raw);
    } catch {
      return { reply: text.trim() || "I could not work that out. Could you rephrase it?", actions: [] as AssistantAction[] };
    }
    return parsed;
  });

/** Apply the actions the owner confirmed. */
export const assistantApply = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ actions: z.array(actionSchema).min(1).max(20) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const applied: string[] = [];
    const failed: string[] = [];
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    const nr = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    const slugify = (s: string) =>
      s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";

    for (const a of data.actions) {
      try {
        const d = a.data;
        if (a.kind === "set_setting") {
          const key = str(d.key);
          if (!key || !ALL_CONTENT_KEYS.includes(key)) throw new Error("unknown setting key");
          await db.from("store_settings").upsert({ key, value: str(d.value) ?? "", updated_at: new Date().toISOString() }, { onConflict: "key" });
        } else if (a.kind === "set_theme") {
          const pairs: Array<[string, string | null]> = [
            ["theme_primary", str(d.primary)],
            ["theme_background", str(d.background)],
            ["theme_secondary", str(d.secondary)],
          ];
          for (const [key, value] of pairs) {
            if (value) await db.from("store_settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
          }
        } else if (a.kind === "add_banner") {
          const title = str(d.title);
          if (!title) throw new Error("banner needs a title");
          await db.from("banners").insert({ title, subtitle: str(d.subtitle), image_url: str(d.image_url), is_active: true, sort_order: 99 });
        } else if (a.kind === "delete_banner") {
          const id = str(d.id);
          if (!id) throw new Error("banner id missing");
          await db.from("banners").delete().eq("id", id);
        } else if (a.kind === "upsert_product") {
          const name = str(d.name);
          const price = nr(d.price);
          if (!name || price === null) throw new Error("product needs a name and price");
          const slug = str(d.slug) ? slugify(str(d.slug)!) : slugify(name);
          let categoryId: string | null = null;
          const cat = str(d.category);
          if (cat) {
            const { data: c } = await db.from("categories").select("id").or(`slug.eq.${slugify(cat)},name.ilike.${cat}`).maybeSingle();
            categoryId = c?.id ?? null;
          }
          const payload = {
            name,
            slug,
            description: str(d.description),
            category_id: categoryId,
            is_active: true,
            updated_at: new Date().toISOString(),
          };
          const { data: existing } = await db.from("products").select("id").eq("slug", slug).maybeSingle();
          let productId = existing?.id ?? null;
          if (productId) await db.from("products").update(payload).eq("id", productId);
          else {
            const { data: ins, error } = await db.from("products").insert(payload).select("id").single();
            if (error || !ins) throw new Error(error?.message ?? "insert failed");
            productId = ins.id;
          }
          const { data: variant } = await db.from("product_variants").select("id").eq("product_id", productId).limit(1).maybeSingle();
          const vRow = { product_id: productId, label: "Standard", price, stock: nr(d.stock) ?? 20, sort_order: 0 };
          if (variant) await db.from("product_variants").update(vRow).eq("id", variant.id);
          else await db.from("product_variants").insert(vRow);
        } else if (a.kind === "delete_product") {
          const id = str(d.id);
          const slug = str(d.slug);
          const q = id ? db.from("products").select("id").eq("id", id) : db.from("products").select("id").eq("slug", slugify(slug ?? ""));
          const { data: p } = await q.maybeSingle();
          if (!p) throw new Error("product not found");
          await db.from("product_variants").delete().eq("product_id", p.id);
          await db.from("products").delete().eq("id", p.id);
        } else if (a.kind === "add_category") {
          const name = str(d.name);
          if (!name) throw new Error("category needs a name");
          await db.from("categories").insert({ name, slug: slugify(str(d.slug) ?? name), is_active: true, sort_order: 99 });
        } else if (a.kind === "delete_category") {
          const slug = str(d.slug);
          if (!slug) throw new Error("category slug missing");
          const { error } = await db.from("categories").delete().eq("slug", slugify(slug));
          if (error) throw new Error("move its products first");
        } else if (a.kind === "set_order_status") {
          const orderNumber = str(d.order_number);
          const status = str(d.status);
          const allowed = ["pending", "confirmed", "packing", "out_for_delivery", "delivered", "cancelled"];
          if (!orderNumber || !status || !allowed.includes(status)) throw new Error("invalid order update");
          const { error } = await db
            .from("orders")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("order_number", orderNumber);
          if (error) throw new Error(error.message);
        }
        applied.push(a.summary);
      } catch (e) {
        failed.push(`${a.summary} — ${(e as Error).message}`);
      }
    }
    return { applied, failed };
  });
