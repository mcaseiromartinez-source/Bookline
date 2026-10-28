/**
 * Agente de ventas desde la terminal.
 *
 *   npm run ventas -- 30 "clínicas dentales en Valencia"
 *
 * Guarda el CSV en la carpeta ventas/ (no se sube a GitHub) y, si están
 * conectados, lo envía a Telegram y lo añade a la base de datos y a la hoja "Ventas".
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseSearchCommand, runSalesSearch } from "@/lib/agents/sales";
import { loadEnv } from "./env-file";

loadEnv();

async function main() {
  const parsed = parseSearchCommand(process.argv.slice(2).join(" "));
  if (!parsed) {
    console.error('\nUso: npm run ventas -- 30 "clínicas dentales en Valencia"\n');
    process.exit(1);
  }

  console.log(`\nBuscando ${parsed.count} resultados para «${parsed.query}»…`);
  const result = await runSalesSearch(parsed.query, parsed.count);

  mkdirSync("ventas", { recursive: true });
  const path = join("ventas", result.filename);
  writeFileSync(path, result.csv);

  console.log(`\n✔ ${result.leads.length} clínicas encontradas`);
  console.log(`  📞 ${result.leads.filter((l) => l.phone).length} con teléfono · ✉️ ${result.leads.filter((l) => l.emails.length).length} con email`);
  console.log(`  Archivo: ${path}`);
  console.log(`  Base de datos: ${result.saved.database ? "sí" : "no"} · Hoja: ${result.saved.sheet ? "sí" : "no"} · Telegram: ${result.saved.telegram ? "sí" : "no"}\n`);
}

main().catch((err) => {
  console.error("\n✖", err instanceof Error ? err.message : err, "\n");
  process.exit(1);
});
