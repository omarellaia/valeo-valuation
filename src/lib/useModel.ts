"use client";
import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { modelData } from "@/lib/data";
import { runModel, type ScenarioKey } from "@/lib/model";

const SCEN: ScenarioKey[] = ["bear", "base", "bull"];
/** Percent in the URL → rate, clamped to the slider range. */
const parse = (x: string | null, lo: number, hi: number) => (x === null || x === "" || !isFinite(Number(x)) ? undefined : Math.min(hi, Math.max(lo, Number(x))) / 100);

/** Scenario and slider values live in the URL (?s=base&wacc=8.5&g=1.5) so any view can be shared by link. */
export function useModel() {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const s = sp.get("s");
  const scenario: ScenarioKey = SCEN.includes(s as ScenarioKey) ? (s as ScenarioKey) : "base";
  const wacc = parse(sp.get("wacc"), 6, 12);
  const g = parse(sp.get("g"), 0, 3);
  const out = useMemo(() => runModel(modelData, { scenario, wacc, g }), [scenario, wacc, g]);
  const set = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) v === null ? next.delete(k) : next.set(k, v);
    const qs = next.toString();
    router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
  }, [sp, router, path]);
  return { out, scenario, wacc, g, set, overridden: wacc !== undefined || g !== undefined };
}
