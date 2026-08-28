import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Upload, X } from "lucide-react";
import { submitQuickOrder } from "@/lib/orders.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/quick-order")({
  head: () => ({
    meta: [
      { title: "Quick Order — Send Your Grocery List | Cook Me Mini Mart" },
      {
        name: "description",
        content:
          "Too busy to browse? Type your grocery list or upload a photo of it and Cook Me Mini Mart will prepare and deliver it in Karachi.",
      },
      { property: "og:title", content: "Quick Order — Cook Me Mini Mart" },
      { property: "og:description", content: "Send your grocery list by text or photo and we'll do the rest." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuickOrder,
});

function QuickOrder() {
  const submit = useServerFn(submitQuickOrder);
  const [form, setForm] = useState({ customerName: "", phone: "", address: "", message: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.customerName.trim().length < 2) return toast.error("Please enter your name.");
    if (!/^[0-9+\-\s]{7,20}$/.test(form.phone.trim())) return toast.error("Please enter a valid phone number.");
    if (form.address.trim().length < 8) return toast.error("Please enter your delivery address.");
    if (!form.message.trim() && !file) return toast.error("Type your list or attach a photo.");
    setBusy(true);
    try {
      let imageUrl = "";
      if (file) {
        const path = `quick-orders/${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split(".").pop()}`;
        const { error } = await supabase.storage.from("uploads").upload(path, file, { upsert: false });
        if (error) throw new Error("Photo upload failed. Please try a smaller image.");
        imageUrl = path;
      }

      await submit({ data: { ...form, imageUrl } });
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <SiteLayout>
        <div className="container-page py-16 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
          <h1 className="mt-4 text-2xl font-extrabold">List received!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Our team will call you shortly to confirm the items and total.
          </p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container-page py-6">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Quick order</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Type your grocery list or upload a photo of your handwritten list. We'll prepare it, call you with the total
          and deliver it — cash on delivery.
        </p>

        <form onSubmit={onSubmit} className="mt-5 max-w-xl space-y-4 rounded-2xl border border-border bg-card p-4">
          <div>
            <Label htmlFor="qname">Your name</Label>
            <Input
              id="qname"
              required
              maxLength={100}
              className="mt-1.5 h-12"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="qphone">Mobile number</Label>
            <Input
              id="qphone"
              required
              inputMode="tel"
              maxLength={20}
              placeholder="03XX XXXXXXX"
              className="mt-1.5 h-12"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="qaddress">Delivery address</Label>
            <Textarea
              id="qaddress"
              required
              minLength={8}
              maxLength={500}
              rows={3}
              className="mt-1.5"
              placeholder="House, street, area, Karachi"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="qmsg">Your list</Label>
            <Textarea
              id="qmsg"
              rows={6}
              maxLength={2000}
              className="mt-1.5"
              placeholder={"2kg sugar\n1 packet tea\n5 eggs..."}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="qfile">Photo of your list (optional)</Label>
            {file ? (
              <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-border p-3">
                <img src={URL.createObjectURL(file)} alt="List preview" className="h-16 w-16 rounded-lg object-cover" />
                <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
                <button type="button" aria-label="Remove photo" onClick={() => setFile(null)} className="p-2">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="qfile"
                className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-sm font-medium text-muted-foreground"
              >
                <Upload className="h-4 w-4" /> Tap to attach a photo
              </label>
            )}
            <input
              id="qfile"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && f.size > 5 * 1024 * 1024) return toast.error("Please choose an image under 5 MB.");
                setFile(f ?? null);
              }}
            />
          </div>
          <Button type="submit" disabled={busy} className="h-12 w-full text-base font-bold">
            {busy ? "Sending…" : "Send my list"}
          </Button>
        </form>
      </div>
    </SiteLayout>
  );
}
