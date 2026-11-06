"use client";
import { useModel } from "@/lib/useModel";
import { modelData } from "@/lib/data";
import { date, eur, meur, mult, pct } from "@/lib/format";
import { ScenarioSwitch } from "./Controls";
import { FootballField } from "./Charts";
import { SensitivityTable } from "./Tables";
import { Card, TableWrap } from "./ui";

export function CompsView() {
  const { out } = useModel();
  const c = out.comps;
  const ws = out.workbookSensitivity;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Sensibilité et comparables</h1>
        <ScenarioSwitch />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Valeur par action : CMPC × g" aside={<span className="text-xs text-muted">scénario {out.byScenario.find((x) => x.key === out.selectedScenario)!.label}, CMPC ± 1 pt</span>}>
          <SensitivityTable wacc={out.sensitivity.wacc} growth={out.sensitivity.growth} grid={out.sensitivity.grid} price={out.price} />
          <p className="mt-2 text-xs text-muted">Vert : au-dessus du cours ({eur(out.price)}). Centré sur le CMPC courant ({pct(out.w, 2)}).</p>
        </Card>
        <Card title="Grille du modèle Excel (scénario base)" aside={<span className="text-xs text-muted">Synthese!A33:F38</span>}>
          <SensitivityTable wacc={ws.wacc} growth={ws.growth} grid={ws.grid} price={out.price} />
          <p className="mt-2 text-xs text-muted">Identique au classeur, vérifié par les tests.</p>
        </Card>
      </div>

      <Card title="Comparables boursiers">
        {c.peers.length === 0 ? (
          <div className="rounded bg-warn-soft p-3 text-sm text-warn">
            <p className="font-medium">Données des pairs manquantes — rien n'est inventé.</p>
            <p className="mt-1">Remplir <code>data/clean/peers.csv</code> (cours et date, nombre d'actions, dette nette, CA, EBITDA, EBIT, résultat net 2026E) pour 6 à 8 pairs : Forvia, Continental (entité post-scission), Schaeffler, Aptiv, Autoliv, Lear, Magna. Puis <code>npm run data</code>. Les multiples seront calculés ici et appliqués aux estimations 2026 de Valeo (EBITDA {meur(out.byScenario[1].dcf.rows[0].ebitda)}, EBIT {meur(out.byScenario[1].dcf.rows[0].ebit)}). Le P/E demande aussi le résultat net 2026E de Valeo.</p>
          </div>
        ) : (
          <TableWrap>
            <table className="fin">
              <thead><tr><th>Pair</th><th>Capitalisation</th><th>VE</th><th>VE/EBITDA</th><th>VE/EBIT</th><th>P/E</th><th>Cours au</th></tr></thead>
              <tbody>
                {c.peers.map((p, i) => (
                  <tr key={p.ticker}><td>{p.name}</td><td className="num">{meur(p.marketCap)}</td><td className="num">{meur(p.ev)}</td><td className="num">{mult(p.evEbitda)}</td><td className="num">{mult(p.evEbit)}</td><td className="num">{mult(p.pe)}</td><td className="text-muted">{date(modelData.peers[i].price_date)}</td></tr>
                ))}
                <tr className="total"><td>Médiane</td><td /><td /><td className="num">{mult(c.medians.evEbitda)}</td><td className="num">{mult(c.medians.evEbit)}</td><td className="num">{mult(c.medians.pe)}</td><td /></tr>
              </tbody>
            </table>
            <p className="mt-2 text-sm">Fourchette implicite : {eur(c.low)} – {eur(c.high)} par action ({c.implied.map((x) => `${x.method} ${eur(x.perShare)}`).join(", ")}).</p>
          </TableWrap>
        )}
      </Card>

      <Card title="Football field"><FootballField rows={out.football} price={out.price} offer={out.offer.chosen} /></Card>
    </div>
  );
}
