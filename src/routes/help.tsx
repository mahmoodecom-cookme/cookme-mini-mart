import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Phone, MapPin, Clock, MessageCircle } from "lucide-react";
import { submitSupport } from "@/lib/orders.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const FAQS = [
  {
    q: "Which areas do you deliver to?",
    a: "We deliver across Karachi. Orders placed before 6 PM are usually dispatched the same day.",
  },
  {
    q: "How can I pay?",
    a: "Cash on delivery only. You pay the rider in cash when your order arrives.",
  },
  {
    q: "Is there a delivery charge?",
    a: "A flat delivery fee applies on smaller orders. Orders above the free-delivery threshold ship free — the exact amounts are shown in your cart.",
  },
  {
    q: "What if an item is missing or damaged?",
    a: "Call us within 24 hours and we'll replace the item or refund it on your next order.",
  },
  {
    q: "Can I order without browsing products?",
    a: "Yes. Use Quick Order to type your list or upload a photo of it, and our team will call you to confirm.",
  },
];

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & Support — Cook Me Mini Mart Karachi" },
      {
        name: "description",
        content:
          "Delivery, payment and returns questions answered. Contact Cook Me Mini Mart support for help with your Karachi grocery order.",
      },
      { property: "og:title", content: "Help & Support — Cook Me Mini Mart" },
      { property: "og:description", content: "FAQs and direct support for your grocery orders in Karachi." },
    ],
  }),
  component: Help,
});

function Help() {
  const submit = useServerFn(submitSupport);
  const [form, setForm] = useState({ name: "", contact: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await submit({ data: form });
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container-page py-6">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Help &amp; support</h1>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Phone, t: "Call us", d: "+92 300 0000000" },
            { icon: MapPin, t: "Our branch", d: "Karachi, Pakistan" },
            { icon: Clock, t: "Timings", d: "Daily 9:00 AM – 11:00 PM" },
          ].map((c) => (
            <div key={c.t} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <c.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold">{c.t}</p>
                <p className="truncate text-sm text-muted-foreground">{c.d}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="text-lg font-extrabold">Frequently asked questions</h2>
            <div className="mt-3 space-y-2">
              {FAQS.map((f) => (
                <details key={f.q} className="rounded-2xl border border-border bg-card p-4">
                  <summary className="cursor-pointer text-sm font-bold">{f.q}</summary>
                  <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-extrabold">Send us a message</h2>
            {done ? (
              <div className="mt-3 rounded-2xl border border-border bg-card p-6 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
                <p className="mt-3 text-sm font-bold">Thanks! We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-3 space-y-4 rounded-2xl border border-border bg-card p-4">
                <div>
                  <Label htmlFor="hname">Name</Label>
                  <Input
                    id="hname"
                    required
                    minLength={2}
                    maxLength={100}
                    className="mt-1.5 h-12"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="hcontact">Phone or email</Label>
                  <Input
                    id="hcontact"
                    required
                    minLength={5}
                    maxLength={150}
                    className="mt-1.5 h-12"
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="hmsg">How can we help?</Label>
                  <Textarea
                    id="hmsg"
                    required
                    minLength={5}
                    maxLength={2000}
                    rows={5}
                    className="mt-1.5"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>
                <Button type="submit" disabled={busy} className="h-12 w-full text-base font-bold">
                  {busy ? "Sending…" : <><MessageCircle className="mr-2 h-4 w-4" /> Send message</>}
                </Button>
              </form>
            )}
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}
