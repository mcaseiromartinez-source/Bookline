import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({ id, eyebrow, title, description, children, className = "" }: SectionProps) {
  return (
    <section id={id} className={`relative px-4 py-20 sm:px-6 md:py-28 ${className}`}>
      <div className="mx-auto max-w-6xl">
        {(eyebrow || title || description) && (
          <Reveal className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
            {eyebrow && (
              <p className="mb-3 text-sm font-semibold tracking-wider text-cyan-400 uppercase">{eyebrow}</p>
            )}
            {title && (
              <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.75rem] md:leading-tight">
                {title}
              </h2>
            )}
            {description && <p className="mt-4 text-base text-slate-400 sm:text-lg">{description}</p>}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}
