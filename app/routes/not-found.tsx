import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Footer } from "~/components/footer";
import type { Route } from "./+types/not-found";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Spot Not Found | Moromads" },
    {
      name: "description",
      content: "The work spot you are looking for doesn't exist in our directory.",
    },
  ];
}

export default function NotFound() {
  return <NotFoundContent />;
}

export function NotFoundContent() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <main className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <h1 className="text-9xl md:text-[12rem] font-black text-primary leading-none mb-4 tracking-tighter">
          404
        </h1>
        <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-6">
          Spot Not Found
        </h2>
        <p className="text-gray-500 font-medium text-lg md:text-xl max-w-md mx-auto mb-12">
          The work spot you&apos;re looking for isn&apos;t here. Let&apos;s get you back to the
          Kingdom&apos;s best remote offices.
        </p>
        <Button
          asChild
          className="rounded-full px-12 h-14 text-lg font-bold bg-gray-900 hover:bg-primary text-white transition-all shadow-lg"
        >
          <Link to="/">🇲🇦 Back to exploration</Link>
        </Button>
      </main>

      <Footer />
    </div>
  );
}
