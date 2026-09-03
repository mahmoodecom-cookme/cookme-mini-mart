import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { getAdminSettings, saveSettings } from "@/lib/admin.functions";
import { SITE_SECTIONS, type ContentSection } from "@/lib/site-content";

export const Route = createFileRoute("/_authenticated/admin/store")({ component: StoreSettingsPage });

function StoreSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "settings"], queryFn: () => getAdminSettings() });
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data) return;
    const map: Record<string, string> = {};
    (data as { key: string; value: string | null }[]).forEach((r) => (map[r.key] = r.value ?? ""));
    setValues(map);
  }, [data]);

  const save = useMutation({
    mutationFn: (section: ContentSection) =>
      saveSettings({
        data: {
          rows: section.fields.map((f) => ({ key: f.key, value: values[f.key] ?? "", label: f.label })),
        },
      }),
    onSuccess: () => {
      toast.success("Saved — your website is updated");
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: () => toast.error("Could not save this section"),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading website content…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Store Settings</h1>
          <p className="text-sm text-muted-foreground">
            Every heading, text and image on your live website — edit and save, no code needed.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <ExternalLink className="h-4 w-4" /> Preview storefront
        </a>
      </div>

      <Card>
        <CardContent className="p-2 sm:p-4">
          <Accordion type="multiple" className="w-full">
            {SITE_SECTIONS.map((section) => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger className="text-left">
                  <span>
                    <span className="font-semibold">{section.title}</span>
                    <span className="block text-xs font-normal text-muted-foreground">{section.description}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 pt-1 sm:grid-cols-2">
                    {section.fields.map((f) => (
                      <div key={f.key} className={`space-y-1.5 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
                        <Label htmlFor={f.key}>{f.label}</Label>
                        {f.type === "image" ? (
                          <MediaUpload
                            allowVideo
                            value={values[f.key] ?? ""}
                            onChange={(url) => setValues((v) => ({ ...v, [f.key]: url }))}
                          />
                        ) : f.type === "textarea" ? (
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
                  </div>
                  <div className="mt-4">
                    <Button onClick={() => save.mutate(section)} disabled={save.isPending}>
                      {save.isPending ? "Saving…" : `Save ${section.title.toLowerCase()}`}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
