import { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { ImagePlus, Loader2, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { uploadProductImage } from "@/lib/admin.functions";

async function cropToDataUrl(src: string, area: Area, removeBg: boolean): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  const size = Math.min(1200, Math.round(Math.max(area.width, area.height)));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size, size);

  if (!removeBg) return canvas.toDataURL("image/jpeg", 0.9);

  const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b as Blob), "image/png"));
  const { removeBackground } = await import("@imgly/background-removal");
  const cut = await removeBackground(blob);
  const white = document.createElement("canvas");
  white.width = size;
  white.height = size;
  const wctx = white.getContext("2d")!;
  wctx.fillStyle = "#ffffff";
  wctx.fillRect(0, 0, size, size);
  const cutImg = await createImageBitmap(cut);
  wctx.drawImage(cutImg, 0, 0, size, size);
  return white.toDataURL("image/jpeg", 0.92);
}

export function ImageManager({ images, onChange }: { images: string[]; onChange: (next: string[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState("image");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [removeBg, setRemoveBg] = useState(false);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB.");
      return;
    }
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function save() {
    if (!src || !area) return;
    setBusy(true);
    try {
      const dataUrl = await cropToDataUrl(src, area, removeBg);
      const { url } = await uploadProductImage({ data: { fileName, dataUrl } });
      onChange([...images, url]);
      setSrc(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setRemoveBg(false);
      toast.success("Image added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not process the image");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={url + i} className="relative h-24 w-24 overflow-hidden rounded-lg border bg-muted">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-destructive shadow"
              aria-label="Remove image"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground hover:border-primary hover:text-primary"
        >
          <ImagePlus className="h-5 w-5" />
          Add photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
      </div>

      <Dialog open={!!src} onOpenChange={(o) => !o && setSrc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crop product photo</DialogTitle>
          </DialogHeader>
          <div className="relative h-72 w-full overflow-hidden rounded-lg bg-muted">
            {src && (
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Zoom</span>
              <Slider min={1} max={3} step={0.05} value={[zoom]} onValueChange={(v) => setZoom(v[0])} />
            </div>
            <Button
              type="button"
              variant={removeBg ? "default" : "outline"}
              size="sm"
              onClick={() => setRemoveBg(!removeBg)}
              className="w-full"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {removeBg ? "Background removal on" : "Remove background automatically"}
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setSrc(null)} disabled={busy}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="button" onClick={save} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
