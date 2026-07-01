import type { Route } from "./+types/about";
import { Footer } from "~/components/footer";
import { NomadHeader } from "~/components/nomad-header";
import { Heart, Globe } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  return { origin: new URL(request.url).origin };
}

export function meta({ loaderData }: Route.MetaArgs) {
  const title = "About Moromads — Find the Best Work & Study Spots in Morocco";
  const description =
    "Moromads is a community-driven directory for remote workers, students, digital nomads, and focus-seekers in Morocco. Find cafés and coworking spaces with verified WiFi, noise, and comfort data.";
  const ogImage = `${loaderData.origin}/og-image.png`;
  const pageUrl = `${loaderData.origin}/about`;
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

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <NomadHeader />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="space-y-16">
            {/* Our Story */}
            <section className="space-y-6">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">Our Story</h2>
              <p className="text-xl text-gray-500 leading-relaxed font-medium">
                Hi, this is Nada and Hamza! We started Moromads because we lived the struggle
                firsthand. Our journey began back in our university days, huddled in quiet library
                corners and crowded cafés trying to study. During our internship days, the hustle
                didn't stop — we were constantly searching for spots with stable internet, decent
                power outlets, and good coffee where we could actually focus.
              </p>
              <p className="text-xl text-gray-500 leading-relaxed font-medium">
                Once we transitioned into remote work, we took our laptops on the road, constantly
                changing cities across Morocco. Whether we were working from a coastal café in
                Taghazout, a bustling space in Casablanca, or a quiet spot in Rabat, one question
                always followed us:{" "}
                <em>"Can I actually work from this café properly with a laptop?"</em>
              </p>
              <p className="text-xl text-gray-500 leading-relaxed font-medium">
                Tired of showing up to places only to find out they don't welcome laptops, have no
                power outlets, or are too noisy to focus, we decided to build Moromads. We coined
                the term "Moromads" (Moroccan Nomads) to describe anyone like us: remote workers,
                students, digital nomads, and focus-seekers who need a welcoming space to get things
                done, wherever they are in the Kingdom.
              </p>
            </section>

            {/* Our Mission */}
            <section className="space-y-6">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Our Mission</h2>
              <p className="text-lg text-gray-500 leading-relaxed font-medium">
                Our goal is to map every work-friendly spot in Morocco — from coworking spaces in
                Casablanca to quiet cafés in Fez — and give fellow Moromads the data they actually
                need: real WiFi speeds, noise levels, and honest comfort ratings.
              </p>
            </section>

            {/* Why Morocco */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Heart size={24} fill="currentColor" />
                </div>
                <h3 className="text-xl font-black text-gray-900">Built with Love</h3>
                <p className="text-gray-500 font-medium leading-relaxed">
                  We are locals and remote professionals who love this country. Every workspace and
                  café on Moromads is verified so you can study, focus, or work from Morocco with
                  confidence.
                </p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Globe size={24} />
                </div>
                <h3 className="text-xl font-black text-gray-900">Community Driven</h3>
                <p className="text-gray-500 font-medium leading-relaxed">
                  Moromads is powered by Morocco's remote work, study, and nomad community. By
                  sharing your WiFi tests and reviews, you help fellow Moromads find their perfect
                  focus spot across the Kingdom.
                </p>
              </div>
            </section>

            {/* Follow CTA */}
            <section className="rounded-[2.5rem] bg-gray-900 px-10 py-12 text-center space-y-6">
              <h2 className="text-3xl font-black text-white tracking-tight">Follow the journey</h2>
              <p className="text-gray-400 font-medium leading-relaxed max-w-md mx-auto">
                We share spot discoveries, tips for working remotely in Morocco, and
                behind-the-scenes on Instagram and TikTok.
              </p>
              <div className="flex items-center justify-center gap-4">
                <a
                  href="https://www.instagram.com/moromads_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 h-12 px-6 rounded-2xl bg-white text-gray-900 font-black text-sm hover:bg-primary hover:text-white transition-all"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                    aria-hidden
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                  @moromads_
                </a>
                <a
                  href="https://www.tiktok.com/@moromads_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 h-12 px-6 rounded-2xl bg-white/10 text-white font-black text-sm hover:bg-primary hover:text-white transition-all"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                    aria-hidden
                  >
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                  </svg>
                  @moromads_
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
