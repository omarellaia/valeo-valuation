import { Suspense } from "react";
import { ValuationView } from "@/components/ValuationView";

export default function Page() {
  return <Suspense fallback={<p className="text-muted">Calcul…</p>}><ValuationView /></Suspense>;
}
