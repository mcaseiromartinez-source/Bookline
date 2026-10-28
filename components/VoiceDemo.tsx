"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, CheckCircle2, Pause, Phone, Play, RotateCcw, User, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DEMO_SCENARIOS, type DialogLine } from "@/lib/content";

type Status = "idle" | "playing" | "done";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Elige voces en español (preferiblemente es-ES) para IA y llamante. */
function pickVoices(): { ai?: SpeechSynthesisVoice; caller?: SpeechSynthesisVoice } {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return {};
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("es"));
  const esES = voices.filter((v) => v.lang.toLowerCase() === "es-es");
  const pool = esES.length ? esES : voices;
  return { ai: pool[0], caller: pool[1] ?? voices.find((v) => v !== pool[0]) ?? pool[0] };
}

/**
 * Lee una línea en voz alta. Siempre resuelve: al terminar el audio, si hay error,
 * o tras un tiempo de seguridad (algunos navegadores no disparan `onend`).
 */
function speakLine(line: DialogLine, muted: boolean): Promise<void> {
  const estimated = Math.max(1800, line.text.length * 65);
  const canSpeak = !muted && typeof window !== "undefined" && "speechSynthesis" in window;
  if (!canSpeak) return wait(estimated);

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const { ai, caller } = pickVoices();
    const u = new SpeechSynthesisUtterance(line.text);
    u.lang = "es-ES";
    const voice = line.speaker === "ai" ? ai : caller;
    if (voice) u.voice = voice;
    u.rate = line.speaker === "ai" ? 1.05 : 1;
    u.pitch = line.speaker === "ai" ? 1.1 : 0.85;
    u.onend = finish;
    u.onerror = finish;
    window.speechSynthesis.speak(u);
    setTimeout(finish, estimated * 2.2 + 1500);
  });
}

function Waveform({ active, bars = 28 }: { active: boolean; bars?: number }) {
  return (
    <div className="flex h-10 items-center justify-center gap-[3px]" aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={`w-[3px] origin-center rounded-full bg-linear-to-t from-blue-500 to-cyan-300 transition-opacity ${
            active ? "animate-wave opacity-100" : "opacity-30"
          }`}
          style={{
            height: `${30 + ((i * 37) % 70)}%`,
            animationDelay: `${(i % 7) * 0.09}s`,
            transform: active ? undefined : "scaleY(0.3)",
          }}
        />
      ))}
    </div>
  );
}

