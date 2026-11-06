export type ScenarioKey = "bear" | "base" | "bull";

export interface ScenarioDrivers {
  label: string;
  description: string;
  sales_2026: number;
  /** growth[0] is null: 2026 is the base year */
  growth: (number | null)[];
  ebitda_margin: number[];
  da_pct: number[];
  restructuring_pct: number[];
  capex_pct: number[];
  terminal_growth: number;
}

export interface OperatingInputs {
  taxRate: number;
  sales2025: number;
  nwcPctSales: number;
  leasePctSales: number;
}

export interface CapitalInputs {
  riskFree: number;
  erp: number;
  betaUnlevered: number;
  costOfDebt: number;
  taxRate: number;
  sharePrice: number;
  sharesM: number;
  netDebtMarket: number; // net debt used for market-weight D/E (30/06/2026)
}

export interface BridgeInputs {
  netDebtH1: number;
  fcfH2: number;
  minorities: number;
  pensions: number;
  factoring: number;
}

export interface ForecastRow {
  year: number;
  t: number;
  sales: number;
  growth: number | null;
  ebitda: number;
  da: number;
  restructuring: number;
  ebit: number;
  tax: number;
  capex: number;
  nwc: number;
  deltaNwc: number;
  lease: number;
  fcff: number;
}

export interface DcfResult {
  wacc: number;
  g: number;
  rows: ForecastRow[];
  pvFcf: number;
  tv: number;
  pvTv: number;
  ev: number;
  claims: number;
  equity: number;
  perShare: number;
  tvShareOfEv: number;
  impliedExitEvEbitda: number;
}
