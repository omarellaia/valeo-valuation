import type { DcfResult, ForecastRow } from "./types";

/** Present value of FCFF for t = 1..n (t = 0, the base year, is not discounted in). */
export function pvExplicit(rows: ForecastRow[], w: number): number {
  return rows.filter((r) => r.t >= 1).reduce((s, r) => s + r.fcff / (1 + w) ** r.t, 0);
}

/** Gordon growth: TV = FCFF_n (1 + g) / (WACC − g) */
export function terminalValue(lastFcff: number, w: number, g: number): number {
  if (!(g < w)) throw new Error("terminal growth must be below WACC");
  return (lastFcff * (1 + g)) / (w - g);
}

export function enterpriseValue(rows: ForecastRow[], w: number, g: number) {
  const last = rows[rows.length - 1];
  const pvFcf = pvExplicit(rows, w);
  const tv = terminalValue(last.fcff, w, g);
  const pvTv = tv / (1 + w) ** last.t;
  return { pvFcf, tv, pvTv, ev: pvFcf + pvTv };
}

export function perShareValue(ev: number, claims: number, shares: number): number {
  return (ev - claims) / shares;
}

export function runDcf(rows: ForecastRow[], w: number, g: number, claims: number, shares: number): DcfResult {
  const { pvFcf, tv, pvTv, ev } = enterpriseValue(rows, w, g);
  const equity = ev - claims;
  const last = rows[rows.length - 1];
  return {
    wacc: w, g, rows, pvFcf, tv, pvTv, ev, claims, equity,
    perShare: equity / shares,
    tvShareOfEv: pvTv / ev,
    impliedExitEvEbitda: tv / last.ebitda,
  };
}

/** Exit-multiple cross-check: TV = EBITDA_n × multiple */
export function exitMultipleValue(rows: ForecastRow[], w: number, multiple: number, claims: number, shares: number) {
  const last = rows[rows.length - 1];
  const tv = last.ebitda * multiple;
  const pvTv = tv / (1 + w) ** last.t;
  const ev = pvExplicit(rows, w) + pvTv;
  const impliedG = (tv * w - last.fcff) / (tv + last.fcff);
  return { tv, pvTv, ev, perShare: (ev - claims) / shares, impliedG };
}
