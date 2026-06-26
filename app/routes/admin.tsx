import type { Route } from "./+types/admin";
import { Form, redirect, useActionData, useNavigation, useFetcher } from "react-router";
import {
  getAllSpots,
  getSubmissions,
  approveSubmission,
  rejectSubmission,
  createSpot,
  updateSpot,
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
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useState, useEffect, useRef } from "react";
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
  const intent = String(form.get("intent"));

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
    const noiseLevel = String(form.get("noise_level")) as ApprovalDetails["noiseLevel"];
    const comfortScore = Number(form.get("comfort_score"));
    const outletsLabel = String(form.get("outlets_label"));
    const priceRange = String(form.get("price_range")) as ApprovalDetails["priceRange"];
    const gradient = String(form.get("gradient"));

    if (!wifiMbps || !noiseLevel || !comfortScore || !outletsLabel || !priceRange || !gradient) {
      return { ok: false, error: "All approval fields are required." };
    }

    const subRaw = form.get("submission_json");
    if (!subRaw) return { ok: false, error: "Missing submission data." };
    const sub = JSON.parse(String(subRaw)) as Submission;

    await approveSubmission(env.DB, id, sub, {
      wifiMbps,
      noiseLevel,
      comfortScore,
      outletsLabel,
      priceRange,
      gradient,
      mapsUrl: String(form.get("maps_url") || "") || undefined,
      timing: String(form.get("timing") || "") || undefined,
      tpe: form.get("tpe") === "1" ? true : form.get("tpe") === "0" ? false : null,
      nonSmoking:
        form.get("non_smoking") === "1" ? true : form.get("non_smoking") === "0" ? false : null,
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
      keepImages: form.getAll("keep_image") as string[],
      appendImages: appendKeys,
    });

    return { ok: true };
  }

  return { ok: false, error: "Unknown intent" };
}

function AddSpotForm() {
  const [open, setOpen] = useState(false);
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          Add Spot Directly
        </h2>
        <button
          onClick={() => setOpen((v) => !v)}
          className="h-8 px-4 rounded-xl bg-gray-900 text-white text-xs font-black uppercase tracking-widest hover:bg-primary transition-all flex items-center gap-1"
        >
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {open ? "Cancel" : "New Spot"}
        </button>
      </div>

      {open && (
        <Form
          method="post"
          encType="multipart/form-data"
          className="bg-white border border-gray-100 rounded-3xl p-6 space-y-5 shadow-sm"
        >
          <input type="hidden" name="intent" value="create-spot" />

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Basic Info
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Name *">
              <input name="name" required placeholder="Café Boavista" className={fieldCls} />
            </Field>
            <Field label="Type *">
              <select name="type" required defaultValue="" className={fieldCls}>
                <option value="" disabled>
                  Select…
                </option>
                <option value="café">Café</option>
                <option value="coworking">Coworking</option>
              </select>
            </Field>
            <Field label="City *">
              <input name="city" required placeholder="Casablanca" className={fieldCls} />
            </Field>
            <Field label="Address *">
              <input name="address" required placeholder="12 Rue Hassan II" className={fieldCls} />
            </Field>
            <Field label="Google Maps URL">
              <input
                name="maps_url"
                type="url"
                placeholder="https://maps.google.com/…"
                className={fieldCls}
              />
            </Field>
            <Field label="Opening Hours">
              <input name="timing" placeholder="Mon–Sat: 08:00 – 22:00" className={fieldCls} />
            </Field>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 pt-2">
            Technical Details
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Field label="WiFi Speed (Mbps) *">
              <input name="wifi_mbps" type="number" required min="1" className={fieldCls} />
            </Field>
            <Field label="Noise Level *">
              <select name="noise_level" required defaultValue="" className={fieldCls}>
                <option value="" disabled>
                  Select…
                </option>
                <option value="quiet">Quiet</option>
                <option value="moderate">Moderate</option>
                <option value="lively">Lively</option>
              </select>
            </Field>
            <Field label="Comfort Score (1–5) *">
              <select name="comfort_score" required defaultValue="" className={fieldCls}>
                <option value="" disabled>
                  Select…
                </option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Power Outlets *">
              <select name="outlets_label" required defaultValue="" className={fieldCls}>
                <option value="" disabled>
                  Select…
                </option>
                <option value="Yes">Yes</option>
                <option value="Limited">Limited</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Price Range *">
              <select name="price_range" required defaultValue="" className={fieldCls}>
                <option value="" disabled>
                  Select…
                </option>
                <option value="$">$ Budget</option>
                <option value="$$">$$ Mid-range</option>
                <option value="$$$">$$$ Premium</option>
              </select>
            </Field>
            <Field label="Card Gradient *">
              <select name="gradient" required defaultValue="" className={fieldCls}>
                <option value="" disabled>
                  Select…
                </option>
                {GRADIENTS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Espresso Price (MAD)">
              <input name="espresso_price" type="number" min="0" step="0.5" className={fieldCls} />
            </Field>
            <Field label="TPE / Card Payment">
              <select name="tpe" defaultValue="" className={fieldCls}>
                <option value="">Unknown</option>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </Field>
            <Field label="Non-smoking area?">
              <select name="non_smoking" defaultValue="" className={fieldCls}>
                <option value="">Unknown</option>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </Field>
          </div>

          <Field label="Photos (optional)">
            <input
              name="images"
              type="file"
              multiple
              accept="image/*"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-gray-900 file:text-white hover:file:bg-primary file:transition-all"
            />
          </Field>

          <Button
            type="submit"
            disabled={busy}
            className="h-12 px-8 rounded-2xl bg-gray-900 hover:bg-primary text-white font-black uppercase tracking-widest text-sm transition-all disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create Spot"}
          </Button>
        </Form>
      )}
    </section>
  );
}

