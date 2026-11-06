import { Suspense } from "react";
import { SummaryView } from "@/components/SummaryView";

export default function Page() {
  return <Suspense fallback={<p className="text-muted">Calcul…</p>}><SummaryView /></Suspense>;
}
