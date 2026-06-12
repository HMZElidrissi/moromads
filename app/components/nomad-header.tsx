import { RoughNotation } from "react-rough-notation";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Link } from "react-router";

export type NomadHeaderProps = React.ComponentProps<"header">;

export function NomadHeader({ className, ...props }: NomadHeaderProps) {
  return (
    <header
      data-slot="nomad-header"
      className={cn("relative overflow-hidden pt-16 pb-16 md:pt-24 md:pb-24", className)}
      {...props}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-primary" aria-hidden="true" />

      {/* Nav */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 mb-12 flex justify-center">
        <Link to="/" aria-label="Moromads home">
          <img src="/logo.svg" alt="Moromads" className="h-32" />
        </Link>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Social Proof Avatars */}
        {/* <div className="flex items-center justify-center gap-3 mb-8">
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
        </div> */}

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6">
          The Best Places to Work remotely from{" "}
          <RoughNotation
            type="highlight"
            show
            color="var(--primary)"
            animationDelay={400}
            animationDuration={800}
            multiline
            padding={[2, 6]}
          >
            <span className="text-white">Morocco</span>
          </RoughNotation>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Verified cafés and coworking spaces with real WiFi speeds across Casablanca, Marrakech,
          Agadir, Rabat, Fez and beyond. Find your next office in Morocco.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            asChild
            className="rounded-full px-10 h-14 text-lg font-bold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95"
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
