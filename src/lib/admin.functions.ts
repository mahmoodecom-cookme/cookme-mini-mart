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

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/* ---------------------------------- auth ---------------------------------- */

export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    const { count } = await db
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) return { granted: false as const };
    const { error } = await db.from("user_roles").insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error("Could not set up the owner account.");
    return { granted: true as const };
  });

export const whoAmI = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    const [{ data: role }, { count }] = await Promise.all([
      db.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle(),
      db.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin"),
    ]);
    return { isAdmin: !!role, adminExists: (count ?? 0) > 0 };
  });

/* -------------------------------- analytics ------------------------------- */

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const db = await admin();
    const since = new Date(Date.now() - 29 * 864e5).toISOString();
    const [orders, items, visits, msgs, support, products] = await Promise.all([
      db.from("orders").select("*").order("created_at", { ascending: false }).limit(500),
      db.from("order_items").select("product_name, quantity, unit_price").limit(2000),
      db.from("page_visits").select("path, created_at").gte("created_at", since).limit(5000),
      db.from("order_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
      db.from("support_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
      db.from("products").select("id", { count: "exact", head: true }),
    ]);
    return {
      orders: orders.data ?? [],
      items: items.data ?? [],
      visits: visits.data ?? [],
      newMessages: (msgs.count ?? 0) + (support.count ?? 0),
      productCount: products.count ?? 0,
    };
  });

/* --------------------------------- orders --------------------------------- */

export const getAdminOrders = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const db = await admin();
    const { data } = await db
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(300);
    return data ?? [];
  });

export const setOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["pending", "confirmed", "packing", "out_for_delivery", "delivered", "cancelled"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { error } = await db.from("orders").update({ status: data.status, updated_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error("Could not update the order.");
    return { ok: true as const };
  });

export const deleteOrder = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    await db.from("order_items").delete().eq("order_id", data.id);
    await db.from("orders").delete().eq("id", data.id);
    return { ok: true as const };
  });

/* -------------------------------- messages -------------------------------- */

export const getAdminMessages = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const db = await admin();
    const [quick, support] = await Promise.all([
      db.from("order_messages").select("*").order("created_at", { ascending: false }).limit(200),
      db.from("support_messages").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    return { quick: quick.data ?? [], support: support.data ?? [] };
  });

export const setMessageStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({ table: z.enum(["order_messages", "support_messages"]), id: z.string().uuid(), status: z.enum(["new", "in_progress", "done"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { error } = await db.from(data.table).update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error("Could not update the message.");
    return { ok: true as const };
  });

export const getUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ path: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: signed } = await db.storage.from("uploads").createSignedUrl(data.path, 60 * 30);
    return { url: signed?.signedUrl ?? null };
  });

/* --------------------------------- catalog -------------------------------- */

export const getAdminCatalog = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const db = await admin();
    const [categories, products] = await Promise.all([
      db.from("categories").select("*").order("sort_order"),
      db.from("products").select("*, product_variants(*)").order("sort_order").limit(500),
    ]);
    return { categories: categories.data ?? [], products: products.data ?? [] };
  });

const variantSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  label: z.string().trim().min(1).max(80),
  price: z.number().nonnegative(),
  compare_at_price: z.number().nonnegative().nullable().optional(),
  stock: z.number().int().min(0).max(100000),
  sku: z.string().trim().max(60).nullable().optional(),
  sort_order: z.number().int().min(0).max(999).default(0),
});

const productSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  brand: z.string().trim().max(80).nullable().optional(),
  images: z.array(z.string().max(1000)).max(8),
  is_featured: z.boolean(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
  variants: z.array(variantSchema).min(1).max(20),
});

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => productSchema.parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const payload = {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      category_id: data.category_id || null,
      brand: data.brand || null,
      images: data.images,
      is_featured: data.is_featured,
      is_active: data.is_active,
      sort_order: data.sort_order,
      updated_at: new Date().toISOString(),
    };
    let productId = data.id ?? null;
    if (productId) {
      const { error } = await db.from("products").update(payload).eq("id", productId);
      if (error) throw new Error(error.message);
    } else {
      const { data: created, error } = await db.from("products").insert(payload).select("id").single();
      if (error || !created) throw new Error(error?.message ?? "Could not create the product.");
      productId = created.id;
    }

    const keepIds = data.variants.map((v) => v.id).filter(Boolean) as string[];
    const { data: existing } = await db.from("product_variants").select("id").eq("product_id", productId);
    const toDelete = (existing ?? []).map((v) => v.id).filter((id) => !keepIds.includes(id));
    if (toDelete.length) await db.from("product_variants").delete().in("id", toDelete);

    for (const v of data.variants) {
      const row = {
        product_id: productId,
        label: v.label,
        price: v.price,
        compare_at_price: v.compare_at_price ?? null,
        stock: v.stock,
        sku: v.sku || null,
        sort_order: v.sort_order ?? 0,
      };
      if (v.id) await db.from("product_variants").update(row).eq("id", v.id);
      else await db.from("product_variants").insert(row);
    }
    return { id: productId };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    await db.from("product_variants").delete().eq("product_id", data.id);
    const { error } = await db.from("products").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete the product.");
    return { ok: true as const };
  });

export const saveCategory = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().nullable().optional(),
        name: z.string().trim().min(2).max(80),
        slug: z.string().trim().min(2).max(80),
        image_url: z.string().trim().max(1000).nullable().optional(),
        sort_order: z.number().int().min(0).max(999),
        is_active: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const row = {
      name: data.name,
      slug: data.slug,
      image_url: data.image_url || null,
      sort_order: data.sort_order,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await db.from("categories").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await db.from("categories").insert(row);
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { error } = await db.from("categories").delete().eq("id", data.id);
    if (error) throw new Error("Remove or move products in this category first.");
    return { ok: true as const };
  });

const bulkRow = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().max(160).optional().default(""),
  category: z.string().trim().max(80).optional().default(""),
  brand: z.string().trim().max(80).optional().default(""),
  description: z.string().trim().max(4000).optional().default(""),
  image: z.string().trim().max(1000).optional().default(""),
  variant: z.string().trim().max(80).optional().default("Standard"),
  price: z.number().nonnegative(),
  compare_at_price: z.number().nonnegative().optional().nullable(),
  stock: z.number().int().min(0).max(100000).optional().default(0),
});

export const bulkImportProducts = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ rows: z.array(bulkRow).min(1).max(500) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: cats } = await db.from("categories").select("id, name, slug");
    const catByName = new Map((cats ?? []).map((c) => [c.name.toLowerCase(), c.id]));
    const catBySlug = new Map((cats ?? []).map((c) => [c.slug.toLowerCase(), c.id]));

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    const grouped = new Map<string, typeof data.rows>();
    for (const r of data.rows) {
      const slug =
        (r.slug || r.name)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "item";
      const list = grouped.get(slug) ?? [];
      list.push({ ...r, slug });
      grouped.set(slug, list);
    }

    for (const [slug, rows] of grouped) {
      const first = rows[0];
      const key = (first.category || "").toLowerCase();
      const categoryId = catByName.get(key) ?? catBySlug.get(key) ?? null;
      const payload = {
        name: first.name,
        slug,
        description: first.description || null,
        category_id: categoryId,
        brand: first.brand || null,
        images: rows.map((r) => r.image).filter(Boolean),
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      const { data: existing } = await db.from("products").select("id").eq("slug", slug).maybeSingle();
      let productId = existing?.id ?? null;
      if (productId) {
        await db.from("products").update(payload).eq("id", productId);
        updated++;
      } else {
        const { data: ins, error } = await db.from("products").insert(payload).select("id").single();
        if (error || !ins) {
          errors.push(`${first.name}: ${error?.message ?? "insert failed"}`);
          continue;
        }
        productId = ins.id;
        created++;
      }
      let i = 0;
      for (const r of rows) {
        const label = r.variant || "Standard";
        const { data: v } = await db
          .from("product_variants")
          .select("id")
          .eq("product_id", productId)
          .eq("label", label)
          .maybeSingle();
        const vRow = {
          product_id: productId,
          label,
          price: r.price,
          compare_at_price: r.compare_at_price ?? null,
          stock: r.stock ?? 0,
          sort_order: i++,
        };
        if (v) await db.from("product_variants").update(vRow).eq("id", v.id);
        else await db.from("product_variants").insert(vRow);
      }
    }
    return { created, updated, errors };
  });

