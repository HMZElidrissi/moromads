import type { LoaderFunctionArgs } from "react-router";
import { getAllSpots } from "~/lib/db.server";
import { cloudflareContext } from "../../load-context";
import type { Env } from "../../load-context";

const CITIES = [
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Tangier",
  "Fez",
  "Agadir",
  "Mohammedia",
  "Taghazout/Tamraght",
  "Essaouira",
];

export async function loader({ request, context }: LoaderFunctionArgs) {
  const cloudflare = context.get(cloudflareContext) as { env: Env };
  const env = cloudflare.env;

  // Resolve base URL (e.g. from wrangler vars, falling back to local host)
  const baseUrl = env.APP_URL || new URL(request.url).origin;

  // Retrieve active spots
  const spots = await getAllSpots(env.DB, { includeDrafts: false });

  const urls: string[] = [];

  // Home Page
  urls.push(
    `<url><loc>${baseUrl}/</loc><priority>1.0</priority><changefreq>daily</changefreq></url>`,
  );

  // Core Static Pages
  urls.push(
    `<url><loc>${baseUrl}/about</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>`,
  );
  urls.push(
    `<url><loc>${baseUrl}/add-spot</loc><priority>0.5</priority><changefreq>monthly</changefreq></url>`,
  );

  // City-specific Search views to boost city search queries indexing
  for (const city of CITIES) {
    const encoded = encodeURIComponent(city);
    urls.push(
      `<url><loc>${baseUrl}/?city=${encoded}</loc><priority>0.9</priority><changefreq>daily</changefreq></url>`,
    );
  }

  // Individual Spot Detail Pages
  for (const spot of spots) {
    urls.push(
      `<url><loc>${baseUrl}/spots/${spot.slug}</loc><priority>0.7</priority><changefreq>weekly</changefreq></url>`,
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.join("\n  ")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
