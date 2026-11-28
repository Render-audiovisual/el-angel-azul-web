const crypto = require('node:crypto');
const db = require('./db');
const { version } = require('./admin-write');
const validation = require('./document-validation');
let objects = require('./private-objects');
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const TYPES = ['dni_frente', 'dni_dorso', 'ficha_medica', 'autorizacion', 'comprobante_pago', 'otro'];
const FIELDS = 'd.id,d.tipo_documento,d.nombre_original,d.mime_type,d.tamano_bytes,d.estado,d.observaciones,d.visible_familia,d.uploaded_at::text,d.updated_at::text,d.contrato_id,d.pasajero_id';
const KEYS = ['id','tipo_documento','nombre_original','mime_type','tamano_bytes','estado','observaciones','visible_familia','uploaded_at','updated_at','contrato_id','pasajero_id'];
const pick = row => Object.fromEntries(KEYS.map(key => [key,row[key]]));
const dto = row => { const value=pick(row);return {...value,_version:version(value)}; };
const publicDto = row => Object.fromEntries(['id','tipo_documento','nombre_original','mime_type','tamano_bytes','estado','observaciones','uploaded_at'].map(key => [key,row[key]]));
async function ready() {
  const row = (await db.getPool().query("select public from storage.buckets where id='documentos'")).rows[0];
  if (!objects.configured() || !row || row.public !== false) throw fail('El almacenamiento privado de documentos todavía no está habilitado. Consultá con el administrador.', 503);
}
async function target(type, id, identity, client = db.getPool(), lock = false) {
  if (!['contratos','pasajeros'].includes(type) || typeof id !== 'string') throw fail('Recurso no encontrado.', 404);
  if (identity && type !== 'pasajeros') throw fail('Recurso no encontrado.', 404);
  const params = [id];
  let scope = '';
  if (identity) {
    params.push(identity.responsable_id || identity.persona_id);
    scope = identity.responsable_id ? ' and exists(select 1 from pasajero_responsables pr where pr.pasajero_id=t.id and pr.responsable_id=$2)' : ' and t.persona_id=$2';
  }
  const row = (await client.query(`select t.id${type === 'pasajeros' ? ',t.contrato_id' : ''} from ${type} t where (t.id::text=$1 or t.legacy_id=$1)${scope}${lock ? ' for share of t' : ''}`, params)).rows[0];
  if (!row) throw fail('Recurso no encontrado.', 404);
  return row;
}
const scope = (row, identity) => identity ? ['((d.pasajero_id=$1 and d.visible_familia) or (d.contrato_id=$2 and d.visible_familia and d.estado=\'aprobado\'))', [row.id, row.contrato_id]] : [row.contrato_id === undefined ? 'd.contrato_id=$1' : 'd.pasajero_id=$1', [row.id]];
async function list(type, id, { identity, antes } = {}) {
  const row = await target(type, id, identity);
  // El tipo explícito evita confundir un PAX sin contrato con un contrato.
  const [where, params] = identity ? scope(row, identity) : [type === 'contratos' ? 'd.contrato_id=$1' : 'd.pasajero_id=$1', [row.id]];
  let cursor = '';
  if (antes) {
    if (!UUID.test(antes)) throw fail('La página de documentos no es válida.');
    params.push(antes);
    cursor = ` and (d.uploaded_at,d.id)<(select d.uploaded_at,d.id from documentos d where ${where} and d.id=$${params.length})`;
  }
  const rows = (await db.getPool().query(`select ${FIELDS} from documentos d where ${where} and d.nombre_original is not null${cursor} order by d.uploaded_at desc,d.id desc limit 51`,params)).rows;
  const more = rows.length > 50;
  if (more) rows.pop();
  return { documentos: rows.map(identity ? publicDto : dto), siguiente: more ? rows.at(-1).id : null, almacenamientoDisponible: objects.configured() && (await db.getPool().query("select public from storage.buckets where id='documentos'")).rows[0]?.public === false };
}
async function existing(id, client = db.getPool(), lock = false) {
  if (typeof id !== 'string' || !UUID.test(id)) throw fail('Recurso no encontrado.', 404);
  return (await client.query(`select ${FIELDS},d.storage_path,d.sha256,d.uploaded_actor from documentos d where d.id=$1 and d.nombre_original is not null${lock ? ' for update of d' : ''}`,[id])).rows[0];
}
const matches = (row, owner, type, data, actor) => row && row[type === 'contratos' ? 'contrato_id' : 'pasajero_id'] === owner.id && row.sha256 === data.hash && row.nombre_original === data.nombre && row.mime_type === data.mime && row.tipo_documento === data.tipo && row.uploaded_actor === actor;
async function cleanup(path) { try { await objects.remove(path); } catch (_) { console.error('Documento privado: quedó un objeto sin confirmar; requiere conciliación de almacenamiento.'); } }
async function upload(type, id, input, actor, identity) {
  if (typeof input.id !== 'string' || !UUID.test(input.id) || (type === 'contratos' ? input.tipo !== 'contrato_firmado' || input.mime !== 'application/pdf' : !TYPES.includes(input.tipo))) throw fail('Elegí el tipo de documento y un archivo compatible.');
  const owner = await target(type, id, identity);
  await ready();
  const data = { ...await validation.validate(input), tipo: input.tipo };
  const previous = await existing(input.id);
  if (previous) {
    if (!matches(previous,owner,type,data,actor)) throw fail('Este envío ya se utilizó con otro archivo o destinatario. Volvé a consultar los documentos.',409);
    return { creado: false, documento: identity ? publicDto(previous) : dto(previous) };
  }
  const path = `privados/${input.id.toLowerCase()}/${crypto.randomUUID()}.${data.extension}`;
  try { await objects.put(path,data.bytes,data.mime); }
  catch(error) { await cleanup(path); throw error; }
  let commitAttempted = false, inserted = false;
  let client;
  try {
    client = await db.getPool().connect();
    await client.query('BEGIN');
    await target(type,id,identity,client,true);
    const result = await client.query(`insert into documentos(id,entidad_tipo,entidad_id,tipo_documento,storage_bucket,storage_path,contrato_id,pasajero_id,nombre_original,mime_type,tamano_bytes,sha256,uploaded_actor,visible_familia)
      values($1,$2,$3,$4,'documentos',$5,$6,$7,$8,$9,$10,$11,$12,$13) on conflict(id) do nothing returning id`,[input.id,type === 'contratos' ? 'contrato' : 'pasajero',owner.id,input.tipo,path,type === 'contratos' ? owner.id : null,type === 'pasajeros' ? owner.id : null,data.nombre,data.mime,data.bytes.length,data.hash,actor,!!identity]);
    inserted = !!result.rows.length;
    const saved = await existing(input.id,client);
    if (!matches(saved,owner,type,data,actor)) throw fail('Este envío ya se utilizó con otro archivo o destinatario. Volvé a consultar los documentos.',409);
    if (inserted) await client.query("insert into eventos_administrativos(entidad,entidad_id,accion,actor_username,detalle) values('documento',$1,'adjuntar',$2,$3::jsonb)",[saved.id,actor,JSON.stringify({tipo:input.tipo,tamano:data.bytes.length,sha256:data.hash})]);
    commitAttempted = true;
    await client.query('COMMIT');
    if (!inserted) await cleanup(path);
    return { creado: inserted, documento: identity ? publicDto(saved) : dto(saved) };
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    // Un COMMIT sin respuesta puede estar confirmado: nunca se elimina el
    // objeto en ese caso. El mismo id permite consultar/reintentar sin duplicar.
    if (!commitAttempted) await cleanup(path);
    throw error;
  } finally { client?.release(); }
}
async function review(id,input,actor) {
  if (!['pendiente','aprobado','rechazado'].includes(input.estado) || typeof input.visibleFamilia !== 'boolean' || typeof input.observaciones !== 'string' || input.observaciones.length > 2000 || (input.estado === 'rechazado' && input.observaciones.trim().length < 3)) throw fail('Indicá el estado y, si rechazás el archivo, explicá qué debe corregirse.');
  const client = await db.getPool().connect();
  try {
    await client.query('BEGIN');
    const row = await existing(id,client,true);
    if (!row) throw fail('Recurso no encontrado.',404);
    const current = pick(row);
    if (input.version !== version(current)) throw fail('El documento cambió en otra sesión. Volvé a consultarlo.',409);
    await client.query('update documentos set estado=$2,visible_familia=$3,observaciones=$4 where id=$1',[id,input.estado,input.visibleFamilia,input.observaciones.trim()]);
    await client.query("insert into eventos_administrativos(entidad,entidad_id,accion,actor_username,detalle) values('documento',$1,'revisar',$2,$3::jsonb)",[id,actor,JSON.stringify({estado_anterior:row.estado,estado:input.estado,visible_anterior:row.visible_familia,visible_familia:input.visibleFamilia,mensaje:input.observaciones.trim()})]);
    const saved = await existing(id,client);
    await client.query('COMMIT');
    return dto(saved);
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
async function download(id, { identity, pasajeroId, actor } = {}) {
  const doc = await existing(id);
  if (!doc) throw fail('Recurso no encontrado.',404);
  if (identity) {
    const owner = await target('pasajeros',pasajeroId,identity);
    if (!doc.visible_familia || !(doc.pasajero_id === owner.id || (doc.contrato_id && doc.contrato_id === owner.contrato_id && doc.estado === 'aprobado'))) throw fail('Recurso no encontrado.',404);
  }
  await ready();
  const bytes = await objects.get(doc.storage_path);
  if (bytes.length !== doc.tamano_bytes || crypto.createHash('sha256').update(bytes).digest('hex') !== doc.sha256) throw fail('No pudimos verificar el archivo privado. Consultá con la agencia.',502);
  await db.getPool().query("insert into eventos_administrativos(entidad,entidad_id,accion,actor_username) values('documento',$1,'descargar',$2)",[doc.id,actor || (identity ? `portal:${identity.id}` : 'administracion')]);
  return { bytes, nombre:doc.nombre_original, mime:doc.mime_type };
}
module.exports = { list,upload,review,download,TYPES,__test:{setStorage(adapter){if(process.env.NODE_ENV!=='test')throw Error('Solo pruebas locales');objects=adapter;}} };
