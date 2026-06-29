import { useState, useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { Check, X, Star } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";
import type { Place } from "~/components/place-directory";
import {
  Field,
  WifiField,
  espressoToRange,
  PRICE_RANGE_HINT,
  GRADIENTS,
  type AdminActionResult,
} from "./shared";
import { PhotoPicker } from "~/components/photo-picker";

export type SpotEditFormProps = {
  spot: Place;
  onClose: () => void;
};

export function SpotEditForm({ spot, onClose }: SpotEditFormProps) {
  const [keptImages, setKeptImages] = useState<string[]>(spot.images ?? []);
  const [mainImage, setMainImage] = useState<string>(spot.images?.[0] ?? "");
  const fetcher = useFetcher<AdminActionResult>();
  const busy = fetcher.state !== "idle";
  const prevFetcherState = useRef(fetcher.state);
  const [priceRange, setPriceRange] = useState<string>(spot.priceRange);

  useEffect(() => {
    if (prevFetcherState.current !== "idle" && fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.ok === true) {
        toast.success("Spot updated");
        onClose();
      } else if (fetcher.data.ok === false && "error" in fetcher.data) {
        toast.error(fetcher.data.error);
      }
    }
    prevFetcherState.current = fetcher.state;
  }, [fetcher.state, fetcher.data, onClose]);

  return (
    <fetcher.Form
      method="post"
      encType="multipart/form-data"
      className="bg-muted/30 border-t border-border/50 p-6 space-y-5"
    >
      <input type="hidden" name="intent" value="update-spot" />
      <input type="hidden" name="slug" value={spot.slug} />

      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Basic Info
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name *">
          <Input name="name" required defaultValue={spot.name} />
        </Field>
        <Field label="Type *">
          <Select name="type" required defaultValue={spot.type}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="café">Café</SelectItem>
              <SelectItem value="coworking">Coworking</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="City *">
          <Input name="city" required defaultValue={spot.city} />
        </Field>
        <Field label="Address *">
          <Input name="address" required defaultValue={spot.address} />
        </Field>
        <Field label="Google Maps URL">
          <Input name="maps_url" type="url" defaultValue={spot.mapsUrl} />
        </Field>
        <Field label="Opening Hours">
          <Input
            name="timing"
            defaultValue={spot.timing ?? ""}
            placeholder="Mon–Sat: 08:00 – 22:00"
          />
        </Field>
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground pt-1">
        Technical Details
      </p>
      <div className="grid grid-cols-2 gap-4">
        <WifiField defaultMbps={spot.wifiMbps} required />
        <Field label="Comfort Score (1–5) *">
          <Select name="comfort_score" required defaultValue={String(spot.comfortScore)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Noise Level *">
          <Select name="noise_level" required defaultValue={spot.noiseLevel}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quiet">Quiet</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="lively">Lively</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Air Conditioning?">
          <Select
            name="air_conditioned"
            defaultValue={spot.airConditioned === null ? "" : spot.airConditioned ? "1" : "0"}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unknown</SelectItem>
              <SelectItem value="1">Yes</SelectItem>
              <SelectItem value="0">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Espresso Price (MAD)">
          <Input
            name="espresso_price"
            type="number"
            min="0"
            step="0.5"
            defaultValue={spot.espressoPrice ?? ""}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val > 0) setPriceRange(espressoToRange(val));
            }}
          />
        </Field>
        <Field label="Price Range *" hint={PRICE_RANGE_HINT}>
          <Select name="price_range" required value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="$">Budget</SelectItem>
              <SelectItem value="$$">Mid-range</SelectItem>
              <SelectItem value="$$$">Premium</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Power Outlets *">
          <Select name="outlets_label" required defaultValue={spot.outletsLabel}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="Limited">Limited</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Vibe *">
          <Select name="gradient" required defaultValue={spot.gradient}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRADIENTS.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="TPE / Card Payment">
          <Select name="tpe" defaultValue={spot.tpe === null ? "" : spot.tpe ? "1" : "0"}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unknown</SelectItem>
              <SelectItem value="1">Yes</SelectItem>
              <SelectItem value="0">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Non-smoking area?">
          <Select
            name="non_smoking"
            defaultValue={spot.nonSmoking === null ? "" : spot.nonSmoking ? "1" : "0"}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unknown</SelectItem>
              <SelectItem value="1">Yes</SelectItem>
              <SelectItem value="0">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Staff Friendliness">
          <Select
            name="staff_score"
            defaultValue={spot.staffScore != null ? String(spot.staffScore) : ""}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Unknown" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unknown</SelectItem>
              <SelectItem value="1">Poor</SelectItem>
              <SelectItem value="2">OK</SelectItem>
              <SelectItem value="3">Good</SelectItem>
              <SelectItem value="4">Very Good</SelectItem>
              <SelectItem value="5">Excellent</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field
        label="Extra Tags"
        hint={
          <p className="text-[10px] text-muted-foreground mt-1">
            Comma-separated, e.g. sea-view, dog-friendly, rooftop
          </p>
        }
      >
        <Input
          name="extra_tags"
          defaultValue={spot.tags
            .filter((t) => t !== spot.type && t !== spot.city.toLowerCase())
            .join(", ")}
          placeholder="sea-view, dog-friendly"
        />
      </Field>

      <Field label="Anything else we should know?">
        <textarea
          name="notes"
          rows={2}
          defaultValue={spot.notes ?? ""}
          placeholder={"Great rooftop view\nParking nearby"}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </Field>

      {spot.images && spot.images.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Current photos ({keptImages.length}/{spot.images.length}) · Star to set cover
          </p>
          <div className="flex flex-wrap gap-2">
            {spot.images.map((src) => {
              const kept = keptImages.includes(src);
              const isMain = kept && src === mainImage;
              return (
                <div key={src} className="relative w-20 h-20 shrink-0 group">
                  <div
                    className={cn(
                      "w-full h-full rounded-xl overflow-hidden border-2 transition-all",
                      isMain
                        ? "border-amber-400"
                        : kept
                          ? "border-border opacity-100"
                          : "border-destructive opacity-40",
                    )}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                  {/* Star button — set as cover */}
                  {kept && (
                    <button
                      type="button"
                      onClick={() => setMainImage(src)}
                      className={cn(
                        "absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all shadow",
                        isMain
                          ? "bg-amber-400 text-white opacity-100"
                          : "bg-muted text-muted-foreground opacity-0 group-hover:opacity-100",
                      )}
                      aria-label="Set as cover photo"
                    >
                      <Star size={10} fill={isMain ? "currentColor" : "none"} />
                    </button>
                  )}
                  {/* Remove/restore button */}
                  <button
                    type="button"
                    onClick={() => {
                      setKeptImages((prev) =>
                        kept ? prev.filter((u) => u !== src) : [...prev, src],
                      );
                      if (kept && src === mainImage) {
                        const next = keptImages.find((u) => u !== src);
                        setMainImage(next ?? "");
                      }
                    }}
                    className={cn(
                      "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all shadow",
                      kept
                        ? "bg-muted-foreground/50 opacity-0 group-hover:opacity-100"
                        : "bg-destructive opacity-100",
                    )}
                    aria-label={kept ? "Remove photo" : "Restore photo"}
                  >
                    {kept ? <X size={10} /> : <Check size={10} />}
                  </button>
                </div>
              );
            })}
          </div>
          {/* Hidden inputs — main image first so it becomes images[0] */}
          {keptImages
            .slice()
            .sort((a, b) => (a === mainImage ? -1 : b === mainImage ? 1 : 0))
            .map((src) => (
              <input key={src} type="hidden" name="keep_image" value={src} />
            ))}
          {keptImages.length < spot.images.length && (
            <p className="text-xs text-destructive font-medium">
              {spot.images.length - keptImages.length} photo
              {spot.images.length - keptImages.length > 1 ? "s" : ""} will be removed on save.
            </p>
          )}
        </div>
      )}

      <Field label="Add Photos">
        <PhotoPicker max={5} />
      </Field>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={busy}
          className="h-10 px-6 rounded-lg bg-foreground hover:bg-primary text-background font-semibold text-sm transition-all disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save Changes"}
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="h-10 px-4 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted/50 transition-all"
        >
          Cancel
        </button>
      </div>
    </fetcher.Form>
  );
}
