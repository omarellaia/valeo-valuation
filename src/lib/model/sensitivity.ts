import { enterpriseValue, perShareValue } from "./dcf";
import type { ForecastRow } from "./types";

/** Value per share for each (WACC row, g column). Cells where g ≥ WACC are null. */
export function sensitivityGrid(rows: ForecastRow[], waccs: number[], growths: number[], claims: number, shares: number): (number | null)[][] {
  return waccs.map((w) => growths.map((g) => (g < w ? perShareValue(enterpriseValue(rows, w, g).ev, claims, shares) : null)));
}

/** WACC axis centred on a value: base ± span in fixed steps (spec: ±1 pt in 0.5 pt steps). */
export function centredAxis(centre: number, span: number, step: number): number[] {
  const n = Math.round(span / step);
  return Array.from({ length: 2 * n + 1 }, (_, i) => centre + (i - n) * step);
}
