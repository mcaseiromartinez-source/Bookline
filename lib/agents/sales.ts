import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { upsertLeads } from "@/lib/db/repo";
import type { Lead } from "@/lib/db/types";
import { assertEnabled, isEnabled, requireEnv } from "@/lib/integrations";
import { escapeHtml, sendTelegram, sendTelegramDocument } from "@/lib/notify/telegram";
import { dateKey, dateTimeKey } from "@/lib/time";
import { appendRows, TABS } from "./costs";

/**
 * AGENTE DE VENTAS
 * "Busca 30 clínicas dentales en Valencia":
 *  1. Busca negocios con la API oficial de Google Places (sin copiar datos de Google Maps).
 *  2. Visita la web pública de cada uno para sacar email, Instagram y Facebook.
 *  3. Claude escribe un mensaje de presentación personalizado para cada clínica.
 *  4. Lo guarda (base de datos y hoja "Ventas") y te lo envía por Telegram con un CSV.
 *
 * Aviso legal: en España la LSSI prohíbe enviar emails comerciales sin consentimiento,
 * también a empresas. Usa la lista para LLAMAR o VISITAR; no hagas envíos masivos.
 */

const MAX_RESULTS = 60; // límite de Google Places por búsqueda
const FETCH_TIMEOUT_MS = 8000;
const MAX_PAGE_BYTES = 1_500_000;

// ---------- 1. Google Places ----------

interface PlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  businessStatus?: string;
}

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.businessStatus",
  "nextPageToken",
].join(",");

