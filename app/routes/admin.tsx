import type { Route } from "./+types/admin";
import { Form, redirect, useActionData, useNavigation, useFetcher } from "react-router";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableToolbar } from "~/components/data-table/data-table-toolbar";
import { spotsColumns } from "~/components/data-table/spots-columns";
import { submissionsColumns } from "~/components/data-table/submissions-columns";
import { useClientDataTable } from "~/hooks/use-client-data-table";
import type { DataTableOption } from "~/types/data-table";
import {
  getAllSpots,
  getSubmissions,
  approveSubmission,
  rejectSubmission,
  createSpot,
  updateSpot,
  deleteSpot,
  type Submission,
  type ApprovalDetails,
} from "~/lib/db.server";
import { cloudflareContext } from "../../load-context";
import { getTokenFromRequest, createSessionCookie } from "~/lib/session.server";
import {
  hasAnyAdminUser,
  createAdminUser,
  loginAdmin,
  createDbSession,
  getSessionUser,
} from "~/lib/auth.server";
import type { Place } from "~/components/place-directory";
import { Check, X, MapPin, Clock, AlertCircle, PlusCircle, LayoutGrid } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";

const GRADIENTS = [
  { label: "Sunset", value: "linear-gradient(135deg, #e07b39 0%, #c1272d 100%)" },
  { label: "Ocean", value: "linear-gradient(135deg, #1b4f8b 0%, #2563eb 100%)" },
  { label: "Forest", value: "linear-gradient(135deg, #065f46 0%, #10b981 100%)" },
  { label: "Violet", value: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)" },
  { label: "Amber", value: "linear-gradient(135deg, #b45309 0%, #f59e0b 100%)" },
  { label: "Rose", value: "linear-gradient(135deg, #be185d 0%, #f472b6 100%)" },
];

export function meta() {
  return [{ title: "Admin | Moromads" }];
}

async function getAuthedUser(request: Request, env: { DB: D1Database; ADMIN_KEY: string }) {
  const token = await getTokenFromRequest(request, env.ADMIN_KEY);
  if (!token) return null;
  return getSessionUser(env.DB, token);
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const user = await getAuthedUser(request, env);

  if (!user) {
    const firstRun = !(await hasAnyAdminUser(env.DB));
    return {
      authed: false,
      firstRun,
      email: null,
      pending: [],
      approved: [],
      rejected: [],
      spots: [],
    };
  }
  const [pending, approved, rejected, spots] = await Promise.all([
    getSubmissions(env.DB, "pending"),
    getSubmissions(env.DB, "approved"),
    getSubmissions(env.DB, "rejected"),
    getAllSpots(env.DB),
  ]);
  return { authed: true, firstRun: false, email: user.email, pending, approved, rejected, spots };
}

