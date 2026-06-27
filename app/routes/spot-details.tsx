import type { Route } from "./+types/spot-details";
import { Link } from "react-router";
import { getSpotBySlug, addReview } from "~/lib/db.server";
import { cloudflareContext } from "../../load-context";
import { Footer } from "~/components/footer";
import { Button } from "~/components/ui/button";
import {
  ChevronLeft,
  MapPin,
  Wifi,
  Volume2,
  Zap,
  Star,
  Clock,
  Share2,
  Check,
  Send,
  Copy,
  Info,
  X,
  CreditCard,
  Wind,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useState } from "react";
import { useFetcher } from "react-router";
import { NotFoundContent } from "./not-found";

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const spot = await getSpotBySlug(env.DB, params.slug ?? "");
  const origin = new URL(request.url).origin;
  return { spot, origin };
}

export async function action({ params, request, context }: Route.ActionArgs) {
  const { env } = context.get(cloudflareContext);
  const form = await request.formData();
  const wifi = Number(form.get("wifi"));
  const noise = Number(form.get("noise"));
  const comfort = Number(form.get("comfort"));
  if (
    !Number.isInteger(wifi) ||
    wifi < 1 ||
    wifi > 5 ||
    !Number.isInteger(noise) ||
    noise < 1 ||
    noise > 5 ||
    !Number.isInteger(comfort) ||
    comfort < 1 ||
    comfort > 5
  ) {
    return { ok: false, error: "Invalid scores" };
  }
  await addReview(env.DB, params.slug ?? "", { wifi, noise, comfort });
  return { ok: true };
}

export function meta({ loaderData }: Route.MetaArgs) {
  const { spot, origin } = loaderData;
  if (!spot) {
    return [
      { title: "Spot Not Found | Moromads" },
      { name: "description", content: "The work spot you are looking for doesn't exist." },
    ];
  }

  const title = `${spot.name} | Work Spot in ${spot.city} | Moromads`;
  const description = `Work from ${spot.name} in ${spot.city}. WiFi: ${spot.wifiMbps} Mbps, Noise: ${spot.noiseScoreLabel}, Comfort: ${spot.comfortScoreLabel}. Find the best places to work from in Morocco.`;
  const ogImage = `${origin}/android-chrome-512x512.png`;
  const pageUrl = `${origin}/spots/${spot.slug}`;

  return [
    { title },
    { name: "description", content: description },
    { property: "og:type", content: "article" },
    { property: "og:site_name", content: "Moromads" },
    { property: "og:title", content: `${spot.name} — ${spot.city} | Moromads` },
    {
      property: "og:description",
      content: `Verified work spot for digital nomads in ${spot.city}, Morocco.`,
    },
    { property: "og:image", content: ogImage },
    { property: "og:url", content: pageUrl },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: `${spot.name} — ${spot.city}` },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
  ];
}

