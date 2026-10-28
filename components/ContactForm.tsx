"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Clock, Gift, Loader2, Send, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { SECTOR_OPTIONS } from "@/lib/content";
import { Section } from "./ui/Section";

interface FormData {
  name: string;
  business: string;
  sector: string;
  phone: string;
  consent: boolean;
}

type Errors = Partial<Record<keyof FormData, string>>;

const INITIAL: FormData = { name: "", business: "", sector: "", phone: "", consent: false };

function validate(data: FormData): Errors {
  const errors: Errors = {};
  if (data.name.trim().length < 2) errors.name = "Indica tu nombre";
  if (data.business.trim().length < 2) errors.business = "Indica el nombre de tu negocio";
  if (!data.sector) errors.sector = "Selecciona un sector";
  const phone = data.phone.replace(/[\s.-]/g, "");
  if (!/^(\+34|0034)?[67]\d{8}$/.test(phone)) errors.phone = "Introduce un móvil español válido (ej. 612 345 678)";
  if (!data.consent) errors.consent = "Necesitamos tu consentimiento para contactarte";
  return errors;
}

const inputBase =
  "w-full rounded-xl border bg-ink-950/60 px-4 py-3 text-white placeholder:text-slate-600 transition focus:outline-none focus:ring-2 focus:ring-cyan-400/50";

const PERKS = [
  { icon: Gift, text: "Piloto gratuito de 14 días, sin tarjeta" },
  { icon: Clock, text: "Te llamamos en menos de 24 h laborables" },
  { icon: ShieldCheck, text: "Configuración guiada y sin permanencia" },
];

export function ContactForm() {
  const [data, setData] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(data);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setStatus("sending");
    // Envío simulado: no se conecta a ningún servicio externo.
    await new Promise((r) => setTimeout(r, 1400));
    setStatus("success");
  };

  const reset = () => {
    setData(INITIAL);
    setErrors({});
    setStatus("idle");
  };

  const fieldClass = (key: keyof FormData) =>
    `${inputBase} ${errors[key] ? "border-rose-500/60" : "border-white/10 hover:border-white/20"}`;

  return (
    <Section id="contacto" className="overflow-hidden">
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[120px]" />
      <div className="relative grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p className="mb-3 text-sm font-semibold tracking-wider text-cyan-400 uppercase">Lista de espera</p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.75rem] md:leading-tight">
            Prueba Atendo gratis en tu negocio
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Estamos abriendo plazas limitadas para el programa piloto con clínicas dentales y de fisioterapia. Déjanos tus
            datos y te enseñamos una demo con tu propia agenda.
          </p>
          <ul className="mt-8 space-y-4">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-slate-300">
                <span className="grid size-9 place-items-center rounded-lg bg-cyan-400/10 text-cyan-300">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-6 shadow-2xl shadow-black/40 backdrop-blur md:p-8">
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center"
                role="status"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-400/15 text-emerald-300"
                >
                  <CheckCircle2 className="size-8" />
                </motion.span>
                <h3 className="font-display mt-6 text-2xl font-bold text-white">¡Solicitud recibida, {data.name.split(" ")[0]}!</h3>
                <p className="mx-auto mt-3 max-w-sm text-slate-400">
                  Hemos reservado una plaza para <span className="text-white">{data.business}</span> en el piloto. Te
                  llamaremos al <span className="text-white">{data.phone}</span> en menos de 24 h laborables.
                </p>
                <button onClick={reset} className="mt-8 text-sm font-medium text-cyan-400 hover:text-cyan-300">
                  Enviar otra solicitud
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={onSubmit}
                noValidate
                className="space-y-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Nombre" error={errors.name} htmlFor="name">
                    <input
                      id="name"
                      autoComplete="name"
                      placeholder="Ana García"
                      value={data.name}
                      onChange={(e) => update("name", e.target.value)}
                      className={fieldClass("name")}
                      aria-invalid={!!errors.name}
                    />
                  </Field>
                  <Field label="Nombre del negocio" error={errors.business} htmlFor="business">
                    <input
                      id="business"
                      autoComplete="organization"
                      placeholder="Clínica Dental Sonríe"
                      value={data.business}
                      onChange={(e) => update("business", e.target.value)}
                      className={fieldClass("business")}
                      aria-invalid={!!errors.business}
                    />
                  </Field>
                </div>
                <Field label="Sector" error={errors.sector} htmlFor="sector">
                  <select
                    id="sector"
                    value={data.sector}
                    onChange={(e) => update("sector", e.target.value)}
                    className={`${fieldClass("sector")} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_1rem_center] bg-no-repeat pr-10 ${
                      data.sector ? "" : "text-slate-600"
                    }`}
                    aria-invalid={!!errors.sector}
                  >
                    <option value="" disabled>
                      Selecciona tu sector
                    </option>
                    {SECTOR_OPTIONS.map((s) => (
                      <option key={s} value={s} className="bg-ink-900 text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Teléfono móvil" error={errors.phone} htmlFor="phone">
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="612 345 678"
                    value={data.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className={fieldClass("phone")}
                    aria-invalid={!!errors.phone}
                  />
                </Field>

                <div>
                  <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-400">
                    <input
                      type="checkbox"
                      checked={data.consent}
                      onChange={(e) => update("consent", e.target.checked)}
                      className="mt-0.5 size-4 shrink-0 accent-cyan-400"
                    />
                    <span>
                      Acepto la{" "}
                      <a href="#" className="text-cyan-400 underline-offset-2 hover:underline">
                        política de privacidad
                      </a>{" "}
                      y que Atendo me contacte para la demo.
                    </span>
                  </label>
                  {errors.consent && <p className="mt-1.5 text-xs text-rose-400">{errors.consent}</p>}
                </div>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-cyan-400 to-blue-500 py-3.5 font-semibold text-ink-950 shadow-lg shadow-cyan-500/25 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
                >
                  {status === "sending" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Enviando…
                    </>
                  ) : (
                    <>
                      Solicitar piloto gratuito <Send className="size-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Section>
  );
}

function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </div>
  );
}
