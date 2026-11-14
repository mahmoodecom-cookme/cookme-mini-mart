import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { CURRENCY } from "@/lib/format";

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

const amount = (value: number) => value.toLocaleString("en-PK", { maximumFractionDigits: 0 });

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
      className="pcard"
      data-out-of-stock={outOfStock ? "true" : undefined}
      aria-label={`${product.name}, ${CURRENCY} ${amount(price)}`}
    >
      <article className="pcard-in">
        <span className="pcard-media">
          {img ? (
            <img className="pcard-img" src={img} alt={product.name} loading="lazy" />
          ) : (
            <span className="pcard-noimg">No image</span>
          )}
          {(off > 0 || lowStock || outOfStock) && (
            <span className="pcard-badges">
              {off > 0 && <span className="pcard-badge">{off}% OFF</span>}
              {lowStock && <span className="pcard-badge" data-kind="stock">Limited stock</span>}
              {outOfStock && <span className="pcard-badge" data-kind="out">Out of stock</span>}
            </span>
          )}
        </span>
        <div className="pcard-info">
          <h3 className="pcard-title">{product.name}</h3>
          {variants.length > 1 && <span className="pcard-pill">{variants.length} sizes available</span>}
          <div className="pcard-foot">
            {off > 0 && <span className="pcard-old">{CURRENCY} {amount(compare)}</span>}
            <p className="pcard-price">
              <span className="pcard-cur">{CURRENCY}</span>
              <span className="pcard-amt">{amount(price)}</span>
            </p>
          </div>
        </div>
        <span className="pcard-cart" aria-hidden="true">
          <ShoppingCart />
        </span>
      </article>
    </Link>
  );
}
