import { Hand, PhoneMissed, TrendingDown } from "lucide-react";
import { PAIN_STATS } from "@/lib/content";
import { Reveal } from "./ui/Reveal";
import { Section } from "./ui/Section";

const ICONS = [PhoneMissed, TrendingDown, Hand];

const TIMELINE = [
  { time: "10:02", text: "Llamada perdida · número desconocido", lost: true },
  { time: "10:17", text: "Llamada perdida · número desconocido", lost: true },
  { time: "10:41", text: "Interrumpes una endodoncia para contestar", lost: false },
  { time: "11:05", text: "Llamada perdida · número desconocido", lost: true },
];

export function Problem() {
  return (
    <Section
      id="problema"
      eyebrow="El problema"
      title={
        <>
          Cada llamada sin contestar es un paciente{" "}
          <span className="text-rose-400">que se va a la competencia</span>
        </>
      }
      description="Estás con guantes, en el gabinete o en la camilla. El teléfono suena. Y tienes dos malas opciones: interrumpir el tratamiento o perder al paciente."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {PAIN_STATS.map((stat, i) => {
          const Icon = ICONS[i];
          return (
            <Reveal key={stat.label} delay={i * 0.1}>
              <div className="h-full rounded-2xl border border-white/5 bg-ink-900 p-6 md:p-7">
                <span className="grid size-11 place-items-center rounded-xl bg-rose-500/10 text-rose-400">
                  <Icon className="size-5" />
                </span>
                <p className="font-display mt-5 text-4xl font-extrabold text-white">{stat.value}</p>
                <p className="mt-2 text-slate-400">{stat.label}</p>
              </div>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={0.2}>
        <div className="mt-8 grid gap-8 rounded-2xl border border-white/5 bg-linear-to-br from-ink-900 to-ink-850 p-6 md:grid-cols-2 md:p-10">
          <div>
            <h3 className="font-display text-2xl font-bold text-white">Una mañana cualquiera en tu clínica</h3>
            <p className="mt-3 text-slate-400">
              El estrés de oír el teléfono mientras atiendes no solo cuesta dinero: rompe tu concentración, alarga los
              tratamientos y empeora la experiencia del paciente que tienes delante.
            </p>
            <p className="mt-5 text-sm text-slate-500">
              * Cifras orientativas basadas en una clínica con 2 gabinetes y un ticket medio de primera visita de 120 €.
            </p>
          </div>
          <ol className="space-y-3">
            {TIMELINE.map((item) => (
              <li
                key={item.time}
                className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
                  item.lost ? "border-rose-500/15 bg-rose-500/[0.06]" : "border-amber-400/15 bg-amber-400/[0.06]"
                }`}
              >
                <span className="font-mono text-sm text-slate-500">{item.time}</span>
                <span className={`text-sm ${item.lost ? "text-rose-200" : "text-amber-200"}`}>{item.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>
    </Section>
  );
}
