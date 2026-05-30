import agadir from "./agadir.json";
import casablanca from "./casablanca.json";
import mohammedia from "./mohammedia.json";
import type { Place } from "~/components/place-directory";

export const allSpots: Record<string, Place[]> = {
  agadir: agadir as Place[],
  casablanca: casablanca as Place[],
  mohammedia: mohammedia as Place[],
};

export const flattenedSpots: Place[] = Object.values(allSpots).flat();
