import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Store analytics</h1>
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
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
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
                <Bar dataKey="visits" fill="hsl(var(--muted-foreground))" radius={3} />
                <Bar dataKey="orders" fill="hsl(var(--primary))" radius={3} />
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
                <Bar dataKey="qty" fill="hsl(var(--primary))" radius={3} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
