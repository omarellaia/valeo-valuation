"use client";
import type { ScenarioKey } from "@/lib/model";
import { useModel } from "@/lib/useModel";
import { pct } from "@/lib/format";

const LABEL: Record<ScenarioKey, string> = { bear: "Baisse", base: "Base", bull: "Hausse" };

export function ScenarioSwitch() {
  const { scenario, set } = useModel();
  return (
    <div role="radiogroup" aria-label="Scénario" className="inline-flex rounded-md border border-line bg-panel p-0.5 text-sm">
      {(["bear", "base", "bull"] as ScenarioKey[]).map((k) => (
        <button key={k} role="radio" aria-checked={scenario === k} onClick={() => set({ s: k === "base" ? null : k })}
          className={`rounded px-3 py-1 ${scenario === k ? "bg-accent text-white font-medium" : "text-muted hover:text-ink"}`}>
          {LABEL[k]}
        </button>
      ))}
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, display }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; display: string }) {
  return (
    <label className="block">
      <div className="flex justify-between text-sm"><span>{label}</span><span className="num font-medium">{display}</span></div>
      <input type="range" className="w-full accent-[var(--accent)]" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function Sliders() {
  const { out, set, overridden } = useModel();
  const w = out.w * 100, g = out.g * 100;
  const r = (x: number) => (Math.round(x * 100) / 100).toString();
  return (
    <div className="space-y-4">
      <Slider label="CMPC (WACC)" value={w} min={6} max={12} step={0.05} display={pct(out.w, 2)} onChange={(v) => set({ wacc: r(v) })} />
      <Slider label="Croissance à l'infini (g)" value={g} min={0} max={3} step={0.05} display={pct(out.g, 2)} onChange={(v) => set({ g: r(v) })} />
      {!out.gValid && <p className="rounded bg-bad-soft px-3 py-2 text-sm text-bad">La croissance à l'infini doit rester inférieure au CMPC : aucune valeur n'est calculée.</p>}
      {out.gValid && out.g >= out.capital.riskFree && <p className="rounded bg-warn-soft px-3 py-2 text-sm text-warn">g ≥ taux sans risque ({pct(out.capital.riskFree, 2)}) : hypothèse agressive.</p>}
      <div className="flex items-center justify-between text-xs text-muted">
        <span>Modèle : CMPC {pct(out.modelWacc, 2)} (itéré), g selon scénario</span>
        <button disabled={!overridden} onClick={() => set({ wacc: null, g: null })}
          className="rounded border border-line px-2.5 py-1 text-ink disabled:opacity-40 hover:bg-accent-soft">Réinitialiser</button>
      </div>
    </div>
  );
}
