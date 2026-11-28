// Organización académica y operativa; no cambia contratos ni importes.
const crypto=require('node:crypto');const db=require('./db');const {version}=require('./admin-write');
const fail=(message,statusCode=400)=>Object.assign(new Error(message),{statusCode});
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const nullableId=(value,label)=>{if(value===null||value===undefined||value==='')return null;if(typeof value!=='string'||!UUID.test(value))throw fail(label+' no válido.');return value.toLowerCase();};
const dated=key=>{if(key===undefined)return undefined;if(key===null||key==='')return null;if(typeof key!=='string')throw fail('Ingresá fechas válidas.');const value=key;if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number(value.slice(0,4))<1||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw fail('Ingresá fechas válidas.');return value;};
const dto=row=>({...row,_version:version(row)});
async function transaction(run,readOnly=false){const client=await db.getPool().connect();try{await client.query(readOnly?'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY':'BEGIN');const result=await run(client);await client.query('COMMIT');return result;}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}
async function audit(client,entity,id,action,actor,details={}){await client.query('insert into eventos_administrativos(entidad,entidad_id,accion,actor_username,detalle) values($1,$2,$3,$4,$5::jsonb)',[entity,id,action,actor,JSON.stringify(details)]);}
const selects={
 promociones:'select id,colegio_id,nivel,anio_egreso,nombre,activo,observaciones,updated_at::text from promociones',
 contingentes:'select id,viaje_id,nombre,fecha_salida::text,fecha_regreso::text,activo,observaciones,updated_at::text from contingentes'
};
async function group(client,id,lock=false){
 const row=(await client.query('select g.id,g.legacy_id,g.viaje_id,g.colegio_id,g.curso,g.division,g.estado,g.promocion_id,g.updated_at::text,v.nivel from grupos g join viajes v on v.id=g.viaje_id where g.id::text=$1 or g.legacy_id=$1'+(lock?' for update of g':''),[id])).rows[0];
 if(!row)throw fail('No encontramos ese grupo.',404);row.contingentes=(await client.query('select contingente_id from contingente_grupos where grupo_id=$1 order by contingente_id',[row.id])).rows.map(row=>row.contingente_id);return row;
}
async function metadata(){
 return transaction(async pool=>{
 const [schools,trips,promotions,departures,groups,links,people]=await Promise.all([
  pool.query('select id,nombre,provincia,localidad,activo from colegios order by nombre'),pool.query("select id,nivel,destino,titulo,anio from viajes where categoria in ('estudiantil','mixto') order by titulo"),pool.query(selects.promociones+' order by anio_egreso desc,nombre'),pool.query(selects.contingentes+' order by fecha_salida desc nulls last,nombre'),
  pool.query('select g.id,g.legacy_id,g.viaje_id,g.colegio_id,g.curso,g.division,g.estado,g.promocion_id,g.updated_at::text,v.nivel from grupos g join viajes v on v.id=g.viaje_id order by g.curso,g.division'),pool.query('select * from contingente_grupos order by contingente_id'),
  pool.query('select p.id,p.legacy_id,p.viaje_id,p.grupo_id,p.contingente_id,p.estado,p.updated_at::text,pe.nombre,pe.apellido from pasajeros p join personas pe on pe.id=p.persona_id order by pe.apellido,pe.nombre')
 ]);
 return {colegios:schools.rows,viajes:trips.rows,promociones:promotions.rows.map(dto),contingentes:departures.rows.map(dto),grupos:groups.rows.map(row=>dto({...row,contingentes:links.rows.filter(link=>link.grupo_id===row.id).map(link=>link.contingente_id)})),pasajeros:people.rows.map(dto)};
 },true);
}
async function save(type,input,actor){
 if(!selects[type])throw fail('Tipo de registro no válido.');
 const candidate=input.id===undefined||input.id===null?crypto.randomUUID():input.id;if(typeof candidate!=='string'||!UUID.test(candidate))throw fail('Identificador no válido.');const id=candidate.toLowerCase();
 if(typeof input.nombre!=='string'||(input.observaciones!==undefined&&input.observaciones!==null&&typeof input.observaciones!=='string'))throw fail('Ingresá el nombre y las notas como texto.');
 const name=input.nombre.trim().normalize('NFC'),notes=input.observaciones===undefined?undefined:input.observaciones===null?'':input.observaciones.trim();if(name.length<2||name.length>150||(notes?.length||0)>5000)throw fail('Completá un nombre de 2 a 150 caracteres y notas de hasta 5.000.');
 if(typeof input.activo!=='boolean')throw fail('Indicá si el registro está activo.');
 let data;
 if(type==='promociones'){
  if(typeof input.colegioId!=='string'||!UUID.test(input.colegioId)||!['Primaria','Secundaria'].includes(input.nivel)||!Number.isInteger(input.anioEgreso)||input.anioEgreso<1900||input.anioEgreso>9999)throw fail('Elegí colegio, nivel y un año de egreso válido.');
  input={...input,colegioId:input.colegioId.toLowerCase()};
  data=[input.colegioId,input.nivel,input.anioEgreso,name,input.activo,notes];
 }else{
  if(typeof input.viajeId!=='string'||!UUID.test(input.viajeId))throw fail('Elegí un viaje estudiantil.');input={...input,viajeId:input.viajeId.toLowerCase()};const from=dated(input.fechaSalida),to=dated(input.fechaRegreso);if(from&&to&&to<from)throw fail('El regreso debe ser igual o posterior a la salida.');
  data=[input.viajeId,name,from,to,input.activo,notes];
 }
 return transaction(async client=>{
  const old=(await client.query(selects[type]+' where id=$1 for update',[id])).rows[0];
  if((input.version??null)!==(old?version(old):null))throw fail('El registro cambió en otra sesión. Volvé a consultarlo.',409);
  data[data.length-1]=notes===undefined?(old?.observaciones||''):notes;
  if(type==='contingentes'){data[2]=data[2]===undefined?(old?.fecha_salida||null):data[2];data[3]=data[3]===undefined?(old?.fecha_regreso||null):data[3];if(data[2]&&data[3]&&data[3]<data[2])throw fail('El regreso debe ser igual o posterior a la salida.');}
  if(type==='contingentes'&&!(await client.query("select 1 from viajes where id=$1 and categoria in ('estudiantil','mixto')",[input.viajeId])).rows.length)throw fail('El viaje no corresponde al área estudiantil.');
  if(type==='promociones'){
   if(!(await client.query('select 1 from colegios where id=$1',[input.colegioId])).rows.length)throw fail('No encontramos el colegio elegido.');
   if(old&&(old.colegio_id!==input.colegioId||old.nivel!==input.nivel)&&(await client.query('select 1 from grupos where promocion_id=$1 limit 1',[id])).rows.length)throw fail('La promoción ya tiene grupos. Conservá su colegio y nivel para no cambiar su pertenencia.');
   await client.query('insert into promociones(id,colegio_id,nivel,anio_egreso,nombre,activo,observaciones) values($1,$2,$3,$4,$5,$6,$7) on conflict(id) do update set colegio_id=excluded.colegio_id,nivel=excluded.nivel,anio_egreso=excluded.anio_egreso,nombre=excluded.nombre,activo=excluded.activo,observaciones=excluded.observaciones',[id,...data]);
  }else{
   if(old&&old.viaje_id!==input.viajeId&&(await client.query('select 1 from contingente_grupos where contingente_id=$1 limit 1',[id])).rows.length)throw fail('La salida ya tiene grupos. No se cambia su viaje: creá otra salida.');
   await client.query('insert into contingentes(id,viaje_id,nombre,fecha_salida,fecha_regreso,activo,observaciones) values($1,$2,$3,$4,$5,$6,$7) on conflict(id) do update set viaje_id=excluded.viaje_id,nombre=excluded.nombre,fecha_salida=excluded.fecha_salida,fecha_regreso=excluded.fecha_regreso,activo=excluded.activo,observaciones=excluded.observaciones',[id,...data]);
  }
  await audit(client,type==='promociones'?'promocion':'contingente',id,old?'editar':'crear',actor);return {creado:!old,registro:dto((await client.query(selects[type]+' where id=$1',[id])).rows[0])};
 });
}
async function linkGroup(id,input,actor){
 if(!Object.hasOwn(input,'promocionId'))throw fail('Indicá la promoción o elegí explícitamente sin promoción.');
 const promotionId=nullableId(input.promocionId,'Identificador de promoción');
 if(!Array.isArray(input.contingentes)||input.contingentes.length>100||input.contingentes.some(id=>typeof id!=='string'||!UUID.test(id)))throw fail('Elegí las salidas para este grupo.');
 const destinations=[...new Set(input.contingentes.map(id=>id.toLowerCase()))].sort();
 return transaction(async client=>{
  const current=await group(client,id,true);if(input.version!==version(current))throw fail('El grupo cambió. Volvé a consultarlo antes de vincularlo.',409);
  if(promotionId){const promotion=(await client.query('select * from promociones where id=$1 for share',[promotionId])).rows[0];if(!promotion||promotion.colegio_id!==current.colegio_id||promotion.nivel.toLowerCase()!==String(current.nivel||'').toLowerCase())throw fail('La promoción debe corresponder al colegio y nivel del grupo.');}
  for(const target of destinations){const row=(await client.query('select viaje_id from contingentes where id=$1 for share',[target])).rows[0];if(!row||row.viaje_id!==current.viaje_id)throw fail('Todas las salidas elegidas deben corresponder al viaje del grupo.');}
  const removed=current.contingentes.filter(id=>!destinations.includes(id));
  if(removed.length&&(await client.query('select 1 from pasajeros where grupo_id=$1 and contingente_id=any($2::uuid[]) limit 1',[current.id,removed])).rows.length)throw fail('Hay pasajeros asignados a una salida que querés quitar. Reasignalos primero.');
  await client.query('update grupos set promocion_id=$2 where id=$1',[current.id,promotionId||null]);
  for(const target of destinations)await client.query('insert into contingente_grupos(contingente_id,grupo_id,viaje_id) values($1,$2,$3) on conflict do nothing',[target,current.id,current.viaje_id]);
  for(const target of removed)await client.query('delete from contingente_grupos where grupo_id=$1 and contingente_id=$2',[current.id,target]);
  await audit(client,'grupo_academico',current.id,'vincular',actor,{promocion_id:promotionId||null,contingentes:destinations});return dto(await group(client,current.id));
 });
}
async function assignPassenger(id,input,actor){
 if(!Object.hasOwn(input,'contingenteId'))throw fail('Indicá una salida o elegí explícitamente sin asignar.');
 const departureId=nullableId(input.contingenteId,'Identificador de salida');
 return transaction(async client=>{
  const row=(await client.query('select p.id,p.legacy_id,p.viaje_id,p.grupo_id,p.contingente_id,p.estado,p.updated_at::text,pe.nombre,pe.apellido from pasajeros p join personas pe on pe.id=p.persona_id where p.id::text=$1 or p.legacy_id=$1 for update of p',[id])).rows[0];if(!row)throw fail('No encontramos ese pasajero.',404);
  if(input.version!==version(row))throw fail('El pasajero cambió. Volvé a consultarlo.',409);
  if(departureId){const departure=(await client.query('select c.* from contingentes c join contingente_grupos cg on cg.contingente_id=c.id where c.id=$1 and cg.grupo_id=$2 and cg.viaje_id=$3 for share of c',[departureId,row.grupo_id,row.viaje_id])).rows[0];if(!departure)throw fail('La salida debe estar vinculada al grupo y viaje de este pasajero.');if(!departure.activo&&row.contingente_id!==departureId)throw fail('La salida está inactiva. Reactivala antes de asignar nuevos pasajeros.');}
  await client.query('update pasajeros set contingente_id=$2 where id=$1',[row.id,departureId||null]);await audit(client,'salida_pasajero',row.id,'asignar',actor,{contingente_id:departureId||null});const current=(await client.query('select p.id,p.legacy_id,p.viaje_id,p.grupo_id,p.contingente_id,p.estado,p.updated_at::text,pe.nombre,pe.apellido from pasajeros p join personas pe on pe.id=p.persona_id where p.id=$1',[row.id])).rows[0];return {asignado:true,pasajero:dto(current)};
 });
}
module.exports={metadata,save,linkGroup,assignPassenger};