function SpotEditCard({ spot }: { spot: Place }) {
  const [open, setOpen] = useState(false);
  const [keptImages, setKeptImages] = useState<string[]>(spot.images ?? []);
  const fetcher = useFetcher<typeof action>();
  const busy = fetcher.state !== "idle";
  const prevFetcherState = useRef(fetcher.state);

  useEffect(() => {
    if (prevFetcherState.current !== "idle" && fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.ok === true) toast.success("Spot updated");
      else if (fetcher.data.ok === false && "error" in fetcher.data)
        toast.error(fetcher.data.error);
    }
    prevFetcherState.current = fetcher.state;
  }, [fetcher.state, fetcher.data]);

  return (
    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-gray-900">{spot.name}</span>
            <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-black uppercase">
              {spot.type}
            </span>
            <span className="text-xs text-gray-400 font-medium">{spot.city}</span>
          </div>
          <p className="text-xs text-gray-400 font-medium mt-0.5">/spots/{spot.slug}</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="h-8 px-4 rounded-xl bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-1 shrink-0"
        >
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {open ? "Cancel" : "Edit"}
        </button>
      </div>

      {open && (
        <fetcher.Form
          method="post"
          encType="multipart/form-data"
          className="border-t border-gray-100 p-6 space-y-5 bg-gray-50"
        >
          <input type="hidden" name="intent" value="update-spot" />
          <input type="hidden" name="slug" value={spot.slug} />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Name *">
              <input name="name" required defaultValue={spot.name} className={fieldCls} />
            </Field>
            <Field label="Type *">
              <select name="type" required defaultValue={spot.type} className={fieldCls}>
                <option value="café">Café</option>
                <option value="coworking">Coworking</option>
              </select>
            </Field>
            <Field label="City *">
              <input name="city" required defaultValue={spot.city} className={fieldCls} />
            </Field>
            <Field label="Address *">
              <input name="address" required defaultValue={spot.address} className={fieldCls} />
            </Field>
            <Field label="Google Maps URL">
              <input name="maps_url" type="url" defaultValue={spot.mapsUrl} className={fieldCls} />
            </Field>
            <Field label="Opening Hours">
              <input
                name="timing"
                defaultValue={spot.timing ?? ""}
                placeholder="Mon–Sat: 08:00 – 22:00"
                className={fieldCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="WiFi Speed (Mbps) *">
              <input
                name="wifi_mbps"
                type="number"
                required
                min="1"
                defaultValue={spot.wifiMbps}
                className={fieldCls}
              />
            </Field>
            <Field label="Noise Level *">
              <select
                name="noise_level"
                required
                defaultValue={spot.noiseLevel}
                className={fieldCls}
              >
                <option value="quiet">Quiet</option>
                <option value="moderate">Moderate</option>
                <option value="lively">Lively</option>
              </select>
            </Field>
            <Field label="Comfort Score (1–5) *">
              <select
                name="comfort_score"
                required
                defaultValue={spot.comfortScore}
                className={fieldCls}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Power Outlets *">
              <select
                name="outlets_label"
                required
                defaultValue={spot.outletsLabel}
                className={fieldCls}
              >
                <option value="Yes">Yes</option>
                <option value="Limited">Limited</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Price Range *">
              <select
                name="price_range"
                required
                defaultValue={spot.priceRange}
                className={fieldCls}
              >
                <option value="$">$ Budget</option>
                <option value="$$">$$ Mid-range</option>
                <option value="$$$">$$$ Premium</option>
              </select>
            </Field>
            <Field label="Card Gradient *">
              <select name="gradient" required defaultValue={spot.gradient} className={fieldCls}>
                {GRADIENTS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Espresso Price (MAD)">
              <input
                name="espresso_price"
                type="number"
                min="0"
                step="0.5"
                defaultValue={spot.espressoPrice ?? ""}
                className={fieldCls}
              />
            </Field>
            <Field label="TPE / Card Payment">
              <select
                name="tpe"
                defaultValue={spot.tpe === null ? "" : spot.tpe ? "1" : "0"}
                className={fieldCls}
              >
                <option value="">Unknown</option>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </Field>
            <Field label="Non-smoking area?">
              <select
                name="non_smoking"
                defaultValue={spot.nonSmoking === null ? "" : spot.nonSmoking ? "1" : "0"}
                className={fieldCls}
              >
                <option value="">Unknown</option>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </Field>
          </div>

          {spot.images && spot.images.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">
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
                          kept ? "border-gray-200 opacity-100" : "border-red-300 opacity-40",
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
                          "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-black transition-all shadow",
                          kept
                            ? "bg-gray-400 opacity-0 group-hover:opacity-100"
                            : "bg-red-500 opacity-100",
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
                <p className="text-xs text-red-500 font-bold">
                  {spot.images.length - keptImages.length} photo
                  {spot.images.length - keptImages.length > 1 ? "s" : ""} will be removed on save.
                </p>
              )}
            </div>
          )}

          <Field label="Add photos (appends to existing)">
            <input
              name="images"
              type="file"
              multiple
              accept="image/*"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-gray-900 file:text-white hover:file:bg-primary file:transition-all"
            />
          </Field>

          <Button
            type="submit"
            disabled={busy}
            className="h-12 px-8 rounded-2xl bg-gray-900 hover:bg-primary text-white font-black uppercase tracking-widest text-sm transition-all disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save Changes"}
          </Button>
        </fetcher.Form>
      )}
    </div>
  );
}

