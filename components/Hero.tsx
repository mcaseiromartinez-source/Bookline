import { ArrowRight, ShieldCheck } from "lucide-react";
import { TRUST_BADGES } from "@/lib/content";
import { ButtonLink } from "./ui/Button";
import { Reveal } from "./ui/Reveal";
import { VoiceDemo } from "./VoiceDemo";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden px-4 pt-28 pb-20 sm:px-6 md:pt-36 md:pb-28">
      <div className="bg-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute top-0 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[120px]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-cyan-400" />
            </span>
            Recepcionista con IA · disponible 24/7
          </span>

          <h1 className="font-display mt-6 text-4xl leading-[1.08] font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Nunca más pierdas un paciente{" "}
            <span className="bg-linear-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">
              por tener las manos ocupadas
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-slate-400">
            Atendo contesta las llamadas que tú no puedes coger, agenda citas hablando con total naturalidad y te
            envía un resumen al móvil. Mientras tú sigues con tu paciente.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="#contacto" className="px-7 py-3.5 text-base">
              Solicitar piloto gratuito <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink href="#como-funciona" variant="ghost" className="px-7 py-3.5 text-base">
              Ver cómo funciona
            </ButtonLink>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-3">
            {TRUST_BADGES.map((badge) => (
              <li key={badge} className="flex items-center gap-1.5 text-sm text-slate-400">
                <ShieldCheck className="size-4 text-cyan-400" />
                {badge}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.15} className="mx-auto w-full max-w-md lg:max-w-none">
          <VoiceDemo />
        </Reveal>
      </div>
    </section>
  );
}
