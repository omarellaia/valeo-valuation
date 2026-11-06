export interface FinancialsData {
  periods: string[];
  metrics: Record<string, { unit: string; source: string; page: number | null; values: Record<string, number | null> }>;
}

export interface HistoryRow {
  period: string;
  sales: number;
  growth: number | null;
  ebitda: number;
  ebitdaMargin: number;
  operatingMargin: number;
  operatingMarginPct: number;
  netIncome: number;
  netDebt: number;
  netDebtToEbitda: number | null;
}

/** Ratios from the historical statements. H1 figures are not annualised; ND/EBITDA for H1 is left out. */
export function historyTable(f: FinancialsData): HistoryRow[] {
  const m = (k: string, p: string) => {
    const x = f.metrics[k]?.values[p];
    if (x === null || x === undefined) throw new Error(`missing ${k} for ${p} in valeo_financials.csv`);
    return x;
  };
  return f.periods.map((p, i) => {
    const sales = m("sales", p), ebitda = m("ebitda_adj", p), om = m("operating_margin", p);
    const prev = i > 0 && !f.periods[i - 1].startsWith("H") && !p.startsWith("H") ? m("sales", f.periods[i - 1]) : null;
    return {
      period: p.replace("_", " "), sales, growth: prev ? sales / prev - 1 : null, ebitda, ebitdaMargin: ebitda / sales,
      operatingMargin: om, operatingMarginPct: om / sales, netIncome: m("net_income_group", p), netDebt: m("net_financial_debt", p),
      netDebtToEbitda: p.startsWith("H") ? null : m("net_financial_debt", p) / ebitda,
    };
  });
}

export interface BridgeItem { item: string; amount: number }

/** Running total of the 2025 EBITDA-to-FCF bridge; returns totals before restructuring and after interest. */
export function fcfBridge(items: BridgeItem[]) {
  let run = 0;
  const steps = items.map((x) => { const start = run; run += x.amount; return { ...x, start, end: run }; });
  const idx = items.findIndex((x) => x.item.toLowerCase().startsWith("restructuration"));
  const beforeRestructuring = idx > 0 ? steps[idx - 1].end : null;
  return { steps, beforeRestructuring, afterInterest: run };
}
