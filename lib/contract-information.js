const db = require('./db');
const portal = require('./passenger-portal');
const TYPES = require('./documents').TYPES;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const fail = (message,statusCode=400) => Object.assign(Error(message),{statusCode});
async function contract(client,id,lock=false) {
  const row = (await client.query('select id from contratos where id::text=$1 or legacy_id=$1'+(lock?' for update':''),[id])).rows[0];
  if (!row) throw fail('Contrato no encontrado.',404);
  return row.id;
}
const dto = row => row ? {revision:row.revision,requisitos:row.requisitos,avisos:row.avisos} : {revision:0,requisitos:[],avisos:[]};
async function read(id,client=db.getPool()) {
  const key=await contract(client,id);
  return dto((await client.query('select * from contratos_informacion where contrato_id=$1',[key])).rows[0]);
}
function validate(input) {
  if (!Number.isInteger(input.revision)||input.revision<0 || !Array.isArray(input.requisitos) || input.requisitos.length>6 || input.requisitos.some(type=>!TYPES.includes(type)) || new Set(input.requisitos).size!==input.requisitos.length) throw fail('Revisá los requisitos documentales del contrato.');
  if (!Array.isArray(input.avisos)||input.avisos.length>20) throw fail('El contrato admite hasta 20 avisos.');
  const ids = new Set();
  const avisos = input.avisos.map(row=>{
    if (!row || typeof row!=='object' || !UUID.test(row.id) || ids.has(row.id) || typeof row.publicado!=='boolean') throw fail('Revisá los avisos del contrato.');
    ids.add(row.id);
    const titulo=String(row.titulo||'').trim(),texto=String(row.texto||'').trim();
    if (!titulo||titulo.length>150||!texto||texto.length>5000) throw fail('Cada aviso necesita un título de hasta 150 caracteres y un texto de hasta 5.000.');
    return {id:row.id,titulo,texto,publicado:row.publicado};
  });
  return {requisitos:[...input.requisitos],avisos};
}
async function save(id,input,actor) {
  const data=validate(input),client=await db.getPool().connect();
  try {
    await client.query('BEGIN');const key=await contract(client,id,true);
    const previous=await read(key,client);
    if(input.revision!==previous.revision) throw fail('La información cambió en otra sesión. Conservamos tu edición: volvé a consultar y compará antes de guardar.',409);
    if(previous.avisos.some(old=>!data.avisos.some(row=>row.id===old.id))) throw fail('Los avisos guardados se conservan en el historial. Quitá su publicación para ocultarlos.',409);
    const revision=previous.revision+1;
    await client.query('insert into contratos_informacion(contrato_id,revision,requisitos,avisos,actor_username) values($1,$2,$3,$4::jsonb,$5) on conflict(contrato_id) do update set revision=excluded.revision,requisitos=excluded.requisitos,avisos=excluded.avisos,actor_username=excluded.actor_username,updated_at=now()',[key,revision,data.requisitos,JSON.stringify(data.avisos),actor]);
    await client.query("insert into eventos_administrativos(entidad,entidad_id,accion,actor_username,detalle) values('contrato_informacion',$1,'guardar',$2,$3::jsonb)",[key,actor,JSON.stringify({antes:previous,despues:{revision,...data}})]);
    await client.query('COMMIT');return {revision,...data};
  } catch(error) { await client.query('ROLLBACK');throw error; } finally {client.release();}
}
async function passenger(id,identity) {
  if(identity)await portal.owns(identity,id);
  const pool=db.getPool(),pax=(await pool.query('select id,contrato_id from pasajeros where id::text=$1 or legacy_id=$1',[id])).rows[0];
  if(!pax)throw fail('Pasajero no encontrado.',404);
  const info=pax.contrato_id?await read(pax.contrato_id):dto(null);
  const documents=(await pool.query("select tipo_documento,estado from documentos where pasajero_id=$1 and nombre_original is not null"+(identity?' and visible_familia':''),[pax.id])).rows;
  const requisitos=info.requisitos.map(tipo=>{const rows=documents.filter(doc=>doc.tipo_documento===tipo);return {tipo,estado:rows.some(doc=>doc.estado==='aprobado')?'aprobado':rows.some(doc=>doc.estado==='pendiente')?'pendiente':rows.length?'rechazado':'faltante'};});
  return {requisitos,avisos:info.avisos.filter(row=>row.publicado).map(({id,titulo,texto})=>({id,titulo,texto}))};
}
module.exports={read,save,passenger,validate};
