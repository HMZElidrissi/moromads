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

export function meta({ loaderData, location }: Route.MetaArgs) {
  const searchParams = new URLSearchParams(location.search);
  const city = searchParams.get("city");

  const title = city
    ? `Best Work & Study Spots in ${city} | Moromads`
    : "Moromads — Best Work & Study Cafés & Coworking Spaces in Morocco";

  const description = city
    ? `Find the best cafés and coworking spaces with fast WiFi to work or study in ${city}, Morocco. Verified WiFi speeds, noise, and comfort data.`
    : "Find the best coworking spaces and cafés with fast WiFi to work, study, or co-work as a remote worker, student, or digital nomad across Morocco — Casablanca, Marrakech, Agadir, Rabat, Fez & more.";

  const ogImage = `${loaderData.origin}/og-image.png`;
  const pageUrl = city
    ? `${loaderData.origin}/?city=${encodeURIComponent(city)}`
    : loaderData.origin;

  return [
    { title },
    { name: "description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Moromads" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: ogImage },
    { property: "og:url", content: pageUrl },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
    {
      tagName: "link",
      rel: "canonical",
      href: pageUrl,
    },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const spots = await getAllSpots(env.DB);
  const origin = new URL(request.url).origin;
  return { spots, origin };
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
            <Cities
              onClickCity={(city) => setSearchParams({ city })}
              places={spots}
              className="py-12 md:py-20"
            />
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
                    Best cafés and coworking spaces to work and study in {selectedCity}
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
