import agadir from "./agadir.json";
import casablanca from "./casablanca.json";
import fez from "./fez.json";
import mohammedia from "./mohammedia.json";
import marrakech from "./marrakech.json";
import rabat from "./rabat.json";
import type { Place } from "~/components/place-directory";

export const allSpots: Record<string, Place[]> = {
  agadir: agadir as Place[],
  casablanca: casablanca as Place[],
  fez: fez as Place[],
  mohammedia: mohammedia as Place[],
  marrakech: marrakech as Place[],
  rabat: rabat as Place[],
};

export const flattenedSpots: Place[] = Object.values(allSpots).flat();
