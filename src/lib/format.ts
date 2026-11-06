const nb = (d: number) => new Intl.NumberFormat("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
export const eur = (x: number | null | undefined, d = 2) => (x === null || x === undefined || !isFinite(x) ? "—" : `${nb(d).format(x)} €`);
export const meur = (x: number | null | undefined, d = 0) => (x === null || x === undefined || !isFinite(x) ? "—" : `${nb(d).format(x)} M€`);
export const num = (x: number | null | undefined, d = 0) => (x === null || x === undefined || !isFinite(x) ? "—" : nb(d).format(x));
export const pct = (x: number | null | undefined, d = 1) => (x === null || x === undefined || !isFinite(x) ? "—" : `${nb(d).format(x * 100)} %`);
export const mult = (x: number | null | undefined, d = 1) => (x === null || x === undefined || !isFinite(x) ? "—" : `${nb(d).format(x)}x`);
export const date = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
