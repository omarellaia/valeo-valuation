"use client";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { eur, meur } from "@/lib/format";

const tip = { contentStyle: { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 6, color: "var(--ink)", fontSize: 12 }, labelStyle: { color: "var(--ink)" } };

/** EV → equity bridge as a waterfall: invisible base + visible step. */
export function BridgeChart({ steps }: { steps: { label: string; value: number; kind: "total" | "minus" }[] }) {
  let run = 0;
  const data = steps.map((s) => {
    if (s.kind === "total") { run = s.value; return { label: s.label, base: 0, bar: s.value, kind: s.kind, v: s.value }; }
    const top = run; run -= s.value;
    return { label: s.label, base: run, bar: top - run, kind: s.kind, v: -s.value };
  });
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 11 }} interval={0} tickLine={false} axisLine={{ stroke: "var(--line)" }} />
        <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)} Md`} width={44} axisLine={false} tickLine={false} />
        <Tooltip {...tip} formatter={(_v, _n, p) => [meur((p.payload as { v: number }).v), ""]} cursor={{ fill: "var(--accent-soft)" }} />
        <Bar dataKey="base" stackId="a" fill="transparent" isAnimationActive={false} />
        <Bar dataKey="bar" stackId="a" isAnimationActive={false} radius={[3, 3, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.kind === "total" ? "var(--c1)" : "var(--bad)"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FootballField({ rows, price, offer }: { rows: { method: string; low: number; high: number }[]; price: number; offer: number }) {
  const data = rows.map((r) => ({ method: r.method, base: Math.min(r.low, r.high), span: Math.abs(r.high - r.low), low: r.low, high: r.high }));
  const max = Math.ceil(Math.max(...rows.map((r) => r.high), offer) / 5) * 5 + 5;
  return (
    <ResponsiveContainer width="100%" height={60 + rows.length * 44}>
      <BarChart data={data} layout="vertical" margin={{ top: 18, right: 16, left: 8, bottom: 8 }} barCategoryGap="28%">
        <CartesianGrid stroke="var(--line)" horizontal={false} />
        <XAxis type="number" domain={[0, max]} tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={(v) => `${v} €`} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
        <YAxis type="category" dataKey="method" width={190} tick={{ fill: "var(--ink)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip {...tip} cursor={{ fill: "var(--accent-soft)" }} formatter={(_v, _n, p) => { const x = p.payload as { low: number; high: number }; return [`${eur(x.low)} – ${eur(x.high)}`, "Fourchette"]; }} />
        <Bar dataKey="base" stackId="f" fill="transparent" isAnimationActive={false} />
        <Bar dataKey="span" stackId="f" fill="var(--c2)" radius={3} isAnimationActive={false} />
        <ReferenceLine x={price} stroke="var(--ink)" strokeDasharray="4 3" label={{ value: `Cours ${eur(price)}`, position: "top", fill: "var(--ink)", fontSize: 11 }} />
        <ReferenceLine x={offer} stroke="var(--bad)" strokeDasharray="4 3" label={{ value: `Offre ${eur(offer)}`, position: "insideBottomRight", fill: "var(--bad)", fontSize: 11 }} />
      </BarChart>
    </ResponsiveContainer>
  );
}
