import type { BridgeInputs, CapitalInputs } from "./types";

/** Hamada: β_L = β_U (1 + (1 − τ) D/E) */
export function leveredBeta(betaU: number, de: number, tax: number): number {
  return betaU * (1 + de * (1 - tax));
}

/** CAPM: r_e = r_f + β_L × ERP */
export function costOfEquity(rf: number, betaL: number, erp: number): number {
  return rf + betaL * erp;
}

/** WACC = E/(D+E) r_e + D/(D+E) r_d (1 − τ) */
export function wacc(equity: number, debt: number, re: number, rd: number, tax: number): number {
  const v = equity + debt;
  return (equity / v) * re + (debt / v) * rd * (1 - tax);
}

export function netDebtAtValuation(b: BridgeInputs): number {
  return b.netDebtH1 - b.fcfH2;
}

/** Everything deducted from EV to reach equity value. Leases are excluded: lease principal is already in FCFF. */
export function bridgeClaims(b: BridgeInputs): number {
  return netDebtAtValuation(b) + b.minorities + b.pensions + b.factoring;
}

export interface WaccBuild {
  marketCap: number;
  deMarket: number;
  betaLMarket: number;
  costOfEquityMarket: number;
  waccMarket: number;
  iterations: { wacc: number; equity: number; de: number; betaL: number; ke: number; next: number }[];
  wacc: number;
  de: number;
  betaL: number;
  costOfEquity: number;
  costOfDebtAfterTax: number;
  lastGap: number;
}

/**
 * Cost of capital with the leverage taken from the DCF's own equity value, solved by fixed-point
 * iteration (replaces the course workbook's circular reference). Starts from market weights.
 * `equityFromWacc` returns the equity value implied by a given WACC (base-case DCF).
 */
export function solveWacc(c: CapitalInputs, netDebtValuation: number, equityFromWacc: (w: number) => number, iterations: number): WaccBuild {
  const marketCap = c.sharePrice * c.sharesM;
  const deMarket = c.netDebtMarket / marketCap;
  const betaLMarket = leveredBeta(c.betaUnlevered, deMarket, c.taxRate);
  const costOfEquityMarket = costOfEquity(c.riskFree, betaLMarket, c.erp);
  const waccMarket = wacc(marketCap, c.netDebtMarket, costOfEquityMarket, c.costOfDebt, c.taxRate);
  const its: WaccBuild["iterations"] = [];
  let w = waccMarket;
  for (let k = 0; k <= iterations; k++) {
    const equity = equityFromWacc(w);
    if (!(equity > 0)) throw new Error("WACC iteration: equity value is not positive");
    const de = netDebtValuation / equity;
    const betaL = leveredBeta(c.betaUnlevered, de, c.taxRate);
    const ke = costOfEquity(c.riskFree, betaL, c.erp);
    const next = wacc(equity, netDebtValuation, ke, c.costOfDebt, c.taxRate);
    its.push({ wacc: w, equity, de, betaL, ke, next });
    w = next;
  }
  const last = its[its.length - 1];
  return {
    marketCap, deMarket, betaLMarket, costOfEquityMarket, waccMarket,
    iterations: its, wacc: last.next, de: last.de, betaL: last.betaL, costOfEquity: last.ke,
    costOfDebtAfterTax: c.costOfDebt * (1 - c.taxRate), lastGap: Math.abs(last.next - last.wacc),
  };
}
