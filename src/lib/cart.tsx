import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  variantId: string;
  variantLabel: string;
  price: number;
  image: string | null;
  quantity: number;
};

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "cookme-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const value = useMemo<CartCtx>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
    return {
      items,
      count,
      subtotal,
      add: (item, qty = 1) =>
        setItems((prev) => {
          const found = prev.find((p) => p.variantId === item.variantId);
          if (found)
            return prev.map((p) =>
              p.variantId === item.variantId ? { ...p, quantity: p.quantity + qty } : p,
            );
          return [...prev, { ...item, quantity: qty }];
        }),
      setQty: (variantId, qty) =>
        setItems((prev) =>
          qty <= 0
            ? prev.filter((p) => p.variantId !== variantId)
            : prev.map((p) => (p.variantId === variantId ? { ...p, quantity: qty } : p)),
        ),
      remove: (variantId) => setItems((prev) => prev.filter((p) => p.variantId !== variantId)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
