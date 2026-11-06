import type { ForecastRow, OperatingInputs, ScenarioDrivers } from "./types";

/**
 * Project sales and free cash flow to the firm, year by year.
 * FCFF = EBIT(1 − τ) + D&A − capex (incl. capitalised R&D) − ΔNWC − IFRS 16 lease principal.
 * EBIT is after restructuring cash costs, which are shown as their own line.
 */
export function projectFcff(years: number[], d: ScenarioDrivers, op: OperatingInputs): ForecastRow[] {
  const n = years.length;
  for (const arr of [d.growth, d.ebitda_margin, d.da_pct, d.restructuring_pct, d.capex_pct]) {
    if (arr.length !== n) throw new Error(`driver length ${arr.length} ≠ ${n} years`);
  }
  const rows: ForecastRow[] = [];
  let sales = d.sales_2026;
  let prevNwc = op.nwcPctSales * op.sales2025;
  for (let i = 0; i < n; i++) {
    const growth = i === 0 ? null : (d.growth[i] as number);
    if (i > 0) sales = sales * (1 + (growth as number));
    const ebitda = sales * d.ebitda_margin[i];
    const da = sales * d.da_pct[i];
    const restructuring = sales * d.restructuring_pct[i];
    const ebit = ebitda - da - restructuring;
    const tax = ebit * op.taxRate;
    const capex = sales * d.capex_pct[i];
    const nwc = op.nwcPctSales * sales;
    const deltaNwc = nwc - prevNwc;
    prevNwc = nwc;
    const lease = sales * op.leasePctSales;
    const fcff = ebit - tax + da - capex - deltaNwc - lease;
    rows.push({ year: years[i], t: i, sales, growth, ebitda, da, restructuring, ebit, tax, capex, nwc, deltaNwc, lease, fcff });
  }
  return rows;
}
