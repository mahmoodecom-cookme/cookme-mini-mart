import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, ShieldCheck, Truck, RotateCcw, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getProduct } from "@/lib/catalog.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, productImages, sortedVariants } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/format";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }) => {
    const res = await getProduct({ data: { slug: params.slug } });
    if (!res.product) throw notFound();
    return res;
  },
  head: ({ loaderData }) => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const p: any = (loaderData as any)?.product;
    if (!p) return { meta: [{ title: "Product not found — Cook Me Mini Mart" }, { name: "robots", content: "noindex" }] };
    const desc =
      (p.description as string | null)?.slice(0, 155) ||
      `Buy ${p.name} online from Cook Me Mini Mart. Cash on delivery across Karachi.`;
    const img = Array.isArray(p.images) && typeof p.images[0] === "string" ? p.images[0] : null;
    return {
      meta: [
        { title: `${p.name} — Buy Online in Karachi | Cook Me Mini Mart` },
        { name: "description", content: desc },
        { property: "og:title", content: `${p.name} — Cook Me Mini Mart` },
        { property: "og:description", content: desc },
        ...(img && img.startsWith("https://")
          ? [
              { property: "og:image", content: img },
              { name: "twitter:image", content: img },
            ]
          : []),
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-extrabold">Product not found</h1>
        <Link to="/products" className="mt-4 inline-block font-bold text-primary">
          Browse all products
        </Link>
      </div>
    </SiteLayout>
  ),
});

function ProductPage() {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const { product, related } = Route.useLoaderData() as { product: any; related: any[] };
  const variants = sortedVariants(product);
  const images = productImages(product);
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const { add } = useCart();

  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const price = Number(variant?.price ?? 0);
  const compare = Number(variant?.compare_at_price ?? 0);
  const off = compare > price && price > 0 ? Math.round(((compare - price) / compare) * 100) : 0;
  const outOfStock = !variant || variant.stock <= 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: images,
    brand: { "@type": "Brand", name: product.brand || "Cook Me Mini Mart" },
    offers: variants.map((v) => ({
      "@type": "Offer",
      name: v.label,
      price: Number(v.price),
      priceCurrency: "PKR",
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    })),
  };

  function addToCart() {
    if (!variant) return;
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantId: variant.id,
        variantLabel: variant.label,
        price: Number(variant.price),
        image: images[0] ?? null,
      },
      qty,
    );
    toast.success(`${product.name} (${variant.label}) added to cart`);
  }

  return (
    <SiteLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container-page py-4">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/products">Products</Link>
          {product.categories?.slug && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link to="/category/$slug" params={{ slug: product.categories.slug }}>
                {product.categories.name}
              </Link>
            </>
          )}
        </nav>

        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
              {images[img] ? (
                <img src={images[img]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">No image yet</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                {images.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setImg(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${i === img ? "border-primary" : "border-border"}`}
                  >
                    <img src={src} alt={`${product.name} view ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-xl font-extrabold sm:text-3xl">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-2xl font-extrabold text-primary sm:text-3xl">{money(price)}</span>
              {off > 0 && (
                <>
                  <span className="text-base text-muted-foreground line-through">{money(compare)}</span>
                  <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-extrabold text-primary-foreground">
                    {off}% OFF
                  </span>
                </>
              )}
            </div>
            {variant && variant.stock > 0 && variant.stock <= 5 && (
              <p className="mt-2 text-sm font-bold text-primary">Only {variant.stock} left — order soon!</p>
            )}

            {variants.length > 0 && (
              <div className="mt-5">
                <p className="text-sm font-bold">Choose size / pack</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVariantId(v.id)}
                      disabled={v.stock <= 0}
                      className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-bold transition-colors disabled:opacity-40 ${
                        v.id === variant?.id
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-border bg-card text-foreground"
                      }`}
                    >
                      {v.label} · {money(v.price)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-border">
                <button
                  aria-label="Decrease quantity"
                  className="grid h-12 w-12 place-items-center"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-base font-bold">{qty}</span>
                <button
                  aria-label="Increase quantity"
                  className="grid h-12 w-12 place-items-center"
                  onClick={() => setQty((q) => q + 1)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button onClick={addToCart} disabled={outOfStock} className="h-12 flex-1 text-base font-bold">
                {outOfStock ? "Out of stock" : "Add to cart"}
              </Button>
            </div>

            <div className="mt-5 grid gap-2 rounded-2xl border border-border bg-card p-4 text-sm">
              <p className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Delivery all over Karachi</p>
              <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Cash on delivery — pay at your door</p>
              <p className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-primary" /> Easy return if item is damaged</p>
            </div>

            {product.description && (
              <div className="mt-5">
                <h2 className="text-base font-extrabold">Description</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-extrabold sm:text-2xl">You may also like</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </SiteLayout>
  );
}
