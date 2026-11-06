import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fillReport, reportValues } from "@/lib/report";
import { renderMarkdown } from "@/lib/markdown";
import X from "./workbook_expected.json";

const md = fs.readFileSync(path.join(__dirname, "../../../../report/report.md"), "utf8");

describe("report", () => {
  it("every placeholder resolves, none is left", () => {
    const out = fillReport(md);
    expect(out).not.toMatch(/\{\{/);
  });
  it("unknown placeholders fail loudly", () => {
    expect(() => fillReport("{{nope}}")).toThrow();
  });
  it("figures come from the model", () => {
    const v = reportValues();
    expect(v.base_ps).toBe(new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(X.scenarios.base.per_share) + " €");
  });
  it("renders headings, tables and a table of contents", () => {
    const r = renderMarkdown(fillReport(md));
    expect(r.toc.length).toBeGreaterThan(8);
    expect(r.html).toContain("<table");
    expect(r.html).not.toContain("<script");
  });
});