export async function action({ request, context }: Route.ActionArgs) {
  const { env } = context.get(cloudflareContext);

  const form = await request.formData();
  const intent = (form.get("intent") as string) ?? "";

  if (intent === "setup") {
    // Only allowed when no admin users exist yet
    if (await hasAnyAdminUser(env.DB)) {
      return { ok: false, error: "Setup already complete." };
    }
    const email = (form.get("email") as string) ?? "";
    const password = (form.get("password") as string) ?? "";
    const confirm = (form.get("confirm") as string) ?? "";
    if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
    if (password !== confirm) return { ok: false, error: "Passwords do not match." };
    const user = await createAdminUser(env.DB, email, password);
    const rawToken = await createDbSession(env.DB, user.id, request);
    const cookie = await createSessionCookie(rawToken, env.ADMIN_KEY);
    return redirect("/admin", { headers: { "Set-Cookie": cookie } });
  }

  if (intent === "login") {
    const email = (form.get("email") as string) ?? "";
    const password = (form.get("password") as string) ?? "";
    const result = await loginAdmin(env.DB, email, password);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    const rawToken = await createDbSession(env.DB, result.user.id, request);
    const cookie = await createSessionCookie(rawToken, env.ADMIN_KEY);
    return redirect("/admin", { headers: { "Set-Cookie": cookie } });
  }

  if (!(await getAuthedUser(request, env))) {
    return { ok: false, error: "Unauthorized" };
  }

  const id = Number(form.get("id"));

  if (intent === "reject") {
    await rejectSubmission(env.DB, id);
    return { ok: true };
  }

  if (intent === "approve") {
    const wifiMbps = Number(form.get("wifi_mbps"));
    const noiseLevel = form.get("noise_level") as string as ApprovalDetails["noiseLevel"];
    const comfortScore = Number(form.get("comfort_score"));
    const outletsLabel = (form.get("outlets_label") as string) ?? "";
    const priceRange = form.get("price_range") as string as ApprovalDetails["priceRange"];
    const gradient = (form.get("gradient") as string) ?? "";

    if (!wifiMbps || !noiseLevel || !comfortScore || !outletsLabel || !priceRange || !gradient) {
      return { ok: false, error: "All approval fields are required." };
    }

    const subRaw = form.get("submission_json");
    if (!subRaw) return { ok: false, error: "Missing submission data." };
    const sub = JSON.parse(subRaw as string) as Submission;

    await approveSubmission(env.DB, id, sub, {
      wifiMbps,
      noiseLevel,
      comfortScore,
      outletsLabel,
      priceRange,
      gradient,
      mapsUrl: (form.get("maps_url") as string) || undefined,
      timing: (form.get("timing") as string) || undefined,
      tpe: form.get("tpe") === "1" ? true : form.get("tpe") === "0" ? false : null,
      nonSmoking:
        form.get("non_smoking") === "1" ? true : form.get("non_smoking") === "0" ? false : null,
      airConditioned:
        form.get("air_conditioned") === "1"
          ? true
          : form.get("air_conditioned") === "0"
            ? false
            : null,
      espressoPrice: form.get("espresso_price") ? Number(form.get("espresso_price")) : null,
    });

    return { ok: true };
  }

  if (intent === "create-spot") {
    const str = (k: string) => ((form.get(k) as string | null) ?? "").trim();
    const name = str("name");
    const type = str("type") as "café" | "coworking";
    const city = str("city");
    const address = str("address");
    const mapsUrl = str("maps_url");
    const wifiMbps = Number(form.get("wifi_mbps"));
    const noiseLevel = str("noise_level") as "quiet" | "moderate" | "lively";
    const comfortScore = Number(form.get("comfort_score"));
    const outletsLabel = str("outlets_label");
    const priceRange = str("price_range") as "$" | "$$" | "$$$";
    const gradient = str("gradient");

    if (
      !name ||
      !type ||
      !city ||
      !address ||
      !wifiMbps ||
      !noiseLevel ||
      !comfortScore ||
      !outletsLabel ||
      !priceRange ||
      !gradient
    ) {
      return { ok: false, error: "All required fields must be filled." };
    }

    const files = form.getAll("images") as File[];
    const imageKeys: string[] = [];
    for (const file of files) {
      if (!file.size) continue;
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const key = `spots/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
      imageKeys.push(key);
    }

    const slug = await createSpot(env.DB, {
      name,
      type,
      city,
      address,
      mapsUrl,
      wifiMbps,
      noiseLevel,
      comfortScore,
      outletsLabel,
      priceRange,
      gradient,
      espressoPrice: form.get("espresso_price") ? Number(form.get("espresso_price")) : null,
      timing: str("timing") || null,
      tpe: form.get("tpe") === "1" ? true : form.get("tpe") === "0" ? false : null,
      nonSmoking:
        form.get("non_smoking") === "1" ? true : form.get("non_smoking") === "0" ? false : null,
      airConditioned:
        form.get("air_conditioned") === "1"
          ? true
          : form.get("air_conditioned") === "0"
            ? false
            : null,
      images: imageKeys,
    });

    return { ok: true, slug };
  }

  if (intent === "update-spot") {
    const str = (k: string) => ((form.get(k) as string | null) ?? "").trim();
    const slug = str("slug");
    const name = str("name");
    const type = str("type") as "café" | "coworking";
    const city = str("city");
    const address = str("address");
    const mapsUrl = str("maps_url");
    const wifiMbps = Number(form.get("wifi_mbps"));
    const noiseLevel = str("noise_level") as "quiet" | "moderate" | "lively";
    const comfortScore = Number(form.get("comfort_score"));
    const outletsLabel = str("outlets_label");
    const priceRange = str("price_range") as "$" | "$$" | "$$$";
    const gradient = str("gradient");

    if (
      !slug ||
      !name ||
      !type ||
      !city ||
      !address ||
      !wifiMbps ||
      !noiseLevel ||
      !comfortScore ||
      !outletsLabel ||
      !priceRange ||
      !gradient
    ) {
      return { ok: false, error: "All required fields must be filled." };
    }

    const files = form.getAll("images") as File[];
    const appendKeys: string[] = [];
    for (const file of files) {
      if (!file.size) continue;
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const key = `spots/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
      appendKeys.push(key);
    }

    await updateSpot(env.DB, {
      slug,
      name,
      type,
      city,
      address,
      mapsUrl,
      wifiMbps,
      noiseLevel,
      comfortScore,
      outletsLabel,
      priceRange,
      gradient,
      espressoPrice: form.get("espresso_price") ? Number(form.get("espresso_price")) : null,
      timing: str("timing") || null,
      tpe: form.get("tpe") === "1" ? true : form.get("tpe") === "0" ? false : null,
      nonSmoking:
        form.get("non_smoking") === "1" ? true : form.get("non_smoking") === "0" ? false : null,
      airConditioned:
        form.get("air_conditioned") === "1"
          ? true
          : form.get("air_conditioned") === "0"
            ? false
            : null,
      keepImages: form.getAll("keep_image") as string[],
      appendImages: appendKeys,
    });

    return { ok: true };
  }

  if (intent === "delete-spot") {
    const slug = (form.get("slug") as string) ?? "";
    if (!slug) return { ok: false, error: "Missing slug." };
    await deleteSpot(env.DB, slug);
    return { ok: true };
  }

  return { ok: false, error: "Unknown intent" };
}

