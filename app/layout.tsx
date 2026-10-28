import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Atendo · Recepcionista telefónica con IA 24/7",
  description:
    "Atendo contesta las llamadas que tú no puedes, agenda citas en lenguaje natural y te envía un resumen al móvil. Para clínicas dentales, fisioterapia, estética, hostelería y talleres.",
  openGraph: {
    title: "Atendo · Tus manos, ocupadas. Tu teléfono, atendido.",
    description: "Recepcionista telefónica con IA que nunca deja una llamada sin contestar.",
    locale: "es_ES",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#04060f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
