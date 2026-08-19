import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAdminSettings, saveSettings } from "@/lib/admin.functions";
import { getAccount, updateCredentials } from "@/lib/account.functions";
import { ACCOUNT_SECTIONS, type ContentSection } from "@/lib/site-content";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: SettingsPage });

function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "settings"], queryFn: () => getAdminSettings() });
  const { data: account } = useQuery({ queryKey: ["admin", "account"], queryFn: () => getAccount() });
  const [values, setValues] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!data) return;
    const map: Record<string, string> = {};
    (data as { key: string; value: string | null }[]).forEach((r) => (map[r.key] = r.value ?? ""));
    setValues(map);
  }, [data]);

  useEffect(() => {
    if (account?.email) setEmail(account.email);
  }, [account?.email]);

  const save = useMutation({
    mutationFn: (section: ContentSection) =>
      saveSettings({ data: { rows: section.fields.map((f) => ({ key: f.key, value: values[f.key] ?? "", label: f.label })) } }),
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: () => toast.error("Could not save these settings"),
  });

  const creds = useMutation({
    mutationFn: () =>
      updateCredentials({
        data: {
          ...(email && email !== account?.email ? { email } : {}),
          ...(password ? { password } : {}),
        },
      }),
    onSuccess: () => {
      toast.success("Login details updated");
      setPassword("");
      qc.invalidateQueries({ queryKey: ["admin", "account"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not update login details"),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading settings…</p>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Account and business configuration — not website content.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Login credentials</CardTitle>
          <CardDescription>Change the email or password you use to open this dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="login-email">Dashboard email</Label>
            <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-password">New password</Label>
            <Input
              id="login-password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              onClick={() => creds.mutate()}
              disabled={creds.isPending || (!password && email === (account?.email ?? ""))}
            >
              {creds.isPending ? "Updating…" : "Update login details"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {ACCOUNT_SECTIONS.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle className="text-base">{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {section.fields.map((f) => (
              <div key={f.key} className={`space-y-1.5 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
                <Label htmlFor={f.key}>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={f.key}
                    rows={3}
                    placeholder={f.placeholder}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                ) : (
                  <Input
                    id={f.key}
                    placeholder={f.placeholder}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
            <div className="sm:col-span-2">
              <Button onClick={() => save.mutate(section)} disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