// ── Inline spot edit form (used inside table row) ──────────────────────────────

function SpotEditForm({ spot, onClose }: { spot: Place; onClose: () => void }) {
  const [keptImages, setKeptImages] = useState<string[]>(spot.images ?? []);
  const fetcher = useFetcher<typeof action>();
  const busy = fetcher.state !== "idle";
  const prevFetcherState = useRef(fetcher.state);
  const [priceRange, setPriceRange] = useState(spot.priceRange);

  useEffect(() => {
    if (prevFetcherState.current !== "idle" && fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.ok === true) {
        toast.success("Spot updated");
        onClose();
      } else if (fetcher.data.ok === false && "error" in fetcher.data) {
        toast.error(fetcher.data.error);
      }
    }
    prevFetcherState.current = fetcher.state;
  }, [fetcher.state, fetcher.data, onClose]);

  return (
    <fetcher.Form
      method="post"
      encType="multipart/form-data"
      className="bg-muted/30 border-t border-border/50 p-6 space-y-5"
    >
      <input type="hidden" name="intent" value="update-spot" />
      <input type="hidden" name="slug" value={spot.slug} />

      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Basic Info
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name *">
          <Input name="name" required defaultValue={spot.name} />
        </Field>
        <Field label="Type *">
          <Select name="type" required defaultValue={spot.type}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="café">Café</SelectItem>
              <SelectItem value="coworking">Coworking</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="City *">
          <Input name="city" required defaultValue={spot.city} />
        </Field>
        <Field label="Address *">
          <Input name="address" required defaultValue={spot.address} />
        </Field>
        <Field label="Google Maps URL">
          <Input name="maps_url" type="url" defaultValue={spot.mapsUrl} />
        </Field>
        <Field label="Opening Hours">
          <Input name="timing" defaultValue={spot.timing ?? ""} placeholder="Mon–Sat: 08:00 – 22:00" />
        </Field>
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground pt-1">
        Technical Details
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="WiFi Speed (Mbps) *">
          <Input name="wifi_mbps" type="number" required min="1" defaultValue={spot.wifiMbps} />
        </Field>
        <Field label="Noise Level *">
          <Select name="noise_level" required defaultValue={spot.noiseLevel}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="quiet">Quiet</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="lively">Lively</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Comfort Score (1–5) *">
          <Select name="comfort_score" required defaultValue={String(spot.comfortScore)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Power Outlets *">
          <Select name="outlets_label" required defaultValue={spot.outletsLabel}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="Limited">Limited</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Price Range *" hint={PRICE_RANGE_HINT}>
          <Select name="price_range" required value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="$">Budget</SelectItem>
              <SelectItem value="$$">Mid-range</SelectItem>
              <SelectItem value="$$$">Premium</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Vibe *">
          <Select name="gradient" required defaultValue={spot.gradient}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GRADIENTS.map((g) => (
                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Espresso Price (MAD)">
          <Input
            name="espresso_price"
            type="number"
            min="0"
            step="0.5"
            defaultValue={spot.espressoPrice ?? ""}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val > 0) setPriceRange(espressoToRange(val));
            }}
          />
        </Field>
        <Field label="TPE / Card Payment">
          <Select name="tpe" defaultValue={spot.tpe === null ? "" : spot.tpe ? "1" : "0"}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unknown</SelectItem>
              <SelectItem value="1">Yes</SelectItem>
              <SelectItem value="0">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Non-smoking area?">
          <Select name="non_smoking" defaultValue={spot.nonSmoking === null ? "" : spot.nonSmoking ? "1" : "0"}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unknown</SelectItem>
              <SelectItem value="1">Yes</SelectItem>
              <SelectItem value="0">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Air Conditioning?">
          <Select name="air_conditioned" defaultValue={spot.airConditioned === null ? "" : spot.airConditioned ? "1" : "0"}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unknown</SelectItem>
              <SelectItem value="1">Yes</SelectItem>
              <SelectItem value="0">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {spot.images && spot.images.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Current photos ({keptImages.length}/{spot.images.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {spot.images.map((src) => {
              const kept = keptImages.includes(src);
              return (
                <div key={src} className="relative w-20 h-20 shrink-0 group">
                  <div
                    className={cn(
                      "w-full h-full rounded-xl overflow-hidden border-2 transition-all",
                      kept ? "border-border opacity-100" : "border-destructive opacity-40",
                    )}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setKeptImages((prev) =>
                        kept ? prev.filter((u) => u !== src) : [...prev, src],
                      )
                    }
                    className={cn(
                      "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all shadow",
                      kept
                        ? "bg-muted-foreground/50 opacity-0 group-hover:opacity-100"
                        : "bg-destructive opacity-100",
                    )}
                    aria-label={kept ? "Remove photo" : "Restore photo"}
                  >
                    {kept ? <X size={10} /> : <Check size={10} />}
                  </button>
                  {kept && <input type="hidden" name="keep_image" value={src} />}
                </div>
              );
            })}
          </div>
          {keptImages.length < spot.images.length && (
            <p className="text-xs text-destructive font-medium">
              {spot.images.length - keptImages.length} photo
              {spot.images.length - keptImages.length > 1 ? "s" : ""} will be removed on save.
            </p>
          )}
        </div>
      )}

      <Field label="Add Photos">
        <input name="images" type="file" multiple accept="image/*" className={fileCls} />
      </Field>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={busy}
          className="h-10 px-6 rounded-lg bg-foreground hover:bg-primary text-background font-semibold text-sm transition-all disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save Changes"}
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="h-10 px-4 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted/50 transition-all"
        >
          Cancel
        </button>
      </div>
    </fetcher.Form>
  );
}