export default function SpotDetails({ loaderData }: Route.ComponentProps) {
  const { spot } = loaderData;

  // UI State
  const [copied, setCopied] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);

  // Rating State
  const fetcher = useFetcher<typeof action>();
  const [ratings, setRatings] = useState({ wifi: 0, noise: 0, comfort: 0 });
  const [hoverRatings, setHoverRatings] = useState({ wifi: 0, noise: 0, comfort: 0 });
  const hasRated = fetcher.data?.ok === true;
  const isSubmitting = fetcher.state === "submitting";

  if (!spot) {
    return <NotFoundContent />;
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `Check out ${spot.name} in ${spot.city} on Moromads! 🇲🇦`;

  const copyLink = () => {
    void navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const images = spot.images && spot.images.length > 0 ? spot.images : [null];

  const priceConfig = {
    $: {
      label: "Budget",
      bg: "bg-emerald-50",
      labelColor: "text-emerald-600",
      coin: "from-emerald-300 to-emerald-500",
      lines: "stroke-emerald-300",
    },
    $$: {
      label: "Mid-Range",
      bg: "bg-amber-50",
      labelColor: "text-amber-500",
      coin: "from-yellow-300 to-amber-500",
      lines: "stroke-amber-200",
    },
    $$$: {
      label: "Premium",
      bg: "bg-primary/10",
      labelColor: "text-primary",
      coin: "from-primary/60 to-primary",
      lines: "stroke-primary/20",
    },
  };

  const handleModalClose = () => {
    setShowRateModal(false);
    if (hasRated) setRatings({ wifi: 0, noise: 0, comfort: 0 });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[90rem] mx-auto px-6 h-20 flex items-center justify-between">
          <Link
            to={`/?city=${encodeURIComponent(spot.city)}`}
            className="flex items-center gap-2 group text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform text-primary"
            />
            <span className="font-black uppercase tracking-widest text-xs">Back to Directory</span>
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowShareModal(true)}
              className="p-3 rounded-full bg-gray-50 text-gray-400 hover:bg-primary/10 hover:text-primary transition-all"
              aria-label="Share spot"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-32 pb-20">
        <div className="max-w-[90rem] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* LEFT COLUMN: Visuals */}
            <div className="space-y-4">
              {/* Main image */}
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden group shadow-xl shadow-gray-200">
                {images[activeImg] ? (
                  <img
                    key={activeImg}
                    src={images[activeImg]!}
                    alt={`${spot.name} - View ${activeImg + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white font-black text-4xl"
                    style={{ background: spot.gradient }}
                  >
                    {spot.name}
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Badge */}
                <div className="absolute top-6 left-6">
                  <div className="bg-white/90 backdrop-blur-md px-5 py-2 rounded-xl shadow-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest text-gray-900">
                      Verified {spot.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div className="flex gap-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      aria-label={`View image ${i + 1}`}
                      className={cn(
                        "flex-1 aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all",
                        activeImg === i
                          ? "border-primary shadow-md shadow-primary/20 opacity-100"
                          : "border-transparent opacity-50 hover:opacity-80",
                      )}
                    >
                      {img ? (
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" style={{ background: spot.gradient }} />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Vitals Summary Grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "WiFi Speed",
                    val: `${spot.wifiMbps} Mbps`,
                    icon: <Wifi size={18} className="text-emerald-500" />,
                  },
                  {
                    label: "Noise Score",
                    val: spot.noiseScoreLabel,
                    icon: <Volume2 size={18} className="text-blue-500" />,
                  },
                  {
                    label: "Comfort",
                    val: spot.comfortScoreLabel,
                    icon: <Star size={18} className="text-primary fill-primary" />,
                  },
                ].map((v) => (
                  <div
                    key={v.label}
                    className="bg-white px-4 py-6 rounded-2xl border border-gray-100 text-center shadow-sm flex flex-col items-center gap-3"
                  >
                    <div>{v.icon}</div>
                    <div>
                      <p className="text-base font-black text-gray-900">{v.val}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-0.5">
                        {v.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price card */}
              {spot.espressoPrice && (
                <div
                  className={cn(
                    "relative overflow-hidden rounded-[2rem] px-8 py-5 flex items-center justify-between gap-6",
                    priceConfig[spot.priceRange].bg,
                  )}
                >
                  {/* Decorative lines */}
                  <svg
                    className="absolute right-12 top-0 h-full w-48 opacity-20 pointer-events-none"
                    viewBox="0 0 200 80"
                    preserveAspectRatio="none"
                  >
                    {[-20, 0, 20, 40, 60, 80, 100].map((x) => (
                      <line
                        key={x}
                        x1={x}
                        y1="0"
                        x2={x + 80}
                        y2="80"
                        strokeWidth="1.5"
                        className={priceConfig[spot.priceRange].lines}
                      />
                    ))}
                  </svg>

                  {/* Coin + price */}
                  <div className="flex items-center gap-4 shrink-0 z-10">
                    <div
                      className={cn(
                        "w-11 h-11 rounded-full bg-gradient-to-br shadow-md flex items-center justify-center",
                        priceConfig[spot.priceRange].coin,
                      )}
                    >
                      <span className="text-white font-black text-[10px] leading-tight text-center">
                        MAD
                        <br />
                        د.م
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Avg. price:</p>
                      <p className="text-sm font-black text-gray-800">{spot.espressoPrice} MAD</p>
                    </div>
                  </div>

                  {/* Label */}
                  <p
                    className={cn(
                      "text-3xl font-black uppercase z-10 tracking-wide",
                      priceConfig[spot.priceRange].labelColor,
                    )}
                    style={{ fontFamily: "var(--font-excalifont)" }}
                  >
                    {priceConfig[spot.priceRange].label}
                  </p>

                  {/* Info */}
                  <Info size={20} className="shrink-0 z-10 opacity-30" />
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Info & Interaction */}
            <div className="space-y-8">
              <div>
                <h1 className="text-6xl font-black text-gray-900 tracking-tighter leading-[0.9] mb-4">
                  {spot.name}
                </h1>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          className={cn(
                            i < Math.round(spot.rating)
                              ? "text-primary fill-primary"
                              : "text-gray-200 fill-gray-200",
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-2xl font-black text-gray-900">
                      {spot.rating.toFixed(1)}
                    </span>
                    <span className="text-gray-400 font-medium">
                      ({spot.reviewCount} {spot.reviewCount === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 font-medium text-base">
                    <MapPin size={20} className="text-primary shrink-0" />
                    <span>
                      {spot.city} · {spot.address}
                    </span>
                  </div>
                  {spot.timing && (
                    <div className="flex items-center gap-3 text-gray-600 font-medium text-base">
                      <Clock size={20} className="text-primary shrink-0" />
                      <span>{spot.timing}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Community Review CTA */}
              <div className="bg-white px-8 py-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-6">
                <div>
                  <h3 className="text-base font-black text-gray-900">Been here?</h3>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">
                    Help other nomads — rate your experience.
                  </p>
                </div>
                <Button
                  onClick={() => setShowRateModal(true)}
                  className="shrink-0 h-11 px-6 rounded-xl bg-gray-900 hover:bg-primary text-white font-black uppercase tracking-widest text-xs transition-all"
                >
                  Rate spot
                </Button>
              </div>

              {/* Connectivity Details */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                  Connectivity & Amenities
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-6 rounded-2xl bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary">
                        <Zap size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                          Power Outlets
                        </p>
                        <p className="text-lg font-black text-gray-900">
                          {spot.outletsLabel || "Unknown"}
                        </p>
                      </div>
                    </div>
                    {spot.outletsLabel && spot.outletsLabel.toLowerCase().startsWith("yes") && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase rounded-lg">
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="p-6 rounded-2xl bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary">
                        <Wifi size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                          Reliability
                        </p>
                        <p className="text-lg font-black text-gray-900">Highly Stable</p>
                      </div>
                    </div>
                  </div>

                  {spot.tpe !== undefined && spot.tpe !== null && (
                    <div className="p-6 rounded-2xl bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary">
                          <CreditCard size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                            Card Payment (TPE)
                          </p>
                          <p className="text-lg font-black text-gray-900">
                            {spot.tpe ? "Accepted" : "Cash only"}
                          </p>
                        </div>
                      </div>
                      {spot.tpe && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-black uppercase rounded-lg">
                          Yes
                        </span>
                      )}
                    </div>
                  )}

                  {spot.nonSmoking !== undefined && spot.nonSmoking !== null && (
                    <div className="p-6 rounded-2xl bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary">
                          <Wind size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                            Smoking
                          </p>
                          <p className="text-lg font-black text-gray-900">
                            {spot.nonSmoking ? "Non-smoking area" : "Smoking allowed"}
                          </p>
                        </div>
                      </div>
                      {spot.nonSmoking && (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase rounded-lg">
                          Clean air
                        </span>
                      )}
                    </div>
                  )}

                  {spot.airConditioned !== undefined && spot.airConditioned !== null && (
                    <div className="p-6 rounded-2xl bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary">
                          <Wind size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                            Air Conditioning
                          </p>
                          <p className="text-lg font-black text-gray-900">
                            {spot.airConditioned ? "A/C available" : "No A/C"}
                          </p>
                        </div>
                      </div>
                      {spot.airConditioned && (
                        <span className="px-3 py-1 bg-sky-100 text-sky-600 text-[10px] font-black uppercase rounded-lg">
                          Cooled
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {spot.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold capitalize"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-2xl p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-8 right-8 text-gray-400 hover:text-gray-900"
            >
              <X size={24} />
            </button>
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center text-primary mx-auto">
                <Share2 size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                  Share Spot
                </h3>
                <p className="text-gray-500 font-medium">Spread the word to other nomads!</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={copyLink}
                  className={cn(
                    "w-full h-14 rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase tracking-widest text-sm",
                    copied
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-900 text-white hover:bg-primary",
                  )}
                >
                  {copied ? (
                    <>
                      <Check size={18} /> Link Copied
                    </>
                  ) : (
                    <>
                      <Copy size={18} /> Copy Link
                    </>
                  )}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-14 rounded-2xl bg-[#25D366] text-white flex items-center justify-center gap-3 hover:brightness-110 transition-all font-black uppercase tracking-widest text-sm"
                >
                  <Send size={18} /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={handleModalClose}
          />
          <div className="relative bg-white w-full max-w-md rounded-2xl p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              onClick={handleModalClose}
              className="absolute top-8 right-8 text-gray-400 hover:text-gray-900"
            >
              <X size={24} />
            </button>
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
                  Rate Spot
                </h3>
                <p className="text-gray-500 font-medium">How was your session at {spot.name}?</p>
              </div>

              {hasRated ? (
                <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-200">
                    <Check size={40} strokeWidth={3} />
                  </div>
                  <p className="text-2xl font-black text-gray-900">Rating Submitted!</p>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                    Updating directory scores...
                  </p>
                </div>
              ) : (
                <fetcher.Form method="post" className="space-y-6">
                  {(
                    [
                      { id: "wifi", label: "WiFi Quality", icon: <Wifi /> },
                      { id: "noise", label: "Noise Level", icon: <Volume2 /> },
                      { id: "comfort", label: "Seat Comfort", icon: <Star /> },
                    ] as const
                  ).map((criteria) => (
                    <div key={criteria.id} className="space-y-3">
                      <div className="flex items-center justify-between px-2">
                        <span className="font-black uppercase tracking-widest text-[10px] text-gray-400">
                          {criteria.label}
                        </span>
                        <span className="text-xs font-black text-primary">
                          {ratings[criteria.id] > 0 ? `${ratings[criteria.id]}/5` : "Rate"}
                        </span>
                      </div>
                      <input type="hidden" name={criteria.id} value={ratings[criteria.id]} />
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() =>
                              setHoverRatings((prev) => ({ ...prev, [criteria.id]: star }))
                            }
                            onMouseLeave={() =>
                              setHoverRatings((prev) => ({ ...prev, [criteria.id]: 0 }))
                            }
                            onClick={() => setRatings((prev) => ({ ...prev, [criteria.id]: star }))}
                            className="flex-1 h-12 rounded-xl bg-gray-50 flex items-center justify-center transition-all group/star"
                          >
                            <Star
                              size={20}
                              className={cn(
                                "transition-all",
                                (hoverRatings[criteria.id] || ratings[criteria.id]) >= star
                                  ? "text-primary fill-primary scale-110"
                                  : "text-gray-200",
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {fetcher.data?.ok === false && (
                    <p className="text-xs font-bold text-red-500 text-center">
                      Something went wrong. Please try again.
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={!ratings.wifi || !ratings.noise || !ratings.comfort || isSubmitting}
                    className="w-full h-16 mt-4 rounded-2xl bg-gray-900 hover:bg-primary text-white font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting…" : "Submit Rating"}
                  </Button>
                </fetcher.Form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
