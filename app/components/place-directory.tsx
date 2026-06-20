import {
  createContext,
  useContext,
  useState,
  useMemo,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import {
  Zap,
  MapPin,
  ExternalLink,
  Star,
  Clock,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type PlaceType = "café" | "coworking";
export type NoiseLevel = "quiet" | "moderate" | "lively";
export type PriceRange = "$" | "$$" | "$$$";

export type Place = {
  id: number;
  slug: string;
  name: string;
  type: PlaceType;
  city: string;
  address: string;
  mapsUrl: string;
  wifiMbps: number;
  wifiSpeedLabel: string;
  noiseLevel: NoiseLevel;
  noiseScoreLabel: string;
  comfortScore: number;
  comfortScoreLabel: string;
  priceRange: PriceRange;
  timing?: string;
  outlets: number;
  outletsLabel: string;
  rating: number;
  reviewCount: number;
  gradient: string;
  images?: string[];
  tags: string[];
};

type Filters = {
  city: string;
  type: "all" | PlaceType;
  wifi: "any" | "fast" | "ok" | "slow";
  noise: "any" | NoiseLevel;
  price: "any" | PriceRange;
  sort: "rating" | "wifi" | "price" | "reviews";
};

const DEFAULT_FILTERS: Filters = {
  city: "All cities",
  type: "all",
  wifi: "any",
  noise: "any",
  price: "any",
  sort: "rating",
};

// ─── Context ───────────────────────────────────────────────────────────────────

type PlaceDirectoryContextValue = {
  filtered: Place[];
  filters: Filters;
  setFilters: (f: Filters) => void;
  allCities: string[];
};

const PlaceDirectoryContext = createContext<PlaceDirectoryContextValue | null>(null);

function usePlaceDirectory() {
  const ctx = useContext(PlaceDirectoryContext);
  if (!ctx)
    throw new Error("PlaceDirectory sub-components must be used within PlaceDirectory.Root");
  return ctx;
}

// ─── Root ──────────────────────────────────────────────────────────────────────

export type RootProps = React.ComponentProps<"div"> & {
  /** Full list of places to display and filter. */
  places: Place[];
  children: ReactNode;
};

function Root({ places, className, children, ...props }: RootProps) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const allCities = useMemo(
    () => ["All cities", ...Array.from(new Set(places.map((p) => p.city))).sort()],
    [places],
  );

  const filtered = useMemo(() => {
    let result = places;

    if (filters.city !== "All cities") {
      result = result.filter((p) => p.city === filters.city);
    }
    if (filters.type !== "all") {
      result = result.filter((p) => p.type === filters.type);
    }
    if (filters.wifi !== "any") {
      result = result.filter((p) =>
        filters.wifi === "fast"
          ? p.wifiMbps >= 50
          : filters.wifi === "ok"
            ? p.wifiMbps >= 20 && p.wifiMbps < 50
            : p.wifiMbps < 20,
      );
    }
    if (filters.noise !== "any") {
      result = result.filter((p) => p.noiseLevel === filters.noise);
    }
    if (filters.price !== "any") {
      result = result.filter((p) => p.priceRange === filters.price);
    }

    return [...result].sort((a, b) => {
      if (filters.sort === "rating") return b.rating - a.rating;
      if (filters.sort === "wifi") return b.wifiMbps - a.wifiMbps;
      if (filters.sort === "reviews") return b.reviewCount - a.reviewCount;
      const order: Record<PriceRange, number> = { $: 0, $$: 1, $$$: 2 };
      return order[a.priceRange] - order[b.priceRange];
    });
  }, [places, filters]);

  return (
    <PlaceDirectoryContext.Provider value={{ filtered, filters, setFilters, allCities }}>
      <div
        data-slot="place-directory"
        className={cn("bg-[#fdfcfb] min-h-screen", className)}
        {...props}
      >
        {children}
      </div>
    </PlaceDirectoryContext.Provider>
  );
}

// ─── Filters ───────────────────────────────────────────────────────────────────

export type FiltersProps = React.ComponentProps<"div">;

function Filters({ className, ...props }: FiltersProps) {
  const { filters, setFilters, allCities, filtered } = usePlaceDirectory();

  const set = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    setFilters({ ...filters, [key]: val });

  const typeOptions: Array<{ label: string; value: Filters["type"] }> = [
    { label: "All", value: "all" },
    { label: "☕ Cafés", value: "café" },
    { label: "💼 Coworking", value: "coworking" },
  ];

  return (
    <div
      data-slot="place-directory-filters"
      className={cn(
        "sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100",
        className,
      )}
      {...props}
    >
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <SlidersHorizontal size={18} className="text-gray-400 shrink-0" aria-hidden />

          {/* Type toggle */}
          <div
            role="group"
            aria-label="Place type"
            className="flex items-center gap-1 bg-gray-100/80 rounded-full p-1"
          >
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => set("type", opt.value)}
                data-state={filters.type === opt.value ? "active" : "inactive"}
                aria-pressed={filters.type === opt.value}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-bold transition-all",
                  filters.type === opt.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400 hover:text-gray-600",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Selects */}
          {[
            { id: "city", value: filters.city, options: allCities },
            {
              id: "wifi",
              value: filters.wifi,
              options: [
                { label: "Any WiFi", value: "any" },
                { label: "Fast (50+ Mbps)", value: "fast" },
                { label: "OK (20–49 Mbps)", value: "ok" },
                { label: "Slow (<20 Mbps)", value: "slow" },
              ],
            },
            {
              id: "noise",
              value: filters.noise,
              options: [
                { label: "Any noise", value: "any" },
                { label: "Quiet 🔇", value: "quiet" },
                { label: "Moderate 🔉", value: "moderate" },
                { label: "Lively 🔊", value: "lively" },
              ],
            },
            {
              id: "price",
              value: filters.price,
              options: [
                { label: "Any price", value: "any" },
                { label: "$ · <30 MAD", value: "$" },
                { label: "$$ · 30–70 MAD", value: "$$" },
                { label: "$$$ · 70+ MAD", value: "$$$" },
              ],
            },
          ].map((select) => (
            <div key={select.id} className="relative group">
              <select
                value={select.value}
                onChange={(e) => set(select.id as keyof Filters, e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 text-sm font-bold text-gray-700 bg-gray-100/80 hover:bg-gray-200/80 rounded-full border-none outline-none cursor-pointer transition-colors"
              >
                {select.options.map((opt) =>
                  typeof opt === "string" ? (
                    <option key={opt}>{opt}</option>
                  ) : (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ),
                )}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform group-hover:translate-y-[-40%]"
                aria-hidden
              />
            </div>
          ))}

          {/* Sort */}
          <div className="relative ml-auto group">
            <select
              value={filters.sort}
              onChange={(e) => set("sort", e.target.value as Filters["sort"])}
              className="appearance-none pl-4 pr-10 py-2.5 text-sm font-bold text-gray-900 bg-white border-2 border-gray-100 rounded-full outline-none cursor-pointer transition-all hover:border-primary/30"
            >
              <option value="rating">Sort: Best rated</option>
              <option value="wifi">Sort: Fastest WiFi</option>
              <option value="price">Sort: Cheapest first</option>
              <option value="reviews">Sort: Most reviewed</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-primary"
              aria-hidden
            />
          </div>

          <span className="text-sm text-gray-400 font-bold shrink-0" aria-live="polite">
            <span className="text-gray-900">{filtered.length}</span> spots
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Grid ──────────────────────────────────────────────────────────────────────

export type GridProps = React.ComponentProps<"section">;

function Grid({ className, ...props }: GridProps) {
  const { filtered } = usePlaceDirectory();

  return (
    <section
      data-slot="place-directory-grid"
      aria-label="Work spots"
      className={cn("max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20", className)}
      {...props}
    >
      {filtered.length === 0 ? (
        <div className="text-center py-32 animate-in fade-in zoom-in duration-500">
          <p className="text-7xl mb-6 grayscale opacity-20" aria-hidden>
            🏜️
          </p>
          <p className="text-2xl font-black text-gray-900 tracking-tight">Nothing found here</p>
          <p className="text-gray-500 mt-2 font-medium">
            Try adjusting your filters to find a spot
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 list-none p-0">
          {filtered.map((place, index) => (
            <li
              key={place.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Item place={place} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Item ──────────────────────────────────────────────────────────────────────

const noiseConfig: Record<NoiseLevel, { label: string; color: string; icon: string }> = {
  quiet: { label: "Quiet", color: "text-emerald-600 bg-emerald-50", icon: "🔇" },
  moderate: { label: "Moderate", color: "text-amber-600 bg-amber-50", icon: "🔉" },
  lively: { label: "Lively", color: "text-orange-600 bg-orange-50", icon: "🔊" },
};

export type ItemProps = React.ComponentProps<"article"> & {
  place: Place;
};

function Item({ place, className, ...props }: ItemProps) {
  const navigate = useNavigate();
  const noise = noiseConfig[place.noiseLevel];
  const isFast = place.wifiMbps >= 50;
  const isOk = place.wifiMbps >= 20;
  const wifiColor = isFast
    ? "text-emerald-600 bg-emerald-50"
    : isOk
      ? "text-amber-600 bg-amber-50"
      : "text-red-600 bg-red-50";

  return (
    <article
      data-slot="place-directory-item"
      onClick={() => navigate(`/spots/${place.slug}`)}
      className={cn(
        "group bg-white rounded-4xl overflow-hidden border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-2 flex flex-col h-full cursor-pointer",
        className,
      )}
      {...props}
    >
      {/* Header Visual */}
      <div
        className="relative h-44 shrink-0 overflow-hidden"
        style={{ background: place.gradient }}
      >
        {place.images?.[0] && (
          <img
            src={place.images[0]}
            alt={place.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-black/20 group-hover:from-black/40 transition-colors duration-300" />

        {/* Floating Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[10px] font-black uppercase tracking-wider text-gray-900 shadow-sm">
            {place.type === "café" ? "☕ Café" : "💼 Cowork"}
          </span>
        </div>

        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/20">
            <Star size={12} className="fill-primary text-primary" />
            <span className="text-xs font-black tracking-tighter">{place.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* City tag bottom left */}
        <div className="absolute bottom-4 left-4">
          <span className="flex items-center gap-1 text-[11px] font-black text-white/90 drop-shadow-sm uppercase tracking-widest">
            <MapPin size={12} className="text-primary" />
            {place.city}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col flex-1 gap-5">
        {/* Title & Rating Count */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h3 className="font-black text-gray-900 text-xl leading-[1.2] tracking-tight group-hover:text-primary transition-colors line-clamp-2">
              {place.name}
            </h3>
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center gap-1 text-xs font-bold text-gray-400">
                <span>{place.reviewCount} verified reviews</span>
              </div>
              {place.timing && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-primary/70">
                  <Clock size={12} />
                  <span>{place.timing}</span>
                </div>
              )}
            </div>
          </div>
          <a
            href={place.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-primary/10 hover:text-primary transition-all"
            aria-label={`Open ${place.name} in Google Maps`}
          >
            <ExternalLink size={18} />
          </a>
        </div>

        {/* WiFi & Connectivity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
            <span className="text-gray-400">WiFi: {place.wifiSpeedLabel}</span>
            <span className={cn("px-2 py-0.5 rounded-md", wifiColor)}>{place.wifiMbps} Mbps</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                isFast ? "bg-emerald-500" : isOk ? "bg-amber-500" : "bg-red-500",
              )}
              style={{ width: `${Math.min((place.wifiMbps / 120) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Vitals Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className={cn(
              "flex flex-col gap-1 p-3 rounded-2xl border border-transparent transition-colors",
              noise.color,
            )}
          >
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
              Noise Score
            </span>
            <div className="flex items-center gap-1.5 font-black text-sm">
              <span>{noise.icon}</span>
              {place.noiseScoreLabel}
            </div>
          </div>
          <div className="flex flex-col gap-1 p-3 rounded-2xl bg-gray-50 border border-transparent">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Power Outlets
            </span>
            <div className="flex items-center gap-1.5 font-black text-sm text-gray-900">
              <Zap size={14} className="text-primary" />
              {place.outletsLabel}
            </div>
          </div>
        </div>

        {/* Tags & Price */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Comfort
            </span>
            <span className="text-xs font-black text-emerald-600">{place.comfortScoreLabel}</span>
          </div>
          <span className="text-sm font-black text-gray-900">{place.priceRange}</span>
        </div>

        {/* Action */}
        <Button className="w-full rounded-2xl h-12 font-black text-sm uppercase tracking-widest bg-gray-900 hover:bg-primary transition-all group-hover:shadow-lg group-hover:shadow-primary/20">
          See Details
        </Button>
      </div>
    </article>
  );
}
// ─── Namespace export ──────────────────────────────────────────────────────────

export const PlaceDirectory = { Root, Filters, Grid, Item };
