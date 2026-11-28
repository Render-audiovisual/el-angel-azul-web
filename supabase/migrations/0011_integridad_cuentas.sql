-- Integridad de cuentas confirmadas. No reescribe cuentas o datos existentes.
alter table cuentas_pasajeros add column plan_nombre text;
create function validar_nueva_cuenta() returns trigger
language plpgsql set search_path = public as $$
declare pasajero pasajeros%rowtype; plan record;
begin
 select * into pasajero from pasajeros where id=new.pasajero_id for update;
 select pp.nombre,pp.contrato_id,pp.activo,pp.cuotas,cp.*,c.viaje_id,c.estado as contrato_estado
  into plan from planes_pago pp join condiciones_planes cp on cp.plan_id=pp.id
  join contratos c on c.id=pp.contrato_id where pp.id=new.plan_id for update of pp;
 if pasajero.id is null or plan.plan_id is null or not plan.activo or plan.contrato_estado <> 'activo'
   or pasajero.plan_pago_id is distinct from new.plan_id or pasajero.contrato_id is distinct from new.contrato_id
   or plan.contrato_id is distinct from new.contrato_id or plan.viaje_id is distinct from pasajero.viaje_id then
  raise exception 'La cuenta debe corresponder al plan, contrato y viaje del pasajero.' using errcode='23514',constraint='eaa_cuenta_origen';
 end if;
 if new.plan_version is distinct from plan.version or new.moneda is distinct from plan.moneda
  or new.total_centavos is distinct from plan.total_centavos or new.cronograma is distinct from plan.cronograma
  or new.condiciones is distinct from plan.condiciones or jsonb_array_length(new.cronograma) <> plan.cuotas then
  raise exception 'Las condiciones del plan cambiaron. Revisalas antes de confirmar la cuenta.' using errcode='23514',constraint='eaa_cuenta_condiciones';
 end if;
 new.plan_nombre := plan.nombre;
 return new;
end $$;
create trigger cuenta_nueva_validada before insert on cuentas_pasajeros
 for each row execute function validar_nueva_cuenta();

create function conservar_vinculos_cuenta() returns trigger
language plpgsql set search_path = public as $$
begin
 if exists(select 1 from cuentas_pasajeros where pasajero_id=old.id) then
  if tg_op='DELETE' then
   raise exception 'Este pasajero tiene una cuenta confirmada. Usá el estado Baja para conservar su historial.' using errcode='23514',constraint='eaa_cuenta_conserva_historial';
  end if;
  if new.contrato_id is distinct from old.contrato_id or new.plan_pago_id is distinct from old.plan_pago_id
   or new.viaje_id is distinct from old.viaje_id then
   raise exception 'Este pasajero tiene una cuenta confirmada. No se cambia su contrato, plan o viaje desde la ficha.' using errcode='23514',constraint='eaa_cuenta_vinculos';
  end if;
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
create trigger pasajero_cuenta_vinculos before update of contrato_id,plan_pago_id,viaje_id or delete on pasajeros
 for each row execute function conservar_vinculos_cuenta();
