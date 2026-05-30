import { RoughNotation } from "react-rough-notation";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Link } from "react-router";

export type NomadHeaderProps = React.ComponentProps<"header">;

const STAR_PATH =
  "M100,10 L118.6,55 L163.6,36.4 L145,81.4 L190,100 L145,118.6 L163.6,163.6 L118.6,145 L100,190 L81.4,145 L36.4,163.6 L55,118.6 L10,100 L55,81.4 L36.4,36.4 L81.4,55 Z";

export function NomadHeader({ className, ...props }: NomadHeaderProps) {
  return (
    <header
      data-slot="nomad-header"
      className={cn(
        "relative overflow-hidden bg-gradient-to-b from-red-50/40 to-white py-16 md:py-24 border-b border-gray-100",
        className,
      )}
      {...props}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-[#C1272D]" aria-hidden="true" />

      {/* Gigantic centered Moroccan compass rose */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none"
        aria-hidden="true"
      >
        <svg className="w-[110%] max-w-[900px] aspect-square" viewBox="0 0 200 200" fill="none">
          {/* Outermost ring */}
          <circle cx="100" cy="100" r="97" stroke="#C1272D" strokeWidth="0.3" opacity="0.06" />
          {/* Outer 8-pointed star */}
          <path d={STAR_PATH} stroke="#C1272D" strokeWidth="0.5" opacity="0.1" />
          {/* Second ring */}
          <circle cx="100" cy="100" r="78" stroke="#C1272D" strokeWidth="0.3" opacity="0.07" />
          {/* Inner 8-pointed star */}
          <path
            d="M100,28 L114,65 L149,52 L134,87 L171,100 L134,113 L149,148 L114,135 L100,172 L86,135 L51,148 L66,113 L29,100 L66,87 L51,52 L86,65 Z"
            stroke="#C1272D"
            strokeWidth="0.4"
            opacity="0.08"
          />
          {/* Third ring */}
          <circle cx="100" cy="100" r="58" stroke="#C1272D" strokeWidth="0.3" opacity="0.06" />
          {/* Innermost star */}
          <path
            d="M100,47 L109,73 L135,63 L125,89 L151,100 L125,111 L135,137 L109,127 L100,153 L91,127 L65,137 L75,111 L49,100 L75,89 L65,63 L91,73 Z"
            stroke="#C1272D"
            strokeWidth="0.4"
            opacity="0.07"
          />
          {/* Inner ring */}
          <circle cx="100" cy="100" r="38" stroke="#C1272D" strokeWidth="0.3" opacity="0.05" />
          {/* Center dot */}
          <circle cx="100" cy="100" r="2" stroke="#C1272D" strokeWidth="0.5" opacity="0.08" />
          {/* 8 radial lines — full diameter */}
          <line
            x1="100"
            y1="3"
            x2="100"
            y2="197"
            stroke="#C1272D"
            strokeWidth="0.25"
            opacity="0.05"
          />
          <line
            x1="3"
            y1="100"
            x2="197"
            y2="100"
            stroke="#C1272D"
            strokeWidth="0.25"
            opacity="0.05"
          />
          <line
            x1="31"
            y1="31"
            x2="169"
            y2="169"
            stroke="#C1272D"
            strokeWidth="0.25"
            opacity="0.05"
          />
          <line
            x1="169"
            y1="31"
            x2="31"
            y2="169"
            stroke="#C1272D"
            strokeWidth="0.25"
            opacity="0.05"
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Social Proof Avatars */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 border border-gray-200 overflow-hidden"
              >
                <img
                  src={`https://i.pravatar.cc/100?u=${i + 10}`}
                  alt="Member"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          <span className="text-sm font-medium text-gray-500">Join moromads members</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6">
          The Best Places to Work remotely from{" "}
          <RoughNotation
            type="highlight"
            show
            color="#C1272D"
            animationDelay={400}
            animationDuration={800}
            multiline
            padding={[2, 6]}
          >
            <span className="text-white">Morocco</span>
          </RoughNotation>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Discover verified cafés, coworking spaces, and vibrant communities across the Kingdom.
          Find your next office now.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            asChild
            className="rounded-full px-10 h-14 text-lg font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-300 transition-all hover:scale-105 active:scale-95"
          >
            <Link to="/#explore">🇲🇦 Explore</Link>
          </Button>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-400">
            <span>Morocco&apos;s #1 Platform to discover remote work spots</span>
          </div>
        </div>
      </div>
    </header>
  );
}