export function VoiceDemo() {
  const [scenarioId, setScenarioId] = useState(DEMO_SCENARIOS[0].id);
  const [status, setStatus] = useState<Status>("idle");
  const [current, setCurrent] = useState(-1);
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const runId = useRef(0);
  const mutedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scenario = DEMO_SCENARIOS.find((s) => s.id === scenarioId) ?? DEMO_SCENARIOS[0];
  const speaking = status === "playing" && current >= 0 ? scenario.lines[current].speaker : null;

  const stop = useCallback(() => {
    runId.current++;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  // Precarga de voces (Chrome las carga de forma asíncrona) y limpieza al desmontar.
  useEffect(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
    return stop;
  }, [stop]);

  // Cronómetro de llamada
  useEffect(() => {
    if (status !== "playing") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  // Autoscroll de la transcripción
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [current, status]);

  const play = async () => {
    stop();
    const id = runId.current;
    setStatus("playing");
    setCurrent(-1);
    setSeconds(0);
    await wait(500);
    for (let i = 0; i < scenario.lines.length; i++) {
      if (runId.current !== id) return;
      setCurrent(i);
      await speakLine(scenario.lines[i], mutedRef.current);
      if (runId.current !== id) return;
      await wait(300);
    }
    if (runId.current === id) setStatus("done");
  };

  const pause = () => {
    stop();
    setStatus("idle");
  };

  const reset = () => {
    stop();
    setStatus("idle");
    setCurrent(-1);
    setSeconds(0);
  };

  const changeScenario = (id: string) => {
    reset();
    setScenarioId(id);
  };

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next && "speechSynthesis" in window) window.speechSynthesis.cancel();
  };

  const visibleLines = status === "done" ? scenario.lines : scenario.lines.slice(0, current + 1);
  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="relative">
      {/* Halo */}
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-linear-to-br from-cyan-500/25 via-blue-600/15 to-transparent blur-3xl" />

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-ink-900/90 shadow-2xl shadow-black/50 backdrop-blur">
        {/* Selector de escenario */}
        <div className="flex items-center gap-1 border-b border-white/5 p-2" role="tablist" aria-label="Escenario de demo">
          {DEMO_SCENARIOS.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={s.id === scenarioId}
              onClick={() => changeScenario(s.id)}
              className={`flex-1 rounded-xl px-3 py-2 text-xs font-medium transition sm:text-sm ${
                s.id === scenarioId ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Cabecera de llamada */}
        <div className="flex items-center gap-3 px-5 pt-5">
          <div className="relative grid size-11 shrink-0 place-items-center rounded-full bg-linear-to-br from-cyan-400 to-blue-600">
            {status === "playing" && <span className="absolute inset-0 animate-ring rounded-full bg-cyan-400/50" />}
            <Phone className="relative size-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{scenario.business}</p>
            <p className="text-xs text-slate-400">
              {status === "playing" ? (
                <span className="text-emerald-400">● En llamada · {mmss}</span>
              ) : status === "done" ? (
                "Llamada finalizada"
              ) : (
                "Llamada entrante · desviada a Atendo"
              )}
            </p>
          </div>
          <button
            onClick={toggleMute}
            className="grid size-9 place-items-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label={muted ? "Activar sonido" : "Silenciar"}
            title={muted ? "Activar sonido" : "Silenciar"}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        </div>

        <div className="px-5 pt-3">
          <Waveform active={speaking !== null} />
          <p className="h-4 text-center text-[11px] tracking-wide text-slate-500 uppercase">
            {speaking === "ai" ? "Atendo está hablando" : speaking === "caller" ? "Paciente hablando" : " "}
          </p>
        </div>

        {/* Transcripción */}
        <div
          ref={scrollRef}
          className="mt-3 h-64 space-y-3 overflow-y-auto px-5 pb-4 sm:h-72"
          aria-live="polite"
          aria-label="Transcripción de la llamada"
        >
          {visibleLines.length === 0 && (
            <div className="grid h-full place-items-center text-center">
              <p className="max-w-[16rem] text-sm text-slate-500">
                Pulsa <span className="font-semibold text-cyan-400">Escuchar llamada</span> para oír cómo responde Atendo
                a un paciente real.
              </p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {visibleLines.map((line, i) => (
              <motion.div
                key={`${scenarioId}-${i}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex items-end gap-2 ${line.speaker === "ai" ? "" : "flex-row-reverse"}`}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full ${
                    line.speaker === "ai" ? "bg-cyan-400/15 text-cyan-300" : "bg-white/10 text-slate-300"
                  }`}
                >
                  {line.speaker === "ai" ? <Bot className="size-3.5" /> : <User className="size-3.5" />}
                </span>
                <p
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    line.speaker === "ai"
                      ? "rounded-bl-sm bg-linear-to-br from-cyan-500/20 to-blue-600/20 text-cyan-50 ring-1 ring-cyan-400/20"
                      : "rounded-br-sm bg-white/[0.07] text-slate-200"
                  }`}
                >
                  {line.text}
                </p>
              </motion.div>
            ))}
            {status === "done" && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] p-4"
              >
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 className="size-4" /> Resumen enviado a tu móvil
                </p>
                <dl className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-3">
                  {scenario.summary.map((item) => (
                    <div key={item.label}>
                      <dt className="text-slate-500">{item.label}</dt>
                      <dd className="font-medium text-slate-200">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2 border-t border-white/5 p-4">
          {status === "playing" ? (
            <button
              onClick={pause}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <Pause className="size-4" /> Detener
            </button>
          ) : (
            <button
              onClick={play}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-linear-to-r from-cyan-400 to-blue-500 py-3 text-sm font-semibold text-ink-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
            >
              <Play className="size-4 fill-current" /> {status === "done" ? "Volver a escuchar" : "Escuchar llamada"}
            </button>
          )}
          {status !== "idle" || current >= 0 ? (
            <button
              onClick={reset}
              className="grid size-11 place-items-center rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
              aria-label="Reiniciar demo"
            >
              <RotateCcw className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
