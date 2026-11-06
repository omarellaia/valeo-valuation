"""Turn data/clean/*.csv|json into the JSON files the app reads (src/data/).

Usage: python3 scripts/clean_data.py
No numbers are created here: every value is copied from data/clean/.
"""
import csv, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CLEAN, OUT = ROOT / "data" / "clean", ROOT / "src" / "data"
OUT.mkdir(parents=True, exist_ok=True)

def num(x):
    x = (x or "").strip()
    if x == "":
        return None
    try:
        return float(x)
    except ValueError:
        return x

def read_csv(name):
    with open(CLEAN / name, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def financials():
    rows = read_csv("valeo_financials.csv")
    periods = ["2023", "2024", "2025", "H1_2026"]
    return {
        "periods": periods,
        "metrics": {r["metric"]: {"unit": r["unit"], "source": r["source"], "page": num(r["page"]),
                                  "values": {p: num(r[p]) for p in periods}} for r in rows},
    }

def bridge():
    return {
        "items": [{"item": r["item"], "amount": num(r["amount_eur_m"]), "source": r["source"], "page": num(r["page"])}
                  for r in read_csv("fcf_bridge_2025.csv")],
        "checks": {r["check"]: {"published": num(r["published_eur_m"]), "source": r["source"], "page": num(r["page"])}
                   for r in read_csv("fcf_bridge_checks.csv")},
    }

NUMERIC_PEER = ["price", "shares_m", "net_debt_m", "sales_2026e_m", "ebitda_2026e_m", "ebit_2026e_m", "net_income_2026e_m"]

def peers():
    out = []
    for r in read_csv("peers.csv"):
        p = {k: (num(v) if k in NUMERIC_PEER else v) for k, v in r.items()}
        missing = [k for k in NUMERIC_PEER if p[k] is None]
        if missing:
            sys.exit(f"peers.csv: {p['ticker']} is missing {', '.join(missing)}")
        out.append(p)
    return out

def copy_json(name):
    return json.loads((CLEAN / name).read_text(encoding="utf-8"))

files = {
    "financials.json": financials(),
    "fcf_bridge.json": bridge(),
    "peers.json": peers(),
    "market.json": copy_json("market.json"),
    "scenarios.json": copy_json("scenarios.json"),
    "decision.json": copy_json("decision.json"),
}
for name, data in files.items():
    (OUT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("wrote", OUT.relative_to(ROOT) / name)
if not files["peers.json"]:
    print("NOTE: data/clean/peers.csv has no rows yet — the Comps page will show what is missing.")
