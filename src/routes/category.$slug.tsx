import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCategory } from "@/lib/catalog.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const res = await getCategory({ data: { slug: params.slug } });
    if (!res.category) throw notFound();
    return res;
  },
  head: ({ loaderData }) => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const c: any = (loaderData as any)?.category;
    if (!c)
      return { meta: [{ title: "Category not found — Cook Me Mini Mart" }, { name: "robots", content: "noindex" }] };
    const desc =
      c.description ||
      `Shop ${c.name} online at Cook Me Mini Mart. Cash on delivery across Karachi with same-day dispatch.`;
    return {
      meta: [
        { title: `${c.name} — Buy Online in Karachi | Cook Me Mini Mart` },
        { name: "description", content: desc },
        { property: "og:title", content: `${c.name} — Cook Me Mini Mart` },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-extrabold">Category not found</h1>
        <Link to="/products" className="mt-4 inline-block font-bold text-primary">
          Browse all products
        </Link>
      </div>
    </SiteLayout>
  ),
});

function CategoryPage() {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const { category, products } = Route.useLoaderData() as { category: any; products: any[] };

  return (
    <SiteLayout>
      <div className="container-page py-5">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{category.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{products.length} products</p>
        {products.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nothing here yet — new stock is added daily.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
