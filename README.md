# Atendo

> *Tus manos, ocupadas. Tu teléfono, atendido.*

Recepcionista telefónica con IA 24/7 para clínicas (y después estética, hostelería y talleres). El proyecto incluye:

- **Web comercial** (landing) en `/`.
- **Lucía**, la asistente de voz (Vapi + Claude), que contesta, reserva citas y resuelve dudas.
- **Agentes** que trabajan después de cada llamada: resumen, avisos, costes, calidad, agenda, recordatorios y ventas.
- **Panel web** para las clínicas en `/panel`.

## Arrancar

```bash
npm install
cp .env.example .env.local   # y rellena las claves (guía: docs/CLAVES.md)
npm run dev                  # http://localhost:3000  ·  panel: /panel
npm run status               # qué servicios están conectados
```

Sin claves todo funciona en **modo demostración**: la web, el panel con datos de ejemplo y los agentes (que se saltan lo que no esté conectado).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run status` | Muestra los servicios conectados y lo que falta |
| `npm run agent:sync` | Crea o actualiza a Lucía en Vapi (guion, voz, agenda, webhook) |
| `npm run agent:test-call` | Pasa una llamada simulada por todos los agentes |
| `npm run telegram:setup` | Conecta tu Telegram y activa las órdenes `/buscar` y `/estado` |
| `npm run sheets:setup` | Prepara la hoja de Google (Llamadas, Clientes, Resumen, Ventas) |
| `npm run ventas -- 30 "clínicas dentales en Valencia"` | Agente de ventas desde la terminal |
| `npm run panel:usuario -- email@clinica.com` | Da acceso al panel a alguien de la clínica |
| `npm run build` / `npm run lint` | Build de producción / comprobación de tipos |

## Cómo funciona

```
Llamada ─► Lucía (Vapi) ──durante la llamada──► /api/vapi/tools ─► Agenda (Google Calendar)
                │
                └──al colgar──► /api/vapi/webhook ─► Orquestador (lib/agents/index.ts)
                                                     ├─ Guardar llamada        (Supabase)
                                                     ├─ Resumen                (Claude)
                                                     ├─ Aviso a ti             (Telegram)
                                                     ├─ Aviso a la clínica     (email + panel)
                                                     ├─ Costes                 (Google Sheets)
                                                     └─ Calidad                (Claude → alerta si hay errores)

Cada mañana ─► /api/cron/reminders ─► Recordatorios (WhatsApp → SMS → llamada)
Tú en Telegram: /buscar 30 clínicas dentales en Valencia ─► Agente de ventas (Google Places + Claude)
```

Cada servicio externo es opcional: si falta su clave, ese paso se salta sin romper los demás (`lib/integrations.ts`).

## Estructura

```
agent/                 Lucía y scripts de terminal
  clinic.ts            Datos y horario de la clínica
  prompt.ts            Guion de Lucía (con o sin agenda)
  assistant.ts         Configuración de Vapi (modelo, voz, herramientas)
  sync.ts, status.ts, test-call.ts, telegram-setup.ts, sheets-setup.ts, ventas.ts, panel-user.ts
app/
  page.tsx             Landing
  panel/               Panel de la clínica (login, lista, detalle de llamada)
  api/vapi/webhook     Fin de llamada → agentes
  api/vapi/tools       Herramientas de agenda durante la llamada
  api/telegram/webhook Órdenes por Telegram
  api/cron/reminders   Recordatorios diarios
lib/
  agents/              summary, quality, costs, agenda, reminders, sales + orquestador
  scheduling/          "Enchufe" del programa de agenda (Google Calendar; ampliable a Gesden, etc.)
  notify/              Telegram, email, SMS, WhatsApp, llamada saliente
  db/                  Supabase (tipos, consultas, sesión)
  panel/               Datos del panel y modo demostración
  integrations.ts      Registro de servicios y sus claves
  time.ts              Fechas en hora de España (con cambio de horario)
supabase/schema.sql    Tablas y reglas de seguridad
docs/CLAVES.md         Guía para conectar cada servicio
```

## Notas

- **Landing:** los textos y cifras están en `lib/content.ts`. Las estadísticas, los precios (149 €/mes) y las métricas son **orientativos**. El formulario de contacto simula el envío. Los textos legales del footer son provisionales.
- **Ley de IA de la UE:** Lucía se presenta como asistente virtual. No lo quites.
- **RGPD:** los resúmenes contienen datos de salud. Usa Supabase en la región UE (Frankfurt) y firma acuerdos de encargado del tratamiento con las clínicas y los proveedores.
- **Ventas:** la LSSI prohíbe enviar emails comerciales sin consentimiento, también a empresas. Usa las listas para llamar o visitar.
