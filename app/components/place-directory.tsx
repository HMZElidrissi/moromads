import {
  createContext,
  useContext,
  useState,
  useMemo,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Zap, MapPin, ExternalLink, Star, Clock, SlidersHorizontal } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

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
  espressoPrice?: number;
  priceRange: PriceRange;
  timing?: string;
  outletsLabel: string;
  tpe?: boolean | null;
  nonSmoking?: boolean | null;
  airConditioned?: boolean | null;
  staffScore?: number | null;
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
  /** Pre-select a city in the filter without restricting allCities options. */
  initialCity?: string;
};

function Root({ places, initialCity, className, children, ...props }: RootProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: Filters = {
    city: searchParams.get("city") ?? initialCity ?? DEFAULT_FILTERS.city,
    type: (searchParams.get("type") as Filters["type"]) ?? DEFAULT_FILTERS.type,
    wifi: (searchParams.get("wifi") as Filters["wifi"]) ?? DEFAULT_FILTERS.wifi,
    noise: (searchParams.get("noise") as Filters["noise"]) ?? DEFAULT_FILTERS.noise,
    price: (searchParams.get("price") as Filters["price"]) ?? DEFAULT_FILTERS.price,
    sort: (searchParams.get("sort") as Filters["sort"]) ?? DEFAULT_FILTERS.sort,
  };

  function setFilters(next: Filters) {
    const params: Record<string, string> = {};
    if (next.city !== DEFAULT_FILTERS.city) params.city = next.city;
    if (next.type !== DEFAULT_FILTERS.type) params.type = next.type;
    if (next.wifi !== DEFAULT_FILTERS.wifi) params.wifi = next.wifi;
    if (next.noise !== DEFAULT_FILTERS.noise) params.noise = next.noise;
    if (next.price !== DEFAULT_FILTERS.price) params.price = next.price;
    if (next.sort !== DEFAULT_FILTERS.sort) params.sort = next.sort;
    setSearchParams(params, { replace: true });
  }

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
      result = result.filter((p) => {
        const ep = p.espressoPrice;
        if (ep === undefined) return p.priceRange === filters.price;
        if (filters.price === "$") return ep <= 20;
        if (filters.price === "$$") return ep > 20 && ep <= 35;
        return ep > 35;
      });
    }

    return [...result].sort((a, b) => {
      if (filters.sort === "rating") return b.rating - a.rating;
      if (filters.sort === "wifi") return b.wifiMbps - a.wifiMbps;
      if (filters.sort === "reviews") return b.reviewCount - a.reviewCount;
      if (a.espressoPrice !== undefined && b.espressoPrice !== undefined)
        return a.espressoPrice - b.espressoPrice;
      const order: Record<PriceRange, number> = { $: 0, $$: 1, $$$: 2 };
      return order[a.priceRange] - order[b.priceRange];
    });
  }, [places, filters]);

  return (
    <PlaceDirectoryContext.Provider value={{ filtered, filters, setFilters, allCities }}>
      <div
        data-slot="place-directory"
        className={cn("bg-cream min-h-screen", className)}
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
      className={cn("sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm", className)}
      {...props}
    >
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                { label: "Budget", value: "$" },
                { label: "Mid-range", value: "$$" },
                { label: "Premium", value: "$$$" },
              ],
            },
          ].map((select) => (
            <Select
              key={select.id}
              value={select.value}
              onValueChange={(val) => set(select.id as keyof Filters, val)}
            >
              <SelectTrigger className="h-10 min-h-10 border-none bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 font-bold px-4 rounded-full cursor-pointer transition-colors shadow-none select-none focus:ring-0 focus-visible:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                align="start"
                className="bg-white border border-gray-100 shadow-md rounded-xl p-1"
              >
                {select.options.map((opt) => {
                  const val = typeof opt === "string" ? opt : opt.value;
                  const label = typeof opt === "string" ? opt : opt.label;
                  return (
                    <SelectItem
                      key={val}
                      value={val}
                      className="rounded-lg text-sm text-gray-700 cursor-pointer"
                    >
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ))}

          {/* Sort */}
          <Select value={filters.sort} onValueChange={(val) => set("sort", val as Filters["sort"])}>
            <SelectTrigger className="ml-auto h-10 min-h-10 pl-4 pr-4 text-sm font-bold text-gray-900 bg-white border-2 border-gray-100 rounded-full cursor-pointer transition-all hover:border-primary/30 focus:ring-0 focus-visible:ring-0 shadow-none select-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              align="end"
              className="bg-white border border-gray-100 shadow-md rounded-xl p-1"
            >
              <SelectItem
                value="rating"
                className="rounded-lg text-sm text-gray-700 cursor-pointer"
              >
                Sort: Best rated
              </SelectItem>
              <SelectItem value="wifi" className="rounded-lg text-sm text-gray-700 cursor-pointer">
                Sort: Fastest WiFi
              </SelectItem>
              <SelectItem value="price" className="rounded-lg text-sm text-gray-700 cursor-pointer">
                Sort: Cheapest first
              </SelectItem>
              <SelectItem
                value="reviews"
                className="rounded-lg text-sm text-gray-700 cursor-pointer"
              >
                Sort: Most reviewed
              </SelectItem>
            </SelectContent>
          </Select>

          <span className="text-sm text-gray-400 font-bold shrink-0" aria-live="polite">
            <span className="text-gray-900">{filtered.length}</span> spots
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── RevealItem ────────────────────────────────────────────────────────────────

function RevealItem({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <li
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={cn(
        "transition-all duration-500",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
      )}
    >
      {children}
    </li>
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
      className={cn("max-w-360 mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20", className)}
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
            <RevealItem key={place.id} delay={Math.min(index % 4, 3) * 80}>
              <Item place={place} />
            </RevealItem>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Item ──────────────────────────────────────────────────────────────────────

const priceLabel: Record<PriceRange, string> = {
  $: "Budget",
  $$: "Mid-range",
  $$$: "Premium",
};

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

  const [imgLoaded, setImgLoaded] = useState(false);

  const barRef = useRef<HTMLDivElement>(null);
  const [barAnimated, setBarAnimated] = useState(false);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setBarAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const targetWidth = `${Math.min((place.wifiMbps / 120) * 100, 100)}%`;

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
        {place.images?.[0] && !imgLoaded && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-card-shimmer bg-linear-to-r from-transparent via-white/20 to-transparent" />
          </div>
        )}
        {place.images?.[0] && (
          <img
            src={place.images[0]}
            alt={place.name}
            onLoad={() => setImgLoaded(true)}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105",
              imgLoaded ? "opacity-100" : "opacity-0",
            )}
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
          <div ref={barRef} className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-1000 ease-out",
                isFast ? "bg-emerald-500" : isOk ? "bg-amber-500" : "bg-red-500",
              )}
              style={{ width: barAnimated ? targetWidth : "0%" }}
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
              {place.outletsLabel || "Unknown"}
            </div>
          </div>
        </div>

        {/* Amenity badges */}
        <div className="flex flex-wrap gap-1.5">
          {place.tpe === true && (
            <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wide">
              TPE
            </span>
          )}
          {place.tpe === false && (
            <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-wide">
              Cash only
            </span>
          )}
          {place.nonSmoking === true && (
            <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wide">
              Non-smoking area
            </span>
          )}
        </div>

        {/* Tags & Price */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Comfort
            </span>
            <span className="text-xs font-black text-emerald-600">{place.comfortScoreLabel}</span>
          </div>
          <span className="text-sm font-black text-gray-900">
            {place.espressoPrice ? `from ${place.espressoPrice} MAD` : priceLabel[place.priceRange]}
          </span>
        </div>

        {/* Action */}
        <Button className="relative overflow-hidden w-full rounded-2xl h-12 font-black text-sm uppercase tracking-widest bg-gray-900 hover:bg-primary transition-all group-hover:shadow-lg group-hover:shadow-primary/20">
          See Details
          <span
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-300-to-r from-transparent via-white/10 to-transparent pointer-events-none"
            aria-hidden="true"
          />
        </Button>
      </div>
    </article>
  );
}
// ─── Namespace export ──────────────────────────────────────────────────────────

export const PlaceDirectory = { Root, Filters, Grid, Item };
