/**
 * Prepara la hoja de Google: crea las pestañas (Llamadas, Clientes, Resumen, Ventas) y sus cabeceras.
 *
 *   npm run sheets:setup
 */
import { rebuildSummary, setupCostsSheet } from "@/lib/agents/costs";
import { loadEnv } from "./env-file";

loadEnv();

async function main() {
  await setupCostsSheet();
  await rebuildSummary();
  console.log('\n✔ Hoja preparada. Rellena la pestaña "Clientes" con tus clínicas y lo que paga cada una al mes.\n');
}

main().catch((err) => {
  console.error("\n✖", err instanceof Error ? err.message : err, "\n");
  process.exit(1);
});
