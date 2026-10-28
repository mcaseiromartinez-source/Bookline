# Conectar los servicios de Atendo

Todo el código está listo. Cada función se activa sola en cuanto pegas su clave en `.env.local`. Lo que no tenga clave se salta sin romper nada.

Para comprobar en cualquier momento qué tienes conectado:

```bash
npm run status
```

> **Nunca pegues claves en un chat, un email o en GitHub.** Solo en `.env.local` (tu ordenador) y en las variables de Vercel (servidor).

Orden recomendado: cada paso desbloquea el siguiente.

---

## 1. Anthropic: el cerebro de los agentes · *imprescindible*

**Para qué:** resumen de llamadas, revisión de calidad y mensajes del agente de ventas.
**Coste:** pago por uso. Con Claude Haiku, cada llamada cuesta fracciones de céntimo. Con 5 € tienes para empezar.

1. Crea una cuenta en https://console.anthropic.com y añade saldo en **Billing**.
2. Ve a **API Keys** → **Create Key**.
3. Pégala en `ANTHROPIC_API_KEY=`.

## 2. Telegram: tus avisos · *imprescindible*

**Para qué:** recibir en el móvil los resúmenes, las alertas de calidad y las listas de ventas, y darle órdenes al agente de ventas.
**Coste:** gratis.

1. En Telegram, busca **@BotFather** y escríbele `/newbot`. Elige un nombre, por ejemplo "Atendo Avisos".
2. Copia el **token** que te da y pégalo en `TELEGRAM_BOT_TOKEN=`.
3. Abre tu bot y **envíale "hola"**.
4. Ejecuta `npm run telegram:setup`. Rellena `TELEGRAM_CHAT_ID` y te envía un mensaje de prueba.
5. Comprueba que todo funciona con `npm run agent:test-call`: procesa una llamada simulada y te llega el resumen.

## 3. Supabase: base de datos y panel de las clínicas

**Para qué:** guardar llamadas, citas y clínicas, y el panel web `/panel` con inicio de sesión. Sin Supabase, el panel funciona en modo demostración.
**Coste:** gratis hasta 500 MB.

1. Crea un proyecto en https://supabase.com. **Elige la región "Frankfurt (eu-central-1)"**: los datos de pacientes deben quedarse en la UE.
2. Ve a **SQL Editor** → **New query**, pega el contenido de `supabase/schema.sql` y pulsa **Run**.
3. Ve a **Project Settings** → **API** y copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL=`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY=` ⚠️ Es la llave maestra: nunca la compartas.
4. Da acceso a la recepción de una clínica con `npm run panel:usuario -- recepcion@clinica.com`. Te muestra una contraseña temporal.

## 4. Vercel: publicar la web y los agentes en internet

**Para qué:** que Vapi pueda avisar a los agentes en las llamadas reales, que Lucía pueda reservar en la agenda, el panel online y la tarea diaria de recordatorios.
**Coste:** gratis (plan Hobby).

1. Crea una cuenta en https://vercel.com **con tu GitHub**.
2. **Add New** → **Project** → importa el repositorio `Bookline` → **Deploy**.
3. Copia la URL que te da (por ejemplo `https://bookline-xxx.vercel.app`) y pégala en `PUBLIC_BASE_URL=`.
4. Inventa una contraseña larga y pégala en `CRON_SECRET=`.
5. Ejecuta `npm run agent:sync` (genera `VAPI_WEBHOOK_SECRET` y conecta Lucía al servidor) y `npm run telegram:setup` (activa las órdenes `/buscar` y genera `TELEGRAM_WEBHOOK_SECRET`).
6. En Vercel, ve a **Settings** → **Environment Variables** y **copia ahí todas las variables** de tu `.env.local` que tengan valor.
7. **Deployments** → los tres puntos del último despliegue → **Redeploy**.

## 5. Google: hoja de costes y agenda (una sola cuenta de servicio)

**Coste:** gratis.

