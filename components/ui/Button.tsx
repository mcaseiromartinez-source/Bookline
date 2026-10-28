import type { AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";

const styles: Record<Variant, string> = {
  primary:
    "bg-linear-to-r from-cyan-400 to-blue-500 text-ink-950 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40 hover:brightness-110",
  ghost: "border border-white/10 bg-white/5 text-white hover:bg-white/10",
};

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  children: ReactNode;
}

export function ButtonLink({ variant = "primary", className = "", children, ...props }: ButtonLinkProps) {
  return (
    <a
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 focus-visible:outline-none ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
