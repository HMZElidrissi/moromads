import type { Route } from "./+types/spot-details";
import { useParams, Link } from "react-router";
import { flattenedSpots } from "~/data/spots";
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
import { NotFoundContent } from "./not-found";

export function meta({ params }: Route.MetaArgs) {
  const spot = flattenedSpots.find((p) => p.slug === params.slug);
  if (!spot) {
    return [
      { title: "Spot Not Found | Moromads" },
      { name: "description", content: "The work spot you are looking for doesn't exist." },
    ];
  }

  return [
    { title: `${spot.name} | Work Spot in ${spot.city} | Moromads` },
    {
      name: "description",
      content: `Work from ${spot.name} in ${spot.city}. WiFi: ${spot.wifiMbps} Mbps, Noise: ${spot.noiseScoreLabel}, Comfort: ${spot.comfortScoreLabel}. Find the best places to work from in Morocco.`,
    },
    { property: "og:title", content: `${spot.name} - ${spot.city} | Moromads` },
    {
      property: "og:description",
      content: `Verified work spot for digital nomads in ${spot.city}, Morocco.`,
    },
    { property: "og:image", content: spot.images?.[0] || "" },
  ];
}

export default function SpotDetails() {
  const { slug } = useParams();
  const places = flattenedSpots;
  const spot = places.find((p) => p.slug === slug);

  // UI State
  const [copied, setCopied] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);

  // Rating State
  const [ratings, setRatings] = useState({ wifi: 0, noise: 0, comfort: 0 });
  const [hoverRatings, setHoverRatings] = useState({ wifi: 0, noise: 0, comfort: 0 });
  const [hasRated, setHasRated] = useState(false);

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
      label: "Budget-friendly",
      desc: "≤ 20 MAD",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    $$: {
      label: "Mid-range",
      desc: "21–35 MAD",
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    $$$: {
      label: "Premium",
      desc: "> 35 MAD",
      color: "text-primary bg-primary/10 border-primary/20",
    },
  };

  const handleRatingSubmit = () => {
    setHasRated(true);
    setTimeout(() => setShowRateModal(false), 2500);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[90rem] mx-auto px-6 h-20 flex items-center justify-between">
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
            <div className="space-y-8">
              <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden group shadow-2xl shadow-gray-200">
                <div
                  className="w-full h-full flex transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
                  style={{ transform: `translateX(-${activeImg * 100}%)` }}
                >
                  {images.map((img, i) => (
                    <div key={i} className="min-w-full h-full relative">
                      {img ? (
                        <img
                          src={img}
                          alt={`${spot.name} - View ${i + 1}`}
                          className="w-full h-full object-cover"
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
                    </div>
                  ))}
                </div>

                {/* Badge Overlay */}
                <div className="absolute top-8 left-8">
                  <div className="bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-2xl shadow-xl flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest text-gray-900">
                      Verified {spot.type}
                    </span>
                  </div>
                </div>

                {images.length > 1 && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={cn(
                          "w-2.5 h-2.5 rounded-full transition-all border border-white/50",
                          activeImg === i ? "bg-white scale-125 shadow-lg" : "bg-white/40",
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Vitals Summary Grid */}
              <div className="grid grid-cols-3 gap-4">
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
                    className="bg-white p-5 rounded-4xl border border-gray-100 text-center shadow-sm"
                  >
                    <div className="flex justify-center mb-2">{v.icon}</div>
                    <p className="text-lg font-black text-gray-900 leading-tight">{v.val}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                      {v.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price Experience Card — only for cafés with espresso price */}
              {spot.espressoPrice && (
                <div
                  className={cn(
                    "p-6 rounded-[2.5rem] border flex items-center justify-between shadow-sm",
                    priceConfig[spot.priceRange].color,
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/50 flex items-center justify-center font-black text-xs text-center leading-tight px-1">
                      {spot.espressoPrice} MAD
                    </div>
                    <div>
                      <p className="font-black text-lg uppercase tracking-tight">
                        {priceConfig[spot.priceRange].label}
                      </p>
                      <p className="text-sm font-bold opacity-70">espresso</p>
                    </div>
                  </div>
                  <Info size={24} className="opacity-30" />
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
                  <div className="flex items-center gap-3 text-gray-400 font-bold text-lg">
                    <MapPin size={22} className="text-primary" />
                    <span>
                      {spot.city} · {spot.address}
                    </span>
                  </div>
                  {spot.timing && (
                    <div className="flex items-center gap-3 text-gray-400 font-bold text-lg">
                      <Clock size={22} className="text-primary" />
                      <span>{spot.timing}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Community Review Button */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                  <Star size={32} className="fill-current" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900">Been here before?</h3>
                  <p className="text-gray-500 font-medium mt-1">
                    Share your experience with other nomads.
                  </p>
                </div>
                <Button
                  onClick={() => setShowRateModal(true)}
                  className="h-14 px-10 rounded-2xl bg-gray-900 hover:bg-primary text-white font-black uppercase tracking-widest transition-all"
                >
                  Rate this spot
                </Button>
              </div>

              {/* Connectivity Details */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                  Connectivity & Amenities
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-6 rounded-4xl bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary">
                        <Zap size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
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

                  <div className="p-6 rounded-4xl bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary">
                        <Wifi size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                          Reliability
                        </p>
                        <p className="text-lg font-black text-gray-900">Highly Stable</p>
                      </div>
                    </div>
                  </div>

                  {spot.tpe !== undefined && spot.tpe !== null && (
                    <div className="p-6 rounded-4xl bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary">
                          <CreditCard size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-gray-400">
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
                    <div className="p-6 rounded-4xl bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary">
                          <Wind size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-gray-400">
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
          <div className="relative bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
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
            onClick={() => setShowRateModal(false)}
          />
          <div className="relative bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowRateModal(false)}
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
                <div className="space-y-6">
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
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
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
                  <Button
                    onClick={handleRatingSubmit}
                    disabled={!ratings.wifi || !ratings.noise || !ratings.comfort}
                    className="w-full h-16 mt-4 rounded-2xl bg-gray-900 hover:bg-primary text-white font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    Submit Rating
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
