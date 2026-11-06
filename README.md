# Valeo valuation — DCF + comps

A web app that values Valeo SE with a discounted cash flow and trading comparables and states a buy / not-buy recommendation. The written report is a page of the same app, with every figure filled from the model. Live: _[add the Vercel link after deploying]_

> Course project (FEDA, Corporate Finance). Not investment advice. Based on Valeo's published filings; not audited.

_Screenshots: add `docs/summary.png` and `docs/sensitivity.png` once deployed._

## Method in 10 lines

1. FCFF = EBIT × (1 − τ) + D&A − capex (incl. capitalised R&D) − ΔNWC − IFRS 16 lease principal; EBIT is after restructuring cash costs.
2. 2026E is the base year (guidance), 2027–2033 are discounted over t = 1…7; valuation date 1 Jan 2027.
3. Cost of equity: CAPM with Hamada-relevered beta (β_U = 0.9).
4. WACC uses value weights; D/E is taken from the DCF's own equity value and solved by iteration, starting from market weights.
5. Terminal value: Gordon growth on 2033 FCFF; the implied EV/EBITDA exit multiple is reported.
6. Cross-check: exit multiple of 3.0x–3.5x 2033 EBITDA.
7. Equity bridge: EV − net debt (30/06/2026 less expected H2 FCF) − minorities − pensions − factored receivables. Leases stay out of the bridge (already in FCFF).
8. Three scenarios (bear / base / bull) with their own drivers and g; probability-weighted 25/50/25.
9. Comps: EV/EBITDA, EV/EBIT, P/E built from each peer's price, shares and net debt, medians applied to Valeo's 2026 estimates.
10. Decision rule (in `data/clean/decision.json`), fixed before reading the result.

## Data and as-of dates

| Input | Value date | Source |
|---|---|---|
| Share price, shares, 52-week range | 14 Oct 2026 | MarketScreener |
| OAT 10y, ERP, unlevered beta | end Oct 2026 | analyst assumptions, see `data/clean/market.json` |
| Cost of debt | Jun 2026 | Valeo bond, 4.875% 2033 |
| Net debt | 30 Jun 2026 | H1 2026 results release |
| Minorities, pensions, factoring | 31 Dec 2025 | 2025 annual report notes 5.2, 6.2–6.3 |
| Historical statements | FY2023–FY2025, H1 2026 | Valeo results releases |

Every input lives in `data/clean/` with its source and date; the app shows the date next to every market figure.

## Repo layout

```
data/raw/            original filings (add the PDFs here)
data/clean/          valeo_financials.csv, fcf_bridge_2025.csv, peers.csv, market.json, scenarios.json, decision.json
model/               valeo_model.xlsx (validation workbook)
scripts/clean_data.py         data/clean → src/data/*.json (the JSON the app reads)
scripts/workbook_reference.py model/valeo_model.xlsx → expected values for the tests
report/report.md     source of the Report page ({{placeholders}} filled from the model)
src/lib/model/       forecast.ts, wacc.ts, dcf.ts, sensitivity.ts, comps.ts, decision.ts, history.ts (pure TypeScript)
src/lib/model/__tests__/   tests against the workbook values
src/app/             summary, valuation, comps, report, method
```

## Run it

```bash
npm install
npm run data        # rebuild src/data/*.json after editing data/clean/
npm run reference   # recompute expected test values from the workbook
npm test            # 33 tests
npm run dev         # http://localhost:3000
```

Scenario and slider values are stored in the URL (`/valuation?s=bull&wacc=9&g=1.5`), so any view can be shared by link.

## Tests and the workbook

`model/valeo_model.xlsx` was written by a script and has no cached results. `scripts/workbook_reference.py` reads every input cell of the workbook and re-applies its formulas in Python; the TypeScript model must match those values (per-share to the cent, and to 1e-6). After opening and saving the workbook in Excel, run `python3 scripts/workbook_reference.py --cached` to test against Excel's own numbers instead.

## Limitations

- **Peers are missing**: `data/clean/peers.csv` is empty, so comps and the comps leg of the decision rule are not computed. Nothing is filled in by default.
- Three years of history plus H1 2026 rather than five; no full balance sheet or cash flow statement, so ROIC and per-year capex are not shown.
- The ERP is a placeholder to replace with the course value; the regression beta and relevered peer beta are not computed yet.
- Market inputs do not all share one date.
- The answer moves most with WACC, terminal growth and the terminal EBITDA margin (see the sensitivity grid). The equity bridge claims (≈ 5.4 bn€) exceed the market cap, so small EV changes move value per share a lot.