function SubmissionCard({ sub }: { sub: Submission }) {
  const [open, setOpen] = useState(false);
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-black text-gray-900">{sub.name}</span>
            <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-black uppercase">
              {sub.type}
            </span>
          </div>
          <p className="text-sm text-gray-500 font-medium mt-0.5">
            {sub.city} · {sub.address}
          </p>
          {sub.notes && <p className="text-xs text-gray-400 mt-1 italic">"{sub.notes}"</p>}
          <p className="text-[10px] text-gray-300 font-medium mt-2">
            {sub.submittedAt} {sub.submitterEmail && `· ${sub.submitterEmail}`}
          </p>
        </div>

        {sub.status === "pending" && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setOpen((v) => !v)}
              className="h-9 px-4 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-1"
            >
              Approve {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <Form method="post">
              <input type="hidden" name="intent" value="reject" />
              <input type="hidden" name="id" value={sub.id} />
              <button
                type="submit"
                disabled={busy}
                className="h-9 px-4 rounded-xl bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all"
              >
                Reject
              </button>
            </Form>
          </div>
        )}

        {sub.status === "approved" && (
          <span className="h-7 px-3 rounded-lg bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase flex items-center gap-1">
            <Check size={12} /> Live
          </span>
        )}
        {sub.status === "rejected" && (
          <span className="h-7 px-3 rounded-lg bg-red-50 text-red-400 text-[10px] font-black uppercase flex items-center gap-1">
            <X size={12} /> Rejected
          </span>
        )}
      </div>

      {open && sub.status === "pending" && (
        <Form method="post" className="border-t border-gray-100 p-6 space-y-5 bg-gray-50">
          <input type="hidden" name="intent" value="approve" />
          <input type="hidden" name="id" value={sub.id} />
          <input type="hidden" name="submission_json" value={JSON.stringify(sub)} />

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Fill in technical details to publish
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Field label="WiFi Speed (Mbps) *">
              <input
                name="wifi_mbps"
                type="number"
                required
                defaultValue={sub.wifiMbps ?? ""}
                min="1"
                className={fieldCls}
              />
            </Field>
            <Field label="Noise Level *">
              <select name="noise_level" required defaultValue="" className={fieldCls}>
                <option value="" disabled>
                  Select…
                </option>
                <option value="quiet">Quiet</option>
                <option value="moderate">Moderate</option>
                <option value="lively">Lively</option>
              </select>
            </Field>
            <Field label="Comfort Score (1–5) *">
              <select name="comfort_score" required defaultValue="" className={fieldCls}>
                <option value="" disabled>
                  Select…
                </option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Power Outlets *">
              <select name="outlets_label" required defaultValue="" className={fieldCls}>
                <option value="" disabled>
                  Select…
                </option>
                <option value="Yes">Yes</option>
                <option value="Limited">Limited</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Price Range *">
              <select
                name="price_range"
                required
                defaultValue={sub.priceRange ?? ""}
                className={fieldCls}
              >
                <option value="" disabled>
                  Select…
                </option>
                <option value="$">$ Budget</option>
                <option value="$$">$$ Mid-range</option>
                <option value="$$$">$$$ Premium</option>
              </select>
            </Field>
            <Field label="Card Gradient *">
              <select name="gradient" required defaultValue="" className={fieldCls}>
                <option value="" disabled>
                  Select…
                </option>
                {GRADIENTS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="TPE / Card Payment">
              <select
                name="tpe"
                defaultValue={sub.tpe === null ? "" : sub.tpe ? "1" : "0"}
                className={fieldCls}
              >
                <option value="">Unknown</option>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </Field>
            <Field label="Non-smoking area?">
              <select
                name="non_smoking"
                defaultValue={sub.nonSmoking === null ? "" : sub.nonSmoking ? "1" : "0"}
                className={fieldCls}
              >
                <option value="">Unknown</option>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
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
              <input name="espresso_price" type="number" min="0" step="0.5" className={fieldCls} />
            </Field>
          )}

          <Button
            type="submit"
            disabled={busy}
            className="h-12 px-8 rounded-2xl bg-gray-900 hover:bg-primary text-white font-black uppercase tracking-widest text-sm transition-all disabled:opacity-50"
          >
            {busy ? "Publishing…" : "Publish Spot"}
          </Button>
        </Form>
      )}
    </div>
  );
}

