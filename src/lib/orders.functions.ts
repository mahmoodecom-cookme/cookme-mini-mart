import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        customerName: z.string().trim().min(2).max(100),
        phone: z.string().trim().min(7).max(20),
        address: z.string().trim().min(8).max(500),
        city: z.string().trim().max(120).optional().default(""),
        postalCode: z.string().trim().max(20).optional().default(""),
        latitude: z.number().min(-90).max(90).nullable().optional().default(null),
        longitude: z.number().min(-180).max(180).nullable().optional().default(null),
        notes: z.string().trim().max(1000).optional().default(""),
        couponCode: z.string().trim().max(40).optional().default(""),
        items: z
          .array(
            z.object({
              productId: z.string().uuid().nullable(),
              name: z.string().trim().min(1).max(200),
              variantLabel: z.string().trim().max(100).nullable(),
              price: z.number().nonnegative(),
              quantity: z.number().int().min(1).max(999),
              image: z.string().max(1000).nullable(),
            }),
          )
          .min(1)
          .max(100),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: settingsRows, error: settingsError } = await supabaseAdmin.from("store_settings").select("key, value");
    if (settingsError) throw new Error("Could not load delivery settings. Please try again.");
    const settings: Record<string, string> = {};
    (settingsRows ?? []).forEach((r) => (settings[r.key] = r.value ?? ""));
    const fee = Number(settings.delivery_fee ?? 150) || 0;
    const threshold = Number(settings.free_delivery_threshold ?? 3000) || 0;
    const taxPercent = Number(settings.tax_percent ?? 0) || 0;

    const subtotal = data.items.reduce((s, i) => s + i.price * i.quantity, 0);

    let discount = 0;
    let appliedCode: string | null = null;
    if (data.couponCode) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", data.couponCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();
      const notExpired = !coupon?.expires_at || new Date(coupon.expires_at) > new Date();
      if (coupon && notExpired && subtotal >= Number(coupon.min_order)) {
        discount =
          coupon.discount_type === "percent"
            ? Math.round((subtotal * Number(coupon.discount_value)) / 100)
            : Number(coupon.discount_value);
        discount = Math.min(discount, subtotal);
        appliedCode = coupon.code;
      }
    }

    const delivery = subtotal - discount >= threshold ? 0 : fee;
    const tax = Math.round(((subtotal - discount) * taxPercent) / 100);
    const total = subtotal - discount + delivery + tax;

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.customerName,
        phone: data.phone,
        address: data.address,
        city: data.city || null,
        postal_code: data.postalCode || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        notes: data.notes || null,
        coupon_code: appliedCode,
        subtotal,
        discount,
        delivery_fee: delivery,
        tax,
        total,
        payment_method: "cod",
        status: "pending",
      })
      .select("id, order_number, total")
      .single();
    if (error || !order) throw new Error("Could not place the order. Please try again.");

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
      data.items.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        product_name: i.name,
        variant_label: i.variantLabel,
        unit_price: i.price,
        quantity: i.quantity,
        image_url: i.image,
      })),
    );
    if (itemsError) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error("Could not save order items. Please try again.");
    }

    return { orderNumber: order.order_number, total: Number(order.total) };
  });

export const submitQuickOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        customerName: z.string().trim().min(2).max(100),
        phone: z.string().trim().min(7).max(20),
        address: z.string().trim().min(8).max(500),
        message: z.string().trim().max(2000).optional().default(""),
        imageUrl: z.string().trim().max(1000).optional().default(""),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    if (!data.message && !data.imageUrl) throw new Error("Add a list or upload a photo.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("order_messages").insert({
      customer_name: data.customerName,
      phone: data.phone,
      address: data.address,
      message: data.message || null,
      image_url: data.imageUrl || null,
      status: "new",
    });
    if (error) throw new Error("Could not send your list. Please try again.");
    return { ok: true as const };
  });

export const submitSupport = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(100),
        contact: z.string().trim().min(5).max(150),
        message: z.string().trim().min(5).max(2000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("support_messages").insert({
      name: data.name,
      contact: data.contact,
      message: data.message,
      status: "new",
    });
    if (error) throw new Error("Could not send your message. Please try again.");
    return { ok: true as const };
  });
