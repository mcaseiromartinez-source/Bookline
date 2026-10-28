# Atendo · Landing

> *Tus manos, ocupadas. Tu teléfono, atendido.*

Landing page de **Atendo**, recepcionista telefónica con IA 24/7 para clínicas dentales, fisioterapia, estética, hostelería y talleres. Es solo frontend: no tiene backend, ni APIs ni base de datos.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript 5
- Tailwind CSS v4 (tema en `app/globals.css`)
- Framer Motion (animaciones) · Lucide (iconos)

## Arrancar

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción
npm run lint     # comprobación de tipos
```

## Estructura

```
app/
  layout.tsx        Fuentes, metadatos SEO, idioma
  page.tsx          Composición de secciones
  globals.css       Tema (colores, animaciones, slider)
components/
  Navbar.tsx        Navegación fija + menú móvil
  Hero.tsx          Titular, CTA, badges de confianza
  VoiceDemo.tsx     Reproductor de llamada simulada (voz real vía Web Speech API)
  Problem.tsx       Pain points
  HowItWorks.tsx    3 pasos
  Verticals.tsx     Tabs por sector (dental/fisio destacado)
  RoiCalculator.tsx Calculadora con sliders
  Comparison.tsx    Recepcionista vs No contestar vs Atendo (tabla / tarjetas en móvil)
  ContactForm.tsx   Lista de espera con validación y envío simulado
  Footer.tsx        Enlaces, aviso RGPD
  ui/               Section, Reveal, Button, Logo
lib/
  content.ts        Todos los textos, cifras y datos de la landing
```

## Notas

- **Textos y cifras** están en `lib/content.ts`. Las estadísticas, los precios (149 €/mes) y las métricas por sector son **orientativos**: hay que validarlos o citar fuentes antes de publicar.
- **Demo de voz:** usa `speechSynthesis` del navegador con voces en español. Si no hay voz disponible o está silenciado, la transcripción avanza igual, por tiempo.
- **Formulario:** simula el envío (1,4 s) y muestra un estado de éxito. No se envía nada.
- **Textos legales** del footer: son placeholders.
