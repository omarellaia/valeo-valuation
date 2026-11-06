import type { ForecastRow } from "@/lib/model";
import { eur, num, pct } from "@/lib/format";
import { TableWrap } from "./ui";

export function FcffTable({ rows }: { rows: ForecastRow[] }) {
  const line = (label: string, f: (r: ForecastRow) => string, cls = "") => (
    <tr className={cls}><td>{label}</td>{rows.map((r) => <td key={r.year} className="num">{f(r)}</td>)}</tr>
  );
  return (
    <TableWrap>
      <table className="fin">
        <thead><tr><th>M€</th>{rows.map((r) => <th key={r.year}>{r.year}{r.t === 0 ? "E (base)" : "E"}</th>)}</tr></thead>
        <tbody>
          {line("Chiffre d'affaires", (r) => num(r.sales))}
          {line("Croissance", (r) => (r.growth === null ? "" : pct(r.growth)), "text-muted")}
          {line("EBITDA ajusté", (r) => num(r.ebitda))}
          {line("Marge d'EBITDA", (r) => pct(r.ebitda / r.sales), "text-muted")}
          {line("− Dotations aux amortissements", (r) => num(-r.da))}
          {line("− Restructuration (décaissé)", (r) => num(-r.restructuring))}
          {line("EBIT", (r) => num(r.ebit), "font-medium")}
          {line("− IS sur EBIT", (r) => num(-r.tax))}
          {line("+ Dotations aux amortissements", (r) => num(r.da))}
          {line("− Investissements (y c. R&D capitalisée)", (r) => num(-r.capex))}
          {line("− Variation du BFR", (r) => num(-r.deltaNwc))}
          {line("− Loyers IFRS 16 (principal)", (r) => num(-r.lease))}
          {line("FCFF", (r) => num(r.fcff), "total")}
        </tbody>
      </table>
    </TableWrap>
  );
}

export function SensitivityTable({ wacc, growth, grid, price, highlight }: { wacc: number[]; growth: number[]; grid: (number | null)[][]; price: number; highlight?: { w: number; g: number } }) {
  const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
  return (
    <TableWrap>
      <table className="fin">
        <thead><tr><th>CMPC \ g</th>{growth.map((g) => <th key={g}>{pct(g, 2)}</th>)}</tr></thead>
        <tbody>
          {wacc.map((w, i) => (
            <tr key={w}>
              <td className="font-medium">{pct(w, 2)}</td>
              {growth.map((g, j) => {
                const v = grid[i][j];
                const hl = highlight && near(highlight.w, w) && near(highlight.g, g);
                const tone = v === null ? "" : v >= price ? "text-good" : "text-bad";
                return <td key={g} title={v === null ? "g ≥ CMPC" : `${eur(v)} vs cours ${eur(price)}`} className={`num ${tone} ${hl ? "bg-accent-soft font-semibold" : ""}`}>{v === null ? "n/a" : eur(v)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}