const fieldCls =
  "w-full h-11 rounded-xl border border-gray-200 px-4 text-gray-900 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
        {label}
      </label>
      {children}
    </div>
  );
}

const ACTION_LABELS: Record<string, string> = {
  approve: "Submission approved",
  reject: "Submission rejected",
  "create-spot": "Spot created",
  "update-spot": "Spot updated",
};

export default function Admin({ loaderData }: Route.ComponentProps) {
  const { authed, firstRun, email, pending, approved, rejected, spots } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const prevNavState = useRef(navigation.state);
  const prevFormRef = useRef<string | null>(null);

  useEffect(() => {
    if (navigation.state === "submitting") {
      prevFormRef.current = navigation.formData?.get("intent") as string | null;
    }
    if (prevNavState.current === "submitting" && navigation.state === "idle" && authed) {
      const intent = prevFormRef.current;
      if (!intent || intent === "login" || intent === "setup") return;
      if (actionData?.ok === true) {
        toast.success(ACTION_LABELS[intent] ?? "Done");
      } else if (actionData?.ok === false && "error" in actionData) {
        toast.error(actionData.error);
      }
    }
    prevNavState.current = navigation.state;
  }, [navigation.state, actionData, authed]);

  if (!authed) {
    const inputCls =
      "w-full h-14 rounded-2xl border border-gray-200 px-5 text-gray-900 font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

    if (firstRun) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-8">
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-black text-gray-900">Moromads Admin</h1>
              <p className="text-sm text-gray-400 font-medium">
                Create your admin account to get started
              </p>
            </div>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="setup" />
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  autoFocus
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  minLength={8}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                  Confirm Password
                </label>
                <input
                  name="confirm"
                  type="password"
                  required
                  placeholder="••••••••"
                  className={inputCls}
                />
              </div>
              {actionData?.ok === false && "error" in actionData && (
                <p className="text-sm font-bold text-red-500">{actionData.error}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-14 rounded-2xl bg-gray-900 hover:bg-primary text-white font-black uppercase tracking-widest text-sm transition-all disabled:opacity-50"
              >
                {submitting ? "Creating account…" : "Create Account"}
              </button>
            </Form>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black text-gray-900">Moromads Admin</h1>
            <p className="text-sm text-gray-400 font-medium">Sign in to continue</p>
          </div>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="login" />
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoFocus
                placeholder="you@example.com"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className={inputCls}
              />
            </div>
            {actionData?.ok === false && "error" in actionData && (
              <p className="text-sm font-bold text-red-500">{actionData.error}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-14 rounded-2xl bg-gray-900 hover:bg-primary text-white font-black uppercase tracking-widest text-sm transition-all disabled:opacity-50"
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </Form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-8 h-16 flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-900">Moromads Admin</h1>
        <div className="flex items-center gap-4">
          {email && (
            <span className="text-xs text-gray-400 font-medium hidden sm:block">{email}</span>
          )}
          <span className="text-xs font-black uppercase tracking-widest text-gray-400">
            {pending.length} pending
          </span>
          <Form method="post" action="/admin/logout">
            <button
              type="submit"
              className="h-8 px-4 rounded-xl bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all"
            >
              Log out
            </button>
          </Form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-12">
        {actionData?.ok === false && (
          <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-bold">
            {actionData.error}
          </div>
        )}

        <AddSpotForm />

        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Live Spots ({spots.length})
          </h2>
          {spots.map((spot: Place) => (
            <SpotEditCard key={spot.slug} spot={spot} />
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Pending ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p className="text-gray-400 text-sm font-medium">No pending submissions.</p>
          ) : (
            pending.map((sub: Submission) => <SubmissionCard key={sub.id} sub={sub} />)
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Approved ({approved.length})
          </h2>
          {approved.map((sub: Submission) => (
            <SubmissionCard key={sub.id} sub={sub} />
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Rejected ({rejected.length})
          </h2>
          {rejected.map((sub: Submission) => (
            <SubmissionCard key={sub.id} sub={sub} />
          ))}
        </section>
      </main>
    </div>
  );
}
