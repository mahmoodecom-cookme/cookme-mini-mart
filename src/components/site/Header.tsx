import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingCart, Phone, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/cookme-logo.png";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { parseMenuLinks, useSiteSettings } from "@/lib/site-settings";

const DEFAULT_NAV = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Shop" },
  { to: "/quick-order", label: "Quick Order" },
  { to: "/help", label: "Help & Support" },
];

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const s = useSiteSettings();
  const custom = parseMenuLinks(s.menu_links);
  const nav = custom.length > 0 ? custom : DEFAULT_NAV;
  const showBar = (s.announcement_enabled ?? "yes").toLowerCase() !== "no";
  const announcement = s.announcement_text || "Cash on Delivery all over Karachi · Free delivery on big orders";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      {showBar && (
        <div className="bg-secondary text-secondary-foreground">
          <div className="container-page flex items-center justify-center gap-2 py-1.5 text-[11px] font-medium sm:text-xs">
            <Phone className="h-3 w-3 shrink-0" />
            <span className="truncate">{announcement}</span>
          </div>
        </div>
      )}
      <div className="container-page grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3">
        <button
          className="-ml-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground md:hidden"
          aria-label="Open menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <Link to="/" className="flex min-w-0 items-center">
          <img src={logo} alt="Cook Me Mini Mart logo" className="h-9 w-auto sm:h-11" width={289} height={162} />
        </Link>
        <div className="flex items-center gap-1">
          <nav className="mr-2 hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <a
                key={n.to}
                href={n.to}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <Link
            to="/products"
            aria-label="Search products"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-muted"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link to="/cart" aria-label="View cart" className="relative">
            <Button size="icon" variant="default" className="h-10 w-10 rounded-lg">
              <ShoppingCart className="h-5 w-5" />
            </Button>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-secondary px-1 text-[11px] font-bold text-secondary-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
      {open && (
        <nav className="border-t border-border bg-card md:hidden">
          {nav.map((n) => (
            <a
              key={n.to}
              href={n.to}
              onClick={() => setOpen(false)}
              className="block border-b border-border px-4 py-3.5 text-base font-semibold text-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
