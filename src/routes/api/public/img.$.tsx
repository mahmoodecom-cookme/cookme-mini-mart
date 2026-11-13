import { createFileRoute } from "@tanstack/react-router";

const TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  avif: "image/avif",
};

function typeFor(path: string, fallback: string) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (TYPES[ext]) return TYPES[ext];
  return fallback && fallback !== "application/octet-stream" ? fallback : "image/jpeg";
}

export const Route = createFileRoute("/api/public/img/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if ((!path.startsWith("products/") && !path.startsWith("media/")) || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("uploads").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });

        const buffer = await data.arrayBuffer();
        const total = buffer.byteLength;
        const baseHeaders = {
          "content-type": typeFor(path, data.type),
          "accept-ranges": "bytes",
          "cache-control": "public, max-age=31536000, immutable",
        };

        // Byte-range support: required for video playback on iPhone/Safari and for seeking.
        const range = request.headers.get("range");
        const match = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;
        if (match) {
          let start: number;
          let end: number;
          if (match[1] === "" && match[2] !== "") {
            start = Math.max(total - parseInt(match[2]!, 10), 0);
            end = total - 1;
          } else {
            start = parseInt(match[1]!, 10);
            end = match[2] === "" ? total - 1 : Math.min(parseInt(match[2]!, 10), total - 1);
          }
          if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= total) {
            return new Response(null, { status: 416, headers: { "content-range": `bytes */${total}` } });
          }
          return new Response(buffer.slice(start, end + 1), {
            status: 206,
            headers: {
              ...baseHeaders,
              "content-range": `bytes ${start}-${end}/${total}`,
              "content-length": String(end - start + 1),
            },
          });
        }

        return new Response(buffer, { headers: { ...baseHeaders, "content-length": String(total) } });
      },
    },
  },
});
