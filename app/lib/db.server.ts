/// <reference types="@cloudflare/workers-types" />

import type { Place } from "~/components/place-directory";

type Row = {
  id: number;
  slug: string;
  name: string;
  type: string;
  city: string;
  address: string;
  maps_url: string;
  wifi_mbps: number;
  wifi_speed_label: string;
  noise_level: string;
  noise_score_label: string;
  comfort_score: number;
  comfort_score_label: string;
  espresso_price: number | null;
  price_range: string;
  timing: string | null;
  outlets_label: string;
  tpe: number | null;
  non_smoking: number | null;
  air_conditioned: number | null;
  staff_score: number | null;
  gradient: string;
  rating: number;
  review_count: number;
  images: string;
  tags: string;
};

function rowToPlace(row: Row): Place {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type as Place["type"],
    city: row.city,
    address: row.address,
    mapsUrl: row.maps_url,
    wifiMbps: row.wifi_mbps,
    wifiSpeedLabel: row.wifi_speed_label,
    noiseLevel: row.noise_level as Place["noiseLevel"],
    noiseScoreLabel: row.noise_score_label,
    comfortScore: row.comfort_score,
    comfortScoreLabel: row.comfort_score_label,
    espressoPrice: row.espresso_price ?? undefined,
    priceRange: row.price_range as Place["priceRange"],
    timing: row.timing ?? undefined,
    outletsLabel: row.outlets_label,
    tpe: row.tpe === null ? null : row.tpe === 1,
    nonSmoking: row.non_smoking === null ? null : row.non_smoking === 1,
    airConditioned: row.air_conditioned === null ? null : row.air_conditioned === 1,
    staffScore: row.staff_score ?? null,
    rating: row.rating,
    reviewCount: row.review_count,
    gradient: row.gradient,
    images: JSON.parse(row.images) as string[],
    tags: JSON.parse(row.tags) as string[],
  };
}

const SPOT_SELECT = `
  SELECT s.*,
    COALESCE(ROUND(AVG((r.wifi_score + r.noise_score + r.comfort_score) / 3.0), 1), 0) AS rating,
    COUNT(r.id) AS review_count
  FROM spots s
  LEFT JOIN reviews r ON r.spot_slug = s.slug
`;

export async function getAllSpots(db: D1Database): Promise<Place[]> {
  const { results } = await db
    .prepare(`${SPOT_SELECT} GROUP BY s.id ORDER BY rating DESC`)
    .all<Row>();
  return results.map(rowToPlace);
}

export async function getSpotBySlug(db: D1Database, slug: string): Promise<Place | null> {
  const row = await db
    .prepare(`${SPOT_SELECT} WHERE s.slug = ? GROUP BY s.id`)
    .bind(slug)
    .first<Row>();
  return row ? rowToPlace(row) : null;
}

// ── Submissions ────────────────────────────────────────────────────────────────

export type Submission = {
  id: number;
  name: string;
  type: string;
  city: string;
  address: string;
  mapsUrl: string | null;
  wifiMbps: number | null;
  timing: string | null;
  espressoPrice: number | null;
  priceRange: string | null;
  tpe: boolean | null;
  nonSmoking: boolean | null;
  airConditioned: boolean | null;
  notes: string | null;
  submitterEmail: string | null;
  images: string[];
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
};

type SubmissionRow = {
  id: number;
  name: string;
  type: string;
  city: string;
  address: string;
  maps_url: string | null;
  wifi_mbps: number | null;
  timing: string | null;
  espresso_price: number | null;
  price_range: string | null;
  tpe: number | null;
  non_smoking: number | null;
  air_conditioned: number | null;
  notes: string | null;
  submitter_email: string | null;
  images: string;
  status: string;
  submitted_at: string;
};

function rowToSubmission(row: SubmissionRow): Submission {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    city: row.city,
    address: row.address,
    mapsUrl: row.maps_url,
    wifiMbps: row.wifi_mbps,
    timing: row.timing,
    espressoPrice: row.espresso_price,
    priceRange: row.price_range,
    tpe: row.tpe === null ? null : row.tpe === 1,
    nonSmoking: row.non_smoking === null ? null : row.non_smoking === 1,
    airConditioned: row.air_conditioned === null ? null : row.air_conditioned === 1,
    notes: row.notes,
    submitterEmail: row.submitter_email,
    images: JSON.parse(row.images) as string[],
    status: row.status as Submission["status"],
    submittedAt: row.submitted_at,
  };
}

