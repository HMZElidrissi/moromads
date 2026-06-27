import type { Route } from "./+types/admin";
import { Form, Link, redirect, useActionData, useNavigation, useSearchParams } from "react-router";
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
import { Check, X, MapPin, Clock, LayoutGrid, PlusCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { SpotsTable } from "~/components/admin/spots-table";
import { SubmissionsTable } from "~/components/admin/submissions-table";
import { AddSpotForm } from "~/components/admin/add-spot-form";
import { Field } from "~/components/admin/shared";

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
      staffScore: form.get("staff_score") ? Number(form.get("staff_score")) : null,
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
      staffScore: form.get("staff_score") ? Number(form.get("staff_score")) : null,
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
      staffScore: form.get("staff_score") ? Number(form.get("staff_score")) : null,
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

const ACTION_LABELS: Record<string, string> = {
  approve: "Submission approved",
  reject: "Submission rejected",
  "create-spot": "Spot created",
  "delete-spot": "Spot deleted",
};

const inputCls =
  "w-full h-12 rounded-xl border border-border px-4 text-foreground font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-background";

export default function Admin({ loaderData }: Route.ComponentProps) {
  const { authed, firstRun, email, pending, approved, rejected, spots } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as "spots" | "submissions" | "add") ?? "spots";
  const setTab = (t: "spots" | "submissions" | "add") =>
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set("tab", t);
        return p;
      },
      { replace: true },
    );
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
      <header className="bg-background border-b border-border/70 px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
          <LayoutGrid size={18} className="text-primary" />
          <span className="font-semibold text-foreground text-sm">Moromads Admin</span>
        </Link>
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
        <div className="space-y-1">
          <p className="text-xs font-medium text-primary uppercase tracking-widest">
            moromads control center
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        </div>

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

        <div className="bg-muted/50 rounded-xl p-1 inline-flex gap-1">
          {tabBtn("spots", `Spots (${spots.length})`)}
          {tabBtn(
            "submissions",
            `Submissions (${pending.length + approved.length + rejected.length})`,
          )}
          {tabBtn("add", "Add Spot")}
        </div>

        {tab === "spots" && <SpotsTable spots={spots} />}

        {tab === "submissions" && (
          <SubmissionsTable pending={pending} approved={approved} rejected={rejected} />
        )}

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
