import React, { useState } from "react";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";

export type AdminActionResult = { ok: true; slug?: string } | { ok: false; error: string };

export const GRADIENTS = [
  { label: "Sunset", value: "linear-gradient(135deg, #e07b39 0%, #c1272d 100%)" },
  { label: "Ocean", value: "linear-gradient(135deg, #1b4f8b 0%, #2563eb 100%)" },
  { label: "Forest", value: "linear-gradient(135deg, #065f46 0%, #10b981 100%)" },
  { label: "Violet", value: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)" },
  { label: "Amber", value: "linear-gradient(135deg, #b45309 0%, #f59e0b 100%)" },
  { label: "Rose", value: "linear-gradient(135deg, #be185d 0%, #f472b6 100%)" },
];

export const fileCls =
  "w-full rounded-xl border border-border px-4 py-3 text-sm text-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-foreground file:text-background hover:file:bg-primary file:transition-all";

export const fieldCls =
  "w-full h-10 rounded-lg border border-border px-3 text-foreground text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export function espressoToRange(mad: number): "$" | "$$" | "$$$" {
  if (mad <= 20) return "$";
  if (mad <= 35) return "$$";
  return "$$$";
}

export function wifiTierToMbps(tier: string): string {
  if (tier === "slow") return "10";
  if (tier === "ok") return "30";
  if (tier === "fast") return "75";
  return "";
}

export const WIFI_HINT = (
  <ul className="mt-1 space-y-0.5 text-xs text-foreground/60">
    <li>· Slow — under 20 Mbps (emails, basic browsing)</li>
    <li>· OK — 20–49 Mbps (video calls, light work)</li>
    <li>· Fast — 50+ Mbps (smooth remote work, uploads)</li>
  </ul>
);

export const PRICE_RANGE_HINT = (
  <ul className="mt-1 space-y-0.5 text-xs text-foreground/60">
    <li>· Budget — espresso ≤ 20 MAD</li>
    <li>· Mid-range — espresso 21–35 MAD</li>
    <li>· Premium — espresso &gt; 35 MAD</li>
  </ul>
);

export type FieldProps = {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
};

export function Field({ label, children, hint, className }: FieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
      {hint}
    </div>
  );
}

export type WifiFieldProps = { defaultMbps?: number | null; required?: boolean };

export function WifiField({ defaultMbps, required }: WifiFieldProps) {
  const [wifiMbps, setWifiMbps] = useState(defaultMbps != null ? String(defaultMbps) : "");
  return (
    <div className="col-span-2 space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        WiFi Speed{required && " *"}
      </label>
      <div className="grid grid-cols-2 gap-4">
        <Select onValueChange={(t) => setWifiMbps(wifiTierToMbps(t))}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Quality…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="slow">Slow</SelectItem>
            <SelectItem value="ok">OK</SelectItem>
            <SelectItem value="fast">Fast</SelectItem>
          </SelectContent>
        </Select>
        <Input
          name="wifi_mbps"
          type="number"
          min="1"
          required={required}
          placeholder="Exact Mbps (optional)"
          value={wifiMbps}
          onChange={(e) => setWifiMbps(e.target.value)}
        />
      </div>
      {WIFI_HINT}
    </div>
  );
}
