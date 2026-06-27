import type { Route } from "./+types/add-spot";
import { Form, Link, useActionData, useNavigation } from "react-router";
import { addSubmission } from "~/lib/db.server";
import { cloudflareContext } from "../../load-context";
import { ChevronLeft, Check } from "lucide-react";
import { Button } from "~/components/ui/button";

const CITIES = [
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Tangier",
  "Fez",
  "Agadir",
  "Mohammedia",
  "Taghazout",
  "Essaouira",
  "Other",
];

export function meta() {
  const title = "Add a Spot | Moromads";
  const description =
    "Know a great café or coworking space in Morocco? Submit it to the Moromads directory.";
  return [
    { title },
    { name: "description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Moromads" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { name: "twitter:card", content: "summary" },
  ];
}

export async function action({ request, context }: Route.ActionArgs) {
  const { env } = context.get(cloudflareContext);
  const form = await request.formData();
  const str = (key: string) => ((form.get(key) as string | null) ?? "").trim();

  const name = str("name");
  const type = str("type");
  const city = str("city");
  const address = str("address");

  if (!name || !type || !city || !address) {
    return { ok: false, error: "Name, type, city and address are required." };
  }
  if (type !== "café" && type !== "coworking") {
    return { ok: false, error: "Invalid spot type." };
  }

  const wifiRaw = form.get("wifi_mbps") as string | null;
  const espressoRaw = form.get("espresso_price") as string | null;

  // Upload images to R2
  const files = form.getAll("images") as File[];
  const imageKeys: string[] = [];
  for (const file of files) {
    if (!file.size) continue;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const key = `spots/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    await env.BUCKET.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });
    imageKeys.push(key);
  }

  await addSubmission(env.DB, {
    name,
    type,
    city,
    address,
    mapsUrl: str("maps_url") || null,
    wifiMbps: wifiRaw ? Number(wifiRaw) : null,
    timing: str("timing") || null,
    espressoPrice: espressoRaw ? Number(espressoRaw) : null,
    priceRange: str("price_range") || null,
    tpe: form.get("tpe") === "1" ? true : form.get("tpe") === "0" ? false : null,
    nonSmoking:
      form.get("non_smoking") === "1" ? true : form.get("non_smoking") === "0" ? false : null,
    airConditioned:
      form.get("air_conditioned") === "1"
        ? true
        : form.get("air_conditioned") === "0"
          ? false
          : null,
    notes: str("notes") || null,
    submitterEmail: str("email") || null,
    images: imageKeys,
  });

  return { ok: true };
}

export default function AddSpot({ loaderData: _ }: Route.ComponentProps) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  if (actionData?.ok) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-8 p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
          <Check size={40} strokeWidth={3} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-gray-900">Spot Submitted!</h1>
          <p className="text-gray-500 font-medium mt-2 max-w-sm">
            Thanks for contributing. Our team will review your submission and add it to the
            directory soon.
          </p>
        </div>
        <Link
          to="/"
          className="h-12 px-8 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest text-sm flex items-center hover:bg-primary transition-colors"
        >
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[90rem] mx-auto px-6 h-20 flex items-center">
          <Link
            to="/"
            className="flex items-center gap-2 group text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform text-primary"
            />
            <span className="font-black uppercase tracking-widest text-xs">Back to Directory</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 pt-32 pb-20">
        <div className="max-w-2xl mx-auto px-6">
          <div className="mb-12">
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter leading-tight">
              Add a Spot
            </h1>
            <p className="text-gray-500 font-medium mt-3 text-lg">
              Know a great place to work from in Morocco? Tell us about it.
            </p>
          </div>

          <Form method="post" encType="multipart/form-data" className="space-y-8">
            {/* Basic Info */}
            <section className="space-y-5">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Basic Info
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                  Spot Name <span className="text-primary">*</span>
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Cloud Coffee Lab"
                  className="w-full h-14 rounded-2xl border border-gray-200 px-5 text-gray-900 font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                    Type <span className="text-primary">*</span>
                  </label>
                  <select
                    name="type"
                    required
                    defaultValue=""
                    className="w-full h-14 rounded-2xl border border-gray-200 px-5 text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  >
                    <option value="" disabled>
                      Select type
                    </option>
                    <option value="café">Café</option>
                    <option value="coworking">Coworking</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                    City <span className="text-primary">*</span>
                  </label>
                  <select
                    name="city"
                    required
                    defaultValue=""
                    className="w-full h-14 rounded-2xl border border-gray-200 px-5 text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  >
                    <option value="" disabled>
                      Select city
                    </option>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                  Address <span className="text-primary">*</span>
                </label>
                <input
                  name="address"
                  required
                  placeholder="Street address or area"
                  className="w-full h-14 rounded-2xl border border-gray-200 px-5 text-gray-900 font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                  Google Maps Link
                </label>
                <input
                  name="maps_url"
                  type="url"
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full h-14 rounded-2xl border border-gray-200 px-5 text-gray-900 font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </section>

            {/* Details */}
            <section className="space-y-5">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Details (optional but helpful)
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                    WiFi Speed (Mbps)
                  </label>
                  <input
                    name="wifi_mbps"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 50"
                    className="w-full h-14 rounded-2xl border border-gray-200 px-5 text-gray-900 font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                    Price Range
                  </label>
                  <select
                    name="price_range"
                    defaultValue=""
                    className="w-full h-14 rounded-2xl border border-gray-200 px-5 text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  >
                    <option value="">Unknown</option>
                    <option value="$">$ — Budget</option>
                    <option value="$$">$$ — Mid-range</option>
                    <option value="$$$">$$$ — Premium</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                  Opening Hours
                </label>
                <input
                  name="timing"
                  placeholder="e.g. Mon–Sat: 08:00 – 22:00"
                  className="w-full h-14 rounded-2xl border border-gray-200 px-5 text-gray-900 font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                  Espresso Price (MAD, cafés only)
                </label>
                <input
                  name="espresso_price"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="e.g. 18"
                  className="w-full h-14 rounded-2xl border border-gray-200 px-5 text-gray-900 font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                    Card Payment (TPE)
                  </label>
                  <select
                    name="tpe"
                    defaultValue=""
                    className="w-full h-14 rounded-2xl border border-gray-200 px-5 text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  >
                    <option value="">Unknown</option>
                    <option value="1">Yes</option>
                    <option value="0">No (cash only)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                    Non-smoking area?
                  </label>
                  <select
                    name="non_smoking"
                    defaultValue=""
                    className="w-full h-14 rounded-2xl border border-gray-200 px-5 text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  >
                    <option value="">Unknown</option>
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                    Air Conditioning?
                  </label>
                  <select
                    name="air_conditioned"
                    defaultValue=""
                    className="w-full h-14 rounded-2xl border border-gray-200 px-5 text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  >
                    <option value="">Unknown</option>
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Photos */}
            <section className="space-y-5">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Photos
              </h2>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                  Upload photos (optional — up to 5)
                </label>
                <input
                  name="images"
                  type="file"
                  multiple
                  accept="image/*"
                  className="w-full rounded-2xl border border-gray-200 px-5 py-4 text-gray-900 font-medium text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-gray-900 file:text-white hover:file:bg-primary file:transition-all"
                />
              </div>
            </section>

            {/* Notes & Contact */}
            <section className="space-y-5">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Notes & Contact
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                  Anything else we should know?
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Great rooftop view, parking nearby, best espresso in Casablanca…"
                  className="w-full rounded-2xl border border-gray-200 px-5 py-4 text-gray-900 font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-600">
                  Your Email (optional — we'll notify you when it's live)
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full h-14 rounded-2xl border border-gray-200 px-5 text-gray-900 font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </section>

            {actionData?.ok === false && (
              <p className="text-sm font-bold text-red-500">{actionData.error}</p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-16 rounded-2xl bg-gray-900 hover:bg-primary text-white font-black uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Spot"}
            </Button>
          </Form>
        </div>
      </main>
    </div>
  );
}
