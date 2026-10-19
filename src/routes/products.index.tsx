import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { getCatalog } from "@/lib/catalog.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { matchesProduct } from "@/lib/product-search";

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>) => ({ q: typeof search.q === 'string' ? search.q : '' }),
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const { categories, products } = Route.useLoaderData() as { categories: any[]; products: any[] };
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [input, setInput] = useState(q);
  const [cat, setCat] = useState<string>("all");
  useEffect(()=>setInput(q),[q]);
  useEffect(()=>{const timer=setTimeout(()=>{if(input.trim()!==q.trim())navigate({search:prev=>({...prev,q:input.trim()}),replace:true});},300);return()=>clearTimeout(timer);},[input,q,navigate]);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
           matchesProduct(p,q,cat),
      ),
    [products, q, cat],
  );

  return (
    <SiteLayout>
      <div className="container-page py-5">
        <h1 className="text-2xl font-extrabold sm:text-3xl">All products</h1>
        <p className="mt-1 text-sm text-muted-foreground">{products.length} items available for delivery</p>

        <div className="sticky top-[104px] z-30 -mx-4 mt-4 bg-background/95 px-4 py-3 backdrop-blur">
          <form className="relative" onSubmit={e=>{e.preventDefault();navigate({search:prev=>({...prev,q:input.trim()})});}}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search products…"
              className="h-12 rounded-xl pl-10 text-base"
              aria-label="Search products"
            />
          </form>
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
          <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            <p>{q.trim() ? `No products found for '${q.trim()}'` : 'No products match your search.'}</p>
            <Button variant="outline" className="my-3" onClick={()=>{setInput('');navigate({search:prev=>({...prev,q:''})});}}>Clear search</Button>{' '}
            <Link to="/quick-order" className="font-bold text-primary">
              Send us your list instead
            </Link>
          </div>
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
