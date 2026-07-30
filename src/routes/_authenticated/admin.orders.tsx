import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteOrder, getAdminOrders, setOrderStatus } from "@/lib/admin.functions";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/orders")({ component: OrdersPage });

const STATUSES = ["pending", "confirmed", "packing", "out_for_delivery", "delivered", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

function OrdersPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const { data, isLoading } = useQuery({ queryKey: ["admin", "orders"], queryFn: () => getAdminOrders() });

  const update = useMutation({
    mutationFn: (v: { id: string; status: Status }) => setOrderStatus({ data: v }),
    onSuccess: () => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Could not update the order"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteOrder({ data: { id } }),
    onSuccess: () => {
      toast.success("Order deleted");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  if (isLoading || !data) return <p className="text-muted-foreground">Loading orders…</p>;
  const orders = filter === "all" ? data : data.filter((o) => o.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All orders</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {orders.length === 0 && <p className="text-muted-foreground">No orders here yet.</p>}

      <div className="space-y-3">
        {orders.map((o) => (
          <Card key={o.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    #{o.order_number} · {o.customer_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {o.phone} · {new Date(o.created_at).toLocaleString("en-PK")}
                  </p>
                  <p className="text-sm text-muted-foreground">{o.address}</p>
                  {o.notes && <p className="text-sm italic text-muted-foreground">“{o.notes}”</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={o.status === "delivered" ? "default" : "secondary"}>{o.status.replace(/_/g, " ")}</Badge>
                  <Select value={o.status} onValueChange={(v) => update.mutate({ id: o.id, status: v as Status })}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate(o.id)} aria-label="Delete order">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border">
                {(o.order_items ?? []).map((it) => (
                  <div key={it.id} className="flex justify-between border-b px-3 py-2 text-sm last:border-b-0">
                    <span>
                      {it.product_name}
                      {it.variant_label ? ` — ${it.variant_label}` : ""} × {it.quantity}
                    </span>
                    <span>{money(Number(it.unit_price) * it.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-end gap-4 text-sm">
                <span>Subtotal {money(o.subtotal)}</span>
                {Number(o.discount) > 0 && <span className="text-primary">Discount −{money(o.discount)}</span>}
                <span>Delivery {money(o.delivery_fee)}</span>
                <span className="font-bold">Total {money(o.total)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
