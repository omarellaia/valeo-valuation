export interface Peer {
  ticker: string;
  name: string;
  currency: string;
  price: number;
  price_date: string;
  shares_m: number;
  net_debt_m: number;
  sales_2026e_m: number;
  ebitda_2026e_m: number;
  ebit_2026e_m: number;
  net_income_2026e_m: number;
  source: string;
}

export interface PeerMultiples {
  ticker: string;
  name: string;
  marketCap: number;
  ev: number;
  evEbitda: number | null;
  evEbit: number | null;
  pe: number | null;
}

const ratio = (a: number, b: number) => (b > 0 ? a / b : null);

/** Multiples built from price, shares and net debt — each in the peer's own currency. */
export function peerMultiples(p: Peer): PeerMultiples {
  const marketCap = p.price * p.shares_m;
  const ev = marketCap + p.net_debt_m;
  return { ticker: p.ticker, name: p.name, marketCap, ev,
    evEbitda: ratio(ev, p.ebitda_2026e_m), evEbit: ratio(ev, p.ebit_2026e_m), pe: ratio(marketCap, p.net_income_2026e_m) };
}

export function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export interface CompsResult {
  peers: PeerMultiples[];
  medians: { evEbitda: number | null; evEbit: number | null; pe: number | null };
  implied: { method: string; multiple: number; perShare: number }[];
  low: number | null;
  high: number | null;
  mid: number | null;
}

/**
 * Apply peer medians to Valeo's 2026 estimates. EV multiples bridge to equity with the same claims as the DCF;
 * P/E applies to net income directly.
 */
export function compsValuation(peers: Peer[], v: { ebitda: number; ebit: number; netIncome: number | null }, claims: number, shares: number): CompsResult {
  const pm = peers.map(peerMultiples);
  const pick = (k: "evEbitda" | "evEbit" | "pe") => median(pm.map((p) => p[k]).filter((x): x is number => x !== null));
  const medians = { evEbitda: pick("evEbitda"), evEbit: pick("evEbit"), pe: pick("pe") };
  const implied: CompsResult["implied"] = [];
  if (medians.evEbitda !== null) implied.push({ method: "EV/EBITDA", multiple: medians.evEbitda, perShare: (medians.evEbitda * v.ebitda - claims) / shares });
  if (medians.evEbit !== null) implied.push({ method: "EV/EBIT", multiple: medians.evEbit, perShare: (medians.evEbit * v.ebit - claims) / shares });
  if (medians.pe !== null && v.netIncome !== null) implied.push({ method: "P/E", multiple: medians.pe, perShare: (medians.pe * v.netIncome) / shares });
  const vals = implied.map((i) => i.perShare);
  const low = vals.length ? Math.min(...vals) : null;
  const high = vals.length ? Math.max(...vals) : null;
  return { peers: pm, medians, implied, low, high, mid: low !== null && high !== null ? (low + high) / 2 : null };
}
