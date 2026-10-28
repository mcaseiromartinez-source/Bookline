"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Check, Scissors, Stethoscope, User, UtensilsCrossed, Wrench, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { VERTICALS, type VerticalId } from "@/lib/content";
import { Section } from "./ui/Section";

const ICONS: Record<VerticalId, LucideIcon> = {
  salud: Stethoscope,
  estetica: Scissors,
  hosteleria: UtensilsCrossed,
  talleres: Wrench,
};

export function Verticals() {
  const [active, setActive] = useState<VerticalId>("salud");
  const vertical = VERTICALS.find((v) => v.id === active) ?? VERTICALS[0];
  const ActiveIcon = ICONS[vertical.id];

  return (
    <Section
      id="sectores"
      eyebrow="Sectores"
      title="Diseñado para negocios donde las manos no descansan"
      description="Empezamos por clínicas dentales y de fisioterapia, y adaptamos el asistente al vocabulario y la agenda de cada sector."
    >
      <div
        role="tablist"
        aria-label="Sectores"
        className="mx-auto mb-8 flex w-fit max-w-full snap-x gap-2 overflow-x-auto rounded-2xl border border-white/5 bg-ink-900 p-1.5 [scrollbar-width:none]"
      >
        {VERTICALS.map((v) => {
          const Icon = ICONS[v.id];
          const selected = v.id === active;
          return (
            <button
              key={v.id}
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${v.id}`}
              onClick={() => setActive(v.id)}
              className={`relative flex shrink-0 snap-start items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition ${
                selected ? "text-ink-950" : "text-slate-400 hover:text-white"
              }`}
            >
              {selected && (
                <motion.span
                  layoutId="vertical-pill"
                  className="absolute inset-0 rounded-xl bg-linear-to-r from-cyan-400 to-blue-500"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <Icon className="relative size-4" />
              <span className="relative">{v.tab}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={vertical.id}
          id={`panel-${vertical.id}`}
          role="tabpanel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="grid gap-6 rounded-3xl border border-white/5 bg-linear-to-br from-ink-900 to-ink-850 p-6 md:p-10 lg:grid-cols-[1.2fr_1fr] lg:gap-10"
        >
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
                <ActiveIcon className="size-5" />
              </span>
              {vertical.featured && (
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                  ★ Nicho principal
                </span>
              )}
            </div>
            <h3 className="font-display mt-5 text-2xl font-bold text-white md:text-3xl">{vertical.headline}</h3>
            <p className="mt-3 text-slate-400">{vertical.pain}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {vertical.features.map((f) => (
                <li key={f} className="flex gap-2.5 text-sm text-slate-300">
                  <Check className="mt-0.5 size-4 shrink-0 text-cyan-400" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-white/5 bg-ink-950/60 p-5">
              <p className="mb-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Ejemplo de llamada</p>
              <div className="space-y-3">
                {vertical.sample.map((line, i) => (
                  <div key={i} className={`flex items-end gap-2 ${line.speaker === "ai" ? "" : "flex-row-reverse"}`}>
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full ${
                        line.speaker === "ai" ? "bg-cyan-400/15 text-cyan-300" : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {line.speaker === "ai" ? <Bot className="size-3.5" /> : <User className="size-3.5" />}
                    </span>
                    <p
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        line.speaker === "ai"
                          ? "rounded-bl-sm bg-cyan-500/15 text-cyan-50 ring-1 ring-cyan-400/20"
                          : "rounded-br-sm bg-white/[0.07] text-slate-200"
                      }`}
                    >
                      {line.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-linear-to-br from-cyan-400/10 to-blue-600/10 p-5">
              <p className="font-display text-4xl font-extrabold text-white">{vertical.metric.value}</p>
              <p className="mt-1 text-sm text-slate-300">{vertical.metric.label}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </Section>
  );
}
