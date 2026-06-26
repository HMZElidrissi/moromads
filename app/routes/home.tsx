import { useEffect } from "react";
import type { Route } from "./+types/home";
import { getAllSpots } from "~/lib/db.server";
import { cloudflareContext } from "../../load-context";
import { PlaceDirectory } from "~/components/place-directory";
import { AddPlaceCTA } from "~/components/add-place-cta";
import { Footer } from "~/components/footer";
import { NomadHeader } from "~/components/nomad-header";
import { Cities } from "~/components/cities";
import { Button } from "~/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useSearchParams } from "react-router";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Moromads — Best Coworking Spaces & Cafés for Digital Nomads in Morocco" },
    {
      name: "description",
      content:
        "Find the best coworking spaces and cafés with fast WiFi for digital nomads across Morocco — Casablanca, Marrakech, Agadir, Rabat, Fez & more. Real WiFi speeds, noise levels, and verified reviews.",
    },
    {
      property: "og:title",
      content: "Moromads — Best Coworking Spaces & Cafés for Digital Nomads in Morocco",
    },
    {
      property: "og:description",
      content:
        "Morocco's #1 directory for digital nomads. Verified cafés and coworking spaces with real WiFi data across every major city.",
    },
    { name: "twitter:card", content: "summary_large_image" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const spots = await getAllSpots(env.DB);
  return { spots };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { spots } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCity = searchParams.get("city");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [selectedCity]);

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <main id="explore" className="flex-1">
        {!selectedCity ? (
          <div className="animate-in fade-in duration-500">
            <NomadHeader />
            <Cities onClickCity={(city) => setSearchParams({ city })} className="py-12 md:py-20" />
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 bg-white">
            <div className="bg-white pb-10">
              <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <Button
                  variant="ghost"
                  onClick={() => setSearchParams({})}
                  className="group flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold px-0"
                >
                  <ChevronLeft
                    size={20}
                    className="transition-transform group-hover:-translate-x-1"
                  />
                  Back to all cities
                </Button>

                <div className="mt-6">
                  <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                    Work spots in <span className="text-primary">{selectedCity}</span>
                  </h2>
                  <p className="text-gray-500 mt-2 text-lg">
                    Best cafés and coworking spaces for nomads in {selectedCity}
                  </p>
                </div>
              </div>
            </div>

            <PlaceDirectory.Root places={spots} initialCity={selectedCity ?? undefined}>
              <PlaceDirectory.Filters />
              <PlaceDirectory.Grid />
            </PlaceDirectory.Root>
          </div>
        )}

        <AddPlaceCTA />
      </main>

      <Footer />
    </div>
  );
}