// ── Add spot form ──────────────────────────────────────────────────────────────

function AddSpotForm() {
  const [priceRange, setPriceRange] = useState("");
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <div className="space-y-5">
      <Form method="post" encType="multipart/form-data" className="space-y-5">
        <input type="hidden" name="intent" value="create-spot" />

        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Basic Info
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Name *">
            <Input name="name" required placeholder="Café Boavista" />
          </Field>
          <Field label="Type *">
            <Select name="type" required defaultValue="">
              <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="café">Café</SelectItem>
                <SelectItem value="coworking">Coworking</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="City *">
            <Input name="city" required placeholder="Casablanca" />
          </Field>
          <Field label="Address *">
            <Input name="address" required placeholder="12 Rue Hassan II" />
          </Field>
          <Field label="Google Maps URL">
            <Input name="maps_url" type="url" placeholder="https://maps.google.com/…" />
          </Field>
          <Field label="Opening Hours">
            <Input name="timing" placeholder="Mon–Sat: 08:00 – 22:00" />
          </Field>
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground pt-1">
          Technical Details
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Field label="WiFi Speed (Mbps) *">
            <Input name="wifi_mbps" type="number" required min="1" />
          </Field>
          <Field label="Noise Level *">
            <Select name="noise_level" required defaultValue="">
              <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="quiet">Quiet</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="lively">Lively</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Comfort Score (1–5) *">
            <Select name="comfort_score" required defaultValue="">
              <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Power Outlets *">
            <Select name="outlets_label" required defaultValue="">
              <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="Limited">Limited</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Price Range *" hint={PRICE_RANGE_HINT}>
            <Select name="price_range" required value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="$">Budget</SelectItem>
                <SelectItem value="$$">Mid-range</SelectItem>
                <SelectItem value="$$$">Premium</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Vibe *">
            <Select name="gradient" required defaultValue="">
              <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {GRADIENTS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Espresso Price (MAD)">
            <Input
              name="espresso_price"
              type="number"
              min="0"
              step="0.5"
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) setPriceRange(espressoToRange(val));
              }}
            />
          </Field>
          <Field label="TPE / Card Payment">
            <Select name="tpe" defaultValue="">
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unknown</SelectItem>
                <SelectItem value="1">Yes</SelectItem>
                <SelectItem value="0">No</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Non-smoking area?">
            <Select name="non_smoking" defaultValue="">
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unknown</SelectItem>
                <SelectItem value="1">Yes</SelectItem>
                <SelectItem value="0">No</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Air Conditioning?">
            <Select name="air_conditioned" defaultValue="">
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unknown</SelectItem>
                <SelectItem value="1">Yes</SelectItem>
                <SelectItem value="0">No</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Photos (optional)">
          <input name="images" type="file" multiple accept="image/*" className={fileCls} />
        </Field>

        <Button
          type="submit"
          disabled={busy}
          className="h-10 px-6 rounded-lg bg-foreground hover:bg-primary text-background font-semibold text-sm transition-all disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create Spot"}
        </Button>
      </Form>
    </div>
  );
}

