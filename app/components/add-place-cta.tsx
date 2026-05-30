import { PlusCircle } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

export type AddPlaceCTAProps = React.ComponentProps<"section">;

export function AddPlaceCTA({ className, ...props }: AddPlaceCTAProps) {
  return (
    <section
      data-slot="add-place-cta"
      className={cn("py-16 bg-white border-t border-gray-100", className)}
      {...props}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="border-none shadow-none text-center bg-transparent">
          <CardContent className="p-0">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5">
              <PlusCircle size={28} className="text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
              Know a great spot we&apos;re missing?
            </h2>
            <p className="text-gray-500 text-base mb-8 max-w-xl mx-auto">
              Help the community by adding a café or coworking space. Include the WiFi speed, noise
              level, outlet count, and a photo — it takes 2 minutes.
            </p>
            <div className="flex justify-center">
              <Button asChild className="rounded-full px-8 h-12 text-base shadow-md">
                <a href="/add-place">
                  <PlusCircle size={18} className="mr-2" />
                  Add a place
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
