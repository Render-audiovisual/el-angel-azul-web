const crypto = require('node:crypto');
const db = require('./db');
const { version } = require('./admin-write');
const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const SELECT = `select c.id,c.legacy_id,c.codigo_contrato,c.estado,c.inscripcion_codigo::text,c.inscripcion_abierta,
 c.updated_at::text,g.estado as grupo_estado,co.activo as colegio_activo
 from contratos c join grupos g on g.id=c.grupo_id join colegios co on co.id=g.colegio_id`;
const dto = row => ({ ...row, enlace: '/#/inscripcion?contrato=' + row.inscripcion_codigo, _version: version(row) });
async function get(id, client = db.getPool(), lock = false) {
  const row = (await client.query(SELECT + ' where c.id::text=$1 or c.legacy_id=$1' + (lock ? ' for update of c' : ''), [id])).rows[0];
  if (!row) throw fail('No encontramos ese contrato.', 404);
  return row;
}
async function configure(id, input, actor) {
  if (typeof input.abierta !== 'boolean' || (input.rotar !== undefined && typeof input.rotar !== 'boolean')) throw fail('Indicá si la inscripción está abierta.');
  const client = await db.getPool().connect();
  try {
    await client.query('BEGIN');
    const row = await get(id, client, true);
    if (version(row) !== input.version) throw fail('El contrato cambió en otra sesión. Volvé a consultarlo.', 409);
    if (input.abierta && (row.estado !== 'activo' || row.grupo_estado !== 'activo' || !row.colegio_activo)) throw fail('Para abrir la inscripción, el contrato, el grupo y el colegio deben estar activos.');
    await client.query('update contratos set inscripcion_abierta=$2,inscripcion_codigo=$3 where id=$1', [row.id, input.abierta, input.rotar ? crypto.randomUUID() : row.inscripcion_codigo]);
    await client.query("insert into eventos_administrativos(entidad,entidad_id,accion,actor_username,detalle) values('enlace_inscripcion',$1,'configurar',$2,$3::jsonb)", [row.id, actor, JSON.stringify({ abierta: input.abierta, enlace_renovado: !!input.rotar })]);
    const saved = dto(await get(row.id, client));
    await client.query('COMMIT');
    return saved;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
module.exports = { get: async id => dto(await get(id)), configure };