const fileCls =
  "w-full rounded-xl border border-border px-4 py-3 text-sm text-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-foreground file:text-background hover:file:bg-primary file:transition-all";

function espressoToRange(mad: number): "$" | "$$" | "$$$" {
  if (mad <= 20) return "$";
  if (mad <= 35) return "$$";
  return "$$$";
}

const PRICE_RANGE_HINT = (
  <ul className="mt-1 space-y-0.5 text-xs text-foreground/60">
    <li>· Budget — espresso ≤ 20 MAD</li>
    <li>· Mid-range — espresso 21–35 MAD</li>
    <li>· Premium — espresso &gt; 35 MAD</li>
  </ul>
);

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
      {hint}
    </div>
  );
}

// ── Spots TanStack Table ───────────────────────────────────────────────────────

function SpotsTable({ spots }: { spots: Place[] }) {
  const deleteFetcher = useFetcher();

  const cityOptions = useMemo<DataTableOption[]>(
    () => [...new Set(spots.map((s) => s.city))].sort().map((c) => ({ label: c, value: c })),
    [spots],
  );

  const columns = useMemo(
    () =>
      spotsColumns({
        cityOptions,
        onDelete: (slug) =>
          deleteFetcher.submit({ intent: "delete-spot", slug }, { method: "post" }),
      }),
    [cityOptions, deleteFetcher],
  );

  const table = useClientDataTable({
    data: spots,
    columns,
    getRowId: (row) => row.slug,
    initialState: {
      sorting: [{ id: "rating", desc: true }],
      columnPinning: { right: ["actions"] },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  });

  if (spots.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <AlertCircle className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No spots yet. Add one from the "Add Spot" tab.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2.5 overflow-auto">
      <DataTableToolbar table={table} />
      <DataTable
        pageSizeOptions={[5, 10, 20, 50]}
        table={table}
        renderSubComponent={({ row }) => (
          <SpotEditForm spot={row.original} onClose={() => row.toggleExpanded(false)} />
        )}
      />
    </div>
  );
}

// ── Submissions TanStack Table ─────────────────────────────────────────────────

function ApprovalForm({
  sub,
  onClose,
  busy,
}: {
  sub: Submission;
  onClose: () => void;
  busy: boolean;
}) {
  const [priceRange, setPriceRange] = useState(sub.priceRange ?? "");
  return (
    <Form method="post" className="p-6 space-y-5">
      <input type="hidden" name="intent" value="approve" />
      <input type="hidden" name="id" value={sub.id} />
      <input type="hidden" name="submission_json" value={JSON.stringify(sub)} />

      <div className="flex items-center gap-3 pb-1">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">{sub.name}</p>
          <p className="text-xs text-muted-foreground">
            {sub.city} · {sub.address}
            {sub.submitterEmail && ` · ${sub.submitterEmail}`}
          </p>
          {sub.notes && (
            <p className="text-xs text-muted-foreground/70 italic mt-0.5">"{sub.notes}"</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-7 px-3 rounded-lg border border-border text-muted-foreground text-xs font-medium hover:border-destructive hover:text-destructive transition-all"
        >
          Cancel
        </button>
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Fill in technical details to publish
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Field label="WiFi Speed (Mbps) *">
          <Input name="wifi_mbps" type="number" required min="1" defaultValue={sub.wifiMbps ?? ""} />
        </Field>
        <Field label="Noise Level *">
          <Select name="noise_level" required defaultValue="">
            <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="quiet">Quiet</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="lively">Lively</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Comfort Score (1–5) *">
          <Select name="comfort_score" required defaultValue="">
            <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Power Outlets *">
          <Select name="outlets_label" required defaultValue="">
            <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="Limited">Limited</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Price Range *" hint={PRICE_RANGE_HINT}>
          <Select name="price_range" required value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="$">Budget</SelectItem>
              <SelectItem value="$$">Mid-range</SelectItem>
              <SelectItem value="$$$">Premium</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Vibe *">
          <Select name="gradient" required defaultValue="">
            <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {GRADIENTS.map((g) => (
                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="TPE / Card Payment">
          <Select name="tpe" defaultValue={sub.tpe === null ? "" : sub.tpe ? "1" : "0"}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unknown</SelectItem>
              <SelectItem value="1">Yes</SelectItem>
              <SelectItem value="0">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Non-smoking area?">
          <Select name="non_smoking" defaultValue={sub.nonSmoking === null ? "" : sub.nonSmoking ? "1" : "0"}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unknown</SelectItem>
              <SelectItem value="1">Yes</SelectItem>
              <SelectItem value="0">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Air Conditioning?">
          <Select name="air_conditioned" defaultValue={sub.airConditioned === null ? "" : sub.airConditioned ? "1" : "0"}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unknown</SelectItem>
              <SelectItem value="1">Yes</SelectItem>
              <SelectItem value="0">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {!sub.mapsUrl && (
        <Field label="Google Maps URL">
          <input name="maps_url" type="url" className={fieldCls} />
        </Field>
      )}
      {!sub.timing && (
        <Field label="Opening Hours">
          <input name="timing" placeholder="Mon–Sat: 08:00 – 22:00" className={fieldCls} />
        </Field>
      )}
      {sub.type === "café" && !sub.espressoPrice && (
        <Field label="Espresso Price (MAD)">
          <Input
            name="espresso_price"
            type="number"
            min="0"
            step="0.5"
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val > 0) setPriceRange(espressoToRange(val));
            }}
          />
        </Field>
      )}

      <Button
        type="submit"
        disabled={busy}
        className="h-10 px-6 rounded-lg bg-foreground hover:bg-primary text-background font-semibold text-sm transition-all disabled:opacity-50"
      >
        {busy ? "Publishing…" : "Publish Spot"}
      </Button>
    </Form>
  );
}

function SubmissionsTable({
  pending,
  approved,
  rejected,
}: {
  pending: Submission[];
  approved: Submission[];
  rejected: Submission[];
}) {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const rejectFetcher = useFetcher();
  const [approvingSub, setApprovingSub] = useState<Submission | null>(null);
  const prevNavState = useRef(navigation.state);

  useEffect(() => {
    if (prevNavState.current !== "idle" && navigation.state === "idle") {
      setApprovingSub(null);
    }
    prevNavState.current = navigation.state;
  }, [navigation.state]);

  const allSubs = useMemo(
    () => [...pending, ...approved, ...rejected],
    [pending, approved, rejected],
  );

  const cityOptions = useMemo<DataTableOption[]>(
    () => [...new Set(allSubs.map((s) => s.city))].sort().map((c) => ({ label: c, value: c })),
    [allSubs],
  );

  const columns = useMemo(
    () =>
      submissionsColumns({
        cityOptions,
        onApprove: (sub) => setApprovingSub(sub),
        onReject: (id) =>
          rejectFetcher.submit({ intent: "reject", id: String(id) }, { method: "post" }),
      }),
    [cityOptions, rejectFetcher],
  );

  const table = useClientDataTable({
    data: allSubs,
    columns,
    getRowId: (row) => String(row.id),
    initialState: {
      sorting: [{ id: "submittedAt", desc: true }],
      columnFilters: [{ id: "status", value: ["pending"] }],
      columnPinning: { right: ["actions"] },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  });

  return (
    <div className="flex w-full flex-col gap-2.5 overflow-auto">
      <DataTableToolbar table={table} />
      <DataTable pageSizeOptions={[5, 10, 20, 50]} table={table} />
      {approvingSub && (
        <Card className="mt-2 overflow-hidden p-0 gap-0">
          <div className="px-5 py-4 border-b border-border/70">
            <p className="text-sm font-semibold text-foreground">Approve: {approvingSub.name}</p>
          </div>
          <ApprovalForm sub={approvingSub} onClose={() => setApprovingSub(null)} busy={busy} />
        </Card>
      )}
    </div>
  );
}

const ACTION_LABELS: Record<string, string> = {
  approve: "Submission approved",
  reject: "Submission rejected",
  "create-spot": "Spot created",
  "delete-spot": "Spot deleted",
};

export default function Admin({ loaderData }: Route.ComponentProps) {
  const { authed, firstRun, email, pending, approved, rejected, spots } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const [tab, setTab] = useState<"spots" | "submissions" | "add">("spots");
  const prevNavState = useRef(navigation.state);
  const prevFormRef = useRef<string | null>(null);

  useEffect(() => {
    if (navigation.state === "submitting") {
      prevFormRef.current = navigation.formData?.get("intent") as string | null;
    }
    if (prevNavState.current === "submitting" && navigation.state === "idle" && authed) {
      const intent = prevFormRef.current;
      if (!intent || intent === "login" || intent === "setup" || intent === "update-spot") return;
      if (actionData?.ok === true) toast.success(ACTION_LABELS[intent] ?? "Done");
      else if (actionData?.ok === false && "error" in actionData) toast.error(actionData.error);
    }
    prevNavState.current = navigation.state;
  }, [navigation.state, actionData, authed]);

  if (!authed) {
    const inputCls =
      "w-full h-12 rounded-xl border border-border px-4 text-foreground font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-background";

    if (firstRun) {
      return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-xl">Moromads Admin</CardTitle>
              <CardDescription>Create your admin account to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="intent" value="setup" />
                <Field label="Email">
                  <input
                    name="email"
                    type="email"
                    required
                    autoFocus
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                </Field>
                <Field label="Password">
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    minLength={8}
                    className={inputCls}
                  />
                </Field>
                <Field label="Confirm Password">
                  <input
                    name="confirm"
                    type="password"
                    required
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </Field>
                {actionData?.ok === false && "error" in actionData && (
                  <p className="text-sm font-medium text-destructive">{actionData.error}</p>
                )}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 rounded-lg bg-foreground hover:bg-primary text-background font-semibold transition-all"
                >
                  {submitting ? "Creating account…" : "Create Account"}
                </Button>
              </Form>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-xl">Moromads Admin</CardTitle>
            <CardDescription>Sign in to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="login" />
              <Field label="Email">
                <input
                  name="email"
                  type="email"
                  required
                  autoFocus
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </Field>
              <Field label="Password">
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className={inputCls}
                />
              </Field>
              {actionData?.ok === false && "error" in actionData && (
                <p className="text-sm font-medium text-destructive">{actionData.error}</p>
              )}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-lg bg-foreground hover:bg-primary text-background font-semibold transition-all"
              >
                {submitting ? "Signing in…" : "Sign In"}
              </Button>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Authed dashboard ────────────────────────────────────────────────────────
  const tabBtn = (t: typeof tab, label: string) => (
    <button
      onClick={() => setTab(t)}
      className={cn(
        "px-4 py-2 text-sm font-medium rounded-lg transition-all",
        tab === t
          ? "bg-background shadow-sm text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border/70 px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <LayoutGrid size={18} className="text-primary" />
          <span className="font-semibold text-foreground text-sm">Moromads Admin</span>
        </div>
        <div className="flex items-center gap-3">
          {email && <span className="text-xs text-muted-foreground hidden sm:block">{email}</span>}
          <Form method="post" action="/admin/logout">
            <button
              type="submit"
              className="h-8 px-3 rounded-lg border border-border text-muted-foreground text-xs font-medium hover:border-destructive hover:text-destructive transition-all"
            >
              Sign out
            </button>
          </Form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Page title */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-primary uppercase tracking-widest">
            moromads control center
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Live Spots", value: spots.length, icon: MapPin, color: "text-primary" },
            { label: "Pending", value: pending.length, icon: Clock, color: "text-amber-500" },
            { label: "Approved", value: approved.length, icon: Check, color: "text-emerald-500" },
            { label: "Rejected", value: rejected.length, icon: X, color: "text-red-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className={cn("size-4", color)} aria-hidden />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-muted/50 rounded-xl p-1 inline-flex gap-1">
          {tabBtn("spots", `Spots (${spots.length})`)}
          {tabBtn(
            "submissions",
            `Submissions (${pending.length + approved.length + rejected.length})`,
          )}
          {tabBtn("add", "Add Spot")}
        </div>

        {/* Spots tab — TanStack Table */}
        {tab === "spots" && <SpotsTable spots={spots} />}

        {/* Submissions tab */}
        {tab === "submissions" && (
          <SubmissionsTable pending={pending} approved={approved} rejected={rejected} />
        )}

        {/* Add Spot tab */}
        {tab === "add" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PlusCircle size={16} className="text-primary" />
                <CardTitle>Add New Spot</CardTitle>
              </div>
              <CardDescription>Publish a spot directly without a submission.</CardDescription>
            </CardHeader>
            <CardContent>
              <AddSpotForm />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
