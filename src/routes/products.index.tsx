import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { getCatalog } from "@/lib/catalog.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/products/")({
  loader: () => getCatalog(),
  head: () => ({
    meta: [
      { title: "All Products — Cook Me Mini Mart Karachi" },
      {
        name: "description",
        content:
          "Browse the full Cook Me Mini Mart catalogue: groceries, spices, snacks, beverages and household essentials with cash on delivery in Karachi.",
      },
      { property: "og:title", content: "All Products — Cook Me Mini Mart" },
      { property: "og:description", content: "Browse every product available for delivery in Karachi." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const { categories, products } = Route.useLoaderData() as { categories: any[]; products: any[] };
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (cat === "all" || p.category_id === cat) &&
          (q.trim() === "" || p.name.toLowerCase().includes(q.trim().toLowerCase())),
      ),
    [products, q, cat],
  );

  return (
    <SiteLayout>
      <div className="container-page py-5">
        <h1 className="text-2xl font-extrabold sm:text-3xl">All products</h1>
        <p className="mt-1 text-sm text-muted-foreground">{products.length} items available for delivery</p>

        <div className="sticky top-[104px] z-30 -mx-4 mt-4 bg-background/95 px-4 py-3 backdrop-blur">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products…"
              className="h-12 rounded-xl pl-10 text-base"
              aria-label="Search products"
            />
          </div>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setCat("all")}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${cat === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${cat === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No products match your search.{" "}
            <Link to="/quick-order" className="font-bold text-primary">
              Send us your list instead
            </Link>
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
