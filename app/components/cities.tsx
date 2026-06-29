import { useRef, useState } from "react";
import { Wifi, MapPin, Star, Coffee } from "lucide-react";
import { cn } from "~/lib/utils";
import citiesData from "~/data/cities.json";
import { flattenedSpots } from "~/data/spots";
import type { Place } from "~/components/place-directory";

type City = {
  id: number;
  name: string;
  nameAr: string;
  region: string;
  wifi: number;
  score: number;
  gradient: string;
  icon: string;

  image: string;
  spotCount?: number;
};

function CityCard({ city, onClick }: { city: City; onClick: (name: string) => void }) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    const el = cardRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    setOffset({
      x: ((e.clientX - left) / width - 0.5) * 18,
      y: ((e.clientY - top) / height - 0.5) * 18,
    });
  }

  return (
    <button
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setOffset({ x: 0, y: 0 });
      }}
      onClick={() => onClick(city.name)}
      className="group relative block text-left w-full aspect-4/5 rounded-4xl overflow-hidden shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
    >
      {/* City Photo Background */}
      <div className="absolute inset-0 bg-gray-200">
        <img
          src={city.image}
          alt={city.name}
          className="w-full h-full object-cover"
          style={{
            transform: `scale(${hovered ? 1.1 : 1}) translate(${offset.x}px, ${offset.y}px)`,
            transition: "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        />
        {/* Overlays */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-black/10" />
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay transition-opacity group-hover:opacity-20"
          style={{ background: city.gradient }}
        />
      </div>

      {/* Floating Badges (Top) */}
      <div className="absolute top-5 inset-x-5 flex justify-between items-start">
        {city.spotCount !== undefined && city.spotCount > 0 && (
          <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-2 shadow-xl">
            <Coffee size={14} className="text-primary" />
            <span className="text-[10px] font-black text-white uppercase tracking-wider">
              {city.spotCount} spots
            </span>
          </div>
        )}
        <div className="px-3 py-1.5 rounded-full bg-primary text-white flex items-center gap-1.5 shadow-xl">
          <Star size={12} className="fill-white" />
          <span className="text-xs font-black">{city.score}</span>
        </div>
      </div>

      {/* Content (Bottom) */}
      <div className="absolute bottom-0 inset-x-0 p-6 space-y-4">
        <div>
          <div className="flex items-baseline gap-3">
            <h3 className="font-black text-3xl text-white tracking-tighter leading-tight">
              {city.name.includes("/") ? (
                <>
                  {city.name.split("/")[0]}
                  <br />
                  {city.name.split("/")[1].trim()}
                </>
              ) : (
                city.name
              )}
            </h3>
            <span className="text-xl text-white/40 font-sans leading-tight">
              {city.nameAr?.includes("/") ? (
                <>
                  {city.nameAr.split("/")[0]}
                  <br />
                  {city.nameAr.split("/")[1].trim()}
                </>
              ) : (
                city.nameAr
              )}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-black uppercase tracking-widest mt-1">
            <MapPin size={10} className="text-primary" />
            {city.region}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Wifi size={14} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-black text-white leading-none">{city.wifi} Mbps</p>
              <p className="text-[8px] font-black text-white/40 uppercase tracking-tighter">
                Avg WiFi
              </p>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export type CitiesProps = React.ComponentProps<"section"> & {
  onClickCity?: (name: string) => void;
  places?: Place[];
};

export function Cities({ onClickCity, places: liveSpots, className, ...props }: CitiesProps) {
  const places = liveSpots ?? (flattenedSpots as Place[]);

  // Calculate dynamic stats for each city
  const cities = (citiesData as City[]).map((city) => {
    const citySpots = places.filter((p) => p.city.toLowerCase() === city.name.toLowerCase());

    if (citySpots.length === 0) return { ...city, spotCount: 0 };

    const avgWifi = Math.round(
      citySpots.reduce((acc, curr) => acc + curr.wifiMbps, 0) / citySpots.length,
    );
    const avgRating = citySpots.reduce((acc, curr) => acc + curr.rating, 0) / citySpots.length;

    return {
      ...city,
      wifi: avgWifi,
      score: Number(avgRating.toFixed(1)),
      spotCount: citySpots.length,
    };
  });

  return (
    <section className={cn("py-20 bg-cream", className)} {...props}>
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">
              Popular Destinations
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
              Where moromads are living
            </h2>
          </div>
          <a
            href="/cities"
            className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors shrink-0"
          >
            View all cities →
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {cities.map((city) => (
            <CityCard key={city.id} city={city} onClick={(name) => onClickCity?.(name)} />
          ))}
        </div>
      </div>
    </section>
  );
}
