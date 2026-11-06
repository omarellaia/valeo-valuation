import market from "@/data/market.json";
import scenarios from "@/data/scenarios.json";
import peers from "@/data/peers.json";
import decision from "@/data/decision.json";
import financials from "@/data/financials.json";
import fcfBridgeData from "@/data/fcf_bridge.json";
import type { ModelData } from "@/lib/model";
import type { Peer } from "@/lib/model/comps";
import type { FinancialsData } from "@/lib/model/history";

export const modelData: ModelData = {
  market: market as unknown as ModelData["market"],
  scenarios: scenarios as unknown as ModelData["scenarios"],
  peers: peers as unknown as Peer[],
  decision: decision as unknown as ModelData["decision"],
};
export const financialsData = financials as unknown as FinancialsData;
export const fcfBridgeRaw = fcfBridgeData as { items: { item: string; amount: number; source: string; page: number | null }[]; checks: Record<string, { published: number; source: string; page: number | null }> };