export async function addSubmission(
  db: D1Database,
  data: Omit<Submission, "id" | "status" | "submittedAt">,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO spot_submissions
       (name, type, city, address, maps_url, wifi_mbps, timing, espresso_price,
        price_range, tpe, non_smoking, air_conditioned, notes, submitter_email, images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      data.name,
      data.type,
      data.city,
      data.address,
      data.mapsUrl ?? null,
      data.wifiMbps ?? null,
      data.timing ?? null,
      data.espressoPrice ?? null,
      data.priceRange ?? null,
      data.tpe === null ? null : data.tpe ? 1 : 0,
      data.nonSmoking === null ? null : data.nonSmoking ? 1 : 0,
      data.airConditioned === null ? null : data.airConditioned ? 1 : 0,
      data.notes ?? null,
      data.submitterEmail ?? null,
      JSON.stringify(data.images ?? []),
    )
    .run();
}

export async function getSubmissions(
  db: D1Database,
  status: "pending" | "approved" | "rejected" = "pending",
): Promise<Submission[]> {
  const { results } = await db
    .prepare("SELECT * FROM spot_submissions WHERE status = ? ORDER BY submitted_at DESC")
    .bind(status)
    .all<SubmissionRow>();
  return results.map(rowToSubmission);
}

export type ApprovalDetails = {
  wifiMbps: number;
  noiseLevel: "quiet" | "moderate" | "lively";
  comfortScore: number;
  outletsLabel: string;
  priceRange: "$" | "$$" | "$$$";
  mapsUrl?: string;
  timing?: string;
  tpe?: boolean | null;
  nonSmoking?: boolean | null;
  airConditioned?: boolean | null;
  staffScore?: number | null;
  espressoPrice?: number | null;
  gradient: string;
};

function wifiLabel(mbps: number): string {
  if (mbps >= 80) return "Excellent";
  if (mbps >= 40) return "Good";
  if (mbps >= 15) return "OK";
  if (mbps >= 5) return "Poor";
  return "Very Poor";
}

