import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowUpDown, ChevronDown, ChevronRight, Eye, Search, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LocationMap } from "@/components/site/LocationMap";
import { deleteOrder, getAdminOrders, setOrderStatus } from "@/lib/admin.functions";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/orders")({ component: OrdersPage });

const STATUSES = ["pending", "confirmed", "packing", "out_for_delivery", "delivered", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

/* eslint-disable @typescript-eslint/no-explicit-any */
type OrderRow = any;

function OrdersPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortDesc, setSortDesc] = useState(true);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [details, setDetails] = useState<OrderRow | null>(null);
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

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ((data ?? []) as OrderRow[])
      .filter((o) => (filter === "all" ? true : o.status === filter))
      .filter((o) =>
        !q ? true : String(o.order_number).includes(q) || String(o.customer_name).toLowerCase().includes(q) || String(o.phone).includes(q),
      )
      .sort((a, b) =>
        sortDesc
          ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
  }, [data, filter, search, sortDesc]);

  if (isLoading || !data) return <p className="text-muted-foreground">Loading orders…</p>;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground">{rows.length} order(s) shown.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, customer or phone"
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setSortDesc((v) => !v)}>
            <ArrowUpDown className="mr-2 h-4 w-4" /> {sortDesc ? "Newest first" : "Oldest first"}
          </Button>
        </div>

        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Delivery</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="py-8 text-center text-muted-foreground">No orders match your filters.</TableCell>
                  </TableRow>
                )}
                {rows.map((o) => (
                  <>
                    <TableRow key={o.id} className="odd:bg-muted/30">
                      <TableCell>
                        <button
                          aria-label="Toggle items"
                          onClick={() => setOpen((s) => ({ ...s, [o.id]: !s[o.id] }))}
                          className="grid h-7 w-7 place-items-center rounded-md hover:bg-muted"
                        >
                          {open[o.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </TableCell>
                      <TableCell className="font-semibold">#{o.order_number}</TableCell>
                      <TableCell className="whitespace-nowrap">{o.customer_name}</TableCell>
                      <TableCell className="whitespace-nowrap">{o.phone}</TableCell>
                      <TableCell className="max-w-[14rem]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate text-muted-foreground">{o.address}</span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">{o.address}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right">{money(o.subtotal)}</TableCell>
                      <TableCell className="text-right text-primary">{Number(o.discount) > 0 ? `−${money(o.discount)}` : "—"}</TableCell>
                      <TableCell className="text-right">{money(o.delivery_fee)}</TableCell>
                      <TableCell className="text-right font-bold">{money(o.total)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={o.status} />
                          <Select value={o.status} onValueChange={(v) => update.mutate({ id: o.id, status: v as Status })}>
                            <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {new Date(o.created_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm" onClick={() => setDetails(o)}>
                            <Eye className="mr-1.5 h-4 w-4" /> View details
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => remove.mutate(o.id)} aria-label="Delete order">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {open[o.id] && (
                      <TableRow key={`${o.id}-items`} className="bg-accent/40">
                        <TableCell colSpan={12}>
                          <div className="space-y-1.5 px-2 py-1">
                            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Items</p>
                            {(o.order_items ?? []).map((it: OrderRow) => (
                              <div key={it.id} className="flex justify-between text-sm">
                                <span>
                                  {it.product_name}
                                  {it.variant_label ? ` — ${it.variant_label}` : ""} × {it.quantity}
                                </span>
                                <span>{money(Number(it.unit_price) * it.quantity)}</span>
                              </div>
                            ))}
                            {o.notes && <p className="pt-1 text-sm italic text-muted-foreground">Note: “{o.notes}”</p>}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={!!details} onOpenChange={(o) => !o && setDetails(null)}>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order #{details?.order_number}</DialogTitle>
            </DialogHeader>
            {details && (
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge status={details.status} />
                  <span className="text-muted-foreground">
                    {new Date(details.created_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>

                <div className="grid gap-1">
                  <p className="font-semibold">{details.customer_name}</p>
                  <a href={`tel:${details.phone}`} className="text-primary underline-offset-2 hover:underline">
                    {details.phone}
                  </a>
                  <p className="text-muted-foreground">{details.address}</p>
                  <p className="text-muted-foreground">
                    {[details.city, details.postal_code].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>

                {details.latitude != null && details.longitude != null ? (
                  <div className="space-y-1.5">
                    <LocationMap
                      lat={Number(details.latitude)}
                      lng={Number(details.longitude)}
                      className="h-52 w-full overflow-hidden rounded-xl border border-border"
                    />
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${details.latitude}&mlon=${details.longitude}#map=17/${details.latitude}/${details.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline-offset-2 hover:underline"
                    >
                      Open pinned location ({Number(details.latitude).toFixed(5)}, {Number(details.longitude).toFixed(5)})
                    </a>
                  </div>
                ) : (
                  <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                    No map location was saved with this order.
                  </p>
                )}

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Items</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {(details.order_items ?? []).map((it: OrderRow) => (
                      <li key={it.id} className="flex justify-between gap-3">
                        <span>
                          {it.product_name}
                          {it.variant_label ? ` — ${it.variant_label}` : ""} × {it.quantity}
                          <span className="ml-1 text-muted-foreground">@ {money(it.unit_price)}</span>
                        </span>
                        <span className="font-semibold">{money(Number(it.unit_price) * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1 border-t pt-3">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{money(details.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>{Number(details.discount) > 0 ? `−${money(details.discount)}` : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{money(details.delivery_fee)}</span></div>
                  <div className="flex justify-between text-base font-bold"><span>Total</span><span className="text-primary">{money(details.total)}</span></div>
                </div>

                {details.notes && <p className="italic text-muted-foreground">Note: “{details.notes}”</p>}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