/* ------------------------------- promotions ------------------------------- */

export const getAdminPromotions = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const db = await admin();
    const [banners, campaigns, coupons] = await Promise.all([
      db.from("banners").select("*").order("sort_order"),
      db.from("campaigns").select("*").order("sort_order"),
      db.from("coupons").select("*").order("created_at", { ascending: false }),
    ]);
    return { banners: banners.data ?? [], campaigns: campaigns.data ?? [], coupons: coupons.data ?? [] };
  });

export const saveBanner = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().nullable().optional(),
        title: z.string().trim().min(2).max(120),
        subtitle: z.string().trim().max(200).nullable().optional(),
        badge: z.string().trim().max(40).nullable().optional(),
        image_url: z.string().trim().max(1000).nullable().optional(),
        link_url: z.string().trim().max(300).nullable().optional(),
        sort_order: z.number().int().min(0).max(999),
        is_active: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { id, ...row } = data;
    const clean = {
      ...row,
      subtitle: row.subtitle || null,
      badge: row.badge || null,
      image_url: row.image_url || null,
      link_url: row.link_url || null,
    };
    const { error } = id ? await db.from("banners").update(clean).eq("id", id) : await db.from("banners").insert(clean);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const saveCampaign = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().nullable().optional(),
        title: z.string().trim().min(2).max(120),
        description: z.string().trim().max(400).nullable().optional(),
        discount_percent: z.number().min(0).max(100),
        starts_at: z.string().nullable().optional(),
        ends_at: z.string().nullable().optional(),
        sort_order: z.number().int().min(0).max(999),
        is_active: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { id, ...row } = data;
    const clean = {
      ...row,
      description: row.description || null,
      starts_at: row.starts_at || null,
      ends_at: row.ends_at || null,
    };
    const { error } = id ? await db.from("campaigns").update(clean).eq("id", id) : await db.from("campaigns").insert(clean);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const saveCoupon = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().nullable().optional(),
        code: z.string().trim().min(2).max(40),
        discount_type: z.enum(["percent", "fixed"]),
        discount_value: z.number().min(0),
        min_order: z.number().min(0),
        expires_at: z.string().nullable().optional(),
        is_active: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { id, ...row } = data;
    const clean = { ...row, code: row.code.toUpperCase(), expires_at: row.expires_at || null };
    const { error } = id ? await db.from("coupons").update(clean).eq("id", id) : await db.from("coupons").insert(clean);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deletePromo = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({ table: z.enum(["banners", "campaigns", "coupons"]), id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { error } = await db.from(data.table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* --------------------------------- settings ------------------------------- */

export const getAdminSettings = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const db = await admin();
    const { data } = await db.from("store_settings").select("*").order("key");
    return data ?? [];
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z
      .object({
        rows: z
          .array(z.object({ key: z.string().trim().min(1).max(80), value: z.string().max(2000), label: z.string().max(120).optional() }))
          .max(60),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    for (const r of data.rows) {
      await db
        .from("store_settings")
        .upsert({ key: r.key, value: r.value, label: r.label ?? null, updated_at: new Date().toISOString() }, { onConflict: "key" });
    }
    return { ok: true as const };
  });

/* --------------------------------- uploads -------------------------------- */

export const uploadProductImage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({ fileName: z.string().trim().min(1).max(120), dataUrl: z.string().min(20).max(12_000_000) }).parse(d),
  )
  .handler(async ({ data }) => {
    const match = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/.exec(data.dataUrl);
    if (!match) throw new Error("Unsupported image format.");
    const contentType = match[1];
    const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const bytes = Uint8Array.from(atob(match[3]), (c) => c.charCodeAt(0));
    const safe = data.fileName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "image";
    const path = `products/${Date.now()}-${safe}.${ext}`;
    const db = await admin();
    const { error } = await db.storage.from("uploads").upload(path, bytes, { contentType, upsert: false });
    if (error) throw new Error("Upload failed. Please try again.");
    return { url: `/api/public/img/${path}` };
  });
