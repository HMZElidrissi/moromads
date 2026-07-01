import type { LoaderFunctionArgs } from "react-router";
import { cloudflareContext } from "../../load-context";
import type { Env } from "../../load-context";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const cloudflare = context.get(cloudflareContext) as { env: Env };
  const env = cloudflare.env;

  const baseUrl = env.APP_URL || new URL(request.url).origin;

  const content = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /admin/*
Disallow: /not-found

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
