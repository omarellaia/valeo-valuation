import { compsValuation, type Peer } from "./comps";
import { exitMultipleValue, runDcf } from "./dcf";
import { applyDecisionRule } from "./decision";
import { projectFcff } from "./forecast";
import { sensitivityGrid, centredAxis } from "./sensitivity";
import type { BridgeInputs, CapitalInputs, OperatingInputs, ScenarioDrivers, ScenarioKey } from "./types";
import { bridgeClaims, netDebtAtValuation, solveWacc } from "./wacc";

export * from "./types";

type Input = { value: number; unit: string; label: string; source: string; as_of: string; analyst_assumption: boolean };
export interface MarketData {
  valuation_date: string;
  inputs: Record<string, Input>;
  bridge: Record<string, Input>;
  operating: Record<string, Input>;
  cross_checks: Record<string, Input>;
  probabilities: { bear: number; base: number; bull: number; source: string };
}
export interface ScenarioData {
  years: number[];
  scenarios: Record<ScenarioKey, ScenarioDrivers>;
  sensitivity: { wacc: number[]; growth: number[]; source: string };
}
export interface DecisionData { margin_of_safety: number; bear_max_loss: number; reference_price: "offer" | "market" }
export interface ModelData { market: MarketData; scenarios: ScenarioData; peers: Peer[]; decision: DecisionData }

export interface Overrides { scenario: ScenarioKey; wacc?: number; g?: number }

const req = (group: Record<string, Input>, key: string) => {
  const x = group[key];
  if (!x || typeof x.value !== "number") throw new Error(`market.json: missing ${key}`);
  return x.value;
};

export function inputsFrom(d: ModelData) {
  const { inputs: i, bridge: b, operating: o } = d.market;
  const capital: CapitalInputs = {
    riskFree: req(i, "risk_free"), erp: req(i, "erp"), betaUnlevered: req(i, "beta_unlevered"), costOfDebt: req(i, "cost_of_debt"),
    taxRate: req(i, "tax_rate"), sharePrice: req(i, "share_price"), sharesM: req(i, "shares_m"), netDebtMarket: req(b, "net_debt_h1"),
  };
  const bridge: BridgeInputs = { netDebtH1: req(b, "net_debt_h1"), fcfH2: req(b, "fcf_h2_2026"), minorities: req(b, "minorities"), pensions: req(b, "pensions"), factoring: req(b, "factoring") };
  const operating: OperatingInputs = { taxRate: capital.taxRate, sales2025: req(o, "sales_2025"), nwcPctSales: req(o, "nwc_pct_sales"), leasePctSales: req(o, "lease_pct_sales") };
  return { capital, bridge, operating };
}

/** The whole valuation, recomputed from data + the viewer's overrides. Pure. */
export function runModel(d: ModelData, o: Overrides) {
  const { capital, bridge, operating } = inputsFrom(d);
  const years = d.scenarios.years;
  const claims = bridgeClaims(bridge);
  const ndVal = netDebtAtValuation(bridge);
  const shares = capital.sharesM;
  const rowsOf = (k: ScenarioKey) => projectFcff(years, d.scenarios.scenarios[k], operating);
  const baseRows = rowsOf("base");
  const baseG = d.scenarios.scenarios.base.terminal_growth;
  const waccBuild = solveWacc(capital, ndVal, (w) => runDcf(baseRows, w, baseG, claims, shares).equity, req(d.market.cross_checks, "wacc_iterations"));
  const modelWacc = waccBuild.wacc;

  const byScenario = (["bear", "base", "bull"] as ScenarioKey[]).map((k) => {
    const dcf = runDcf(rowsOf(k), modelWacc, d.scenarios.scenarios[k].terminal_growth, claims, shares);
    return { key: k, label: d.scenarios.scenarios[k].label, dcf };
  });
  const probs = d.market.probabilities;
  const weighted = byScenario.reduce((s, x) => s + x.dcf.perShare * probs[x.key], 0);

  const selRows = rowsOf(o.scenario);
  const w = o.wacc ?? modelWacc;
  const g = o.g ?? d.scenarios.scenarios[o.scenario].terminal_growth;
  const gValid = g < w;
  const selected = gValid ? runDcf(selRows, w, g, claims, shares) : null;

  const workbookGrid = sensitivityGrid(baseRows, d.scenarios.sensitivity.wacc, d.scenarios.sensitivity.growth, claims, shares);
  const gridWacc = centredAxis(w, 0.01, 0.005);
  const gridG = [0.01, 0.015, 0.02, 0.025];
  const grid = sensitivityGrid(selRows, gridWacc, gridG, claims, shares);

  const cc = d.market.cross_checks;
  const exitLow = exitMultipleValue(baseRows, modelWacc, req(cc, "exit_multiple"), claims, shares);
  const exitHigh = exitMultipleValue(baseRows, modelWacc, req(cc, "exit_multiple_high"), claims, shares);

  const y26 = baseRows[0];
  const comps = compsValuation(d.peers, { ebitda: y26.ebitda, ebit: y26.ebit, netIncome: null }, claims, shares);

  const price = capital.sharePrice;
  const offer = { low: price * (1 + req(cc, "premium_low")), chosen: price * (1 + req(cc, "control_premium")), high: price * (1 + req(cc, "premium_high")) };
  const refPrice = d.decision.reference_price === "offer" ? offer.chosen : price;
  const base = byScenario.find((x) => x.key === "base")!.dcf;
  const bear = byScenario.find((x) => x.key === "bear")!.dcf;
  const decision = applyDecisionRule(
    { marginOfSafety: d.decision.margin_of_safety, bearMaxLoss: d.decision.bear_max_loss, referencePrice: d.decision.reference_price },
    { basePerShare: base.perShare, bearPerShare: bear.perShare, compsMid: comps.mid, price: refPrice },
  );

  const football = [
    { method: "Cours 52 semaines", low: req(d.market.inputs, "price_52w_low"), high: req(d.market.inputs, "price_52w_high") },
    { method: "Prix d'offre (prime 20–40%)", low: offer.low, high: offer.high },
    { method: "DCF base: CMPC 8–9%, g 1–2%", low: workbookGrid[3][0] ?? NaN, high: workbookGrid[1][4] ?? NaN },
    { method: "DCF base: sortie 3,0x–3,5x EBITDA", low: exitLow.perShare, high: exitHigh.perShare },
    { method: "DCF scénarios baisse → hausse", low: Math.max(0, bear.perShare), high: byScenario[2].dcf.perShare },
    ...(comps.low !== null ? [{ method: "Comparables (médianes)", low: comps.low, high: comps.high as number }] : []),
  ];

  return {
    years, claims, netDebtValuation: ndVal, shares, price, offer, refPrice,
    capital, bridge, waccBuild, modelWacc, byScenario, weighted,
    selected, selectedScenario: o.scenario, w, g, gValid,
    sensitivity: { wacc: gridWacc, growth: gridG, grid },
    workbookSensitivity: { wacc: d.scenarios.sensitivity.wacc, growth: d.scenarios.sensitivity.growth, grid: workbookGrid },
    exitLow, exitHigh, comps, decision, football,
  };
}

export type ModelOutput = ReturnType<typeof runModel>;
