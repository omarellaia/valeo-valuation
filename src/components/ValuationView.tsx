"use client";
import { useModel } from "@/lib/useModel";
import { modelData } from "@/lib/data";
import { date, eur, meur, num, pct } from "@/lib/format";
import { ScenarioSwitch, Sliders } from "./Controls";
import { BridgeChart } from "./Charts";
import { FcffTable } from "./Tables";
import { Card, TableWrap } from "./ui";

export function ValuationView() {
  const { out } = useModel();
  const s = out.selected;
  const b = out.bridge, mk = modelData.market;
  const wb = out.waccBuild;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Valorisation DCF</h1>
        <ScenarioSwitch />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Curseurs"><Sliders /></Card>
        <Card className="md:col-span-2" title="De la VE à la valeur par action">
          {s ? (
            <>
              <BridgeChart steps={[
                { label: "VE", value: s.ev, kind: "total" },
                { label: "Dette nette", value: out.netDebtValuation, kind: "minus" },
                { label: "Minoritaires", value: b.minorities, kind: "minus" },
                { label: "Retraites", value: b.pensions, kind: "minus" },
                { label: "Affacturage", value: b.factoring, kind: "minus" },
                { label: "Capitaux propres", value: s.equity, kind: "total" },
              ]} />
              <p className="text-sm">VE {meur(s.ev)} = FCF actualisés {meur(s.pvFcf)} + VT actualisée {meur(s.pvTv)} ({pct(s.tvShareOfEv, 0)} de la VE). Capitaux propres {meur(s.equity)} ÷ {num(out.shares, 1)} M actions = <b>{eur(s.perShare)}</b> par action.</p>
              <p className="text-xs text-muted mt-1">Dette nette à la date de valorisation = {meur(b.netDebtH1)} au 30/06/2026 − FCF H2 2026 attendu {meur(b.fcfH2)}. Les loyers IFRS 16 sont déduits dans le FCFF, donc exclus du pont (pas de double comptage).</p>
            </>
          ) : <p className="text-bad text-sm">g ≥ CMPC : pas de valeur.</p>}
        </Card>
      </div>

      {s && <Card title="Free cash flow to the firm" aside={<span className="text-xs text-muted">2026E = année de base (non actualisée); 2027–2033 actualisés t = 1…7</span>}><FcffTable rows={s.rows} /></Card>}

      <Card title="Construction du CMPC" aside={<span className="text-xs text-muted">Bêta réendetté (Hamada), levier itéré sur la valeur DCF</span>}>
        <div className="grid gap-4 md:grid-cols-2">
          <TableWrap>
            <table className="fin">
              <thead><tr><th>Donnée</th><th>Valeur</th><th>Date</th></tr></thead>
              <tbody>
                {(["risk_free", "erp", "beta_unlevered", "cost_of_debt", "tax_rate", "share_price", "shares_m"] as const).map((k) => {
                  const x = mk.inputs[k];
                  const v = x.unit === "rate" ? pct(x.value, 2) : x.unit === "EUR" ? eur(x.value) : num(x.value, x.unit === "m" ? 1 : 2);
                  return <tr key={k}><td title={x.source}>{x.label}{x.analyst_assumption ? " (A)" : ""}</td><td className="num">{v}</td><td className="text-muted">{date(x.as_of)}</td></tr>;
                })}
              </tbody>
            </table>
          </TableWrap>
          <TableWrap>
            <table className="fin">
              <thead><tr><th>Étape</th><th>Marché</th><th>Retenu (itéré)</th></tr></thead>
              <tbody>
                <tr><td>Capitaux propres (M€)</td><td className="num">{meur(wb.marketCap)}</td><td className="num">{meur(wb.iterations.at(-1)!.equity)}</td></tr>
                <tr><td>Dette nette (M€)</td><td className="num">{meur(b.netDebtH1)}</td><td className="num">{meur(out.netDebtValuation)}</td></tr>
                <tr><td>D/E</td><td className="num">{pct(wb.deMarket, 0)}</td><td className="num">{pct(wb.de, 0)}</td></tr>
                <tr><td>Bêta endetté</td><td className="num">{num(wb.betaLMarket, 2)}</td><td className="num">{num(wb.betaL, 2)}</td></tr>
                <tr><td>Coût des capitaux propres</td><td className="num">{pct(wb.costOfEquityMarket, 2)}</td><td className="num">{pct(wb.costOfEquity, 2)}</td></tr>
                <tr><td>Coût de la dette après IS</td><td className="num">{pct(wb.costOfDebtAfterTax, 2)}</td><td className="num">{pct(wb.costOfDebtAfterTax, 2)}</td></tr>
                <tr className="total"><td>CMPC</td><td className="num">{pct(wb.waccMarket, 2)}</td><td className="num">{pct(wb.wacc, 2)}</td></tr>
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted">{wb.iterations.length} itérations, écart final {wb.lastGap.toExponential(1)}. Cours au {date(mk.inputs.share_price.as_of)}.</p>
          </TableWrap>
        </div>
      </Card>
    </div>
  );
}
