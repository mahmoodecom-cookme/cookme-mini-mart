import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";

export function MobileCartBar() {
  const { count, subtotal } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (count === 0 || pathname.startsWith("/cart") || pathname.startsWith("/checkout")) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card p-3 shadow-pop md:hidden">
      <Link
        to="/cart"
        className="flex h-14 items-center justify-between rounded-xl bg-primary px-4 text-primary-foreground"
      >
        <span className="flex items-center gap-2 text-sm font-bold">
          <ShoppingCart className="h-5 w-5" />
          {count} item{count > 1 ? "s" : ""}
        </span>
        <span className="text-base font-extrabold">{money(subtotal)} · View cart</span>
      </Link>
    </div>
  );
}
