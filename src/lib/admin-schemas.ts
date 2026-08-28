import { z } from "zod";

export const productSchema = z.object({
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
  variants: z
    .array(
      z.object({
        id: z.string().uuid().nullable().optional(),
        label: z.string().trim().min(1).max(80),
        price: z.number().nonnegative(),
        compare_at_price: z.number().nonnegative().nullable().optional(),
        stock: z.number().int().min(0).max(100000),
        sku: z.string().trim().max(60).nullable().optional(),
        sort_order: z.number().int().min(0).max(999).default(0),
      }),
    )
    .min(1)
    .max(20),
});

export const bulkRowSchema = z.object({
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