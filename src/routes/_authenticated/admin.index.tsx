import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getAdminOverview } from "@/lib/admin.functions";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({ component: AnalyticsPage });

function AnalyticsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "overview"], queryFn: () => getAdminOverview() });

  if (isLoading || !data) return <p className="text-muted-foreground">Loading analytics…</p>;

  const revenue = data.orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
  const pending = data.orders.filter((o) => o.status === "pending").length;

  const byDay = new Map<string, { day: string; orders: number; revenue: number; visits: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    byDay.set(d, { day: d.slice(5), orders: 0, revenue: 0, visits: 0 });
  }
  data.orders.forEach((o) => {
    const k = String(o.created_at).slice(0, 10);
    const row = byDay.get(k);
    if (row) {
      row.orders += 1;
      if (o.status !== "cancelled") row.revenue += Number(o.total);
    }
  });
  data.visits.forEach((v) => {
    const row = byDay.get(String(v.created_at).slice(0, 10));
    if (row) row.visits += 1;
  });
  const series = [...byDay.values()];

  const topMap = new Map<string, number>();
  data.items.forEach((i) => topMap.set(i.product_name, (topMap.get(i.product_name) ?? 0) + i.quantity));
  const top = [...topMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, qty]) => ({ name: name.length > 16 ? name.slice(0, 15) + "…" : name, qty }));

  const stats = [
    { label: "Total revenue", value: money(revenue) },
    { label: "Orders", value: String(data.orders.length) },
    { label: "Pending orders", value: String(pending) },
    { label: "Page visits (30d)", value: String(data.visits.length) },
    { label: "Products", value: String(data.productCount) },
    { label: "New messages", value: String(data.newMessages) },
  ];

  const latest = data.orders.slice(0, 8);
  const payments = latest.map((o) => ({
    ref: `COD-${o.order_number}`,
    amount: Number(o.total),
    status: o.status === "delivered" ? "paid" : o.status === "cancelled" ? "void" : "pending",
    date: o.created_at,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live performance of your store.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-lg font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue — last 14 days</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="color-mix(in oklab, var(--primary) 20%, transparent)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Visits &amp; orders</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="visits" fill="var(--muted-foreground)" radius={3} />
                <Bar dataKey="orders" fill="var(--primary)" radius={3} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Best selling products</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" fontSize={11} />
                <YAxis type="category" dataKey="name" width={120} fontSize={11} />
                <Tooltip />
                <Bar dataKey="qty" fill="var(--primary)" radius={3} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Latest product orders</CardTitle>
            <Link to="/admin/orders" className="text-sm font-semibold text-primary">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latest.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No orders yet.</TableCell></TableRow>
                )}
                {latest.map((o) => (
                  <TableRow key={o.id} className="odd:bg-muted/30">
                    <TableCell className="font-medium">#{o.order_number}</TableCell>
                    <TableCell className="max-w-[10rem] truncate">{o.customer_name}</TableCell>
                    <TableCell className="text-right">{money(o.total)}</TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("en-PK")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent payment logs</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No payments yet.</TableCell></TableRow>
                )}
                {payments.map((p) => (
                  <TableRow key={p.ref} className="odd:bg-muted/30">
                    <TableCell className="font-medium">{p.ref}</TableCell>
                    <TableCell className="text-right">{money(p.amount)}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(p.date).toLocaleDateString("en-PK")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="border-t px-4 py-3 text-xs text-muted-foreground">
              All orders are Cash on Delivery — payment is marked paid once the order is delivered.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
