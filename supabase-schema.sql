-- ============================================================
-- GASOLINA K3 — Esquema de base de datos para Supabase
-- ------------------------------------------------------------
-- Cómo usar:
--   1. Crea un proyecto en https://supabase.com
--   2. Ve a "SQL Editor" en el menú lateral
--   3. Pega TODO este script y haz clic en "Run"
--   4. En "Settings → API" copia la Project URL y la anon key
--      y pégalas en la app (pantalla de configuración inicial)
-- ============================================================

-- Tabla de tanqueos (registro de consumos de gasolina)
create table if not exists public.tanqueos (
  id text primary key,                          -- ID generado por la app
  fecha date not null,                          -- Fecha del tanqueo (YYYY-MM-DD)
  estacion text not null,                       -- Estación de servicio
  combustible text not null default 'Corriente',-- Corriente | Extra
  precio numeric not null default 0,            -- Precio por galón (COP)
  galones numeric not null default 0,           -- Galones comprados
  costo numeric not null default 0,             -- Valor pagado (COP)
  odometro numeric not null default 0,          -- Odómetro en km
  tanque_lleno smallint not null default 1,     -- 1 = parcial, 2 = lleno
  notas text default '',                        -- Notas opcionales
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabla de estaciones de servicio
create table if not exists public.estaciones (
  nombre text primary key,
  created_at timestamptz not null default now()
);

-- Índices para consultas rápidas
create index if not exists idx_tanqueos_fecha on public.tanqueos (fecha);
create index if not exists idx_tanqueos_estacion on public.tanqueos (estacion);

-- Trigger: actualiza updated_at automáticamente al editar
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tanqueos_updated on public.tanqueos;
create trigger trg_tanqueos_updated
before update on public.tanqueos
for each row execute function public.set_updated_at();

-- ============================================================
-- ACCESO PÚBLICO (sin login)
-- Permite leer y escribir a cualquier persona con el anon key.
-- Si más adelante quieres proteger tus datos, agrega
-- autenticación y cambia estas políticas por las de tu usuario.
-- ============================================================
alter table public.tanqueos enable row level security;
alter table public.estaciones enable row level security;

create policy "acceso_publico_tanqueos"
on public.tanqueos
for all
to anon, authenticated
using (true)
with check (true);

create policy "acceso_publico_estaciones"
on public.estaciones
for all
to anon, authenticated
using (true)
with check (true);
