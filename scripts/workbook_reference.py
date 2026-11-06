"""Independent reference values for the tests, computed from model/valeo_model.xlsx.

The workbook ships without cached results (it was written by a script), so this file
reads every INPUT cell from the workbook itself and re-applies the workbook's own
formulas in plain Python. Output: src/lib/model/__tests__/workbook_expected.json.
Once you open and save the workbook in Excel, run with --cached to use Excel's own
computed values instead and the tests will compare against those.

Usage: python3 scripts/workbook_reference.py [--cached]
"""
import json, pathlib, sys
import openpyxl

ROOT = pathlib.Path(__file__).resolve().parent.parent
XLSX = ROOT / "model" / "valeo_model.xlsx"
OUT = ROOT / "src" / "lib" / "model" / "__tests__" / "workbook_expected.json"

wb = openpyxl.load_workbook(XLSX, data_only=False)
H = wb["Hypotheses"]
v = lambda ws, c: ws[c].value
COLS = "BCDEFGHI"

hyp = {k: v(H, c) for k, c in dict(rf="B3", erp="B4", bu="B5", kd="B6", tax="B7", price="B8", shares="B9",
       nd_h1="B11", fcf_h2="B12", minorities="B14", pensions="B15", factoring="B16", net_interest="B18",
       exit_mult="B19", p_bear="B20", p_base="B21", p_bull="B22", premium="B23", sales_2025="B24",
       nwc_pct="B25", lease_pct="B26", low52="B27", high52="B28").items()}

def sheet_inputs(name):
    ws = wb[name]
    row = lambda r: [v(ws, f"{c}{r}") for c in COLS]
    return dict(sales0=v(ws, "B12"), growth=row(13), margin=row(16), da=row(19), restr=row(22),
                capex=row(31), g=v(ws, "E9"))

def fcf(s):
    sales = [s["sales0"]]
    for g in s["growth"][1:]:
        sales.append(sales[-1] * (1 + g))
    out, prev_nwc, rows = [], hyp["nwc_pct"] * hyp["sales_2025"], []
    for i, S in enumerate(sales):
        ebitda = S * s["margin"][i]; da = S * s["da"][i]; re = S * s["restr"][i]
        ebit = ebitda - da - re; tax = ebit * hyp["tax"]; capex = S * s["capex"][i]
        nwc = hyp["nwc_pct"] * S; dnwc = nwc - prev_nwc; prev_nwc = nwc; lease = S * hyp["lease_pct"]
        f = ebit - tax - capex - dnwc - lease + da
        rows.append(dict(sales=S, ebitda=ebitda, da=da, restructuring=re, ebit=ebit, tax=tax, capex=capex,
                         delta_nwc=dnwc, lease=lease, fcff=f))
    return rows

nd_val = hyp["nd_h1"] - hyp["fcf_h2"]
claims = nd_val + hyp["minorities"] + hyp["pensions"] + hyp["factoring"]

def ev(f, w, g):
    pv = sum(f[t] / (1 + w) ** t for t in range(1, 8))
    tv = f[7] * (1 + g) / (w - g) / (1 + w) ** 7
    return pv, tv, pv + tv

base_in = sheet_inputs("DCF_Base")
base_rows = fcf(base_in)
base_f = [r["fcff"] for r in base_rows]

mcap = hyp["price"] * hyp["shares"]
de0 = hyp["nd_h1"] / mcap
bl0 = hyp["bu"] * (1 + de0 * (1 - hyp["tax"]))
ke0 = hyp["rf"] + bl0 * hyp["erp"]
we = mcap / (mcap + hyp["nd_h1"])
kd_at = hyp["kd"] * (1 - hyp["tax"])
w0 = we * ke0 + (1 - we) * kd_at
iters, w = [], w0
for k in range(9):  # rows 19..27
    pv, tv, e = ev(base_f, w, base_in["g"]); eq = e - claims; de = nd_val / eq
    bl = hyp["bu"] * (1 + de * (1 - hyp["tax"])); ke = hyp["rf"] + bl * hyp["erp"]
    w_next = eq / (eq + nd_val) * ke + nd_val / (eq + nd_val) * kd_at
    iters.append(dict(wacc=w, equity=eq, de=de, beta_l=bl, ke=ke, wacc_next=w_next)); w = w_next
