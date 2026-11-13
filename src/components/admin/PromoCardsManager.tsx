import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { createUploadTicket } from "@/lib/admin.functions";
import { isVideoUrl } from "@/lib/media";
import { deletePromoCard, getAdminPromoCards, reorderPromoCards, savePromoCard } from "@/lib/promo-cards.functions";

// image_url stores either an image or a short video URL (the type is detected from the file extension).
type PromoCard = { id: string; image_url: string; link_url: string | null; sort_order: number; is_active: boolean };
type Draft = { id?: string; image_url: string; link_url: string; sort_order: number; is_active: boolean };
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 30 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 30;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];

async function cropToFiveByEight(file: File): Promise<Blob> {
  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = source;
    await image.decode();
    const width = 600;
    const height = 960;
    const targetRatio = 5 / 8;
    const sourceRatio = image.naturalWidth / image.naturalHeight;
    const cropWidth = sourceRatio > targetRatio ? image.naturalHeight * targetRatio : image.naturalWidth;
    const cropHeight = sourceRatio > targetRatio ? image.naturalHeight : image.naturalWidth / targetRatio;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this image.");
    context.drawImage(image, (image.naturalWidth - cropWidth) / 2, (image.naturalHeight - cropHeight) / 2, cropWidth, cropHeight, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not crop the image.")), "image/webp", .88));
    return blob;
  } finally {
    URL.revokeObjectURL(source);
  }
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const done = () => URL.revokeObjectURL(url);
    video.preload = "metadata";
    video.onloadedmetadata = () => { const seconds = video.duration; done(); resolve(seconds); };
    video.onerror = () => { done(); reject(new Error("This video could not be read. Use an MP4 (H.264) or WEBM file.")); };
    video.src = url;
  });
}

function Preview({ url, className, alt }: { url: string; className: string; alt: string }) {
  return isVideoUrl(url)
    ? <video src={`${url}#t=0.001`} className={className} muted loop playsInline autoPlay preload="metadata" aria-label={alt} />
    : <img src={url} alt={alt} className={className} />;
}

