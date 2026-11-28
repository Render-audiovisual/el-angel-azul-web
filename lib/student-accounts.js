// Cuentas confirmadas: calendario explícito, centavos enteros y reparto manual.
const db = require('./db');
const {version} = require('./admin-write');
const fail = (message,statusCode=400) => Object.assign(new Error(message),{statusCode});
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function cents(value){
 const text=String(value??'').trim();
 if(!/^\d{1,9}(?:\.\d{1,2})?$/.test(text))throw fail('Usá importes positivos con hasta dos decimales.');
 const [whole,fraction='']=text.split('.');const amount=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(!Number.isSafeInteger(amount)||amount<=0||amount>99999999999)throw fail('El importe debe ser mayor a cero y menor a mil millones.');
 return amount;
}
function schedule(input,number){
 if(input.moneda!=='ARS')throw fail('Las cuentas del registro manual utilizan pesos argentinos (ARS).');
 const total=cents(input.total);
 if(!Array.isArray(input.cuotas)||input.cuotas.length!==number)throw fail(`Configurá exactamente ${number} vencimientos e importes.`);
 const rows=input.cuotas.map((row,index)=>{
  const date=String(row.vencimiento||'');const concept=String(row.concepto||'').trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw fail('Cada cuota necesita un vencimiento válido.');
  if(!concept||concept.length>200)throw fail('Cada cuota necesita un concepto de hasta 200 caracteres.');
  return {numero:index+1,concepto:concept,vencimiento:date,monto_centavos:String(cents(row.monto))};
 });
 if(rows.reduce((sum,row)=>sum+Number(row.monto_centavos),0)!==total)throw fail('La suma de las cuotas debe coincidir exactamente con el precio acordado.');
 const conditions=String(input.condiciones||'').trim();if(conditions.length>10000)throw fail('Las condiciones admiten hasta 10.000 caracteres.');
 return {total,rows,conditions};
}
async function transaction(run,readOnly=false){const client=await db.getPool().connect();try{await client.query(readOnly?'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY':'BEGIN');const result=await run(client);await client.query('COMMIT');return result;}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}
async function audit(client,entity,id,action,actor,details={}){await client.query('insert into eventos_administrativos (entidad,entidad_id,accion,actor_username,detalle) values ($1,$2,$3,$4,$5::jsonb)',[entity,id,action,actor,JSON.stringify({origen:'cuentas_y_cuotas',...details})]);}
function planRow(row){const {condiciones_version,total_centavos,moneda,cronograma,condiciones,...base}=row;return {...base,planVersion:version(base),version:Number(condiciones_version||0),total_centavos:total_centavos===null?null:String(total_centavos),moneda:moneda||'ARS',cronograma:cronograma||[],condiciones:condiciones||''};}
const PLAN_SELECT=`select p.id,p.contrato_id,c.codigo_contrato,p.nombre,p.cuotas,p.activo,p.updated_at::text as plan_updated_at,
 cp.version as condiciones_version,cp.total_centavos,cp.moneda,cp.cronograma,cp.condiciones
 from planes_pago p join contratos c on c.id=p.contrato_id left join condiciones_planes cp on cp.plan_id=p.id`;
