-- Ampliación aditiva. No backfill, cargos, reparto ni vencimientos automáticos.
-- Aplicar en la base oficial únicamente con autorización del administrador.
create function cronograma_cuenta_valido(items jsonb, total bigint) returns boolean
language plpgsql immutable set search_path = public as $$
declare item jsonb; suma bigint := 0; contador integer := 0; fecha date;
begin
  if coalesce(jsonb_typeof(items),'') <> 'array' or jsonb_array_length(items) not between 1 and 18 then return false; end if;
  for item in select value from jsonb_array_elements(items) loop
    contador := contador + 1;
    if coalesce(jsonb_typeof(item),'') <> 'object' or coalesce(item->>'numero','') !~ '^[0-9]+$' then return false; end if;
    if (item->>'numero')::integer <> contador or coalesce(item->>'monto_centavos','') !~ '^[0-9]+$' or (item->>'monto_centavos')::bigint <= 0 then return false; end if;
    if coalesce(item->>'concepto','') = '' or coalesce(item->>'vencimiento','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then return false; end if;
    fecha := (item->>'vencimiento')::date;
    suma := suma + (item->>'monto_centavos')::bigint;
  end loop;
  return suma = total;
exception when others then return false;
end $$;

create table condiciones_planes (
  plan_id uuid primary key references planes_pago(id) on delete restrict,
  version integer not null check (version > 0),
  moneda text not null check (moneda = 'ARS'),
  total_centavos bigint not null check (total_centavos > 0 and total_centavos <= 99999999999),
  cronograma jsonb not null,
  condiciones text not null default '',
  actor_username text not null,
  updated_at timestamptz not null default now(),
  check (cronograma_cuenta_valido(cronograma,total_centavos))
);
create table cuentas_pasajeros (
  id uuid primary key default gen_random_uuid(),
  pasajero_id uuid not null unique references pasajeros(id) on delete restrict,
  plan_id uuid not null references planes_pago(id) on delete restrict,
  contrato_id uuid not null references contratos(id) on delete restrict,
  plan_version integer not null,
  moneda text not null check (moneda = 'ARS'),
  total_centavos bigint not null check (total_centavos > 0 and total_centavos <= 99999999999),
  cronograma jsonb not null,
  condiciones text not null default '',
  actor_username text not null,
  created_at timestamptz not null default now(),
  check (cronograma_cuenta_valido(cronograma,total_centavos))
);
create index cuentas_pasajeros_plan_idx on cuentas_pasajeros(plan_id);
create index cuentas_pasajeros_contrato_idx on cuentas_pasajeros(contrato_id);
create table cuotas_pasajeros (
  id uuid primary key default gen_random_uuid(),
  cuenta_id uuid not null references cuentas_pasajeros(id) on delete restrict,
  numero integer not null check (numero between 1 and 18),
  concepto text not null check (length(btrim(concepto)) between 1 and 200),
  vencimiento date not null,
  monto_centavos bigint not null check (monto_centavos > 0 and monto_centavos <= 99999999999),
  unique(cuenta_id,numero)
);
create table imputaciones_pagos (
  id uuid primary key,
  pago_id uuid not null references pagos_manuales(id) on delete restrict,
  cuota_id uuid not null references cuotas_pasajeros(id) on delete restrict,
  monto_centavos bigint not null check (monto_centavos > 0 and monto_centavos <= 99999999999),
  actor_username text not null,
  created_at timestamptz not null default now()
);
create index imputaciones_pagos_pago_idx on imputaciones_pagos(pago_id);
create index imputaciones_pagos_cuota_idx on imputaciones_pagos(cuota_id);
create function impedir_cambio_cuenta_confirmada() returns trigger
language plpgsql set search_path = public as $$
begin raise exception 'Los importes y vencimientos confirmados se conservan como historial.'; end $$;
create trigger cuenta_confirmada_inmutable before update or delete on cuentas_pasajeros
  for each row execute function impedir_cambio_cuenta_confirmada();
create trigger cuota_confirmada_inmutable before update or delete on cuotas_pasajeros
  for each row execute function impedir_cambio_cuenta_confirmada();
create trigger imputacion_inmutable before update or delete on imputaciones_pagos
  for each row execute function impedir_cambio_cuenta_confirmada();
alter table condiciones_planes enable row level security;
alter table cuentas_pasajeros enable row level security;
alter table cuotas_pasajeros enable row level security;
alter table imputaciones_pagos enable row level security;

-- La integridad del reparto se exige también al escribir directamente en SQL.
create function validar_imputacion_pago() returns trigger
language plpgsql set search_path = public as $$
declare pago pagos_manuales%rowtype; cuota record; usado_pago bigint; usado_cuota bigint;
begin
  select * into pago from pagos_manuales where id=new.pago_id for update;
  select q.*,c.pasajero_id,c.moneda into cuota from cuotas_pasajeros q
    join cuentas_pasajeros c on c.id=q.cuenta_id where q.id=new.cuota_id for update of q;
  if pago.id is null or cuota.id is null or pago.estado <> 'confirmado' or pago.pasajero_id <> cuota.pasajero_id or pago.moneda <> cuota.moneda then
    raise exception 'El pago y la cuota no corresponden al mismo pasajero o el pago está anulado.' using errcode='23514';
  end if;
  select coalesce(sum(monto_centavos),0) into usado_pago from imputaciones_pagos where pago_id=pago.id;
  select coalesce(sum(i.monto_centavos),0) into usado_cuota from imputaciones_pagos i
    join pagos_manuales p on p.id=i.pago_id where i.cuota_id=cuota.id and p.estado='confirmado';
  if new.monto_centavos > pago.monto_centavos-usado_pago or new.monto_centavos > cuota.monto_centavos-usado_cuota then
    raise exception 'La imputación supera el pago disponible o el saldo de la cuota.' using errcode='23514';
  end if;
  return new;
end $$;
create trigger imputacion_validada before insert on imputaciones_pagos
  for each row execute function validar_imputacion_pago();
