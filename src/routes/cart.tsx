import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { getSettings } from "@/lib/catalog.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { money, settingsMap, num } from "@/lib/format";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  loader: () => getSettings(),
  head: () => ({
    meta: [
      { title: "Your Cart — Cook Me Mini Mart" },
      { name: "description", content: "Review your grocery order before checkout. Cash on delivery across Karachi." },
      { property: "og:title", content: "Your Cart — Cook Me Mini Mart" },
      { property: "og:description", content: "Review your grocery order before checkout." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const settings = settingsMap(Route.useLoaderData() as { key: string; value: string | null }[]);
  const { items, setQty, remove, subtotal } = useCart();
  const fee = num(settings.delivery_fee, 150);
  const threshold = num(settings.free_delivery_threshold, 3000);
  const delivery = subtotal >= threshold || subtotal === 0 ? 0 : fee;

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="container-page py-20 text-center">
          <ShoppingBag className="mx-auto h-14 w-14 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-extrabold">Your cart is empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">Add some groceries and they'll show up here.</p>
          <Link to="/products">
            <Button className="mt-6 h-12 px-6 text-base font-bold">Start shopping</Button>
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container-page py-5">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Your cart</h1>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            {items.map((i) => (
              <div key={i.variantId} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {i.image && <img src={i.image} alt={i.name} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to="/products/$slug" params={{ slug: i.slug }} className="line-clamp-2 text-sm font-bold">
                    {i.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{i.variantLabel}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center rounded-lg border border-border">
                      <button
                        aria-label="Decrease quantity"
                        className="grid h-9 w-9 place-items-center"
                        onClick={() => setQty(i.variantId, i.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{i.quantity}</span>
                      <button
                        aria-label="Increase quantity"
                        className="grid h-9 w-9 place-items-center"
                        onClick={() => setQty(i.variantId, i.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-base font-extrabold">{money(i.price * i.quantity)}</p>
                    <button aria-label="Remove item" onClick={() => remove(i.variantId)} className="p-2 text-muted-foreground">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-28">
            <h2 className="text-base font-extrabold">Order summary</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold">{money(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-bold">{delivery === 0 ? "Free" : money(delivery)}</span>
              </div>
              {subtotal < threshold && (
                <p className="rounded-lg bg-accent p-2 text-xs font-medium text-accent-foreground">
                  Add {money(threshold - subtotal)} more for free delivery.
                </p>
              )}
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <span className="font-extrabold">Total</span>
                <span className="font-extrabold text-primary">{money(subtotal + delivery)}</span>
              </div>
            </div>
            <Link to="/checkout">
              <Button className="mt-4 h-12 w-full text-base font-bold">Proceed to checkout</Button>
            </Link>
            <p className="mt-2 text-center text-xs text-muted-foreground">Cash on delivery only · Karachi</p>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}