async function plans(){return (await db.getPool().query(PLAN_SELECT+' order by p.nombre,p.id')).rows.map(planRow);}
async function configure(planId,input,actor){
 if(!UUID.test(planId))throw fail('Plan no válido.');
 return transaction(async client=>{
  const row=(await client.query(PLAN_SELECT+' where p.id=$1 for update of p',[planId])).rows[0];if(!row)throw fail('No encontramos ese plan.',404);
  const current=planRow(row);
  if(input.version!==current.version||input.planVersion!==current.planVersion)throw fail('El plan cambió en otra sesión. Volvé a consultarlo antes de guardar.',409);
  const data=schedule(input,Number(row.cuotas));
  const saved=await client.query(`insert into condiciones_planes (plan_id,version,moneda,total_centavos,cronograma,condiciones,actor_username)
   values ($1,$2,'ARS',$3,$4::jsonb,$5,$6) on conflict(plan_id) do update set version=excluded.version,total_centavos=excluded.total_centavos,cronograma=excluded.cronograma,condiciones=excluded.condiciones,actor_username=excluded.actor_username,updated_at=now() where condiciones_planes.version=$7 returning plan_id`,[planId,current.version+1,String(data.total),JSON.stringify(data.rows),data.conditions,actor,current.version]);
  if(!saved.rows.length)throw fail('Las condiciones cambiaron en otra sesión. Volvé a consultarlas.',409);
  await audit(client,'condiciones_plan',planId,'configurar',actor,{version:current.version+1,total_centavos:String(data.total),cronograma:data.rows,condiciones:data.conditions});
  return planRow((await client.query(PLAN_SELECT+' where p.id=$1',[planId])).rows[0]);
 });
}
async function passenger(client,id,lock=false){const row=(await client.query('select id,contrato_id,plan_pago_id from pasajeros where id::text=$1 or legacy_id=$1'+(lock?' for update':''),[id])).rows[0];if(!row)throw fail('No encontramos ese pasajero.',404);return row;}
async function confirm(passengerId,input,actor){
 return transaction(async client=>{
  const pax=await passenger(client,passengerId,true);
  const existing=(await client.query('select * from cuentas_pasajeros where pasajero_id=$1',[pax.id])).rows[0];
  if(existing){if(existing.plan_id!==input.planId)throw fail('El pasajero ya tiene una cuenta confirmada. No se reemplaza su historial.',409);return {creada:false,cuenta:existing};}
  if(!pax.plan_pago_id||pax.plan_pago_id!==input.planId)throw fail('Asigná primero al pasajero un plan de su contrato.');
  const plan=(await client.query(PLAN_SELECT+' where p.id=$1 for update of p',[input.planId])).rows[0];
  if(!plan||plan.contrato_id!==pax.contrato_id||!plan.activo)throw fail('El plan no está habilitado para el contrato del pasajero.');
  if(!plan.condiciones_version||Number(plan.condiciones_version)!==input.version||planRow(plan).planVersion!==input.planVersion)throw fail('Revisá y confirmá las condiciones actuales del plan.',409);
  const contract=(await client.query('select estado from contratos where id=$1 for share',[pax.contrato_id])).rows[0];
  if(contract?.estado!=='activo')throw fail('El contrato debe estar activo para confirmar la cuenta.');
  if(plan.cronograma.length!==Number(plan.cuotas))throw fail('La cantidad de cuotas cambió. Revisá las condiciones del plan.',409);
  const account=(await client.query(`insert into cuentas_pasajeros (pasajero_id,plan_id,contrato_id,plan_version,moneda,total_centavos,cronograma,condiciones,actor_username)
   values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9) returning *`,[pax.id,plan.id,pax.contrato_id,plan.condiciones_version,plan.moneda,String(plan.total_centavos),JSON.stringify(plan.cronograma),plan.condiciones,actor])).rows[0];
  for(const item of plan.cronograma)await client.query('insert into cuotas_pasajeros (cuenta_id,numero,concepto,vencimiento,monto_centavos) values ($1,$2,$3,$4,$5)',[account.id,item.numero,item.concepto,item.vencimiento,item.monto_centavos]);
  await audit(client,'cuenta_pasajero',account.id,'confirmar',actor);return {creada:true,cuenta:account};
 });
}
async function summary(passengerId,today=new Date().toISOString().slice(0,10)){
 return transaction(async pool=>{
 const pax=await passenger(pool,passengerId);
 const account=(await pool.query('select * from cuentas_pasajeros where pasajero_id=$1',[pax.id])).rows[0];
 if(!account)return {cuenta:null,cuotas:[],planId:pax.plan_pago_id};
 const paid=BigInt((await pool.query("select coalesce(sum(monto_centavos),0)::text as n from pagos_manuales where pasajero_id=$1 and estado='confirmado' and moneda=$2",[pax.id,account.moneda])).rows[0].n);
 const rows=(await pool.query(`select c.*,c.vencimiento::text as vencimiento,coalesce(sum(case when p.estado='confirmado' then i.monto_centavos else 0 end),0)::text as imputado_centavos
 from cuotas_pasajeros c left join imputaciones_pagos i on i.cuota_id=c.id left join pagos_manuales p on p.id=i.pago_id
 where c.cuenta_id=$1 group by c.id order by c.numero`,[account.id])).rows;
 const installments=rows.map(row=>{const assigned=Number(row.imputado_centavos),due=Number(row.monto_centavos);return {...row,monto_centavos:String(due),pendiente_centavos:String(due-assigned),estado:assigned>=due?'pagada':row.vencimiento<today?'vencida':'pendiente'};});
 const total=BigInt(account.total_centavos),assigned=installments.reduce((s,q)=>s+BigInt(q.imputado_centavos),0n);
 return {cuenta:{...account,total_centavos:String(total)},cuotas:installments,pagado_centavos:String(paid),saldo_centavos:String(total>paid?total-paid:0n),saldo_favor_centavos:String(paid>total?paid-total:0n),sin_imputar_centavos:String(paid-assigned)};
 },true);
}
async function allocate(input,actor){
 if(!UUID.test(input.id)||!UUID.test(input.pagoId)||!UUID.test(input.cuotaId))throw fail('Elegí un pago y una cuota válidos.');
 const amount=cents(input.monto);
 return transaction(async client=>{
  const payment=(await client.query('select * from pagos_manuales where id=$1 for update',[input.pagoId])).rows[0];
  if(!payment||payment.estado!=='confirmado')throw fail('El pago no está disponible para imputar.');
  const quota=(await client.query('select q.*,c.pasajero_id,c.moneda from cuotas_pasajeros q join cuentas_pasajeros c on c.id=q.cuenta_id where q.id=$1 for update of q',[input.cuotaId])).rows[0];
  if(!quota||quota.pasajero_id!==payment.pasajero_id||quota.moneda!==payment.moneda)throw fail('El pago y la cuota deben pertenecer al mismo pasajero y moneda.');
  const old=(await client.query('select * from imputaciones_pagos where id=$1',[input.id])).rows[0];
  if(old){if(old.pago_id!==input.pagoId||old.cuota_id!==input.cuotaId||Number(old.monto_centavos)!==amount)throw fail('Ese identificador corresponde a otra imputación.',409);return {creada:false,imputacion:old};}
  const usedPayment=Number((await client.query('select coalesce(sum(monto_centavos),0)::text as n from imputaciones_pagos where pago_id=$1',[payment.id])).rows[0].n);
  const usedQuota=Number((await client.query("select coalesce(sum(i.monto_centavos),0)::text as n from imputaciones_pagos i join pagos_manuales p on p.id=i.pago_id where i.cuota_id=$1 and p.estado='confirmado'",[quota.id])).rows[0].n);
  if(amount>Number(payment.monto_centavos)-usedPayment||amount>Number(quota.monto_centavos)-usedQuota)throw fail('El importe supera el pago disponible o el saldo de esa cuota.',409);
  const row=(await client.query('insert into imputaciones_pagos (id,pago_id,cuota_id,monto_centavos,actor_username) values ($1,$2,$3,$4,$5) returning *',[input.id,payment.id,quota.id,String(amount),actor])).rows[0];
  await audit(client,'imputacion_pago',row.id,'imputar',actor);return {creada:true,imputacion:row};
 });
}
async function list(today=new Date().toISOString().slice(0,10)){
 return transaction(async client=>{
  const accounts=(await client.query('select c.*,p.legacy_id,pp.nombre as plan_nombre from cuentas_pasajeros c join pasajeros p on p.id=c.pasajero_id join planes_pago pp on pp.id=c.plan_id order by c.created_at')).rows;
  const quotas=(await client.query(`select q.*,q.vencimiento::text,coalesce(sum(case when pm.estado='confirmado' then ip.monto_centavos else 0 end),0)::text as imputado_centavos
   from cuotas_pasajeros q left join imputaciones_pagos ip on ip.cuota_id=q.id left join pagos_manuales pm on pm.id=ip.pago_id group by q.id order by q.numero`)).rows;
  const paid=new Map((await client.query("select pasajero_id,sum(monto_centavos)::text as total from pagos_manuales where estado='confirmado' and moneda='ARS' group by pasajero_id")).rows.map(row=>[row.pasajero_id,BigInt(row.total)]));
  return accounts.map(row=>{const collected=paid.get(row.pasajero_id)||0n,total=BigInt(row.total_centavos);return {
   pasajero_id:row.pasajero_id,legacy_id:row.legacy_id,plan_nombre:row.plan_nombre,moneda:row.moneda,total_centavos:String(total),pagado_centavos:String(collected),saldo_centavos:String(total>collected?total-collected:0n),saldo_favor_centavos:String(collected>total?collected-total:0n),
   cuotas:quotas.filter(q=>q.cuenta_id===row.id).map(q=>({...q,monto_centavos:String(q.monto_centavos),pendiente_centavos:String(BigInt(q.monto_centavos)-BigInt(q.imputado_centavos)),estado:BigInt(q.imputado_centavos)>=BigInt(q.monto_centavos)?'pagada':q.vencimiento<today?'vencida':'pendiente'}))
  };});
 },true);
}
module.exports={list,plans,configure,confirm,summary,allocate,schedule,cents};
