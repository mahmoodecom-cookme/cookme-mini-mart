import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Truck, ShieldCheck, RotateCcw, Clock, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { getStorefront } from "@/lib/catalog.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { settingsMap, money, num } from "@/lib/format";

export const Route = createFileRoute("/")({
  loader: () => getStorefront(),
  head: () => ({
    meta: [
      { title: "Cook Me Mini Mart — Online Grocery Delivery in Karachi" },
      {
        name: "description",
        content:
          "Shop groceries, snacks, spices and daily essentials at Cook Me Mini Mart. Cash on delivery across Karachi, fast dispatch and fresh stock.",
      },
      { property: "og:title", content: "Cook Me Mini Mart — Online Grocery Delivery in Karachi" },
      {
        property: "og:description",
        content: "Groceries and daily essentials delivered across Karachi. Cash on delivery only.",
      },
    ],
  }),
  component: Home,
});

function Banners({ banners }: { banners: Array<{ id: string; title: string; subtitle: string | null; image_url: string | null; link_url: string | null; badge: string | null }> }) {
  const [i, setI] = useState(0);
  const n = banners.length;

  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n]);

  if (n === 0) return null;
  const b = banners[i % n];

  const inner = (
    <div className="relative h-44 overflow-hidden rounded-2xl bg-secondary sm:h-64 md:h-80">
      {b.image_url ? (
        <img src={b.image_url} alt={b.title} className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 via-secondary/60 to-transparent" />
      <div className="relative flex h-full flex-col justify-center gap-2 p-5 sm:p-8">
        {b.badge && (
          <span className="w-fit rounded-full bg-primary px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-primary-foreground">
            {b.badge}
          </span>
        )}
        <h2 className="max-w-md text-2xl font-extrabold leading-tight text-secondary-foreground sm:text-4xl">
          {b.title}
        </h2>
        {b.subtitle && <p className="max-w-sm text-sm text-secondary-foreground/80 sm:text-base">{b.subtitle}</p>}
        <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
          Shop now <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  );

  return (
    <section className="relative">
      {b.link_url ? (
        <a href={b.link_url}>{inner}</a>
      ) : (
        <Link to="/products">{inner}</Link>
      )}
      {n > 1 && (
        <>
          <button
            aria-label="Previous banner"
            onClick={() => setI((v) => (v - 1 + n) % n)}
            className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-card/85 text-foreground sm:grid"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            aria-label="Next banner"
            onClick={() => setI((v) => (v + 1) % n)}
            className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-card/85 text-foreground sm:grid"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="mt-3 flex justify-center gap-1.5">
            {banners.map((x, idx) => (
              <button
                key={x.id}
                aria-label={`Go to banner ${idx + 1}`}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === i % n ? "w-6 bg-primary" : "w-2 bg-border"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

type AnyRow = Record<string, any>;

function Home() {
  const data = Route.useLoaderData() as {
    banners: AnyRow[];
    categories: AnyRow[];
    products: AnyRow[];
    settings: { key: string; value: string | null }[];
    campaigns: AnyRow[];
  };
  const { banners, categories, products, settings, campaigns } = data;
  const s = settingsMap(settings);
  const threshold = num(s.free_delivery_threshold, 3000);
  const featured = products.filter((p) => p.is_featured);
  const list = (featured.length > 0 ? featured : products).slice(0, 12);


  return (
    <SiteLayout>
      <div className="container-page space-y-10 py-4 sm:py-6">
        <Banners banners={banners} />

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { icon: Truck, t: "Karachi-wide delivery", d: `Free above ${money(threshold)}` },
            { icon: ShieldCheck, t: "Cash on delivery", d: "Pay when you receive" },
            { icon: Clock, t: "Same-day dispatch", d: "Order before 6 PM" },
            { icon: RotateCcw, t: "Easy returns", d: "On damaged items" },
          ].map((b) => (
            <div key={b.t} className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                <b.icon className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-foreground">{b.t}</p>
                <p className="truncate text-[11px] text-muted-foreground">{b.d}</p>
              </div>
            </div>
          ))}
        </section>

        {categories.length > 0 && (
          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <h2 className="text-lg font-extrabold sm:text-2xl">Shop by category</h2>
              <Link to="/products" className="text-sm font-bold text-primary">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className="group rounded-2xl border border-border bg-card p-3 text-center shadow-card"
                >
                  <div className="mx-auto aspect-square w-full overflow-hidden rounded-xl bg-muted">
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-2xl">🛒</div>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs font-bold text-foreground sm:text-sm">{c.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {campaigns.length > 0 && (
          <section className="grid gap-3 sm:grid-cols-2">
            {campaigns.map((c) => (
              <div key={c.id} className="rounded-2xl border border-primary/25 bg-accent p-4">
                <p className="text-sm font-extrabold text-accent-foreground">{c.title}</p>
                {c.description && <p className="mt-1 text-sm text-foreground/70">{c.description}</p>}
                {Number(c.discount_percent) > 0 && (
                  <p className="mt-2 text-2xl font-extrabold text-primary">{Number(c.discount_percent)}% OFF</p>
                )}
              </div>
            ))}
          </section>
        )}

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-lg font-extrabold sm:text-2xl">
              {featured.length > 0 ? "Bestsellers & featured" : "Popular right now"}
            </h2>
            <Link to="/products" className="text-sm font-bold text-primary">
              See all
            </Link>
          </div>
          {list.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Products are being added. Please check back shortly.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl bg-secondary p-6 text-secondary-foreground sm:p-10">
          <h2 className="text-xl font-extrabold sm:text-3xl">Have a handwritten list?</h2>
          <p className="mt-2 max-w-lg text-sm text-secondary-foreground/75 sm:text-base">
            Type your items or upload a photo of your list — our team will prepare it and call you to confirm.
          </p>
          <Link to="/quick-order">
            <Button className="mt-5 h-12 px-6 text-base font-bold">Send us your order list</Button>
          </Link>
        </section>
      </div>
    </SiteLayout>
  );
}
