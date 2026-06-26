/**
 * Generates a D1-compatible SQL seed file from the local JSON spot data.
 * Run:  vp dlx tsx scripts/seed-d1.ts > db/seed.sql
 * Then: wrangler d1 execute moromads --file=db/seed.sql
 * Or for local dev: wrangler d1 execute moromads --local --file=db/seed.sql
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

function loadSpots(filename: string) {
  const p = join(import.meta.dirname, "../app/data/spots", filename);
  return JSON.parse(readFileSync(p, "utf-8")) as Record<string, unknown>[];
}

const allSpots = [
  ...loadSpots("agadir.json"),
  ...loadSpots("casablanca.json"),
  ...loadSpots("fez.json"),
  ...loadSpots("marrakech.json"),
  ...loadSpots("mohammedia.json"),
  ...loadSpots("rabat.json"),
];

function esc(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
  return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
}

const lines: string[] = ["DELETE FROM spots;", ""];

for (const spot of allSpots) {
  const s = spot as {
    id: number;
    slug: string;
    name: string;
    type: string;
    city: string;
    address: string;
    mapsUrl: string;
    wifiMbps: number;
    wifiSpeedLabel: string;
    noiseLevel: string;
    noiseScoreLabel: string;
    comfortScore: number;
    comfortScoreLabel: string;
    espressoPrice?: number | null;
    priceRange: string;
    timing?: string | null;
    outletsLabel: string;
    tpe?: boolean | null;
    nonSmoking?: boolean | null;
    rating: number;
    reviewCount: number;
    gradient: string;
    images?: string[];
    tags: string[];
  };

  lines.push(
    `INSERT INTO spots (id, slug, name, type, city, address, maps_url, wifi_mbps, wifi_speed_label, noise_level, noise_score_label, comfort_score, comfort_score_label, espresso_price, price_range, timing, outlets_label, tpe, non_smoking, rating, review_count, gradient, images, tags) VALUES (${[
      esc(s.id),
      esc(s.slug),
      esc(s.name),
      esc(s.type),
      esc(s.city),
      esc(s.address),
      esc(s.mapsUrl),
      esc(s.wifiMbps),
      esc(s.wifiSpeedLabel),
      esc(s.noiseLevel),
      esc(s.noiseScoreLabel),
      esc(s.comfortScore),
      esc(s.comfortScoreLabel),
      esc(s.espressoPrice ?? null),
      esc(s.priceRange),
      esc(s.timing ?? null),
      esc(s.outletsLabel),
      s.tpe === null || s.tpe === undefined ? "NULL" : s.tpe ? "1" : "0",
      s.nonSmoking === null || s.nonSmoking === undefined ? "NULL" : s.nonSmoking ? "1" : "0",
      esc(s.rating),
      esc(s.reviewCount),
      esc(s.gradient),
      esc(s.images ?? []),
      esc(s.tags),
    ].join(", ")});`,
  );
}

process.stdout.write(lines.join("\n") + "\n");
