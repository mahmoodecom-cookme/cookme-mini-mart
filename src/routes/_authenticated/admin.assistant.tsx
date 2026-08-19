import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Send, Sparkle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { assistantApply, assistantPropose, type AssistantAction } from "@/lib/assistant.functions";
import logo from "@/assets/cookme-logo.png";

export const Route = createFileRoute("/_authenticated/admin/assistant")({ component: AssistantPage });

type Msg = { role: "user" | "assistant"; content: string };

const EXAMPLES = [
  "Change the announcement bar to say free delivery above Rs. 2,000",
  "Make the website theme a deeper red",
  "Add a product called Fresh Eggs (dozen) for Rs. 320 in Dairy",
  "Mark order 1004 as out for delivery",
];

function AssistantPage() {
  const qc = useQueryClient();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<AssistantAction[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const propose = useMutation({
    mutationFn: (msgs: Msg[]) => assistantPropose({ data: { messages: msgs } }),
    onSuccess: (res) => {
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
      setPending(res.actions);
      inputRef.current?.focus();
    },
    onError: (e: Error) => toast.error(e.message || "The assistant could not respond"),
  });

  const apply = useMutation({
    mutationFn: () => assistantApply({ data: { actions: pending } }),
    onSuccess: (res) => {
      setPending([]);
      if (res.applied.length) toast.success(`${res.applied.length} change(s) are live`);
      res.failed.forEach((f) => toast.error(f));
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Done — applied: ${res.applied.join("; ") || "nothing"}${res.failed.length ? `. Failed: ${res.failed.join("; ")}` : ""}`,
        },
      ]);
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message || "Could not apply the changes"),
  });

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, propose.isPending]);

  function send(text: string) {
    const value = text.trim();
    if (!value || propose.isPending) return;
    const next: Msg[] = [...messages, { role: "user", content: value }];
    setMessages(next);
    setInput("");
    setPending([]);
    propose.mutate(next);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Describe a change in plain language. Nothing goes live until you approve the preview.
        </p>
      </div>

      <Card className="flex h-[calc(100vh-15rem)] min-h-96 flex-col">
        <CardContent ref={boxRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="mx-auto max-w-md py-8 text-center">
              <img src={logo} alt="Cook Me Mini Mart" className="mx-auto h-12 w-auto" />
              <p className="mt-3 font-semibold">What would you like to change?</p>
              <div className="mt-4 grid gap-2">
                {EXAMPLES.map((e) => (
                  <button
                    key={e}
                    onClick={() => send(e)}
                    className="rounded-xl border px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[80%] rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground">{m.content}</p>
              </div>
            ) : (
              <div key={i} className="flex gap-2">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Sparkle className="h-4 w-4" />
                </span>
                <p className="max-w-[85%] whitespace-pre-wrap text-sm text-foreground">{m.content}</p>
              </div>
            ),
          )}

          {propose.isPending && <p className="animate-pulse text-sm text-muted-foreground">Thinking…</p>}

          {pending.length > 0 && (
            <div className="rounded-2xl border border-primary/30 bg-accent/60 p-4">
              <p className="text-sm font-bold text-accent-foreground">Review these changes before they go live</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {pending.map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>
                      {a.summary}
                      <span className="ml-1 text-xs text-muted-foreground">({a.kind.replace(/_/g, " ")})</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => apply.mutate()} disabled={apply.isPending}>
                  <Check className="mr-2 h-4 w-4" /> {apply.isPending ? "Applying…" : "Approve & publish"}
                </Button>
                <Button variant="outline" onClick={() => setPending([])} disabled={apply.isPending}>
                  <X className="mr-2 h-4 w-4" /> Discard
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        <div className="border-t p-3">
          <div className="flex items-end gap-2">
            <Textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="e.g. Change the homepage heading to “Fresh groceries, delivered fast”"
              className="min-h-16 resize-none"
            />
            <Button size="icon" className="h-10 w-10 shrink-0" onClick={() => send(input)} disabled={propose.isPending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
