import { describe, expect, it } from "vitest";
import X from "./workbook_expected.json";
import { modelData, financialsData, fcfBridgeRaw } from "@/lib/data";
import { inputsFrom, runModel } from "@/lib/model";
import { projectFcff } from "@/lib/model/forecast";
import { costOfEquity, leveredBeta, wacc, bridgeClaims, netDebtAtValuation, solveWacc } from "@/lib/model/wacc";
import { enterpriseValue, exitMultipleValue, perShareValue, pvExplicit, runDcf, terminalValue } from "@/lib/model/dcf";
import { centredAxis, sensitivityGrid } from "@/lib/model/sensitivity";
import { compsValuation, median, peerMultiples, type Peer } from "@/lib/model/comps";
import { applyDecisionRule } from "@/lib/model/decision";
import { fcfBridge, historyTable } from "@/lib/model/history";

// Expected values: src/lib/model/__tests__/workbook_expected.json, produced from model/valeo_model.xlsx by scripts/workbook_reference.py
const CENT = 2; // to the cent
const M = 6;

const { capital, bridge, operating } = inputsFrom(modelData);
const years = modelData.scenarios.years;
const S = modelData.scenarios.scenarios;
const out = runModel(modelData, { scenario: "base" });

describe("data files tie to the workbook inputs", () => {
  it("market inputs", () => {
    expect(capital.riskFree).toBe(X.inputs.rf);
    expect(capital.erp).toBe(X.inputs.erp);
    expect(capital.betaUnlevered).toBe(X.inputs.bu);
    expect(capital.costOfDebt).toBe(X.inputs.kd);
    expect(capital.taxRate).toBe(X.inputs.tax);
    expect(capital.sharePrice).toBe(X.inputs.price);
    expect(capital.sharesM).toBe(X.inputs.shares);
    expect(bridge.netDebtH1).toBe(X.inputs.nd_h1);
    expect(bridge.minorities + bridge.pensions + bridge.factoring).toBe(X.inputs.minorities + X.inputs.pensions + X.inputs.factoring);
    expect(operating.nwcPctSales).toBe(X.inputs.nwc_pct);
    expect(operating.leasePctSales).toBe(X.inputs.lease_pct);
  });
});

describe("forecast.ts", () => {
  for (const k of ["bear", "base", "bull"] as const) {
    it(`FCFF ${k} 2026–2033`, () => {
      const rows = projectFcff(years, S[k], operating);
      rows.forEach((r, i) => {
        expect(r.sales).toBeCloseTo(X.scenarios[k].sales[i], M);
        expect(r.ebitda).toBeCloseTo(X.scenarios[k].ebitda[i], M);
        expect(r.fcff).toBeCloseTo(X.scenarios[k].fcff[i], M);
      });
    });
  }
  it("rejects drivers of the wrong length", () => {
    expect(() => projectFcff([2026, 2027], S.base, operating)).toThrow();
  });
});

describe("wacc.ts", () => {
  it("Hamada, CAPM, WACC formulas", () => {
    expect(leveredBeta(1, 0.5, 0.25)).toBeCloseTo(1.375, 12);
    expect(costOfEquity(0.03, 1.2, 0.05)).toBeCloseTo(0.09, 12);
    expect(wacc(60, 40, 0.1, 0.05, 0.2)).toBeCloseTo(0.076, 12);
  });
  it("bridge claims and net debt at valuation date", () => {
    expect(netDebtAtValuation(bridge)).toBe(X.net_debt_valuation);
    expect(bridgeClaims(bridge)).toBe(X.claims);
  });
  it("market-weight starting WACC and converged WACC match the workbook", () => {
    expect(out.waccBuild.waccMarket).toBeCloseTo(X.wacc.start, 10);
    expect(out.modelWacc).toBeCloseTo(X.wacc.converged, 10);
    expect(out.waccBuild.de).toBeCloseTo(X.wacc.de, 8);
    expect(out.waccBuild.lastGap).toBeLessThan(1e-6);
    expect(out.waccBuild.iterations).toHaveLength(X.wacc.iterations.length);
  });
  it("throws when equity turns negative", () => {
    expect(() => solveWacc(capital, 1000, () => -1, 3)).toThrow();
  });
});

