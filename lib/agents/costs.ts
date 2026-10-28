import type { CallReport } from "@/lib/calls/types";
import { googleFetch, SHEETS_SCOPE } from "@/lib/google";
import { assertEnabled, requireEnv } from "@/lib/integrations";
import { dateTimeKey } from "@/lib/time";

/**
 * AGENTE DE COSTES Y CLIENTES (Google Sheets)
 *
 * La hoja tiene tres pestañas:
 *  - "Llamadas": una fila por llamada (la añade este agente).
 *  - "Clientes": tus clínicas y lo que pagan al mes (la rellenas tú).
 *  - "Resumen":  minutos, coste, cuota y margen de cada clínica este mes
 *                (este agente la recalcula después de cada llamada).
 */

export const TABS = {
  calls: {
    title: "Llamadas",
    header: ["Fecha", "Clínica", "Id llamada", "Minutos", "Coste USD", "Coste EUR", "Tipo", "Urgencia", "Paciente"],
  },
  clients: {
    title: "Clientes",
    header: ["Clínica", "Cuota mensual (€)", "Email de contacto", "Estado"],
  },
  summary: {
    title: "Resumen",
    header: ["Mes", "Clínica", "Llamadas", "Minutos", "Coste (€)", "Cuota (€)", "Margen (€)", "Margen %", "Actualizado"],
  },
  leads: {
    title: "Ventas",
    header: ["Fecha", "Búsqueda", "Clínica", "Teléfono", "Web", "Emails", "Instagram", "Facebook", "Valoración", "Reseñas", "Google Maps", "Mensaje", "Estado"],
  },
} as const;

/** Añade filas al final de una pestaña. */
export async function appendRows(tab: string, rows: (string | number)[][]) {
  assertEnabled("sheets");
  if (!rows.length) return;
  await googleFetch(
    `${base()}/values/${range(`${tab}!A1`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    SHEETS_SCOPE,
    { method: "POST", body: { values: rows } },
  );
}

const usdToEur = () => Number(process.env.USD_EUR_RATE ?? "0.92");
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

const base = () => `https://sheets.googleapis.com/v4/spreadsheets/${requireEnv("GOOGLE_SHEETS_ID")}`;
const range = (r: string) => encodeURIComponent(r);

type Cell = string | number | boolean | undefined;

async function readRange(r: string): Promise<Cell[][]> {
  // UNFORMATTED_VALUE: números como números, sin depender del idioma de la hoja.
  const res = await googleFetch<{ values?: Cell[][] }>(
    `${base()}/values/${range(r)}?valueRenderOption=UNFORMATTED_VALUE`,
    SHEETS_SCOPE,
  );
  return res.values ?? [];
}

/** Crea las pestañas y cabeceras si no existen. Se puede ejecutar varias veces. */
export async function setupCostsSheet() {
  assertEnabled("sheets");
  const meta = await googleFetch<{ sheets: { properties: { title: string } }[] }>(
    `${base()}?fields=sheets.properties.title`,
    SHEETS_SCOPE,
  );
  const existing = new Set(meta.sheets.map((s) => s.properties.title));
  const missing = Object.values(TABS).filter((t) => !existing.has(t.title));
  if (missing.length) {
    await googleFetch(`${base()}:batchUpdate`, SHEETS_SCOPE, {
      method: "POST",
      body: { requests: missing.map((t) => ({ addSheet: { properties: { title: t.title } } })) },
    });
  }
  for (const tab of Object.values(TABS)) {
    await googleFetch(`${base()}/values/${range(`${tab.title}!A1`)}?valueInputOption=RAW`, SHEETS_SCOPE, {
      method: "PUT",
      body: { values: [tab.header] },
    });
  }
}

export interface CostRowInput {
  report: CallReport;
  clinicName: string;
  tipo?: string;
  urgencia?: string;
  paciente?: string | null;
}

/** Añade la llamada a "Llamadas" y recalcula "Resumen". */
export async function recordCallCost({ report, clinicName, tipo, urgencia, paciente }: CostRowInput) {
  assertEnabled("sheets");
  const minutes = round((report.durationSeconds ?? 0) / 60);
  const usd = report.costUsd ?? 0;
  const when = report.endedAt ? new Date(report.endedAt) : new Date();

  await googleFetch(
    `${base()}/values/${range(`${TABS.calls.title}!A1`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    SHEETS_SCOPE,
    {
      method: "POST",
      body: {
        values: [
          [dateTimeKey(when), clinicName, report.callId, minutes, round(usd, 4), round(usd * usdToEur(), 4), tipo ?? "", urgencia ?? "", paciente ?? ""],
        ],
      },
    },
  );

  await rebuildSummary();
}

/** Recalcula la pestaña "Resumen" para el mes en curso. */
export async function rebuildSummary() {
  assertEnabled("sheets");
  const month = dateTimeKey(new Date()).slice(0, 7); // "2026-10"
  const [callRows, clientRows] = await Promise.all([
    readRange(`${TABS.calls.title}!A2:F`),
    readRange(`${TABS.clients.title}!A2:B`),
  ]);

  const toNumber = (v: Cell) => (typeof v === "number" ? v : Number(String(v ?? "0").replace(",", ".")) || 0);
  const text = (v: Cell) => String(v ?? "").trim();
  const prices = new Map(clientRows.filter((r) => text(r[0])).map((r) => [text(r[0]), toNumber(r[1])]));

  const totals = new Map<string, { calls: number; minutes: number; eur: number }>();
  for (const [fecha, clinica, , minutos, , eur] of callRows) {
    if (!text(fecha).startsWith(month) || !text(clinica)) continue;
    const t = totals.get(text(clinica)) ?? { calls: 0, minutes: 0, eur: 0 };
    t.calls += 1;
    t.minutes += toNumber(minutos);
    t.eur += toNumber(eur);
    totals.set(text(clinica), t);
  }
  // Las clínicas sin llamadas este mes también salen (con coste 0).
  for (const name of prices.keys()) if (!totals.has(name)) totals.set(name, { calls: 0, minutes: 0, eur: 0 });

  const updated = dateTimeKey(new Date());
  const rows = [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([clinica, t]) => {
      const fee = prices.get(clinica) ?? 0;
      const margin = fee - t.eur;
      return [month, clinica, t.calls, round(t.minutes), round(t.eur), fee, round(margin), fee ? `${Math.round((margin / fee) * 100)}%` : "-", updated];
    });

  await googleFetch(`${base()}/values/${range(`${TABS.summary.title}!A2:Z`)}:clear`, SHEETS_SCOPE, { method: "POST", body: {} });
  if (rows.length) {
    await googleFetch(`${base()}/values/${range(`${TABS.summary.title}!A2`)}?valueInputOption=RAW`, SHEETS_SCOPE, {
      method: "PUT",
      body: { values: rows },
    });
  }
}
