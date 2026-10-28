-- ============================================================
-- Atendo · esquema de base de datos (Supabase / Postgres)
-- Cómo usarlo: Supabase → SQL Editor → New query → pega todo → Run.
-- Se puede ejecutar varias veces sin romper nada.
-- ============================================================

-- Clínicas (clientes de Atendo)
create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  vapi_assistant_id text unique,
  notify_emails text[] not null default '{}',
  monthly_price_eur numeric(10, 2) not null default 0,
  google_calendar_id text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Quién puede entrar al panel de cada clínica
create table if not exists public.clinic_members (
  user_id uuid not null references auth.users (id) on delete cascade,
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  primary key (user_id, clinic_id)
);

-- Llamadas atendidas por la asistente
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  vapi_call_id text unique not null,
  caller_number text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  ended_reason text,
  cost_usd numeric(10, 4),
  transcript text not null default '',
  recording_url text,
  summary jsonb,
  tipo text,
  urgencia text,
  patient_name text,
  quality jsonb,
  quality_score integer,
  handled_at timestamptz,
  handled_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index if not exists calls_clinic_created_idx on public.calls (clinic_id, created_at desc);

-- Citas reservadas por la asistente
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  vapi_call_id text,
  patient_name text not null,
  patient_phone text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  is_new_patient boolean,
  urgent boolean not null default false,
  status text not null default 'confirmada' check (status in ('confirmada', 'cancelada', 'completada', 'no_presentado')),
  calendar_event_id text,
  reminders_enabled boolean not null default true,
  reminder_sent_at timestamptz,
  reminder_channel text,
  created_at timestamptz not null default now()
);
create index if not exists appointments_starts_idx on public.appointments (starts_at) where status = 'confirmada';

-- Clínicas encontradas por el agente de ventas (datos públicos de empresas)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  place_id text unique not null,
  search_query text not null,
  name text not null,
  address text,
  phone text,
  website text,
  emails text[] not null default '{}',
  instagram text,
  facebook text,
  rating numeric(2, 1),
  reviews integer,
  maps_url text,
  pitch text,
  status text not null default 'nuevo' check (status in ('nuevo', 'contactado', 'interesado', 'piloto', 'cliente', 'descartado')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Seguridad: cada usuario solo ve los datos de sus clínicas.
-- Los agentes usan la clave de servicio, que no pasa por estas reglas.
-- ============================================================
alter table public.clinics enable row level security;
alter table public.clinic_members enable row level security;
alter table public.calls enable row level security;
alter table public.appointments enable row level security;
alter table public.leads enable row level security; -- sin políticas: solo accesible con la clave de servicio

create or replace function public.is_clinic_member(target uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from clinic_members where clinic_id = target and user_id = auth.uid());
$$;

drop policy if exists "miembros ven su clínica" on public.clinics;
create policy "miembros ven su clínica" on public.clinics
  for select using (public.is_clinic_member(id));

drop policy if exists "cada usuario ve sus membresías" on public.clinic_members;
create policy "cada usuario ve sus membresías" on public.clinic_members
  for select using (user_id = auth.uid());

drop policy if exists "miembros ven sus llamadas" on public.calls;
create policy "miembros ven sus llamadas" on public.calls
  for select using (public.is_clinic_member(clinic_id));

drop policy if exists "miembros gestionan sus llamadas" on public.calls;
create policy "miembros gestionan sus llamadas" on public.calls
  for update using (public.is_clinic_member(clinic_id)) with check (public.is_clinic_member(clinic_id));

drop policy if exists "miembros ven sus citas" on public.appointments;
create policy "miembros ven sus citas" on public.appointments
  for select using (public.is_clinic_member(clinic_id));