describe("dcf.ts", () => {
  for (const k of ["bear", "base", "bull"] as const) {
    it(`EV, equity and value per share — ${k}`, () => {
      const r = out.byScenario.find((x) => x.key === k)!.dcf;
      const e = X.scenarios[k];
      expect(r.pvFcf).toBeCloseTo(e.pv_fcf, M);
      expect(r.pvTv).toBeCloseTo(e.pv_tv, M);
      expect(r.ev).toBeCloseTo(e.ev, M);
      expect(r.equity).toBeCloseTo(e.equity, M);
      expect(r.perShare).toBeCloseTo(e.per_share, CENT);
      expect(r.perShare).toBeCloseTo(e.per_share, M);
      expect(r.tvShareOfEv).toBeCloseTo(e.tv_share, M);
    });
  }
  it("probability-weighted value", () => {
    expect(out.weighted).toBeCloseTo(X.weighted_per_share, M);
  });
  it("Gordon TV, discounting and the g < WACC guard", () => {
    expect(terminalValue(100, 0.1, 0.02)).toBeCloseTo(1275, 9);
    expect(() => terminalValue(100, 0.05, 0.05)).toThrow();
    const rows = projectFcff(years, S.base, operating);
    expect(pvExplicit(rows, 0)).toBeCloseTo(rows.slice(1).reduce((s, r) => s + r.fcff, 0), 9);
    const ev = enterpriseValue(rows, 0.09, 0.015);
    expect(ev.ev).toBeCloseTo(ev.pvFcf + ev.pvTv, 9);
    expect(perShareValue(1000, 400, 100)).toBe(6);
    expect(runDcf(rows, 0.09, 0.015, 0, 1).impliedExitEvEbitda).toBeCloseTo(ev.tv / rows[7].ebitda, 9);
  });
  it("exit-multiple cross-check (Synthese B25–B30)", () => {
    const rows = projectFcff(years, S.base, operating);
    const lo = exitMultipleValue(rows, out.modelWacc, 3, X.claims, X.inputs.shares);
    expect(rows[7].ebitda).toBeCloseTo(X.exit_multiple.ebitda_2033, M);
    expect(lo.tv).toBeCloseTo(X.exit_multiple.tv, M);
    expect(lo.perShare).toBeCloseTo(X.exit_multiple.per_share, M);
    expect(lo.impliedG).toBeCloseTo(X.exit_multiple.implied_g, M);
    expect(out.exitHigh.perShare).toBeCloseTo(X.exit_multiple.per_share_35, M);
  });
  it("offer prices", () => {
    expect(out.offer.low).toBeCloseTo(X.offer.p20, M);
    expect(out.offer.chosen).toBeCloseTo(X.offer.chosen, M);
    expect(out.offer.high).toBeCloseTo(X.offer.p40, M);
  });
});

describe("sensitivity.ts", () => {
  it("workbook grid (Synthese A33:F38) to the cent", () => {
    out.workbookSensitivity.grid.forEach((row, i) => row.forEach((v, j) => expect(v as number).toBeCloseTo(X.sensitivity.grid[i][j], M)));
  });
  it("null where g ≥ WACC", () => {
    const rows = projectFcff(years, S.base, operating);
    expect(sensitivityGrid(rows, [0.02], [0.01, 0.02], 0, 1)[0][1]).toBeNull();
  });
  it("centred axis: ±1 pt in 0.5 pt steps", () => {
    const a = centredAxis(0.085, 0.01, 0.005);
    expect(a).toHaveLength(5);
    expect(a[0]).toBeCloseTo(0.075, 12);
    expect(a[4]).toBeCloseTo(0.095, 12);
  });
});

