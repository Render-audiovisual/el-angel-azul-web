// Cobros manuales: importes enteros en centavos, idempotencia y auditoría.
const db = require('./db');
const { version } = require('./admin-write');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MEDIOS = ['efectivo', 'transferencia', 'tarjeta', 'otro'];
const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const text = (value) => String(value ?? '').trim();
function validate(input) {
  const id = text(input.id), pasajeroId = text(input.pasajeroId), fecha = text(input.fecha);
  if (!UUID.test(id)) throw fail('Falta el identificador del pago. Recargá el formulario.');
  if (!pasajeroId || pasajeroId.length > 200) throw fail('Elegí un pasajero guardado.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number(fecha.slice(0,4)) < 1 || !Number.isFinite(Date.parse(fecha)) || new Date(fecha).toISOString().slice(0,10) !== fecha) throw fail('Ingresá una fecha válida.');
  const monto = text(input.monto);
  if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(monto)) throw fail('El monto debe ser positivo, con hasta dos decimales.');
  const [entero, decimal = ''] = monto.split('.');
  const centavos = Number(entero) * 100 + Number(decimal.padEnd(2,'0'));
  if (!Number.isSafeInteger(centavos) || centavos <= 0 || centavos > 99999999999) throw fail('El monto debe ser mayor a cero y menor a mil millones de pesos.');
  const medio = text(input.medio), concepto = text(input.concepto), referencia = text(input.referencia);
  if (!MEDIOS.includes(medio)) throw fail('Elegí un medio de pago válido.');
  if (!concepto || concepto.length > 200) throw fail('Escribí un concepto de hasta 200 caracteres.');
  if (referencia.length > 120) throw fail('La referencia admite hasta 120 caracteres.');
  if (input.moneda && input.moneda !== 'ARS') throw fail('El registro manual usa pesos argentinos (ARS).');
  return { id, pasajeroId, fecha, centavos, medio, concepto, referencia };
}
function rowForClient(row) {
  const result = { ...row, fecha: String(row.fecha).slice(0,10), monto_centavos: String(row.monto_centavos) };
  return { ...result, _version: version(result) };
}
const SELECT = `select pm.*, pm.fecha::text as fecha, p.legacy_id as pasajero_legacy_id, pe.nombre as pasajero_nombre,
 pe.apellido as pasajero_apellido, pe.numero_documento as pasajero_dni
 from pagos_manuales pm join pasajeros p on p.id=pm.pasajero_id join personas pe on pe.id=p.persona_id`;
async function list() {
  const { rows } = await db.getPool().query(SELECT + ' order by pm.fecha desc, pm.created_at desc, pm.id');
  return rows.map(rowForClient);
}
async function audit(client, id, action, actor, fields) {
  await client.query(`insert into eventos_administrativos (entidad,entidad_id,accion,actor_username,detalle)
    values ('pago_manual',$1,$2,$3,$4::jsonb)`, [id,action,actor,JSON.stringify({ campos: fields })]);
}
async function create(input, actor) {
  const data = validate(input);
  const client = await db.getPool().connect();
  try {
    await client.query('BEGIN');
    const passenger = await client.query('select id from pasajeros where legacy_id=$1 or id::text=$1', [data.pasajeroId]);
    if (!passenger.rows.length) throw fail('El pasajero ya no está disponible. Actualizá la lista.',404);
    const passengerId = passenger.rows[0].id;
    const inserted = await client.query(`insert into pagos_manuales (id,pasajero_id,fecha,monto_centavos,medio,concepto,referencia,actor_username)
      values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict (id) do nothing returning id`,
      [data.id,passengerId,data.fecha,String(data.centavos),data.medio,data.concepto,data.referencia,actor]);
    const row = (await client.query(SELECT+' where pm.id=$1',[data.id])).rows[0];
    if (!inserted.rows.length && (String(row.pasajero_id)!==String(passengerId) || String(row.fecha).slice(0,10)!==data.fecha || Number(row.monto_centavos)!==data.centavos || row.medio!==data.medio || row.concepto!==data.concepto || row.referencia!==data.referencia)) {
      throw fail('Ese identificador ya corresponde a otro pago. Revisá el historial antes de reintentar.',409);
    }
    if (inserted.rows.length) await audit(client,data.id,'crear',actor,['pasajero_id','fecha','monto_centavos','medio','concepto','referencia']);
    await client.query('COMMIT');
    return { pago: rowForClient(row), creado: Boolean(inserted.rows.length) };
  } catch(e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}
async function annul(id, input, actor) {
  if (!UUID.test(id)) throw fail('Pago no válido.');
  const motivo = text(input.motivo);
  if (motivo.length < 3 || motivo.length > 500) throw fail('Escribí el motivo de anulación (entre 3 y 500 caracteres).');
  const client = await db.getPool().connect();
  try {
    await client.query('BEGIN');
    const row = (await client.query(SELECT+' where pm.id=$1 for update of pm',[id])).rows[0];
    if (!row) throw fail('No encontramos ese pago.',404);
    if (row.estado==='anulado') { await client.query('COMMIT'); return rowForClient(row); }
    if (input.version !== rowForClient(row)._version) throw fail('El pago cambió en otra sesión. Actualizá el historial y revisalo.',409);
    await client.query(`update pagos_manuales set estado='anulado',anulado_por=$2,motivo_anulacion=$3 where id=$1`,[id,actor,motivo]);
    await audit(client,id,'anular',actor,['estado','anulado_por','motivo_anulacion']);
    const updated=(await client.query(SELECT+' where pm.id=$1',[id])).rows[0];
    await client.query('COMMIT');return rowForClient(updated);
  } catch(e) { await client.query('ROLLBACK');throw e; }
  finally { client.release(); }
}
module.exports={list,create,annul,validate};