const noiseScore: Record<string, string> = { quiet: "5/5", moderate: "3/5", lively: "1/5" };
const comfortLabel = (s: number) => `${s}/5`;

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function approveSubmission(
  db: D1Database,
  id: number,
  sub: Submission,
  details: ApprovalDetails,
): Promise<void> {
  const base = toSlug(sub.name);
  let slug = base;
  let suffix = 1;
  while (await db.prepare("SELECT 1 FROM spots WHERE slug = ?").bind(slug).first()) {
    slug = `${base}-${suffix++}`;
  }

  const tags = JSON.stringify([sub.type, sub.city.toLowerCase()]);

  await db.batch([
    db
      .prepare(
        `INSERT INTO spots
         (slug, name, type, city, address, maps_url, wifi_mbps, wifi_speed_label,
          noise_level, noise_score_label, comfort_score, comfort_score_label,
          espresso_price, price_range, timing, outlets_label, tpe, non_smoking, air_conditioned,
          staff_score, gradient, images, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        slug,
        sub.name,
        sub.type,
        sub.city,
        sub.address,
        details.mapsUrl ?? sub.mapsUrl ?? "",
        details.wifiMbps,
        wifiLabel(details.wifiMbps),
        details.noiseLevel,
        noiseScore[details.noiseLevel],
        details.comfortScore,
        comfortLabel(details.comfortScore),
        details.espressoPrice ?? sub.espressoPrice ?? null,
        details.priceRange,
        details.timing ?? sub.timing ?? null,
        details.outletsLabel,
        details.tpe === null ? null : details.tpe ? 1 : 0,
        details.nonSmoking === null ? null : details.nonSmoking ? 1 : 0,
        details.airConditioned === null ? null : details.airConditioned ? 1 : 0,
        details.staffScore ?? null,
        details.gradient,
        JSON.stringify(sub.images.map((key) => `/images/${key}`)),
        tags,
      ),
    db.prepare("UPDATE spot_submissions SET status = 'approved' WHERE id = ?").bind(id),
  ]);
}

export async function rejectSubmission(db: D1Database, id: number): Promise<void> {
  await db.prepare("UPDATE spot_submissions SET status = 'rejected' WHERE id = ?").bind(id).run();
}

export type NewSpot = {
  name: string;
  type: "café" | "coworking";
  city: string;
  address: string;
  mapsUrl: string;
  wifiMbps: number;
  noiseLevel: "quiet" | "moderate" | "lively";
  comfortScore: number;
  outletsLabel: string;
  espressoPrice: number | null;
  priceRange: "$" | "$$" | "$$$";
  timing: string | null;
  tpe: boolean | null;
  nonSmoking: boolean | null;
  airConditioned: boolean | null;
  staffScore: number | null;
  gradient: string;
  images: string[];
};

export async function createSpot(db: D1Database, data: NewSpot): Promise<string> {
  const base = toSlug(data.name);
  let slug = base;
  let suffix = 1;
  while (await db.prepare("SELECT 1 FROM spots WHERE slug = ?").bind(slug).first()) {
    slug = `${base}-${suffix++}`;
  }

  const tags = JSON.stringify([data.type, data.city.toLowerCase()]);

  await db
    .prepare(
      `INSERT INTO spots
       (slug, name, type, city, address, maps_url, wifi_mbps, wifi_speed_label,
        noise_level, noise_score_label, comfort_score, comfort_score_label,
        espresso_price, price_range, timing, outlets_label, tpe, non_smoking, air_conditioned,
        staff_score, gradient, images, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      slug,
      data.name,
      data.type,
      data.city,
      data.address,
      data.mapsUrl,
      data.wifiMbps,
      wifiLabel(data.wifiMbps),
      data.noiseLevel,
      noiseScore[data.noiseLevel],
      data.comfortScore,
      comfortLabel(data.comfortScore),
      data.espressoPrice ?? null,
      data.priceRange,
      data.timing ?? null,
      data.outletsLabel,
      data.tpe === null ? null : data.tpe ? 1 : 0,
      data.nonSmoking === null ? null : data.nonSmoking ? 1 : 0,
      data.airConditioned === null ? null : data.airConditioned ? 1 : 0,
      data.staffScore ?? null,
      data.gradient,
      JSON.stringify(data.images.map((key) => `/images/${key}`)),
      tags,
    )
    .run();

  return slug;
}

export type SpotUpdate = Omit<NewSpot, "images"> & {
  slug: string;
  keepImages: string[]; // existing URLs to retain (caller omits removed ones)
  appendImages: string[]; // new R2 keys to append
};

export async function updateSpot(db: D1Database, data: SpotUpdate): Promise<void> {
  const tags = JSON.stringify([data.type, data.city.toLowerCase()]);

  const newImageUrls = data.appendImages.map((key) => `/images/${key}`);
  const images = JSON.stringify([...data.keepImages, ...newImageUrls]);

  await db
    .prepare(
      `UPDATE spots SET
         name = ?, type = ?, city = ?, address = ?, maps_url = ?,
         wifi_mbps = ?, wifi_speed_label = ?,
         noise_level = ?, noise_score_label = ?, comfort_score = ?, comfort_score_label = ?,
         espresso_price = ?, price_range = ?, timing = ?, outlets_label = ?,
         tpe = ?, non_smoking = ?, air_conditioned = ?, staff_score = ?, gradient = ?, images = ?, tags = ?
       WHERE slug = ?`,
    )
    .bind(
      data.name,
      data.type,
      data.city,
      data.address,
      data.mapsUrl,
      data.wifiMbps,
      wifiLabel(data.wifiMbps),
      data.noiseLevel,
      noiseScore[data.noiseLevel],
      data.comfortScore,
      comfortLabel(data.comfortScore),
      data.espressoPrice ?? null,
      data.priceRange,
      data.timing ?? null,
      data.outletsLabel,
      data.tpe === null ? null : data.tpe ? 1 : 0,
      data.nonSmoking === null ? null : data.nonSmoking ? 1 : 0,
      data.airConditioned === null ? null : data.airConditioned ? 1 : 0,
      data.staffScore ?? null,
      data.gradient,
      images,
      tags,
      data.slug,
    )
    .run();
}

export async function deleteSpot(db: D1Database, slug: string): Promise<void> {
  await db.prepare("DELETE FROM spots WHERE slug = ?").bind(slug).run();
}

// ── Admin config ──────────────────────────────────────────────────────────────

export async function getAdminConfig(db: D1Database, key: string): Promise<string | null> {
  const row = await db
    .prepare("SELECT value FROM admin_config WHERE key = ?")
    .bind(key)
    .first<{ value: string }>();
  return row?.value ?? null;
}

export async function setAdminConfig(db: D1Database, key: string, value: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO admin_config (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
    )
    .bind(key, value)
    .run();
}

// ── Reviews ────────────────────────────────────────────────────────────────────

export async function addReview(
  db: D1Database,
  slug: string,
  scores: { wifi: number; noise: number; comfort: number; staff?: number | null },
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO reviews (spot_slug, wifi_score, noise_score, comfort_score, staff_score) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(slug, scores.wifi, scores.noise, scores.comfort, scores.staff ?? null)
    .run();
}