wacc, de_final = iters[-1]["wacc_next"], iters[-1]["de"]

scen = {}
for key, name in [("bear", "DCF_Down"), ("base", "DCF_Base"), ("bull", "DCF_Up")]:
    s = sheet_inputs(name); rows = fcf(s); f = [r["fcff"] for r in rows]
    pv, tv, e = ev(f, wacc, s["g"]); eq = e - claims
    scen[key] = dict(inputs=s, rows=rows, pv_fcf=pv, pv_tv=tv, ev=e, equity=eq, per_share=eq / hyp["shares"], tv_share=tv / e)
weighted = scen["bear"]["per_share"] * hyp["p_bear"] + scen["base"]["per_share"] * hyp["p_base"] + scen["bull"]["per_share"] * hyp["p_bull"]

S = wb["Synthese"]
wacc_grid = [v(S, f"A{r}") for r in range(34, 39)]
g_grid = [v(S, f"{c}33") for c in "BCDEF"]
grid = [[(ev(base_f, wr, gc)[2] - claims) / hyp["shares"] for gc in g_grid] for wr in wacc_grid]

ebitda33 = base_rows[7]["ebitda"]
tv_mult = ebitda33 * hyp["exit_mult"]
pv_tvm = tv_mult / (1 + wacc) ** 7
exit_ps = (scen["base"]["pv_fcf"] + pv_tvm - claims) / hyp["shares"]
exit_ps_35 = (scen["base"]["pv_fcf"] + 3.5 * ebitda33 / (1 + wacc) ** 7 - claims) / hyp["shares"]
implied_g = (tv_mult * wacc - base_f[7]) / (tv_mult + base_f[7])

expected = dict(
    source="python re-computation of model/valeo_model.xlsx formulas",
    wacc=dict(start=w0, converged=wacc, de=de_final, last_gap=abs(iters[-1]["wacc_next"] - iters[-1]["wacc"]), iterations=iters),
    claims=claims, net_debt_valuation=nd_val, market_cap=mcap,
    scenarios={k: dict(fcff=[r["fcff"] for r in x["rows"]], ebitda=[r["ebitda"] for r in x["rows"]], sales=[r["sales"] for r in x["rows"]],
                       pv_fcf=x["pv_fcf"], pv_tv=x["pv_tv"], ev=x["ev"], equity=x["equity"], per_share=x["per_share"], tv_share=x["tv_share"])
               for k, x in scen.items()},
    weighted_per_share=weighted,
    sensitivity=dict(wacc=wacc_grid, growth=g_grid, grid=grid),
    exit_multiple=dict(ebitda_2033=ebitda33, tv=tv_mult, pv_tv=pv_tvm, per_share=exit_ps, per_share_35=exit_ps_35, implied_g=implied_g),
    offer=dict(p20=hyp["price"] * 1.2, chosen=hyp["price"] * (1 + hyp["premium"]), p40=hyp["price"] * 1.4),
    inputs=hyp,
)

if "--cached" in sys.argv:
    c = openpyxl.load_workbook(XLSX, data_only=True)
    if c["DCF_Base"]["I9"].value is None:
        sys.exit("The workbook has no cached values yet: open it in Excel, save, and rerun.")
    expected["source"] = "Excel cached values"
    expected["wacc"]["converged"] = c["WACC"]["B30"].value
    for k, sh in [("bear", "DCF_Down"), ("base", "DCF_Base"), ("bull", "DCF_Up")]:
        e = expected["scenarios"][k]
        e["pv_fcf"], e["pv_tv"], e["ev"], e["equity"], e["per_share"] = (c[sh][x].value for x in ["H4", "H5", "H7", "H9", "I9"])
        e["fcff"] = [c[sh][f"{col}40"].value for col in COLS]
    expected["sensitivity"]["grid"] = [[c["Synthese"][f"{col}{r}"].value for col in "BCDEF"] for r in range(34, 39)]

OUT.write_text(json.dumps(expected, indent=2) + "\n")
print(f"wrote {OUT.relative_to(ROOT)} ({expected['source']}); base = {scen['base']['per_share']:.4f} EUR/share, WACC = {wacc:.6f}")
