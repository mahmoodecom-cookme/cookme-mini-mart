import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="mt-14 border-t border-border bg-secondary text-secondary-foreground">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="inline-flex rounded-xl bg-card p-3">
            <img src={logo} alt="Cook Me Mini Mart" className="h-10 w-auto" loading="lazy" width={220} height={110} />
          </div>
          <p className="mt-4 max-w-xs text-sm text-secondary-foreground/70">
            Your neighbourhood mini mart — groceries, snacks and daily essentials delivered across Karachi with
            cash on delivery.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide">Shop</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-secondary-foreground/75">
            <li><Link to="/products">All products</Link></li>
            <li><Link to="/quick-order">Send your order list</Link></li>
            <li><Link to="/cart">Your cart</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide">Support</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-secondary-foreground/75">
            <li><Link to="/help">Help & Support</Link></li>
            <li className="flex items-center gap-2"><Truck className="h-4 w-4" /> Delivery: all over Karachi</li>
            <li className="flex items-center gap-2"><RotateCcw className="h-4 w-4" /> Easy returns on damaged items</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Cash on delivery only</li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide">Visit us</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-secondary-foreground/75">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> Cook Me Mini Mart, Karachi</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> Call to confirm your order</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-secondary-foreground/10 py-5 text-center text-xs text-secondary-foreground/60">
        © {new Date().getFullYear()} Cook Me Mini Mart. All rights reserved.
      </div>
    </footer>
  );
}
