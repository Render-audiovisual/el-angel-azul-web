-- Registro manual de cobros. Aplicar en la base oficial solo con autorización.
create table pagos_manuales (
  id uuid primary key,
  pasajero_id uuid not null references pasajeros(id) on delete restrict,
  fecha date not null,
  monto_centavos bigint not null check (monto_centavos > 0 and monto_centavos <= 99999999999),
  moneda text not null default 'ARS' check (moneda = 'ARS'),
  medio text not null check (medio in ('efectivo', 'transferencia', 'tarjeta', 'otro')),
  concepto text not null check (char_length(concepto) between 1 and 200),
  referencia text not null default '' check (char_length(referencia) <= 120),
  estado text not null default 'confirmado' check (estado in ('confirmado', 'anulado')),
  actor_username text not null,
  anulado_por text,
  motivo_anulacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (estado <> 'anulado' or (anulado_por is not null and char_length(motivo_anulacion) >= 3))
);
create index pagos_manuales_pasajero_idx on pagos_manuales(pasajero_id);
create index pagos_manuales_fecha_idx on pagos_manuales(fecha desc);
create trigger trg_pagos_manuales_updated_at before update on pagos_manuales
  for each row execute function set_updated_at();
alter table pagos_manuales enable row level security;