**Cuenta de servicio** (un "usuario robot" de Google):
1. Entra en https://console.cloud.google.com, crea un proyecto llamado "Atendo".
2. En **APIs y servicios** → **Biblioteca**, activa **Google Sheets API** y **Google Calendar API**.
3. En **IAM y administración** → **Cuentas de servicio** → **Crear**. Ponle de nombre "atendo".
4. Entra en ella → **Claves** → **Agregar clave** → **JSON**. Se descarga un archivo.
5. Del archivo, copia:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL=`
   - `private_key` → `GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`. Va en una sola línea, entre comillas, tal como viene en el archivo.
6. Guarda el archivo JSON en un sitio seguro **fuera de esta carpeta**.

**Hoja de costes:**
1. Crea una hoja nueva en Google Sheets.
2. **Compartir** → pega el email de la cuenta de servicio → **Editor**.
3. Copia el id de la URL (lo que va entre `/d/` y `/edit`) en `GOOGLE_SHEETS_ID=`.
4. Ejecuta `npm run sheets:setup`. Crea las pestañas *Llamadas*, *Clientes*, *Resumen* y *Ventas*.
5. Rellena la pestaña **Clientes** con cada clínica y lo que paga al mes. *Resumen* calculará el margen solo.

**Agenda (para que Lucía reserve citas):**
1. En Google Calendar, crea un calendario para la clínica (o usa el suyo).
2. **Configuración y uso compartido** → **Compartir con determinadas personas** → pega el email de la cuenta de servicio → **Hacer cambios en eventos**.
3. En **Integrar el calendario**, copia el **ID del calendario** en `GOOGLE_CALENDAR_ID=`.
4. Ejecuta `npm run agent:sync`. Ahora Lucía consulta huecos y reserva durante la llamada.

## 6. Google Places: agente de ventas

**Coste:** Google da un uso mensual gratuito. Cada búsqueda de 20 resultados cuesta unos céntimos fuera de ese margen.

1. En el mismo proyecto de Google Cloud, activa **Places API (New)**.
2. **Credenciales** → **Crear credenciales** → **Clave de API**. Restríngela a "Places API (New)".
3. Pégala en `GOOGLE_PLACES_API_KEY=`.
4. Pruébalo con `npm run ventas -- 30 "clínicas dentales en Valencia"`, o escribe a tu bot `/buscar 30 clínicas dentales en Valencia`.

> ⚖️ La ley española (LSSI) prohíbe enviar emails comerciales sin consentimiento previo, también a empresas. Usa la lista para **llamar o visitar**.

## 7. Resend: emails a las clínicas

**Coste:** gratis hasta 3.000 emails al mes.

1. Crea una cuenta en https://resend.com.
2. **Domains** → añade tu dominio (por ejemplo `atendo.es`) y sigue los pasos de DNS. Hace falta tener un dominio.
3. **API Keys** → crea una y pégala en `RESEND_API_KEY=`.
4. `EMAIL_FROM=Atendo <avisos@tudominio.es>`.
5. Los destinatarios de cada clínica se añaden solos con `npm run panel:usuario`. También puedes ponerlos en `CLINIC_NOTIFY_EMAILS=`.

## 8. Recordatorios a pacientes (elige uno o varios)

Se envían cada día a las 9:00 (hora de España en invierno) para las citas del día siguiente. Prueba los canales en el orden de `REMINDER_CHANNELS`.

**SMS con Twilio** (lo más rápido de activar):
1. Crea una cuenta en https://twilio.com y compra un número que pueda enviar SMS.
2. Copia **Account SID**, **Auth Token** y el número en `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_FROM_NUMBER` (con formato `+34…`).

**WhatsApp Business** (lo que más se lee, pero tarda días en aprobarse):
1. En https://business.facebook.com, crea una app de WhatsApp Business y verifica la empresa.
2. Crea una plantilla de tipo "Utilidad" con 3 variables, por ejemplo: *"Hola {{1}}, te recordamos tu cita en {{2}} el {{3}}. Si no puedes venir, llámanos."*
3. Cuando Meta la apruebe, rellena `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_REMINDER_TEMPLATE` (el nombre de la plantilla).

**Llamada de Lucía:**
1. Compra o importa un número en Vapi (**Phone Numbers**) y copia su id en `VAPI_PHONE_NUMBER_ID=`.

> ⚖️ La clínica debe informar a sus pacientes de que recibirán recordatorios. Lucía lo dice al reservar.

---

## Resumen de costes para empezar

| Servicio | Coste inicial |
|---|---|
| Anthropic | 5 € de saldo |
| Telegram, Supabase, Vercel, Google Sheets/Calendar, Resend | Gratis |
| Google Places | Gratis dentro del uso mensual incluido |
| Vapi | Crédito gratuito, después ~0,10–0,15 €/min |
| Twilio / WhatsApp | Céntimos por mensaje |

*Precios orientativos. Confírmalos en cada web antes de usarlo con clientes.*
