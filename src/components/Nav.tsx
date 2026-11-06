"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const LINKS = [
  ["/", "Synthèse"], ["/valuation", "Valorisation"], ["/comps", "Sensibilité & comps"], ["/report", "Rapport"], ["/method", "Méthode"],
] as const;

export function Nav() {
  const path = usePathname();
  const q = useSearchParams().toString();
  return (
    <nav className="flex flex-wrap gap-1 text-sm">
      {LINKS.map(([href, label]) => (
        <Link key={href} href={q && href !== "/method" && href !== "/report" ? `${href}?${q}` : href}
          className={`rounded px-2.5 py-1 ${path === href ? "bg-accent-soft text-accent font-medium" : "text-muted hover:text-ink"}`}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