async function searchPlaces(query: string, count: number): Promise<PlaceResult[]> {
  assertEnabled("places");
  const results: PlaceResult[] = [];
  let pageToken: string | undefined;

  while (results.length < count) {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": requireEnv("GOOGLE_PLACES_API_KEY"),
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({ textQuery: query, languageCode: "es", regionCode: "ES", pageSize: 20, pageToken }),
    });
    if (!res.ok) throw new Error(`Google Places respondió ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = (await res.json()) as { places?: PlaceResult[]; nextPageToken?: string };
    results.push(...(data.places ?? []).filter((p) => !p.businessStatus || p.businessStatus === "OPERATIONAL"));
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return results.slice(0, count);
}

// ---------- 2. Web pública de cada clínica ----------

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const BAD_EMAIL = /\.(png|jpe?g|gif|webp|svg|css|js)$|@(sentry|example|domain|email|wixpress|sentry-next)\.|^(user|nombre|tu|your)@/i;
const INSTAGRAM_RE = /https?:\/\/(?:www\.)?instagram\.com\/(?!p\/|reel\/|explore\/|accounts\/)[A-Za-z0-9_.]{2,30}\/?/i;
const FACEBOOK_RE = /https?:\/\/(?:www\.|es-es\.)?facebook\.com\/(?!sharer|share|plugins|tr\?|dialog)[A-Za-z0-9_.\-/]{2,80}/i;

async function fetchPage(url: string): Promise<string> {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    const res = await fetch(parsed, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AtendoBot/1.0)", "Accept-Language": "es-ES,es" },
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("text/html")) return "";
    const text = await res.text();
    return text.slice(0, MAX_PAGE_BYTES);
  } catch {
    return "";
  }
}

function extractContacts(html: string) {
  const decoded = html.replace(/&#64;|\[at\]|\(at\)/gi, "@");
  const emails = [...new Set((decoded.match(EMAIL_RE) ?? []).map((e) => e.toLowerCase()))].filter((e) => !BAD_EMAIL.test(e));
  return {
    emails: emails.slice(0, 3),
    instagram: html.match(INSTAGRAM_RE)?.[0]?.replace(/\/$/, "") ?? null,
    facebook: html.match(FACEBOOK_RE)?.[0]?.replace(/\/$/, "") ?? null,
  };
}

async function enrichFromWebsite(website: string | undefined) {
  if (!website) return { emails: [], instagram: null, facebook: null };
  const home = extractContacts(await fetchPage(website));
  if (home.emails.length) return home;
  // Si la portada no tiene email, probamos la página de contacto.
  for (const path of ["/contacto", "/contacto/", "/contact"]) {
    const contact = extractContacts(await fetchPage(new URL(path, website).toString()));
    if (contact.emails.length) {
      return { emails: contact.emails, instagram: home.instagram ?? contact.instagram, facebook: home.facebook ?? contact.facebook };
    }
  }
  return home;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

// ---------- 3. Mensajes personalizados ----------

const PitchesSchema = z.object({
  mensajes: z.array(z.object({ id: z.string(), mensaje: z.string() })),
});

const PITCH_PROMPT = `Eres el comercial de Atendo, una recepcionista telefónica con IA para clínicas: atiende las llamadas que la clínica no puede coger mientras está con pacientes, 24 horas, reserva citas en su agenda y le envía un resumen al instante.
Para cada clínica escribe un mensaje de presentación corto (3 o 4 frases) para abrir una LLAMADA o una VISITA, no para email masivo.
- Personalízalo con lo que sabes de la clínica (zona, valoración, número de reseñas): por ejemplo, muchas reseñas suelen significar mucha demanda y muchas llamadas.
- Céntrate en su problema: llamadas perdidas mientras atienden y pacientes nuevos que se van a otra clínica.
- Termina proponiendo un piloto gratuito de 14 días.
- Tono cercano y profesional, español de España, de usted. Sin exagerar ni inventar datos.`;

async function writePitches(places: { id: string; name: string; address: string | null; rating: number | null; reviews: number | null }[], query: string) {
  if (!isEnabled("anthropic") || !places.length) return new Map<string, string>();
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-haiku-5-5",
    max_tokens: 16000,
    system: PITCH_PROMPT,
    output_config: { effort: "low", format: zodOutputFormat(PitchesSchema) },
    messages: [
      {
        role: "user",
        content: `Búsqueda: ${query}\n\nClínicas (JSON):\n${JSON.stringify(places)}\n\nDevuelve un mensaje por cada id.`,
      },
    ],
  });
  if (!response.parsed_output) return new Map<string, string>();
  return new Map(response.parsed_output.mensajes.map((m) => [m.id, m.mensaje]));
}

// ---------- 4. Resultado ----------

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function leadsToCsv(leads: Lead[]): string {
  const header = ["Nombre", "Dirección", "Teléfono", "Web", "Emails", "Instagram", "Facebook", "Valoración", "Reseñas", "Google Maps", "Mensaje"];
  const rows = leads.map((l) =>
    [l.name, l.address, l.phone, l.website, l.emails.join(" "), l.instagram, l.facebook, l.rating, l.reviews, l.mapsUrl, l.pitch]
      .map(csvCell)
      .join(";"),
  );
  // BOM + ";" para que Excel en español lo abra bien con tildes y columnas.
  return `﻿${header.map(csvCell).join(";")}\n${rows.join("\n")}\n`;
}

export interface SalesSearchResult {
  query: string;
  leads: Lead[];
  csv: string;
  filename: string;
  saved: { database: boolean; sheet: boolean; telegram: boolean };
}

export function parseSearchCommand(text: string): { count: number; query: string } | null {
  const match = text.trim().match(/^(\d{1,3})?\s*([\s\S]+)$/);
  if (!match || !match[2].trim()) return null;
  const count = Math.min(Math.max(Number(match[1] ?? 20), 1), MAX_RESULTS);
  return { count, query: match[2].trim() };
}

export async function runSalesSearch(query: string, count: number, opts: { notify?: boolean } = {}): Promise<SalesSearchResult> {
  const places = await searchPlaces(query, Math.min(count, MAX_RESULTS));
  const contacts = await mapWithConcurrency(places, 5, (p) => enrichFromWebsite(p.websiteUri));

  const basic = places.map((p) => ({
    id: p.id,
    name: p.displayName?.text ?? "Sin nombre",
    address: p.formattedAddress ?? null,
    rating: p.rating ?? null,
    reviews: p.userRatingCount ?? null,
  }));
  const pitches = await writePitches(basic, query).catch((err) => {
    console.error("[ventas] no se pudieron escribir los mensajes:", err);
    return new Map<string, string>();
  });

  const leads: Lead[] = places.map((p, i) => ({
    placeId: p.id,
    searchQuery: query,
    name: basic[i].name,
    address: basic[i].address,
    phone: p.internationalPhoneNumber ?? p.nationalPhoneNumber ?? null,
    website: p.websiteUri ?? null,
    emails: contacts[i].emails,
    instagram: contacts[i].instagram,
    facebook: contacts[i].facebook,
    rating: basic[i].rating,
    reviews: basic[i].reviews,
    mapsUrl: p.googleMapsUri ?? null,
    pitch: pitches.get(p.id) ?? null,
  }));

  const csv = leadsToCsv(leads);
  const slug = query.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  const filename = `clinicas-${slug}-${dateKey(new Date())}.csv`;
  const saved = { database: false, sheet: false, telegram: false };

  if (isEnabled("supabase")) {
    saved.database = await upsertLeads(leads).then(() => true, (err) => (console.error("[ventas] base de datos:", err), false));
  }
  if (isEnabled("sheets")) {
    const now = dateTimeKey(new Date());
    saved.sheet = await appendRows(
      TABS.leads.title,
      leads.map((l) => [now, query, l.name, l.phone ?? "", l.website ?? "", l.emails.join(" "), l.instagram ?? "", l.facebook ?? "", l.rating ?? "", l.reviews ?? "", l.mapsUrl ?? "", l.pitch ?? "", "nuevo"]),
    ).then(() => true, (err) => (console.error("[ventas] hoja de cálculo:", err), false));
  }
  if (opts.notify !== false && isEnabled("telegram")) {
    const withEmail = leads.filter((l) => l.emails.length).length;
    const withPhone = leads.filter((l) => l.phone).length;
    const top = leads
      .slice(0, 10)
      .map((l, i) => `${i + 1}. <b>${escapeHtml(l.name)}</b>${l.rating ? ` · ⭐ ${l.rating} (${l.reviews ?? 0})` : ""}\n   ${escapeHtml(l.phone ?? "sin teléfono")}${l.emails[0] ? ` · ${escapeHtml(l.emails[0])}` : ""}`);
    await sendTelegram(
      [
        `<b>🎯 ${leads.length} clínicas · ${escapeHtml(query)}</b>`,
        `📞 ${withPhone} con teléfono · ✉️ ${withEmail} con email`,
        "",
        ...top,
        leads.length > 10 ? `\n…y ${leads.length - 10} más en el archivo.` : "",
        "",
        "<i>Recuerda: llama o visita. Los emails comerciales sin consentimiento están prohibidos (LSSI).</i>",
      ].join("\n"),
    );
    await sendTelegramDocument(filename, csv, `Lista completa con mensajes personalizados · ${escapeHtml(query)}`);
    saved.telegram = true;
  }
  return { query, leads, csv, filename, saved };
}
