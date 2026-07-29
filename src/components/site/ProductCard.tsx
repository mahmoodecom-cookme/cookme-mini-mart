import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { money } from "@/lib/format";

export type Variant = {
  id: string;
  label: string;
  price: number | string;
  compare_at_price: number | string | null;
  stock: number;
  sort_order?: number;
};

export type ProductLite = {
  id: string;
  name: string;
  slug: string;
  images: unknown;
  description?: string | null;
  product_variants?: Variant[] | null;
};

export function productImages(p: { images: unknown }): string[] {
  const arr = Array.isArray(p.images) ? (p.images as unknown[]) : [];
  return arr.filter((x): x is string => typeof x === "string" && x.length > 0);
}

export function sortedVariants(p: ProductLite): Variant[] {
  return [...(p.product_variants ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export function ProductCard({ product }: { product: ProductLite }) {
  const variants = sortedVariants(product);
  const cheapest = variants.reduce<Variant | null>(
    (min, v) => (min === null || Number(v.price) < Number(min.price) ? v : min),
    null,
  );
  const img = productImages(product)[0];
  const compare = cheapest?.compare_at_price ? Number(cheapest.compare_at_price) : 0;
  const price = Number(cheapest?.price ?? 0);
  const off = compare > price && price > 0 ? Math.round(((compare - price) / compare) * 100) : 0;
  const lowStock = cheapest ? cheapest.stock > 0 && cheapest.stock <= 5 : false;
  const outOfStock = variants.length > 0 && variants.every((v) => v.stock <= 0);

  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-pop"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-xs font-medium text-muted-foreground">
            No image
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {off > 0 && (
            <span className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-extrabold text-primary-foreground">
              {off}% OFF
            </span>
          )}
          {lowStock && (
            <span className="rounded-md bg-warning px-2 py-0.5 text-[11px] font-bold text-warning-foreground">
              Limited stock
            </span>
          )}
          {outOfStock && (
            <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-bold text-secondary-foreground">
              Out of stock
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{product.name}</h3>
        {variants.length > 1 && (
          <p className="text-[11px] font-medium text-muted-foreground">{variants.length} sizes available</p>
        )}
        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold text-foreground">{money(price)}</p>
            {off > 0 && (
              <p className="truncate text-xs font-medium text-muted-foreground line-through">{money(compare)}</p>
            )}
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <Plus className="h-5 w-5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
