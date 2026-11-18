import { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { ImagePlus, Loader2, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { uploadProductImage } from "@/lib/admin.functions";

const MAX_SIDE = 4096; // 4K long-side cap for normal photos
const MAX_SIDE_BG_REMOVAL = 2048; // background removal runs in the browser; keep it lighter
const MAX_DATA_URL_CHARS = 11_500_000; // server limit is 12,000,000

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Encode as high-quality JPEG; only lowers quality if the file would be too big to upload.
function encodeJpeg(canvas: HTMLCanvasElement, startQuality: number): string {
  let q = startQuality;
  let out = canvas.toDataURL("image/jpeg", q);
  while (out.length > MAX_DATA_URL_CHARS && q > 0.7) {
    q -= 0.05;
    out = canvas.toDataURL("image/jpeg", q);
  }
  return out;
}

async function cropToDataUrl(src: string, area: Area, removeBg: boolean): Promise<string> {
  const image = await loadImage(src);

  // Keep the ORIGINAL pixel resolution of the selected area (no forced 1200px / square).
  const srcW = Math.max(1, Math.round(area.width));
  const srcH = Math.max(1, Math.round(area.height));
  const cap = removeBg ? MAX_SIDE_BG_REMOVAL : MAX_SIDE;
  const scale = Math.min(1, cap / Math.max(srcW, srcH));
  const outW = Math.max(1, Math.round(srcW * scale));
  const outH = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  // White background: shows only if the crop box extends past the photo (zoomed out).
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outW, outH);

  // Crop box may extend outside the image when zoomed out, so clamp the source rect.
  const sx = Math.max(0, area.x);
  const sy = Math.max(0, area.y);
  const sw = Math.min(image.naturalWidth, area.x + area.width) - sx;
  const sh = Math.min(image.naturalHeight, area.y + area.height) - sy;
  if (sw > 0 && sh > 0) {
    ctx.drawImage(image, sx, sy, sw, sh, (sx - area.x) * scale, (sy - area.y) * scale, sw * scale, sh * scale);
  }

  if (!removeBg) return encodeJpeg(canvas, 0.95);

  const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b as Blob), "image/png"));
  const { removeBackground } = await import("@imgly/background-removal");
  const cut = await removeBackground(blob);
  const white = document.createElement("canvas");
  white.width = outW;
  white.height = outH;
  const wctx = white.getContext("2d")!;
  wctx.fillStyle = "#ffffff";
  wctx.fillRect(0, 0, outW, outH);
  const cutImg = await createImageBitmap(cut);
  wctx.drawImage(cutImg, 0, 0, outW, outH);
  return encodeJpeg(white, 0.95);
}

type AspectChoice = { key: string; label: string; value: number | "full" };
const ASPECTS: AspectChoice[] = [
  { key: "full", label: "Full image", value: "full" },
  { key: "1:1", label: "1:1", value: 1 },
  { key: "4:5", label: "4:5", value: 4 / 5 },
  { key: "3:4", label: "3:4", value: 3 / 4 },
];

export function ImageManager({ images, onChange }: { images: string[]; onChange: (next: string[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState("image");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [removeBg, setRemoveBg] = useState(false);
  const [busy, setBusy] = useState(false);
  const [aspectKey, setAspectKey] = useState("full");
  const [naturalRatio, setNaturalRatio] = useState(1);

  const chosen = ASPECTS.find((a) => a.key === aspectKey) ?? ASPECTS[0];
  const aspect = chosen.value === "full" ? naturalRatio : chosen.value;

  const onCropComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Image must be under 25 MB.");
      return;
    }
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const probe = new Image();
      probe.onload = () => {
        setNaturalRatio(probe.naturalWidth / probe.naturalHeight || 1);
        setAspectKey("full"); // start with the WHOLE photo selected
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        setSrc(url);
      };
      probe.onerror = () => toast.error("Could not read this image.");
      probe.src = url;
    };
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
            <img src={url} alt="" className="h-full w-full object-contain" />
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop product photo</DialogTitle>
          </DialogHeader>
          <div className="relative h-[55vh] min-h-72 w-full overflow-hidden rounded-lg bg-muted">
            {src && (
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                minZoom={0.3}
                maxZoom={4}
                restrictPosition={false}
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Crop shape</span>
              {ASPECTS.map((a) => (
                <Button
                  key={a.key}
                  type="button"
                  size="sm"
                  variant={aspectKey === a.key ? "default" : "outline"}
                  onClick={() => {
                    setAspectKey(a.key);
                    setZoom(1);
                    setCrop({ x: 0, y: 0 });
                  }}
                >
                  {a.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Zoom</span>
              <Slider min={0.3} max={4} step={0.05} value={[zoom]} onValueChange={(v) => setZoom(v[0])} />
            </div>
            <p className="text-xs text-muted-foreground">
              "Full image" saves the whole photo at its original quality (up to 4K). Zoom in to crop, or zoom out to add white space around the product.
            </p>
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
