import { env } from "cloudflare:workers";
import { mediaRange } from "@/lib/media-range";
export const dynamic = "force-dynamic";
const files = new Set([
  "courvix-product-demo.mp4",
  "courvix-teaser-4x5.mp4",
  "courvix-teaser-vertical.mp4",
]);
async function serve(req: Request, head = false) {
  const url = new URL(req.url),
    file = url.searchParams.get("file") || "";
  if (!files.has(file))
    return Response.json({ error: "Media not found." }, { status: 404 });
  const assets = (env as any).ASSETS as Fetcher | undefined;
  if (!assets)
    return Response.json(
      { error: "Media is temporarily unavailable." },
      { status: 503 },
    );
  const assetUrl = new URL("/media/" + file, url),
    range = req.headers.get("range");
  const requestHeaders = new Headers();
  if (range && !head) requestHeaders.set("Range", range);
  const asset = await assets.fetch(
    new Request(assetUrl, { method: "GET", headers: requestHeaders }),
  );
  if (!asset.ok)
    return new Response(null, { status: asset.status, headers: asset.headers });
  const headers = new Headers(asset.headers);
  headers.set("Content-Type", "video/mp4");
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=3600");
  headers.set("X-Content-Type-Options", "nosniff");
  if (head) {
    const data = await asset.arrayBuffer();
    headers.set("Content-Length", String(data.byteLength));
    headers.delete("Content-Encoding");
    return new Response(null, { status: 200, headers });
  }
  if (!range || asset.status === 206)
    return new Response(asset.body, { status: asset.status, headers });
  // Native asset delivery may return a full response locally. These bounded
  // bundled files have a deterministic single-range fallback for chapter seeking.
  const content = await asset.arrayBuffer(),
    selection = mediaRange(range, content.byteLength);
  if (!selection) {
    headers.set("Content-Range", "bytes */" + content.byteLength);
    headers.set("Content-Length", "0");
    return new Response(null, { status: 416, headers });
  }
  const { start, end } = selection;
  headers.set("Content-Range", `bytes ${start}-${end}/${content.byteLength}`);
  headers.set("Content-Length", String(end - start + 1));
  headers.delete("Content-Encoding");
  return new Response(content.slice(start, end + 1), { status: 206, headers });
}
export const GET = (req: Request) => serve(req);
export const HEAD = (req: Request) => serve(req, true);
