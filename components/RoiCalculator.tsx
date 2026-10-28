"use client";

import { animate, useMotionValue, useTransform, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { ButtonLink } from "./ui/Button";
import { Section } from "./ui/Section";

/** Supuestos del modelo (editables). */
const WORKING_DAYS = 22;
const PLAN_PRICE = 149;

const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  hint?: string;
}

function Slider({ label, value, min, max, step, format, onChange, hint }: SliderProps) {
  const id = useId();
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}
        </label>
        <span className="font-display text-2xl font-bold text-white tabular-nums">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range"
        style={{ "--fill": `${fill}%` } as React.CSSProperties}
      />
      <div className="mt-1.5 flex justify-between text-xs text-slate-500">
        <span>{format(min)}</span>
        {hint && <span className="hidden sm:inline">{hint}</span>}
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

function AnimatedEuro({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => eur.format(Math.round(v)));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.5, ease: "easeOut" });
    return controls.stop;
  }, [mv, value]);
  return <motion.span className={className}>{text}</motion.span>;
}

export function RoiCalculator() {
  const [calls, setCalls] = useState(6);
  const [ticket, setTicket] = useState(90);
  const [conversion, setConversion] = useState(40);

  const bookingsLost = calls * WORKING_DAYS * (conversion / 100);
  const monthlyLoss = bookingsLost * ticket;
  const yearlyLoss = monthlyLoss * 12;
  const roi = monthlyLoss / PLAN_PRICE;

  return (
    <Section
      id="roi"
      eyebrow="Calculadora de ROI"
      title="¿Cuánto dinero se queda sin descolgar?"
      description="Ajusta los valores a tu negocio y descubre lo que pierdes cada mes por las llamadas que no puedes atender."
      className="bg-ink-900/40"
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-9 rounded-3xl border border-white/5 bg-ink-900 p-6 md:p-10">
          <Slider
            label="Llamadas perdidas al día"
            value={calls}
            min={1}
            max={30}
            step={1}
            format={(v) => `${v}`}
            onChange={setCalls}
          />
          <Slider
            label="Valor medio del servicio"
            value={ticket}
            min={20}
            max={600}
            step={5}
            format={(v) => eur.format(v)}
            onChange={setTicket}
            hint="Primera visita, tratamiento, reserva…"
          />
          <Slider
            label="Llamadas que acabarían en cita"
            value={conversion}
            min={10}
            max={80}
            step={5}
            format={(v) => `${v}%`}
            onChange={setConversion}
          />
          <p className="text-xs text-slate-500">
            Cálculo: llamadas × {WORKING_DAYS} días laborables × % de conversión × valor medio. Plan de referencia:{" "}
            {eur.format(PLAN_PRICE)}/mes.
          </p>
        </div>

        <div className="relative flex flex-col overflow-hidden rounded-3xl border border-cyan-400/20 bg-linear-to-br from-cyan-500/15 via-blue-600/10 to-ink-900 p-6 md:p-10">
          <div className="pointer-events-none absolute -top-20 -right-20 size-60 rounded-full bg-cyan-400/20 blur-3xl" />
          <p className="relative text-sm font-medium text-cyan-200">Estás dejando de ingresar</p>
          <AnimatedEuro
            value={monthlyLoss}
            className="font-display relative mt-2 text-5xl font-extrabold tracking-tight text-white tabular-nums md:text-6xl"
          />
          <p className="relative text-slate-400">al mes</p>

          <dl className="relative mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
            <div>
              <dt className="text-xs text-slate-400">Al año</dt>
              <dd className="font-display text-xl font-bold text-white tabular-nums">
                <AnimatedEuro value={yearlyLoss} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Citas perdidas / mes</dt>
              <dd className="font-display text-xl font-bold text-white tabular-nums">{Math.round(bookingsLost)}</dd>
            </div>
            <div className="col-span-2 rounded-xl bg-white/5 p-4">
              <dt className="text-xs text-slate-400">Retorno estimado con Atendo</dt>
              <dd className="font-display text-2xl font-bold text-emerald-300 tabular-nums">
                x{roi.toFixed(1)} <span className="text-sm font-medium text-slate-400">la inversión</span>
              </dd>
            </div>
          </dl>

          <ButtonLink href="#contacto" className="relative mt-8 w-full">
            Recuperar esas llamadas <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
