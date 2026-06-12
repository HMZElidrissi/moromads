import { Footer } from "~/components/footer";
import { NomadHeader } from "~/components/nomad-header";
import { Button } from "~/components/ui/button";
import { Link } from "react-router";
import { ChevronLeft, Heart, Globe, Users, Zap } from "lucide-react";

export function meta() {
  return [
    { title: "About Moromads — Morocco's Digital Nomad Work Spot Directory" },
    {
      name: "description",
      content:
        "Moromads maps the best cafés and coworking spaces for digital nomads across Morocco. Real WiFi data, verified spots, and a growing remote work community.",
    },
  ];
}

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <NomadHeader />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Button
            variant="ghost"
            asChild
            className="px-0 text-gray-500 hover:text-gray-900 font-bold group mb-12"
          >
            <Link to="/">
              <ChevronLeft
                size={20}
                className="mr-1 transition-transform group-hover:-translate-x-1"
              />
              Back to exploration
            </Link>
          </Button>

          <div className="space-y-16">
            {/* Mission */}
            <section className="space-y-6">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">Our Mission</h2>
              <p className="text-xl text-gray-500 leading-relaxed font-medium">
                Moromads was born from a simple observation: Morocco is one of the most underrated
                destinations for digital nomads, yet finding a reliable coworking space or café with
                fast WiFi can be a real challenge. Our goal is to map every work-friendly spot in
                the Kingdom — from coworking spaces in Casablanca to quiet cafés in Fez — and give
                remote workers the data they actually need: real WiFi speeds, noise levels, and
                honest comfort ratings.
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
                  We are locals and digital nomads who love this country. Every coworking space and
                  café on Moromads is manually verified so you can work from Morocco with
                  confidence.
                </p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Globe size={24} />
                </div>
                <h3 className="text-xl font-black text-gray-900">Community Driven</h3>
                <p className="text-gray-500 font-medium leading-relaxed">
                  Moromads is powered by Morocco's remote work community. By sharing your WiFi tests
                  and reviews, you help thousands of digital nomads find their perfect spot across
                  the Kingdom.
                </p>
              </div>
            </section>

            {/* Values */}
            <section className="space-y-8">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                What we care about
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: <Zap size={20} />,
                    title: "Accuracy",
                    desc: "No more 'good WiFi' vague descriptions. We want real Mbps numbers.",
                  },
                  {
                    icon: <Users size={20} />,
                    title: "Accessibility",
                    desc: "Helping digital nomads and remote workers find coworking spaces and cafés that genuinely welcome laptops.",
                  },
                  {
                    icon: <Globe size={20} />,
                    title: "Local Impact",
                    desc: "Supporting local businesses across Morocco by connecting them with a steady community of respectful remote workers and nomads.",
                  },
                ].map((val, i) => (
                  <div key={i} className="flex gap-6 items-start">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-900">
                      {val.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-gray-900">{val.title}</h4>
                      <p className="text-gray-500 font-medium">{val.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
