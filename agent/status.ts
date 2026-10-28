/**
 * Muestra qué servicios están conectados y cuáles faltan.
 *
 *   npm run status
 */
import { INTEGRATIONS, isEnabled, missingKeys, type IntegrationId } from "@/lib/integrations";
import { loadEnv } from "./env-file";

loadEnv();

const ids = Object.keys(INTEGRATIONS) as IntegrationId[];
const done = ids.filter(isEnabled).length;

console.log(`\nAtendo · conexiones (${done}/${ids.length})\n`);
for (const id of ids) {
  const { name, unlocks } = INTEGRATIONS[id];
  if (isEnabled(id)) {
    console.log(`  ✔ ${name}`);
  } else {
    console.log(`  ✖ ${name}  →  ${unlocks}`);
    console.log(`      falta: ${missingKeys(id).join(", ")}`);
  }
}
console.log("\nGuía paso a paso para cada clave: docs/CLAVES.md\n");
