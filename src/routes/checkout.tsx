import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Search } from "lucide-react";
import { getSettings } from "@/lib/catalog.functions";
import { placeOrder } from "@/lib/orders.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { LocationMap } from "@/components/site/LocationMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { money, settingsMap, num } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { reverseGeocode, searchPlaces, type GeoPlace } from "@/lib/geo";

export const Route = createFileRoute("/checkout")({
  loader: () => getSettings(),
  head: () => ({
    meta: [
      { title: "Checkout — Cash on Delivery | Cook Me Mini Mart" },
      { name: "description", content: "Place your grocery order with cash on delivery anywhere in Karachi." },
      { property: "og:title", content: "Checkout — Cook Me Mini Mart" },
      { property: "og:description", content: "Cash on delivery checkout for Karachi customers." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const settings = settingsMap(Route.useLoaderData() as { key: string; value: string | null }[]);
  const { items, subtotal, clear } = useCart();
  const submit = useServerFn(placeOrder);
  const navigate = useNavigate();

  const [form, setForm] = useState({ customerName: "", phone: "", address: "", city: "", postalCode: "", notes: "", couponCode: "" });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ orderNumber: number; total: number } | null>(null);

  const fee = num(settings.delivery_fee, 150);
  const threshold = num(settings.free_delivery_threshold, 3000);
  const delivery = subtotal >= threshold ? 0 : fee;

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchPlaces(query, controller.signal)
        .then(setResults)
        .catch(() => setResults([]));
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  /** Fill the text fields from a map pin so every order keeps a readable address too. */
  async function applyPin(lat: number, lng: number) {
    setCoords({ lat, lng });
    try {
      const place = await reverseGeocode(lat, lng);
      if (!place) return;
      setForm((f) => ({
        ...f,
        address: place.street || place.label || f.address,
        city: place.city || f.city,
        postalCode: place.postcode || f.postalCode,
      }));
    } catch {
      /* keep whatever the customer typed */
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.customerName.trim().length < 2) return toast.error("Please enter your full name.");
    if (!/^[0-9+\-\s]{7,20}$/.test(form.phone.trim())) return toast.error("Please enter a valid phone number.");
    if (form.address.trim().length < 8) return toast.error("Please enter your complete delivery address.");
    setBusy(true);
    try {
      const res = await submit({
        data: {
          ...form,
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            variantLabel: i.variantLabel,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
          })),
        },
      });
      clear();
      setDone(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <SiteLayout>
        <div className="container-page py-16 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
          <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">Order confirmed!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Order #{done.orderNumber} · {money(done.total)} payable in cash on delivery.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Our team will call you shortly to confirm.</p>
          <Link to="/products">
            <Button className="mt-6 h-12 px-6 text-base font-bold">Continue shopping</Button>
          </Link>
        </div>
      </SiteLayout>
    );
  }

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="container-page py-20 text-center">
          <h1 className="text-2xl font-extrabold">Your cart is empty</h1>
          <Button className="mt-6 h-12 px-6 text-base font-bold" onClick={() => navigate({ to: "/products" })}>
            Start shopping
          </Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container-page py-5">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Checkout</h1>
        <form onSubmit={onSubmit} className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                required
                maxLength={100}
                className="mt-1.5 h-12"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Mobile number</Label>
              <Input
                id="phone"
                required
                inputMode="tel"
                maxLength={20}
                placeholder="03XX XXXXXXX"
                className="mt-1.5 h-12"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="area-search">Search delivery area</Label>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="area-search"
                  className="h-12 pl-9"
                  autoComplete="off"
                  placeholder="e.g. Gulshan-e-Iqbal Block 6, Karachi"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {results.length > 0 && (
                  <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-lg">
                    {results.map((p) => (
                      <li key={`${p.lat},${p.lng},${p.label}`}>
                        <button
                          type="button"
                          className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => {
                            setResults([]);
                            setQuery(p.label);
                            setCoords({ lat: p.lat, lng: p.lng });
                            setForm((f) => ({
                              ...f,
                              address: p.street || p.label,
                              city: p.city || f.city,
                              postalCode: p.postcode || f.postalCode,
                            }));
                          }}
                        >
                          {p.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Pick your area, then tap or drag the pin for the exact spot. You can always type the address yourself.
              </p>
              <LocationMap
                lat={coords?.lat ?? null}
                lng={coords?.lng ?? null}
                onPick={applyPin}
                className="mt-2 h-56 w-full overflow-hidden rounded-xl border border-border"
              />
              {coords && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Pinned location: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="address">Street address (Karachi only)</Label>
              <Textarea
                id="address"
                required
                maxLength={500}
                rows={3}
                className="mt-1.5"
                placeholder="House / flat, street, area, nearest landmark"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  maxLength={120}
                  className="mt-1.5 h-12"
                  placeholder="Karachi"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="postal">Postal code</Label>
                <Input
                  id="postal"
                  maxLength={20}
                  inputMode="numeric"
                  className="mt-1.5 h-12"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Order notes (optional)</Label>
              <Textarea
                id="notes"
                maxLength={1000}
                rows={2}
                className="mt-1.5"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="coupon">Promo code (optional)</Label>
              <Input
                id="coupon"
                maxLength={40}
                className="mt-1.5 h-12 uppercase"
                value={form.couponCode}
                onChange={(e) => setForm({ ...form, couponCode: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="rounded-xl bg-accent p-3 text-sm font-bold text-accent-foreground">
              Payment method: Cash on Delivery
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-28">
            <h2 className="text-base font-extrabold">Order summary</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {items.map((i) => (
                <li key={i.variantId} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {i.quantity}× {i.name} ({i.variantLabel})
                  </span>
                  <span className="shrink-0 font-bold">{money(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold">{money(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-bold">{delivery === 0 ? "Free" : money(delivery)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <span className="font-extrabold">Total</span>
                <span className="font-extrabold text-primary">{money(subtotal + delivery)}</span>
              </div>
            </div>
            <Button type="submit" disabled={busy} className="mt-4 h-12 w-full text-base font-bold">
              {busy ? "Placing order…" : "Place order (COD)"}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Discounts from promo codes are applied on confirmation.
            </p>
          </aside>
        </form>
      </div>
    </SiteLayout>
  );
}
