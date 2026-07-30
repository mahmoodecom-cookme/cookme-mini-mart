import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminSettings, saveSettings } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: SettingsPage });

function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "settings"], queryFn: () => getAdminSettings() });
  const [rows, setRows] = useState<{ key: string; value: string; label: string }[]>([]);

  useEffect(() => {
    if (data) setRows(data.map((r) => ({ key: r.key, value: r.value ?? "", label: r.label ?? "" })));
  }, [data]);

  const save = useMutation({
    mutationFn: () => saveSettings({ data: { rows } }),
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Could not save settings"),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading settings…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Store settings</h1>
      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
          {rows.map((r, i) => (
            <div key={r.key} className="space-y-1.5">
              <Label htmlFor={r.key}>{r.label || r.key}</Label>
              <Input
                id={r.key}
                value={r.value}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = { ...r, value: e.target.value };
                  setRows(next);
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>
      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