describe("comps.ts (synthetic peers — arithmetic only, not market data)", () => {
  const p = (t: string, price: number, ebitda: number): Peer => ({ ticker: t, name: t, currency: "EUR", price, price_date: "x", shares_m: 10, net_debt_m: 50,
    sales_2026e_m: 1000, ebitda_2026e_m: ebitda, ebit_2026e_m: ebitda / 2, net_income_2026e_m: 20, source: "test" });
  it("multiples from price, shares and net debt", () => {
    const m = peerMultiples(p("A", 10, 30));
    expect(m.marketCap).toBe(100);
    expect(m.ev).toBe(150);
    expect(m.evEbitda).toBe(5);
    expect(m.evEbit).toBe(10);
    expect(m.pe).toBe(5);
    expect(peerMultiples(p("B", 10, 0)).evEbitda).toBeNull();
  });
  it("median, odd and even", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBeNull();
  });
  it("implied range applies medians and the same equity bridge", () => {
    const r = compsValuation([p("A", 10, 30), p("B", 20, 50)], { ebitda: 100, ebit: 50, netIncome: 10 }, 100, 10);
    expect(r.medians.evEbitda).toBeCloseTo(5, 12); // (5 + 5) / 2
    expect(r.implied[0].perShare).toBeCloseTo((5 * 100 - 100) / 10, 12);
    expect(r.low).not.toBeNull();
    expect(compsValuation([], { ebitda: 1, ebit: 1, netIncome: null }, 0, 1).mid).toBeNull();
  });
});

describe("decision.ts", () => {
  const rule = { marginOfSafety: 0.15, bearMaxLoss: 0.3, referencePrice: "market" as const };
  it("BUY when every leg passes", () => {
    expect(applyDecisionRule(rule, { basePerShare: 12, bearPerShare: 8, compsMid: 12, price: 10 }).verdict).toBe("BUY");
  });
  it("NOT BUY when the DCF misses the hurdle", () => {
    expect(applyDecisionRule(rule, { basePerShare: 11, bearPerShare: 8, compsMid: 12, price: 10 }).verdict).toBe("NOT BUY");
  });
  it("NOT BUY when the bear case loses too much", () => {
    expect(applyDecisionRule(rule, { basePerShare: 12, bearPerShare: 6, compsMid: 12, price: 10 }).verdict).toBe("NOT BUY");
  });
  it("INCOMPLETE when only comps are missing", () => {
    expect(applyDecisionRule(rule, { basePerShare: 12, bearPerShare: 8, compsMid: null, price: 10 }).verdict).toBe("INCOMPLETE");
  });
});

describe("history.ts", () => {
  it("2025 FCF bridge ties to the published 756 and 371", () => {
    const b = fcfBridge(fcfBridgeRaw.items);
    expect(b.beforeRestructuring).toBe(fcfBridgeRaw.checks.fcf_before_restructuring.published);
    expect(b.afterInterest).toBe(fcfBridgeRaw.checks.fcf_after_interest.published);
  });
  it("ratios", () => {
    const h = historyTable(financialsData);
    expect(h[2].ebitdaMargin).toBeCloseTo(3082 / 20903, 12);
    expect(h[1].growth).toBeCloseTo(21492 / 22044 - 1, 12);
    expect(h[3].netDebtToEbitda).toBeNull();
  });
});

describe("runModel overrides", () => {
  it("sliders override WACC and g; invalid g ≥ WACC gives no result", () => {
    const r = runModel(modelData, { scenario: "base", wacc: 0.09, g: 0.01 });
    expect(r.selected!.perShare).toBeCloseTo(X.sensitivity.grid[3][0], M);
    expect(runModel(modelData, { scenario: "base", wacc: 0.03, g: 0.03 }).selected).toBeNull();
  });
});
