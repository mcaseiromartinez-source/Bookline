import { Lock } from "lucide-react";
import { BRAND, NAV_LINKS } from "@/lib/content";
import { Logo } from "./ui/Logo";

const LEGAL_LINKS = ["Aviso legal", "Política de privacidad", "Política de cookies", "Términos del servicio"];
const SECTORS = ["Clínicas dentales", "Fisioterapia", "Peluquerías y estética", "Hostelería", "Talleres e ITV"];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/5 bg-ink-950 px-4 pt-16 pb-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-slate-400">{BRAND.slogan}</p>
            <a href={`mailto:${BRAND.email}`} className="mt-4 inline-block text-sm text-cyan-400 hover:text-cyan-300">
              {BRAND.email}
            </a>
          </div>
          <FooterCol title="Producto" items={NAV_LINKS.map((l) => ({ label: l.label, href: l.href }))} />
          <FooterCol title="Sectores" items={SECTORS.map((s) => ({ label: s, href: "#sectores" }))} />
          <FooterCol title="Legal" items={LEGAL_LINKS.map((s) => ({ label: s, href: "#" }))} />
        </div>

        <div className="mt-12 flex gap-3 rounded-2xl border border-white/5 bg-ink-900 p-5 text-xs leading-relaxed text-slate-500">
          <Lock className="mt-0.5 size-4 shrink-0 text-cyan-400" />
          <p>
            <span className="font-semibold text-slate-300">Protección de datos (RGPD).</span> Responsable: {BRAND.name}{" "}
            (datos de empresa pendientes). Finalidad: gestionar tu solicitud de demo y contactarte. Legitimación: tu
            consentimiento. No se cederán datos a terceros salvo obligación legal. Las grabaciones y transcripciones de
            llamadas se alojan en servidores ubicados en la Unión Europea. Puedes ejercer tus derechos de acceso,
            rectificación, supresión, oposición y portabilidad escribiendo a {BRAND.email}.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-slate-500 sm:flex-row">
          <p>
            © {year} {BRAND.name}. Todos los derechos reservados.
          </p>
          <p>Hecho en España 🇪🇸 · Datos alojados en la UE 🇪🇺</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="mb-4 text-sm font-semibold text-white">{title}</p>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.label}>
            <a href={item.href} className="text-sm text-slate-400 transition hover:text-white">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
