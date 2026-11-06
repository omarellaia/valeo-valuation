import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { modelData } from "@/lib/data";
import { date } from "@/lib/format";

export const metadata: Metadata = { title: "Valeo Valuation", description: "DCF and trading comps valuation of Valeo SE, recalculated in the browser." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const m = modelData.market;
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">
        <header className="border-b border-line bg-panel">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="font-semibold tracking-tight">Valeo <span className="text-muted font-normal">· valorisation DCF + comparables</span></div>
            <Suspense fallback={null}><Nav /></Suspense>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-xs text-muted border-t border-line">
          Projet de cours (FEDA, Corporate Finance) — pas un conseil en investissement. Basé sur les documents publiés par Valeo, non audité.
          Cours au {date(m.inputs.share_price.as_of)}; date de valorisation {date(m.valuation_date)}.
        </footer>
      </body>
    </html>
  );
}
