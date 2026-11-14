import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const PUBLIC_SETTING_KEYS = [
  "hero_image",
  "hero_mobile_image",
  "announcement_enabled",
  "announcement_text",
  "menu_links",
  "delivery_fee",
  "free_delivery_threshold",
  "theme_primary",
  "theme_background",
  "theme_secondary",
  "footer_about",
  "footer_delivery_note",
  "footer_returns_note",
  "footer_payment_note",
  "footer_copyright",
  "social_facebook",
  "social_instagram",
  "social_youtube",
  "contact_address",
  "business_address",
  "contact_phone",
  "business_phone",
] as const;

function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const url = process.env.SUPABASE_URL!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getStorefront = createServerFn({ method: "GET" }).handler(async () => {
  const db = publicClient();
  const [banners, categories, products, settings, campaigns, features, promoCards] = await Promise.all([
    db.from("banners").select("*").eq("is_active", true).order("sort_order"),
    db.from("categories").select("*").eq("is_active", true).order("sort_order"),
    db
      .from("products")
      .select("*, product_variants(*), categories(name,slug)")
      .eq("is_active", true)
      .order("sort_order")
      .limit(60),
    db.from("store_settings").select("key, value").in("key", [...PUBLIC_SETTING_KEYS]),
    db.from("campaigns").select("*").eq("is_active", true).order("sort_order"),
    db.from("feature_cards").select("*").eq("is_active", true).order("sort_order").order("id"),
    db.from("promo_cards").select("id, image_url, link_url, sort_order, is_active, created_at").eq("is_active", true).order("sort_order").order("id"),
  ]);
  if (features.error || settings.error || promoCards.error) throw new Error("Could not load homepage content. Please try again.");
  return {
    banners: banners.data ?? [],
    categories: categories.data ?? [],
    products: products.data ?? [],
    settings: settings.data ?? [],
    campaigns: campaigns.data ?? [],
    features: features.data ?? [],
    promoCards: promoCards.data ?? [],
  };
});

export const getCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const db = publicClient();
  const [categories, products] = await Promise.all([
    db.from("categories").select("*").eq("is_active", true).order("sort_order"),
    db
      .from("products")
      .select("*, product_variants(*), categories(name,slug)")
      .eq("is_active", true)
      .order("name"),
  ]);
  return { categories: categories.data ?? [], products: products.data ?? [] };
});

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const db = publicClient();
    const { data: product } = await db
      .from("products")
      .select("*, product_variants(*), categories(name,slug)")
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!product) return { product: null, related: [] };
    const { data: related } = await db
      .from("products")
      .select("*, product_variants(*)")
      .eq("is_active", true)
      .eq("category_id", product.category_id ?? "")
      .neq("id", product.id)
      .limit(8);
    return { product, related: related ?? [] };
  });

export const getCategory = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const db = publicClient();
    const { data: category } = await db
      .from("categories")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!category) return { category: null, products: [] };
    const { data: products } = await db
      .from("products")
      .select("*, product_variants(*)")
      .eq("is_active", true)
      .eq("category_id", category.id)
      .order("name");
    return { category, products: products ?? [] };
  });

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const db = publicClient();
  const { data } = await db.from("store_settings").select("key, value").in("key", [...PUBLIC_SETTING_KEYS]);
  return data ?? [];
});

