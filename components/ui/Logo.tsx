import { BRAND } from "@/lib/content";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="#top" className={`flex items-center gap-2.5 ${className}`} aria-label={`${BRAND.name}, inicio`}>
      <span className="relative grid size-9 place-items-center rounded-xl bg-linear-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/25">
        <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" aria-hidden="true">
          <path d="M5 10v4M9 7v10M13 4v16M17 8v8M21 11v2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="font-display text-xl font-bold tracking-tight text-white">{BRAND.name}</span>
    </a>
  );
}
