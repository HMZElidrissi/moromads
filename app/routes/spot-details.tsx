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
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useState } from "react";

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
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <h1 className="text-4xl font-black text-gray-900 mb-4">Spot not found</h1>
            <p className="text-gray-500 mb-8">
              The work spot you are looking for doesn&apos;t exist.
            </p>
            <Button asChild>
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
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
      desc: "Under 30 MAD",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    $$: {
      label: "Mid-range",
      desc: "30–70 MAD",
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    $$$: { label: "Premium", desc: "70+ MAD", color: "text-[#C1272D] bg-red-50 border-red-100" },
  };

  const handleRatingSubmit = () => {
    setHasRated(true);
    setTimeout(() => setShowRateModal(false), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <main className="flex-1 pb-20">
        {/* Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Button
            variant="ghost"
            asChild
            className="px-0 text-gray-500 hover:text-gray-900 font-bold group"
          >
            <Link to="/">
              <ChevronLeft
                size={20}
                className="mr-1 transition-transform group-hover:-translate-x-1"
              />
              Back to exploration
            </Link>
          </Button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* LEFT COLUMN: Visuals & Stats */}
            <div className="space-y-8">
              <div className="relative group">
                <div className="aspect-[16/10] rounded-[2.5rem] shadow-2xl overflow-hidden relative bg-gray-100">
                  {images[activeImg] ? (
                    <img
                      src={images[activeImg]!}
                      alt={spot.name}
                      className="w-full h-full object-cover animate-in fade-in duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0" style={{ background: spot.gradient }} />
                  )}
                  <div className="absolute top-6 left-6">
                    <span className="px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-xs font-black uppercase tracking-widest text-gray-900 shadow-xl border border-white">
                      {spot.type === "café" ? "☕ Specialty Café" : "💼 Premium Cowork"}
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
                    icon: <Star size={18} className="text-[#C1272D] fill-[#C1272D]" />,
                  },
                ].map((v) => (
                  <div
                    key={v.label}
                    className="bg-white p-5 rounded-[2rem] border border-gray-100 text-center shadow-sm"
                  >
                    <div className="flex justify-center mb-2">{v.icon}</div>
                    <p className="text-lg font-black text-gray-900 leading-tight">{v.val}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                      {v.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price Experience Card */}
              <div
                className={cn(
                  "p-6 rounded-[2.5rem] border flex items-center justify-between shadow-sm",
                  priceConfig[spot.priceRange].color,
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/50 flex items-center justify-center font-black text-xl">
                    {spot.priceRange}
                  </div>
                  <div>
                    <p className="font-black text-lg uppercase tracking-tight">
                      {priceConfig[spot.priceRange].label}
                    </p>
                    <p className="text-sm font-bold opacity-70">
                      {priceConfig[spot.priceRange].desc}
                    </p>
                  </div>
                </div>
                <Info size={24} className="opacity-30" />
              </div>
            </div>

            {/* RIGHT COLUMN: Info & Interaction */}
            <div className="space-y-8">
              <div>
                <h1 className="text-6xl font-black text-gray-900 tracking-tighter leading-[0.9] mb-4">
                  {spot.name}
                </h1>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-gray-400 font-bold text-lg">
                    <MapPin size={22} className="text-[#C1272D]" />
                    <span>
                      {spot.city} · {spot.address}
                    </span>
                  </div>
                  {spot.timing && (
                    <div className="flex items-center gap-3 text-gray-400 font-bold text-lg">
                      <Clock size={22} className="text-[#C1272D]" />
                      <span>{spot.timing}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Community Review Button */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 rounded-full bg-[#C1272D]/5 flex items-center justify-center text-[#C1272D]">
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
                  className="w-full rounded-[1.5rem] h-14 font-black uppercase tracking-widest bg-gray-900 hover:bg-[#C1272D] shadow-lg shadow-gray-200 transition-all"
                >
                  {hasRated ? "✅ Review Submitted" : "Rate this spot"}
                </Button>
              </div>

              {/* Actions Section */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  asChild
                  className="flex-1 rounded-[1.5rem] h-16 font-black text-sm uppercase tracking-widest bg-[#C1272D] hover:bg-[#C1272D]/90 shadow-2xl shadow-red-100"
                >
                  <a href={spot.mapsUrl} target="_blank" rel="noopener noreferrer">
                    <MapPin size={20} className="mr-2" />
                    View on Maps
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowShareModal(true)}
                  className="flex-1 rounded-[1.5rem] h-16 font-black text-sm uppercase tracking-widest border-2 hover:bg-gray-50"
                >
                  <Share2 size={20} className="mr-2" />
                  Share Spot
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Social Share Modal Overlay */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          />
          <div className="relative bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">
              Share this spot
            </h3>
            <p className="text-gray-500 font-medium mb-8">
              Let other nomads know where to work from.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                {
                  label: "WhatsApp",
                  icon: <Send size={24} />,
                  color: "bg-[#25D366]",
                  link: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
                },
                {
                  label: "X / Twitter",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M18.244 2.25h3.308l-7.227 7.717L22.875 22.5h-6.653l-5.211-6.817-5.961 6.817H1.738l7.731-8.861L1.25 2.25h6.821l4.704 6.157 5.469-6.157zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                    </svg>
                  ),
                  color: "bg-black",
                  link: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
                },
                {
                  label: "LinkedIn",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                    </svg>
                  ),
                  color: "bg-[#0077b5]",
                  link: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-3xl text-white font-black transition-transform hover:scale-105 active:scale-95 shadow-lg",
                    social.color,
                  )}
                >
                  {social.icon}
                  <span className="text-[10px] uppercase tracking-widest">{social.label}</span>
                </a>
              ))}
              <button
                onClick={copyLink}
                className="flex items-center gap-3 p-4 rounded-3xl bg-gray-100 text-gray-900 font-black transition-transform hover:scale-105 active:scale-95 shadow-sm"
              >
                {copied ? <Check size={24} className="text-emerald-500" /> : <Copy size={24} />}
                <span className="text-[10px] uppercase tracking-widest">
                  {copied ? "Copied" : "Copy Link"}
                </span>
              </button>
            </div>

            <Button
              onClick={() => setShowShareModal(false)}
              className="w-full rounded-2xl h-14 font-black uppercase bg-gray-100 text-gray-500 hover:bg-gray-200"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Rate Spot Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRateModal(false)}
          />
          <div className="relative bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300">
            <button
              onClick={() => setShowRateModal(false)}
              className="absolute top-8 right-8 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">
              Rate this spot
            </h3>
            <p className="text-gray-500 font-medium mb-10">
              How was your work experience at {spot.name}?
            </p>

            {!hasRated ? (
              <div className="space-y-10">
                {[
                  { id: "wifi", label: "WiFi Speed & Reliability", icon: <Wifi size={20} /> },
                  { id: "noise", label: "Noise Level & Quietness", icon: <Volume2 size={20} /> },
                  { id: "comfort", label: "Comfort & Ergonomics", icon: <Zap size={20} /> },
                ].map((aspect) => (
                  <div key={aspect.id} className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <p className="font-black text-sm uppercase tracking-wider text-gray-900 flex items-center gap-2">
                        {aspect.icon} {aspect.label}
                      </p>
                      <span className="font-black text-lg text-[#C1272D]">
                        {ratings[aspect.id as keyof typeof ratings] || "—"}{" "}
                        <span className="text-gray-300 text-sm">/ 5</span>
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onMouseEnter={() =>
                            setHoverRatings((prev) => ({ ...prev, [aspect.id]: s }))
                          }
                          onMouseLeave={() =>
                            setHoverRatings((prev) => ({ ...prev, [aspect.id]: 0 }))
                          }
                          onClick={() => setRatings((prev) => ({ ...prev, [aspect.id]: s }))}
                          className="transition-transform active:scale-90"
                        >
                          <Star
                            size={40}
                            className={cn(
                              "transition-colors",
                              (hoverRatings[aspect.id as keyof typeof ratings] ||
                                ratings[aspect.id as keyof typeof ratings]) >= s
                                ? "fill-[#C1272D] text-[#C1272D]"
                                : "fill-gray-100 text-gray-200",
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-4">
                  <Button
                    disabled={Object.values(ratings).some((v) => v === 0)}
                    onClick={handleRatingSubmit}
                    className="w-full rounded-3xl h-16 font-black uppercase tracking-widest text-lg bg-gray-900 hover:bg-[#C1272D] shadow-xl transition-all"
                  >
                    Submit Community Review
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-6">
                <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-100 animate-bounce">
                  <Check size={48} />
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-black text-gray-900 tracking-tight">
                    Review Received!
                  </p>
                  <p className="text-gray-500 font-medium text-lg">
                    Your data helps nomads thrive in Morocco. 🇲🇦
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
