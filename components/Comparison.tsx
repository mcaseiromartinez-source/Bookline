import { Check, X } from "lucide-react";
import { COMPARISON } from "@/lib/content";
import { Reveal } from "./ui/Reveal";
import { Section } from "./ui/Section";

function Cell({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <span
        className={`inline-grid size-7 place-items-center rounded-full ${
          highlight ? "bg-cyan-400 text-ink-950" : "bg-emerald-400/15 text-emerald-300"
        }`}
      >
        <Check className="size-4" aria-label="Sí" />
      </span>
    ) : (
      <span className="inline-grid size-7 place-items-center rounded-full bg-rose-500/10 text-rose-400">
        <X className="size-4" aria-label="No" />
      </span>
    );
  }
  return <span className={highlight ? "font-semibold text-white" : "text-slate-400"}>{value}</span>;
}

export function Comparison() {
  const { columns, rows } = COMPARISON;
  return (
    <Section
      id="comparativa"
      eyebrow="Comparativa"
      title="La recepción que tu negocio necesita, sin el coste de una nómina"
    >
      <Reveal>
        {/* Desktop / tablet: tabla */}
        <div className="hidden overflow-hidden rounded-3xl border border-white/5 bg-ink-900 md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="p-6" scope="col">
                  <span className="sr-only">Característica</span>
                </th>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    scope="col"
                    className={`p-6 text-center align-bottom ${col.highlight ? "bg-cyan-400/[0.07]" : ""}`}
                  >
                    {col.highlight && (
                      <span className="mb-2 inline-block rounded-full bg-linear-to-r from-cyan-400 to-blue-500 px-3 py-0.5 text-[11px] font-bold text-ink-950">
                        RECOMENDADO
                      </span>
                    )}
                    <p className={`font-display text-lg font-bold ${col.highlight ? "text-cyan-300" : "text-white"}`}>
                      {col.title}
                    </p>
                    <p className="text-xs font-normal text-slate-500">{col.subtitle}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-white/5">
                  <th scope="row" className="p-5 pl-6 font-medium text-slate-300">
                    {row.label}
                  </th>
                  {row.values.map((v, i) => (
                    <td
                      key={i}
                      className={`p-5 text-center ${columns[i].highlight ? "bg-cyan-400/[0.07]" : ""}`}
                    >
                      <Cell value={v} highlight={columns[i].highlight} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Móvil: tarjetas por opción */}
        <div className="grid gap-4 md:hidden">
          {columns.map((col, ci) => (
            <div
              key={col.id}
              className={`rounded-2xl border p-5 ${
                col.highlight ? "order-first border-cyan-400/30 bg-cyan-400/[0.07]" : "border-white/5 bg-ink-900"
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className={`font-display text-lg font-bold ${col.highlight ? "text-cyan-300" : "text-white"}`}>
                    {col.title}
                  </p>
                  <p className="text-xs text-slate-500">{col.subtitle}</p>
                </div>
                {col.highlight && (
                  <span className="rounded-full bg-cyan-400 px-2.5 py-0.5 text-[10px] font-bold text-ink-950">
                    RECOMENDADO
                  </span>
                )}
              </div>
              <dl className="space-y-2.5">
                {rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 text-sm">
                    <dt className="text-slate-400">{row.label}</dt>
                    <dd className="text-right">
                      <Cell value={row.values[ci]} highlight={col.highlight} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
