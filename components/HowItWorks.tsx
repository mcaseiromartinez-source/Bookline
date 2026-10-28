import { Bot, CalendarCheck, MessageSquareText, PhoneForwarded } from "lucide-react";
import { STEPS } from "@/lib/content";
import { Reveal } from "./ui/Reveal";
import { Section } from "./ui/Section";

function StepVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/5 text-xs text-slate-400"
          >
            {n}º
          </span>
        ))}
        <span className="mx-1 h-px w-6 bg-linear-to-r from-slate-600 to-cyan-400" />
        <span className="grid size-9 place-items-center rounded-full bg-cyan-400/15 text-cyan-300">
          <Bot className="size-4" />
        </span>
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="mx-auto flex max-w-[15rem] items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
        <CalendarCheck className="size-5 shrink-0 text-cyan-300" />
        <div className="text-left">
          <p className="text-xs font-medium text-white">Cita confirmada</p>
          <p className="text-[11px] text-slate-400">Jue 10:30 · Primera visita</p>
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-[15rem] rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-2.5 text-left">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
        <MessageSquareText className="size-3.5" /> Atendo · ahora
      </p>
      <p className="mt-1 text-xs text-slate-300">Nueva cita: Laura G., dolor molar, mañana 10:30.</p>
    </div>
  );
}

const ICONS = [PhoneForwarded, Bot, MessageSquareText];

export function HowItWorks() {
  return (
    <Section
      id="como-funciona"
      eyebrow="Cómo funciona"
      title="En marcha en 3 simples pasos"
      description="Sin cambiar de número, sin instalar nada y sin formación. Tu equipo sigue trabajando igual; Atendo cubre lo que no llega."
      className="bg-ink-900/40"
    >
      <div className="relative grid gap-5 md:grid-cols-3">
        <div className="pointer-events-none absolute top-16 right-[16%] left-[16%] hidden h-px bg-linear-to-r from-cyan-400/0 via-cyan-400/40 to-cyan-400/0 md:block" />
        {STEPS.map((step, i) => {
          const Icon = ICONS[i];
          return (
            <Reveal key={step.title} delay={i * 0.12}>
              <div className="relative h-full rounded-2xl border border-white/5 bg-ink-900 p-6 text-center md:p-8">
                <div className="relative mx-auto grid size-14 place-items-center rounded-2xl bg-linear-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
                  <Icon className="size-6 text-white" />
                  <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border-2 border-ink-900 bg-white text-xs font-bold text-ink-950">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-display mt-6 text-xl font-bold text-white">{step.title}</h3>
                <p className="mt-3 text-slate-400">{step.description}</p>
                <div className="mt-6">
                  <StepVisual index={i} />
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
