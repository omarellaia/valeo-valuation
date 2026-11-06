import { Suspense } from "react";
import { CompsView } from "@/components/CompsView";

export default function Page() {
  return <Suspense fallback={<p className="text-muted">Calcul…</p>}><CompsView /></Suspense>;
}
