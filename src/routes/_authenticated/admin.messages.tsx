import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAdminMessages, getUploadUrl, setMessageStatus } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/messages")({ component: MessagesPage });

const STATUSES = ["new", "in_progress", "done"] as const;

function MessagesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "messages"], queryFn: () => getAdminMessages() });

  const update = useMutation({
    mutationFn: (v: { table: "order_messages" | "support_messages"; id: string; status: (typeof STATUSES)[number] }) =>
      setMessageStatus({ data: v }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  async function openImage(path: string) {
    const { url } = await getUploadUrl({ data: { path } });
    if (url) window.open(url, "_blank", "noopener");
    else toast.error("Image not available");
  }

  if (isLoading || !data) return <p className="text-muted-foreground">Loading messages…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Messages</h1>
      <Tabs defaultValue="quick">
        <TabsList>
          <TabsTrigger value="quick">Quick orders ({data.quick.length})</TabsTrigger>
          <TabsTrigger value="support">Support ({data.support.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="space-y-3 pt-4">
          {data.quick.length === 0 && <p className="text-muted-foreground">No quick orders yet.</p>}
          {data.quick.map((m) => (
            <Card key={m.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{m.customer_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {m.phone} · {new Date(m.created_at).toLocaleString("en-PK")}
                    </p>
                    <p className="text-sm text-muted-foreground">{m.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={m.status === "new" ? "default" : "secondary"}>{m.status.replace(/_/g, " ")}</Badge>
                    <Select value={m.status} onValueChange={(v) => update.mutate({ table: "order_messages", id: m.id, status: v as "new" })}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {m.message && <p className="whitespace-pre-wrap text-sm">{m.message}</p>}
                {m.image_url && (
                  <Button variant="outline" size="sm" onClick={() => openImage(m.image_url!)}>
                    View uploaded list
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="support" className="space-y-3 pt-4">
          {data.support.length === 0 && <p className="text-muted-foreground">No support messages yet.</p>}
          {data.support.map((m) => (
            <Card key={m.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {m.contact} · {new Date(m.created_at).toLocaleString("en-PK")}
                    </p>
                  </div>
                  <Select value={m.status} onValueChange={(v) => update.mutate({ table: "support_messages", id: m.id, status: v as "new" })}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="whitespace-pre-wrap text-sm">{m.message}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
