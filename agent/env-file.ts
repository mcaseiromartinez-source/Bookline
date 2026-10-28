import { existsSync, readFileSync, writeFileSync } from "node:fs";

export const ENV_FILE = ".env.local";

/** Carga .env.local en process.env (los scripts no pasan por Next.js). */
export function loadEnv() {
  if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);
}

/** Crea o reemplaza una variable en .env.local sin tocar las demás. */
export function setEnvVar(key: string, value: string) {
  const content = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8") : "";
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^#?\\s*${key}=.*$`, "m");
  const next = pattern.test(content) ? content.replace(pattern, line) : `${content.trimEnd()}\n${line}\n`;
  writeFileSync(ENV_FILE, next);
  process.env[key] = value;
}
