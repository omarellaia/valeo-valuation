import { modelData } from "@/lib/data";
import { date, eur, num, pct } from "@/lib/format";
import { Card, TableWrap } from "@/components/ui";

type In = { value: number; unit: string; label: string; source: string; as_of: string; analyst_assumption: boolean };
const fmt = (x: In) => (x.unit === "rate" ? pct(x.value, 2) : x.unit === "EUR" ? eur(x.value) : x.unit === "x" ? `${num(x.value, 2)}x` : num(x.value, x.unit === "m" ? 1 : 0));

function SourceTable({ rows }: { rows: In[] }) {
  return (
    <TableWrap>
      <table className="fin">
        <thead><tr><th>Donnée</th><th>Valeur</th><th>Unité</th><th style={{ textAlign: "left" }}>Source</th><th>Au</th></tr></thead>
        <tbody>{rows.map((x) => (
          <tr key={x.label}><td>{x.label}{x.analyst_assumption && <span className="ml-1 rounded bg-warn-soft px-1 text-xs text-warn">hypothèse</span>}</td>
            <td className="num">{fmt(x)}</td><td className="text-muted">{x.unit}</td><td style={{ textAlign: "left", whiteSpace: "normal" }} className="text-muted">{x.source}</td><td className="text-muted">{date(x.as_of)}</td></tr>
        ))}</tbody>
      </table>
    </TableWrap>
  );
}

export default function Method() {
  const m = modelData.market;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Méthode, sources et limites</h1>
      <Card title="Méthode en bref">
        <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
          <li><b>FCFF</b> = EBIT × (1 − τ) + D&A − investissements (y c. R&D capitalisée) − ΔBFR − loyers IFRS 16 (principal). L'EBIT est après restructuration décaissée.</li>
          <li><b>Horizon</b> : 2026E année de base (non actualisée), 2027–2033 actualisés sur t = 1…7, date de valorisation {date(m.valuation_date)}.</li>
          <li><b>CMPC</b> : r<sub>e</sub> = r<sub>f</sub> + β<sub>L</sub> × ERP, β<sub>L</sub> = β<sub>U</sub>(1 + (1 − τ) D/E) ; pondérations en valeur, D/E itéré sur la valeur DCF des capitaux propres (point de départ : valeurs de marché).</li>
          <li><b>Valeur terminale</b> : Gordon-Shapiro, TV = FCFF<sub>2033</sub>(1 + g)/(CMPC − g) ; recoupée par un multiple VE/EBITDA de sortie.</li>
          <li><b>Pont</b> : capitaux propres = VE − dette nette (30/06/2026 moins FCF H2) − minoritaires − retraites − affacturage. Loyers exclus du pont car déjà dans le FCFF.</li>
          <li><b>Comparables</b> : multiples VE/EBITDA, VE/EBIT, P/E recalculés depuis cours, actions et dette nette de chaque pair, médianes appliquées aux estimations 2026 de Valeo.</li>
          <li><b>Règle de décision</b> : acheter si DCF base et médiane des comps ≥ prix de référence × (1 + {pct(modelData.decision.margin_of_safety, 0)}) et perte en baisse &lt; {pct(modelData.decision.bear_max_loss, 0)}. Prix de référence : {modelData.decision.reference_price === "offer" ? "prix d'offre" : "cours"}.</li>
        </ul>
      </Card>
      <Card title="Marché et coût du capital"><SourceTable rows={Object.values(m.inputs)} /></Card>
      <Card title="Pont VE → capitaux propres"><SourceTable rows={Object.values(m.bridge)} /></Card>
      <Card title="Exploitation et recoupements"><SourceTable rows={[...Object.values(m.operating), ...Object.values(m.cross_checks)]} /></Card>
      <Card title="Définitions">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li><b>Marge opérationnelle</b> : définition de Valeo (avant autres produits et charges), telle que publiée.</li>
          <li><b>EBITDA ajusté</b> : tel que publié par Valeo.</li>
          <li><b>Dette nette</b> : dette financière nette publiée ; les loyers IFRS 16 et les retraites sont traités à part (loyers dans le FCFF, retraites dans le pont). La même définition doit s'appliquer à chaque pair.</li>
        </ul>
      </Card>
      <Card title="Limites et données manquantes">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Peer data : <code>data/clean/peers.csv</code> est vide ; aucun multiple n'est affiché ni inventé.</li>
          <li>Historique sur 3 ans + S1 2026 (le cahier des charges en prévoit 5), sans bilan ni tableau de flux complets ; ROIC et investissements par année non disponibles.</li>
          <li>Bêta de régression de Valeo et bêta relevé des pairs non encore calculés.</li>
          <li>Les hypothèses marquées « hypothèse » sont celles de l'analyste ; la prime de risque doit être remplacée par la valeur du cours.</li>
          <li>Les données de marché ne portent pas toutes la même date (cours au {date(m.inputs.share_price.as_of)}, OAT fin octobre 2026) : à aligner.</li>
          <li>Hypothèses qui déplacent le plus le résultat : CMPC, croissance à l'infini et marge d'EBITDA terminale (voir la grille de sensibilité).</li>
        </ul>
      </Card>
    </div>
  );
}
