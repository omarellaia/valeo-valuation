"use client";
import { useModel } from "@/lib/useModel";
import { modelData } from "@/lib/data";
import { date, eur, meur, pct } from "@/lib/format";
import { ScenarioSwitch } from "./Controls";
import { FootballField } from "./Charts";
import { Card, Stat, TableWrap } from "./ui";

const TONE = { BUY: "bg-good-soft text-good", "NOT BUY": "bg-bad-soft text-bad", INCOMPLETE: "bg-warn-soft text-warn" } as const;
const FR = { BUY: "Acheter", "NOT BUY": "Ne pas acheter", INCOMPLETE: "Incomplet" } as const;

export function SummaryView() {
  const { out, scenario, overridden } = useModel();
  const m = modelData.market;
  const d = out.decision;
  const sel = out.selected;
  const upside = sel ? sel.perShare / out.price - 1 : null;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Valeo SE — faut-il acheter ?</h1>
          <p className="text-sm text-muted">Cours {eur(out.price)} au {date(m.inputs.share_price.as_of)} · valorisation au {date(m.valuation_date)} · M€ sauf mention</p>
        </div>
        <ScenarioSwitch />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <div className="text-xs uppercase tracking-wide text-muted">Recommandation (règle de décision, scénario base)</div>
          <div className={`mt-2 inline-block rounded-md px-3 py-1.5 text-lg font-semibold ${TONE[d.verdict]}`}>{FR[d.verdict]}</div>
          <ul className="mt-3 space-y-1 text-sm">
            <li>DCF base {eur(out.byScenario[1].dcf.perShare)} vs seuil {eur(d.hurdle)} : {d.dcfPasses ? "✓" : "✗"}</li>
            <li>Comparables : {d.compsPasses === null ? "données manquantes" : d.compsPasses ? "✓" : "✗"}</li>
            <li>Perte en scénario baisse {pct(d.bearLoss, 0)} (limite {pct(modelData.decision.bear_max_loss, 0)}) : {d.bearPasses ? "✓" : "✗"}</li>
          </ul>
          <p className="mt-2 text-xs text-muted">Seuil = {modelData.decision.reference_price === "offer" ? `prix d'offre (prime ${pct(m.cross_checks.control_premium.value, 0)})` : "cours"} × (1 + marge de sécurité {pct(modelData.decision.margin_of_safety, 0)}).</p>
        </Card>
        <Card className="md:col-span-2" title={`Valeur par action — scénario ${out.byScenario.find((x) => x.key === scenario)!.label}${overridden ? " (curseurs modifiés)" : ""}`}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Valeur DCF" value={sel ? eur(sel.perShare) : "—"} sub={upside === null ? "g ≥ CMPC" : `${upside >= 0 ? "+" : ""}${pct(upside, 0)} vs cours`} />
            <Stat label="Cours" value={eur(out.price)} sub={`au ${date(m.inputs.share_price.as_of)}`} />
            <Stat label="Prix d'offre" value={eur(out.offer.chosen)} sub={`prime ${pct(m.cross_checks.control_premium.value, 0)}`} />
            <Stat label="Pondérée (25/50/25)" value={eur(out.weighted)} sub="trois scénarios" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
            <Stat label="VE" value={sel ? meur(sel.ev) : "—"} />
            <Stat label="CMPC / g" value={`${pct(out.w, 2)} / ${pct(out.g, 2)}`} />
            <Stat label="Part VT dans VE" value={sel ? pct(sel.tvShareOfEv, 0) : "—"} sub={sel && sel.tvShareOfEv > 0.75 ? "> 75 % : à commenter" : undefined} />
            <Stat label="VE/EBITDA implicite VT" value={sel ? `${sel.impliedExitEvEbitda.toFixed(1)}x` : "—"} />
          </div>
        </Card>
      </div>

      <Card title="Trois scénarios (CMPC du modèle)">
        <TableWrap>
          <table className="fin">
            <thead><tr><th>Scénario</th><th>g</th><th>VE</th><th>Capitaux propres</th><th>Valeur / action</th><th>vs cours</th><th>vs offre</th><th>Part VT</th><th>Probabilité</th></tr></thead>
            <tbody>
              {out.byScenario.map((s) => (
                <tr key={s.key} className={s.key === scenario ? "bg-accent-soft" : ""}>
                  <td>{s.label}</td><td className="num">{pct(s.dcf.g, 1)}</td><td className="num">{meur(s.dcf.ev)}</td><td className="num">{meur(s.dcf.equity)}</td>
                  <td className="num font-medium">{eur(s.dcf.perShare)}</td><td className="num">{pct(s.dcf.perShare / out.price - 1, 0)}</td>
                  <td className="num">{pct(s.dcf.perShare / out.offer.chosen - 1, 0)}</td><td className="num">{pct(s.dcf.tvShareOfEv, 0)}</td><td className="num">{pct(m.probabilities[s.key], 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <Card title="Football field — fourchettes de valeur par action">
        <FootballField rows={out.football} price={out.price} offer={out.offer.chosen} />
        {out.comps.low === null && <p className="text-xs text-warn">Les comparables n'apparaissent pas : data/clean/peers.csv est vide.</p>}
      </Card>
    </div>
  );
}
