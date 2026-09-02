import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { createUploadTicket } from "@/lib/admin.functions";
import { isVideoUrl } from "@/lib/media";

type Props = {
  value: string;
  onChange: (url: string) => void;
  /** Allow video files in addition to images. */
  allowVideo?: boolean;
  label?: string;
};

const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

export function MediaUpload({ value, onChange, allowVideo = false, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    if (isVideo && !allowVideo) return toast.error("Only images can be uploaded here.");
    if (!isVideo && !file.type.startsWith("image/")) return toast.error("Please choose an image file.");
    if (file.size > (isVideo ? MAX_VIDEO : MAX_IMAGE))
      return toast.error(isVideo ? "Videos must be under 50 MB." : "Images must be under 10 MB.");

    setBusy(true);
    try {
      const ticket = await createUploadTicket({ data: { fileName: file.name, kind: isVideo ? "video" : "image" } });
      const { error } = await supabase.storage.from("uploads").uploadToSignedUrl(ticket.path, ticket.token, file, {
        contentType: file.type,
      });
      if (error) throw new Error(error.message);
      onChange(ticket.url);
      toast.success(isVideo ? "Video uploaded" : "Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-fit overflow-hidden rounded-lg border bg-muted">
          {isVideoUrl(value) ? (
            <video src={value} className="h-24 w-40 object-cover" muted playsInline controls={false} />
          ) : (
            <img src={value} alt="" className="h-24 w-40 object-cover" />
          )}
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-destructive shadow"
            aria-label="Remove file"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        {label ?? (allowVideo ? "Upload image or video" : "Upload image")}
      </Button>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={allowVideo ? "image/*,video/*" : "image/*"}
        onChange={pick}
      />
    </div>
  );
}
