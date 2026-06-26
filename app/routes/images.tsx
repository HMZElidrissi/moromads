import type { Route } from "./+types/images";
import { cloudflareContext } from "../../load-context";

export async function loader({ params, context }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const key = params["*"];
  if (!key) throw new Response("Not found", { status: 404 });

  const obj = await env.BUCKET.get(key);
  if (!obj) throw new Response("Not found", { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(obj.body, { headers });
}
