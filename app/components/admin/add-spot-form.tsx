import { useState } from "react";
import { Form, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Field, WifiField, espressoToRange, PRICE_RANGE_HINT, fileCls, GRADIENTS } from "./shared";

export function AddSpotForm() {
  const [priceRange, setPriceRange] = useState("");
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <div className="space-y-5">
      <Form method="post" encType="multipart/form-data" className="space-y-5">
        <input type="hidden" name="intent" value="create-spot" />

        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Basic Info
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Name *">
            <Input name="name" required placeholder="Café Boavista" />
          </Field>
          <Field label="Type *">
            <Select name="type" required defaultValue="">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="café">Café</SelectItem>
                <SelectItem value="coworking">Coworking</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="City *">
            <Input name="city" required placeholder="Casablanca" />
          </Field>
          <Field label="Address *">
            <Input name="address" required placeholder="12 Rue Hassan II" />
          </Field>
          <Field label="Google Maps URL">
            <Input name="maps_url" type="url" placeholder="https://maps.google.com/…" />
          </Field>
          <Field label="Opening Hours">
            <Input name="timing" placeholder="Mon–Sat: 08:00 – 22:00" />
          </Field>
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground pt-1">
          Technical Details
        </p>

        <div className="grid grid-cols-2 gap-4">
          <WifiField required />
          <Field label="Comfort Score (1–5) *">
            <Select name="comfort_score" required defaultValue="">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select…" />
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
            <Select name="noise_level" required defaultValue="">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quiet">Quiet</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="lively">Lively</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Air Conditioning?">
            <Select name="air_conditioned" defaultValue="">
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
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) setPriceRange(espressoToRange(val));
              }}
            />
          </Field>
          <Field label="Price Range *" hint={PRICE_RANGE_HINT}>
            <Select name="price_range" required value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="$">Budget</SelectItem>
                <SelectItem value="$$">Mid-range</SelectItem>
                <SelectItem value="$$$">Premium</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Power Outlets *">
            <Select name="outlets_label" required defaultValue="">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="Limited">Limited</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Vibe *">
            <Select name="gradient" required defaultValue="">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select…" />
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
            <Select name="tpe" defaultValue="">
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
            <Select name="non_smoking" defaultValue="">
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
            <Select name="staff_score" defaultValue="">
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
          <Input name="extra_tags" placeholder="sea-view, dog-friendly" />
        </Field>

        <Field label="Internal Notes">
          <textarea
            name="notes"
            rows={2}
            placeholder="Admin-only notes about this spot…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </Field>

        <Field label="Photos (optional)">
          <input name="images" type="file" multiple accept="image/*" className={fileCls} />
        </Field>

        <Button
          type="submit"
          disabled={busy}
          className="h-10 px-6 rounded-lg bg-foreground hover:bg-primary text-background font-semibold text-sm transition-all disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create Spot"}
        </Button>
      </Form>
    </div>
  );
}
