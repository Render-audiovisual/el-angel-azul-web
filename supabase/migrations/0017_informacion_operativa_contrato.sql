-- Sin requisitos ni avisos predeterminados; cada contrato los configura explícitamente.
create table contratos_informacion (
 contrato_id uuid primary key references contratos(id) on delete restrict,
 revision integer not null check(revision > 0),
 requisitos text[] not null default '{}',
 avisos jsonb not null default '[]',
 actor_username text not null,
 updated_at timestamptz not null default now(),
 check(cardinality(requisitos)<=6 and requisitos <@ array['dni_frente','dni_dorso','ficha_medica','autorizacion','comprobante_pago','otro']::text[]),
 check(jsonb_typeof(avisos)='array' and jsonb_array_length(avisos)<=20)
);
alter table contratos_informacion enable row level security;
comment on table contratos_informacion is 'Requisitos y avisos configurados por el operador, sin efectos financieros ni aceptación jurídica automática';
