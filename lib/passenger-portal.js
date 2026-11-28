// Identidad verificada por el administrador y sesión propia. Nunca autenticar por DNI.
const crypto=require('node:crypto');const db=require('./db');const accounts=require('./student-accounts');
const fail=(message,statusCode=400)=>Object.assign(new Error(message),{statusCode});
const COOKIE='eaa_portal_session';const SESSION_SECONDS=8*60*60;const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hash=token=>crypto.createHash('sha256').update(String(token)).digest('hex');
const token=()=>crypto.randomBytes(32).toString('base64url');
const scope=`(i.persona_id=p.persona_id or exists(select 1 from pasajero_responsables pr where pr.pasajero_id=p.id and pr.responsable_id=i.responsable_id))`;
async function transaction(run){const client=await db.getPool().connect();try{await client.query('BEGIN');const result=await run(client);await client.query('COMMIT');return result;}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}
async function passenger(client,id){const row=(await client.query('select id,persona_id from pasajeros where id::text=$1 or legacy_id=$1',[id])).rows[0];if(!row)throw fail('No encontramos ese pasajero.',404);return row;}
async function targets(id){
 const pool=db.getPool();const pax=await passenger(pool,id);
 const person=(await pool.query('select id,nombre,apellido from personas where id=$1',[pax.persona_id])).rows[0];
 const guardians=(await pool.query('select r.id,r.nombre,r.apellido,r.email,r.telefono,pr.vinculo from responsables r join pasajero_responsables pr on pr.responsable_id=r.id where pr.pasajero_id=$1 order by pr.es_principal desc,r.nombre',[pax.id])).rows;
 return {pasajeroId:pax.id,destinatarios:[...guardians.map(row=>({...row,tipo:'responsable'})),{...person,tipo:'pasajero'}]};
}
async function resolveIdentity(client,passengerId,input,create){
 const pax=await passenger(client,passengerId);
 if(!['pasajero','responsable'].includes(input.tipo)||!UUID.test(input.destinatarioId))throw fail('Elegí un destinatario vinculado al pasajero.');
 if(input.tipo==='pasajero'&&input.destinatarioId!==pax.persona_id)throw fail('El destinatario no corresponde a este pasajero.',403);
 if(input.tipo==='responsable'&&!(await client.query('select 1 from pasajero_responsables where pasajero_id=$1 and responsable_id=$2',[pax.id,input.destinatarioId])).rows.length)throw fail('El responsable no está vinculado al pasajero.',403);
 const column=input.tipo==='pasajero'?'persona_id':'responsable_id';
 if(create)await client.query(`insert into portal_identidades (${column}) values ($1) on conflict do nothing`,[input.destinatarioId]);
 const identity=(await client.query(`select * from portal_identidades where ${column}=$1 for update`,[input.destinatarioId])).rows[0];
 return {pax,identity};
}
async function invite(id,input,actor){
 if(input.canalVerificado!==true)throw fail('Verificá el destinatario y el canal antes de generar su acceso.');
 const hours=Number(input.horas??24);if(!Number.isInteger(hours)||hours<1||hours>168)throw fail('La invitación admite una vigencia de entre 1 y 168 horas.');
 return transaction(async client=>{
  const {pax,identity}=await resolveIdentity(client,id,input,true);const raw=token();
  const invitation=(await client.query("insert into portal_invitaciones(identidad_id,pasajero_id,token_hash,expires_at,actor_username) values ($1,$2,$3,now()+($4::int*interval '1 hour'),$5) returning id,expires_at",[identity.id,pax.id,hash(raw),hours,actor])).rows[0];
  await client.query("insert into eventos_administrativos(entidad,entidad_id,accion,actor_username,detalle) values ('portal_invitacion',$1,'crear',$2,$3::jsonb)",[invitation.id,actor,JSON.stringify({identidad_id:identity.id,pasajero_id:pax.id,canal_verificado:true,horas:hours})]);
  return {id:invitation.id,expires_at:invitation.expires_at,enlace:`/#/mi-viaje?acceso=${raw}`};
 });
}
async function consume(raw,previous){
 if(typeof raw!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(raw))throw fail('El enlace no está disponible. Pedí un nuevo acceso a El Ángel Azul.',401);
 return transaction(async client=>{
  const candidate=(await client.query('select identidad_id from portal_invitaciones where token_hash=$1',[hash(raw)])).rows[0];
  if(!candidate)throw fail('El enlace no está disponible. Pedí un nuevo acceso a El Ángel Azul.',401);
  await client.query('select id from portal_identidades where id=$1 for update',[candidate.identidad_id]);
  const invitation=(await client.query('select v.*,i.persona_id,i.responsable_id from portal_invitaciones v join portal_identidades i on i.id=v.identidad_id where v.token_hash=$1 for update of v',[hash(raw)])).rows[0];
  if(!invitation||invitation.usada_at||invitation.revocada_at||new Date(invitation.expires_at).getTime()<=Date.now())throw fail('El enlace no está disponible. Pedí un nuevo acceso a El Ángel Azul.',401);
  const allowed=(await client.query(`select 1 from pasajeros p join portal_identidades i on i.id=$1 where p.id=$2 and ${scope}`,[invitation.identidad_id,invitation.pasajero_id])).rows.length;
  if(!allowed)throw fail('El enlace no está disponible. Pedí un nuevo acceso a El Ángel Azul.',401);
  await client.query('update portal_invitaciones set usada_at=now() where id=$1',[invitation.id]);
  if(previous)await client.query('update portal_sesiones set revocada_at=now() where token_hash=$1',[hash(previous)]);
  const rawSession=token();await client.query("insert into portal_sesiones(identidad_id,token_hash,expires_at) values ($1,$2,now()+interval '8 hours')",[invitation.identidad_id,hash(rawSession)]);
  return rawSession;
 });
}
async function session(raw){
 if(typeof raw!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(raw))return null;
 return (await db.getPool().query('select s.id as sesion_id,i.* from portal_sesiones s join portal_identidades i on i.id=s.identidad_id where s.token_hash=$1 and s.revocada_at is null and s.expires_at>now()',[hash(raw)])).rows[0]||null;
}
async function logout(raw){if(raw)await db.getPool().query('update portal_sesiones set revocada_at=now() where token_hash=$1',[hash(raw)]);}
async function revoke(passengerId,input,actor){
 const reason=String(input.motivo||'').trim();if(reason.length<3||reason.length>500)throw fail('Indicá un motivo de entre 3 y 500 caracteres.');
 return transaction(async client=>{
  const {identity}=await resolveIdentity(client,passengerId,input,false);if(!identity)return {revocado:true};
  await client.query('update portal_sesiones set revocada_at=now() where identidad_id=$1 and revocada_at is null',[identity.id]);
  await client.query('update portal_invitaciones set revocada_at=now() where identidad_id=$1 and revocada_at is null',[identity.id]);
  await client.query("insert into eventos_administrativos(entidad,entidad_id,accion,actor_username,detalle) values ('portal_identidad',$1,'revocar',$2,$3::jsonb)",[identity.id,actor,JSON.stringify({motivo:reason})]);return {revocado:true};
 });
}
async function owns(identity,id){
 if(!UUID.test(id))throw fail('Recurso no encontrado.',404);
 const owned=(await db.getPool().query(`select 1 from pasajeros p join portal_identidades i on i.id=$1 where p.id=$2 and ${scope}`,[identity.id,id])).rows.length;
 if(!owned)throw fail('Recurso no encontrado.',404);
}
async function me(identity){
 const pool=db.getPool();const subject=identity.responsable_id
  ?(await pool.query('select nombre,apellido from responsables where id=$1',[identity.responsable_id])).rows[0]
  :(await pool.query('select nombre,apellido from personas where id=$1',[identity.persona_id])).rows[0];
 const passengers=(await pool.query(`select p.id,pe.nombre,pe.apellido,p.estado,p.documentacion_estado,p.ficha_medica_estado,
 v.destino,v.titulo as viaje,v.fecha_salida::text,v.fecha_regreso::text,v.nivel,c.nombre as colegio,g.curso,g.division,
 co.codigo_contrato,co.estado as contrato_estado,case when ca.id is not null then coalesce(nullif(ca.plan_nombre,''),'Plan confirmado') else pp.nombre end as plan,exists(select 1 from fichas_adhesion fa join inscripciones ins on ins.id=fa.inscripcion_id where ins.persona_id=p.persona_id and ins.viaje_id=p.viaje_id) as ficha_disponible
 from pasajeros p join personas pe on pe.id=p.persona_id join viajes v on v.id=p.viaje_id
 left join grupos g on g.id=p.grupo_id left join colegios c on c.id=g.colegio_id
 left join contratos co on co.id=p.contrato_id left join planes_pago pp on pp.id=p.plan_pago_id left join cuentas_pasajeros ca on ca.pasajero_id=p.id
 join portal_identidades i on i.id=$1 where ${scope} order by v.fecha_salida desc nulls last,pe.apellido,pe.nombre`,[identity.id])).rows;
 return {identidad:{...subject,tipo:identity.responsable_id?'responsable':'pasajero'},pasajeros:passengers};
}
async function account(identity,id){
 await owns(identity,id);const result=await accounts.summary(id);
 const pick=(row,keys)=>Object.fromEntries(keys.filter(key=>row[key]!==undefined).map(key=>[key,row[key]]));
 return {...pick(result,['pagado_centavos','saldo_centavos','saldo_favor_centavos','sin_imputar_centavos']),cuenta:result.cuenta?pick(result.cuenta,['moneda','total_centavos','condiciones','plan_version','plan_nombre']):null,cuotas:result.cuotas.map(row=>pick(row,['id','numero','concepto','vencimiento','monto_centavos','imputado_centavos','pendiente_centavos','estado']))};
}
async function payments(identity,id){await owns(identity,id);return (await db.getPool().query('select id,fecha::text,monto_centavos::text,moneda,medio,concepto,referencia,estado from pagos_manuales where pasajero_id=$1 order by fecha desc,created_at desc',[id])).rows;}
async function fichaId(identity,id){
 await owns(identity,id);const row=(await db.getPool().query('select fa.id from fichas_adhesion fa join inscripciones ins on ins.id=fa.inscripcion_id join pasajeros p on p.persona_id=ins.persona_id and p.viaje_id=ins.viaje_id where p.id=$1 order by fa.created_at desc limit 1',[id])).rows[0];
 if(!row)throw fail('No encontramos una ficha disponible.',404);return row.id;
}
module.exports={COOKIE,SESSION_SECONDS,targets,invite,consume,session,logout,revoke,owns,me,account,payments,fichaId};
