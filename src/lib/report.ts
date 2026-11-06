import { modelData, financialsData, fcfBridgeRaw } from "@/lib/data";
import { runModel, type ScenarioKey } from "@/lib/model";
import { fcfBridge, historyTable } from "@/lib/model/history";
import { date, eur, meur, mult, num, pct } from "@/lib/format";

const row = (cells: string[]) => `| ${cells.join(" | ")} |`;
const table = (head: string[], rows: string[][]) => [row(head), row(head.map(() => "---")), ...rows.map(row)].join("\n");

/** Every figure the report may cite, computed from the model. Placeholders are {{name}}. */
export function reportValues(): Record<string, string> {
  const o = runModel(modelData, { scenario: "base" });
  const m = modelData.market;
  const sc = (k: ScenarioKey) => o.byScenario.find((x) => x.key === k)!.dcf;
  const base = sc("base"), bear = sc("bear"), bull = sc("bull");
  const h = historyTable(financialsData);
  const fb = fcfBridge(fcfBridgeRaw.items);
  const v: Record<string, string> = {};
  const VERD = { BUY: "Acheter", "NOT BUY": "Ne pas acheter", INCOMPLETE: "Recommandation incomplète (comparables manquants)" } as const;

  v.verdict = VERD[o.decision.verdict];
  v.price = eur(o.price); v.price_date = date(m.inputs.share_price.as_of); v.valuation_date = date(m.valuation_date);
  v.offer = eur(o.offer.chosen); v.offer_low = eur(o.offer.low); v.offer_high = eur(o.offer.high); v.control_premium = pct(m.cross_checks.control_premium.value, 0);
  v.hurdle = eur(o.decision.hurdle); v.margin_of_safety = pct(modelData.decision.margin_of_safety, 0); v.bear_max_loss = pct(modelData.decision.bear_max_loss, 0);
  v.bear_loss = pct(o.decision.bearLoss, 0);
  v.dcf_passes = o.decision.dcfPasses ? "dépasse" : "n'atteint pas";
  v.bear_passes = o.decision.bearPasses ? "reste sous" : "dépasse";
  for (const [k, d] of [["base", base], ["bear", bear], ["bull", bull]] as const) {
    v[`${k}_ps`] = eur(d.perShare); v[`${k}_ev`] = meur(d.ev); v[`${k}_equity`] = meur(d.equity); v[`${k}_g`] = pct(d.g, 1);
    v[`${k}_vs_price`] = pct(d.perShare / o.price - 1, 0); v[`${k}_vs_offer`] = pct(d.perShare / o.offer.chosen - 1, 0); v[`${k}_tv_share`] = pct(d.tvShareOfEv, 0);
  }
  v.weighted_ps = eur(o.weighted);
  v.base_pv_fcf = meur(base.pvFcf); v.base_pv_tv = meur(base.pvTv); v.base_implied_mult = mult(base.impliedExitEvEbitda);
  v.base_tv_comment = base.tvShareOfEv > 0.75 ? "au-delà du seuil d'alerte de 75 % : la valeur dépend surtout de l'après-2033, d'où l'importance de la grille de sensibilité" : "sous le seuil d'alerte de 75 %";
  v.wacc = pct(o.modelWacc, 2); v.wacc_market = pct(o.waccBuild.waccMarket, 2); v.de = pct(o.waccBuild.de, 0); v.de_market = pct(o.waccBuild.deMarket, 0);
  v.beta_l = num(o.waccBuild.betaL, 2); v.beta_l_market = num(o.waccBuild.betaLMarket, 2); v.beta_u = num(o.capital.betaUnlevered, 2); v.ke = pct(o.waccBuild.costOfEquity, 2); v.kd_at = pct(o.waccBuild.costOfDebtAfterTax, 2);
  v.nd_min = meur(Math.min(...h.map((x) => x.netDebt))); v.nd_max = meur(Math.max(...h.map((x) => x.netDebt)));
  v.per_bn_ev = eur(1000 / o.shares);
  v.nwc_note = pct(m.operating.nwc_pct_sales.value, 1);
  v.iterations = String(o.waccBuild.iterations.length);
  v.net_debt_h1 = meur(o.bridge.netDebtH1); v.fcf_h2 = meur(o.bridge.fcfH2); v.net_debt_val = meur(o.netDebtValuation);
  v.minorities = meur(o.bridge.minorities); v.pensions = meur(o.bridge.pensions); v.factoring = meur(o.bridge.factoring); v.claims = meur(o.claims);
  v.shares = num(o.shares, 1); v.market_cap = meur(o.waccBuild.marketCap);
  v.exit_mult = mult(m.cross_checks.exit_multiple.value); v.exit_ps = eur(o.exitLow.perShare); v.exit_ps_high = eur(o.exitHigh.perShare); v.exit_implied_g = pct(o.exitLow.impliedG, 2);
  v.exit_mult_high = mult(m.cross_checks.exit_multiple_high.value);
  v.low52 = eur(m.inputs.price_52w_low.value); v.high52 = eur(m.inputs.price_52w_high.value); v.analyst_target = eur(m.inputs.analyst_target.value);
  v.fcf25_before = meur(fb.beforeRestructuring); v.fcf25_after = meur(fb.afterInterest);
  v.h1_sales = meur(h[3].sales); v.h1_om = meur(h[3].operatingMargin); v.h1_om_pct = pct(h[3].operatingMarginPct, 1);
  v.nd_ebitda_25 = mult(h[2].netDebtToEbitda);
  v.grid_low = eur(o.workbookSensitivity.grid[4][0]); v.grid_high = eur(o.workbookSensitivity.grid[0][4]);
  v.comps_status = o.comps.mid === null ? "Les données des pairs ne sont pas encore saisies (`data/clean/peers.csv`) : la jambe « comparables » de la règle de décision reste ouverte." : `Médianes appliquées aux estimations 2026 : ${eur(o.comps.low)} – ${eur(o.comps.high)} par action.`;
  v.decision_comment = o.decision.verdict === "INCOMPLETE"
    ? "Le DCF et le scénario baisse passent la règle ; la décision finale attend les comparables."
    : o.decision.verdict === "BUY" ? "Toutes les conditions de la règle sont réunies." : `Condition(s) non remplie(s) : ${o.decision.reasons.filter((r) => r !== "comps not available").map((r) => ({ "base-case DCF below hurdle": "DCF base sous le seuil", "comps midpoint below hurdle": "comparables sous le seuil", "bear-case loss above limit": "perte en scénario baisse au-delà de la limite" })[r] ?? r).join(", ")}. Les comparables, une fois saisis, ne peuvent pas inverser ce résultat.`;

  v["table:history"] = table(["M€", ...h.map((x) => x.period)], [
    ["Chiffre d'affaires", ...h.map((x) => num(x.sales))],
    ["Croissance", ...h.map((x) => (x.growth === null ? "" : pct(x.growth)))],
    ["EBITDA ajusté", ...h.map((x) => num(x.ebitda))],
    ["Marge d'EBITDA", ...h.map((x) => pct(x.ebitdaMargin))],
    ["Marge opérationnelle (déf. Valeo)", ...h.map((x) => num(x.operatingMargin))],
    ["Marge opérationnelle, % du CA", ...h.map((x) => pct(x.operatingMarginPct))],
    ["Résultat net part du groupe", ...h.map((x) => num(x.netIncome))],
    ["Dette nette", ...h.map((x) => num(x.netDebt))],
    ["Dette nette / EBITDA", ...h.map((x) => mult(x.netDebtToEbitda))],
  ]);
  v["table:fcf_bridge"] = table(["2025, M€", "Montant"], [...fb.steps.map((s) => [s.item, num(s.amount)]), ["**FCF après intérêts**", `**${num(fb.afterInterest)}**`]]);
  const S = modelData.scenarios.scenarios;
  const avg = (a: number[]) => a.slice(1).reduce((s, x) => s + x, 0) / (a.length - 1);
  v["table:drivers"] = table(["Moteur (2027–2033, moyenne)", "Baisse", "Base", "Hausse"], [
    ["CA 2026E (M€)", num(S.bear.sales_2026), num(S.base.sales_2026), num(S.bull.sales_2026)],
    ["Croissance annuelle", pct(avg(S.bear.growth as number[])), pct(avg(S.base.growth as number[])), pct(avg(S.bull.growth as number[]))],
    ["Marge d'EBITDA 2033", pct(S.bear.ebitda_margin[7]), pct(S.base.ebitda_margin[7]), pct(S.bull.ebitda_margin[7])],
    ["Investissements, % du CA", pct(avg(S.bear.capex_pct)), pct(avg(S.base.capex_pct)), pct(avg(S.bull.capex_pct))],
    ["Restructuration, % du CA", pct(S.bear.restructuring_pct[1]), pct(S.base.restructuring_pct[1]), pct(S.bull.restructuring_pct[1])],
    ["Croissance à l'infini", pct(S.bear.terminal_growth), pct(S.base.terminal_growth), pct(S.bull.terminal_growth)],
  ]);
  v["table:wacc_inputs"] = table(["Donnée", "Valeur", "Source", "Date"], (["risk_free", "erp", "beta_unlevered", "cost_of_debt", "tax_rate", "share_price", "shares_m"] as const).map((k) => {
    const x = m.inputs[k];
    return [x.label + (x.analyst_assumption ? " (A)" : ""), x.unit === "rate" ? pct(x.value, 2) : x.unit === "EUR" ? eur(x.value) : num(x.value, 2), x.source, date(x.as_of)];
  }));
  v["table:fcff"] = table(["M€", ...base.rows.map((r) => `${r.year}E`)], [
    ["CA", ...base.rows.map((r) => num(r.sales))], ["EBITDA", ...base.rows.map((r) => num(r.ebitda))], ["EBIT", ...base.rows.map((r) => num(r.ebit))],
    ["IS", ...base.rows.map((r) => num(-r.tax))], ["Investissements", ...base.rows.map((r) => num(-r.capex))], ["Var. BFR", ...base.rows.map((r) => num(-r.deltaNwc))],
    ["Loyers IFRS 16", ...base.rows.map((r) => num(-r.lease))], ["**FCFF**", ...base.rows.map((r) => `**${num(r.fcff)}**`)],
  ]);
  v["table:bridge"] = table(["Pont VE → capitaux propres", "M€"], [
    ["Valeur d'entreprise", num(base.ev)], ["− Dette nette à la date de valorisation", num(-o.netDebtValuation)], ["− Intérêts minoritaires", num(-o.bridge.minorities)],
    ["− Provisions pour retraites", num(-o.bridge.pensions)], ["− Créances cédées (affacturage)", num(-o.bridge.factoring)],
    ["**Capitaux propres**", `**${num(base.equity)}**`], ["Nombre d'actions (M)", num(o.shares, 1)], ["**Valeur par action**", `**${eur(base.perShare)}**`],
  ]);
  v["table:scenarios"] = table(["Scénario", "VE", "Valeur / action", "vs cours", "vs offre", "Part VT", "Probabilité"], o.byScenario.map((s) => [
    s.label, meur(s.dcf.ev), eur(s.dcf.perShare), pct(s.dcf.perShare / o.price - 1, 0), pct(s.dcf.perShare / o.offer.chosen - 1, 0), pct(s.dcf.tvShareOfEv, 0), pct(m.probabilities[s.key], 0),
  ]));
  const ws = o.workbookSensitivity;
  v["table:sensitivity"] = table(["CMPC \\ g", ...ws.growth.map((g) => pct(g, 2))], ws.wacc.map((w, i) => [pct(w, 1), ...ws.grid[i].map((x) => eur(x))]));
  v["table:football"] = table(["Méthode", "Bas", "Haut"], o.football.map((f) => [f.method, eur(f.low), eur(f.high)]));
  return v;
}

export function fillReport(md: string, values = reportValues()): string {
  return md.replace(/\{\{([a-z0-9_:]+)\}\}/g, (_, k: string) => {
    if (!(k in values)) throw new Error(`report.md: unknown placeholder {{${k}}}`);
    return values[k];
  });
}
