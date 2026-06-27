import { useState } from "react";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { Submission } from "~/lib/db.server";
import { Field, WifiField, espressoToRange, PRICE_RANGE_HINT, fieldCls, GRADIENTS } from "./shared";

export type ApprovalFormProps = {
  sub: Submission;
  onClose: () => void;
  busy: boolean;
};

export function ApprovalForm({ sub, onClose, busy }: ApprovalFormProps) {
  const [priceRange, setPriceRange] = useState<string>(sub.priceRange ?? "");

  return (
    <Form method="post" className="p-6 space-y-5">
      <input type="hidden" name="intent" value="approve" />
      <input type="hidden" name="id" value={sub.id} />
      <input type="hidden" name="submission_json" value={JSON.stringify(sub)} />

      <div className="flex items-center gap-3 pb-1">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">{sub.name}</p>
          <p className="text-xs text-muted-foreground">
            {sub.city} · {sub.address}
            {sub.submitterEmail && ` · ${sub.submitterEmail}`}
          </p>
          {sub.notes && (
            <p className="text-xs text-muted-foreground/70 italic mt-0.5">"{sub.notes}"</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-7 px-3 rounded-lg border border-border text-muted-foreground text-xs font-medium hover:border-destructive hover:text-destructive transition-all"
        >
          Cancel
        </button>
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Fill in technical details to publish
      </p>

      <div className="grid grid-cols-2 gap-4">
        <WifiField defaultMbps={sub.wifiMbps} required />
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
          <Select
            name="air_conditioned"
            defaultValue={sub.airConditioned === null ? "" : sub.airConditioned ? "1" : "0"}
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
            defaultValue={sub.espressoPrice ?? ""}
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
          <Select name="tpe" defaultValue={sub.tpe === null ? "" : sub.tpe ? "1" : "0"}>
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
            defaultValue={sub.nonSmoking === null ? "" : sub.nonSmoking ? "1" : "0"}
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

      {!sub.mapsUrl && (
        <Field label="Google Maps URL">
          <input name="maps_url" type="url" className={fieldCls} />
        </Field>
      )}
      {!sub.timing && (
        <Field label="Opening Hours">
          <input name="timing" placeholder="Mon–Sat: 08:00 – 22:00" className={fieldCls} />
        </Field>
      )}

      <Button
        type="submit"
        disabled={busy}
        className="h-10 px-6 rounded-lg bg-foreground hover:bg-primary text-background font-semibold text-sm transition-all disabled:opacity-50"
      >
        {busy ? "Publishing…" : "Publish Spot"}
      </Button>
    </Form>
  );
}