export function PromoCardsManager() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["admin", "promo-cards"], queryFn: () => getAdminPromoCards() });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<PromoCard | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const uploadTicket = async (blob: Blob, kind: "image" | "video", fileName: string, contentType: string) => {
    const ticket = await createUploadTicket({ data: { fileName, kind } });
    const { error } = await supabase.storage.from("uploads").uploadToSignedUrl(ticket.path, ticket.token, blob, { contentType });
    if (error) throw new Error(error.message);
    return ticket.url;
  };
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "promo-cards"] }),
      queryClient.invalidateQueries({ queryKey: ["storefront"] }),
    ]);
  };
  const save = useMutation({ mutationFn: (value: Draft) => savePromoCard({ data: { ...value, link_url: value.link_url.trim() || null } }), onSuccess: async () => { toast.success("Promo card saved"); setDraft(null); await invalidate(); }, onError: (error: Error) => toast.error(error.message || "Could not save promo card") });
  const reorder = useMutation({ mutationFn: (ids: string[]) => reorderPromoCards({ data: { ids } }), onSuccess: invalidate, onError: () => toast.error("Could not reorder cards") });
  const toggle = useMutation({ mutationFn: (card: PromoCard) => savePromoCard({ data: { ...card, is_active: !card.is_active } }), onSuccess: invalidate, onError: () => toast.error("Could not update promo card") });
  const remove = useMutation({ mutationFn: (card: PromoCard) => deletePromoCard({ data: { id: card.id } }), onSuccess: async () => { toast.success("Promo card deleted"); setConfirmDelete(null); await invalidate(); }, onError: () => toast.error("Could not delete promo card") });
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= data.length) return;
    const ids = data.map((card) => card.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(ids);
  };
  const saveDroppedOrder = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    const next = [...data] as PromoCard[];
    const from = next.findIndex((card) => card.id === draggingId);
    const to = next.findIndex((card) => card.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    reorder.mutate(next.map((card) => card.id));
    setDraggingId(null);
  };
  const pickMedia = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !draft) return;
    const isVideo = VIDEO_TYPES.includes(file.type);
    if (!isVideo && !IMAGE_TYPES.includes(file.type)) return toast.error("Choose a PNG, JPG, WEBP image or an MP4 / WEBM video.");
    if (!isVideo && file.size > MAX_IMAGE_SIZE) return toast.error("Images must be 5 MB or smaller.");
    if (isVideo && file.size > MAX_VIDEO_SIZE) return toast.error("Videos must be 30 MB or smaller.");
    setUploading(true);
    try {
      let url: string;
      if (isVideo) {
        const seconds = await readVideoDuration(file);
        if (seconds > MAX_VIDEO_SECONDS) throw new Error(`Keep videos under ${MAX_VIDEO_SECONDS} seconds (this one is ${Math.round(seconds)}s).`);
        const ext = file.type === "video/webm" ? "webm" : "mp4";
        url = await uploadTicket(file, "video", `promo-${Date.now()}.${ext}`, file.type);
        toast.success("Video uploaded");
      } else {
        const cropped = await cropToFiveByEight(file);
        url = await uploadTicket(cropped, "image", `promo-${Date.now()}.webp`, "image/webp");
        toast.success("Image uploaded and center-cropped");
      }
      setDraft((current) => current ? { ...current, image_url: url } : current);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading promo cards…</p>;

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="max-w-2xl text-sm text-muted-foreground">Upload your own post designs (images) or short videos. Everything is shown in the 5:8 card shape: images are center-cropped, videos autoplay muted on a loop.</p>
      <Button onClick={() => setDraft({ image_url: "", link_url: "", sort_order: data.length, is_active: true })}><Plus className="mr-2 h-4 w-4"/>Add promo card</Button>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {data.map((card, index) => <Card key={card.id} draggable onDragStart={() => setDraggingId(card.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => saveDroppedOrder(card.id)} onDragEnd={() => setDraggingId(null)} className={draggingId === card.id ? "opacity-50" : ""}>
        <CardContent className="flex gap-4 p-4">
          <Preview url={card.image_url} alt="Promo card preview" className="aspect-[5/8] w-24 shrink-0 rounded-md bg-muted object-cover" />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <label className="flex items-center justify-between gap-2 text-sm">Active<Switch checked={card.is_active} onCheckedChange={() => toggle.mutate(card)} /></label>
            <div className="space-y-1"><span className="text-xs text-muted-foreground">{isVideoUrl(card.image_url) ? "Video card · Link" : "Image card · Link"}</span><p className="break-all text-sm">{card.link_url || "No link"}</p></div>
            <div className="mt-auto flex flex-wrap gap-2">
              <Button variant="outline" size="icon" aria-label="Move promo card up" disabled={index === 0 || reorder.isPending} onClick={() => move(index, -1)}><ArrowUp className="h-4 w-4"/></Button>
              <Button variant="outline" size="icon" aria-label="Move promo card down" disabled={index === data.length - 1 || reorder.isPending} onClick={() => move(index, 1)}><ArrowDown className="h-4 w-4"/></Button>
              <Button variant="outline" className="flex-1" onClick={() => setDraft({ id: card.id, image_url: card.image_url, link_url: card.link_url ?? "", sort_order: card.sort_order, is_active: card.is_active })}>Edit</Button>
              <Button variant="ghost" size="icon" aria-label="Delete promo card" onClick={() => setConfirmDelete(card)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
            </div>
          </div>
        </CardContent>
      </Card>)}
    </div>
    {data.length === 0 && <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No promo cards yet. Add your first card to show the carousel on Home.</p>}

    <AlertDialog open={!!draft} onOpenChange={(open) => !open && !uploading && setDraft(null)}>
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <AlertDialogHeader><AlertDialogTitle>{draft?.id ? "Edit promo card" : "New promo card"}</AlertDialogTitle><AlertDialogDescription>Only the uploaded image or video appears on the Home page.</AlertDialogDescription></AlertDialogHeader>
        {draft && <div className="space-y-4">
          <div className="space-y-2"><Label>Card image or video</Label>{draft.image_url ? <Preview url={draft.image_url} alt="Live promo preview" className="mx-auto aspect-[5/8] w-36 rounded-md bg-muted object-cover"/> : <div className="mx-auto aspect-[5/8] w-36 rounded-md border border-dashed bg-muted"/>}
            <p className="text-xs text-muted-foreground">Images: 600 x 960 px (5:8), PNG/JPG/WEBP, up to 5 MB; other shapes are center-cropped. Videos: vertical 5:8 (e.g. 720 x 1152), MP4 (H.264) or WEBM, up to 30 seconds and 30 MB, shown muted on a loop.</p>
            <Button type="button" variant="outline" className="w-full" disabled={uploading} onClick={() => document.getElementById("promo-card-file")?.click()}>{uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Uploading…</> : <><Upload className="mr-2 h-4 w-4"/>{draft.image_url ? "Replace image or video" : "Upload image or video"}</>}</Button>
            {uploading && <Progress value={undefined} aria-label="Uploading media"/>}<input id="promo-card-file" className="hidden" type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm" onChange={pickMedia}/>
          </div>
          <div className="space-y-1.5"><Label htmlFor="promo-card-link">Optional link URL</Label><Input id="promo-card-link" value={draft.link_url} onChange={(event) => setDraft({ ...draft, link_url: event.target.value })} placeholder="/products or https://…" /></div>
          <label className="flex items-center justify-between gap-2 text-sm">Active on Home<Switch checked={draft.is_active} onCheckedChange={(value) => setDraft({ ...draft, is_active: value })}/></label>
        </div>}
        <AlertDialogFooter><AlertDialogCancel disabled={uploading}>Cancel</AlertDialogCancel><Button disabled={!draft?.image_url || uploading || save.isPending} onClick={() => draft && save.mutate(draft)}>{save.isPending ? "Saving…" : "Save card"}</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this promo card?</AlertDialogTitle><AlertDialogDescription>This card will be removed from the Home carousel.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); if (confirmDelete) remove.mutate(confirmDelete); }} disabled={remove.isPending}>{remove.isPending ? "Deleting…" : "Delete card"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </div>;
}
