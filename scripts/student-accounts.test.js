const test=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');
Object.assign(process.env,{NODE_ENV:'test',DATABASE_URL:'pglite-en-memoria',EAA_POSTGRES_MIGRATION_ENABLED:'true',EAA_ADMIN_PASSWORD:'Prueba-cuentas-local-42'});
const db=require('../lib/db');const {crearPoolLocal}=require('./helpers/pglite-pool');const {createAppServer}=require('../server');
let pool,server,base,cookie,plan;
const planId='11111111-2222-4333-8444-555555555555';let account;
const passengerIds={};
async function request(path,data,session=cookie,origin=base){path=path.replace(/pax-cuenta|otro-pax/g,key=>passengerIds[key]||key);return fetch(base+path,{method:data?'POST':'GET',headers:{Origin:origin,...(session?{Cookie:session}:{}),...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});}
async function write(sheet,row){const r=await request('/api/google-sheets',{sheet,rows:[row],expectedVersions:{[row.id]:null}});assert.equal((await r.json()).ok,true,sheet);}
async function plans(){const r=await request('/api/admin/finanzas/planes');assert.equal(r.status,200);return (await r.json()).planes;}
async function summary(id='pax-cuenta'){const r=await request('/api/admin/finanzas/pasajeros/'+id);assert.equal(r.status,200);return r.json();}
const conditions=()=>({version:plan.version,planVersion:plan.planVersion,moneda:'ARS',total:'100.01',condiciones:'Condiciones ficticias, sin recargos ni intereses.',cuotas:[{concepto:'Inscripción de prueba',vencimiento:'2027-01-10',monto:'40.00'},{concepto:'Saldo de prueba',vencimiento:'2027-02-10',monto:'60.01'}]});
const confirm=()=>({planId,version:plan.version,planVersion:plan.planVersion});
async function payment(pax,monto){const r=await request('/api/admin/pagos',{id:crypto.randomUUID(),pasajeroId:passengerIds[pax]||pax,fecha:'2026-11-27',monto,medio:'transferencia',concepto:'Prueba local',referencia:''});assert.equal(r.status,201);return (await r.json()).pago;}
async function allocation(pago,cuota,monto,id=crypto.randomUUID()){return request('/api/admin/finanzas/imputaciones',{id,pagoId:pago.id,cuotaId:cuota.id,monto});}
test.before(async()=>{pool=await crearPoolLocal();db.__test.setPool(pool);server=createAppServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;const r=await request('/api/admin/login',{username:'admin',password:process.env.EAA_ADMIN_PASSWORD},null);cookie=r.headers.get('set-cookie').split(';')[0];
 const school=(await pool.query("insert into colegios(nombre) values ('Colegio ficticio cuentas') returning id")).rows[0].id;
 await write('GRUPOS',{id:'grupo-cuenta',colegio_id:school,nivel:'Secundaria',viaje:'Bariloche 2027',curso:'5°',division:'A',estado:'Activo'});
 await write('CONTRATOS',{id:'contrato-cuenta',grupo_id:'grupo-cuenta',codigo_contrato:'PRUEBA-CUENTAS',estado:'Activo'});
 await write('PLANES_PAGO',{id:planId,contrato_id:'contrato-cuenta',nombre:'Dos cuotas configuradas',cuotas:'2',activo:'TRUE'});
 for(const [id,dni] of [['pax-cuenta','45111222'],['otro-pax','45222333']])await write('PASAJEROS',{id,grupo_id:'grupo-cuenta',contrato_id:'contrato-cuenta',dni,nombre:'Pasajero',apellido:'De Prueba',plan_pago_id:planId,estado:'Activo'});
 const passengers=(await (await request('/api/google-sheets?sheet=PASAJEROS')).json()).rows;passengerIds['pax-cuenta']=passengers.find(row=>row.dni==='45111222').id;passengerIds['otro-pax']=passengers.find(row=>row.dni==='45222333').id;
 plan=(await plans())[0];});
test.after(async()=>{if(server?.listening)await new Promise(r=>server.close(r));await pool?.close();});
test('cuentas y condiciones requieren sesión y las escrituras requieren origen',async()=>{
 for(const path of ['/api/admin/finanzas/planes','/api/admin/finanzas/pasajeros/pax-cuenta'])assert.equal((await request(path,null,null)).status,401);
 assert.equal((await request('/api/admin/finanzas/planes/'+planId,conditions(),cookie,'https://ajeno.invalid')).status,403);
 assert.equal((await summary()).cuenta,null);
});
test('configurar exige importes exactos, fechas válidas, cantidad de cuotas y versión vigente',async()=>{
 for(const patch of [{total:'100.02'},{moneda:'USD'},{cuotas:[]},{cuotas:[{concepto:'A',vencimiento:'2027-02-30',monto:'40'},{concepto:'B',vencimiento:'2027-02-10',monto:'60.01'}]}]){
  const r=await request('/api/admin/finanzas/planes/'+planId,{...conditions(),...patch});assert.equal(r.status,400);
 }
 assert.equal((await request('/api/admin/finanzas/planes/'+planId,{...conditions(),version:999})).status,409);
 const result=await request('/api/admin/finanzas/planes/'+planId,conditions());assert.equal(result.status,200);plan=(await result.json()).plan;assert.equal(plan.version,1);assert.equal(plan.total_centavos,'10001');
 assert.equal((await pool.query('select cronograma_cuenta_valido($1::jsonb,100) as valido',[JSON.stringify([{numero:1,concepto:'Inválido',monto_centavos:'100'}])])).rows[0].valido,false);
});
test('confirmar crea la cuenta y las cuotas exactas una sola vez, sin asignar pagos ni alterar otras personas',async()=>{
 const endpoint='/api/admin/finanzas/pasajeros/pax-cuenta/confirmar';
 const result=await request(endpoint,confirm());assert.equal(result.status,201,await result.clone().text());account=(await result.json()).cuenta;
 assert.equal((await request(endpoint,confirm())).status,200);
 const data=await summary();assert.equal(data.cuotas.length,2);assert.equal(data.saldo_centavos,'10001');assert.equal(data.cuotas[1].monto_centavos,'6001');assert.equal((await summary('otro-pax')).cuenta,null);
 assert.equal((await pool.query('select count(*)::int as n from cuentas_pasajeros')).rows[0].n,1);
});
test('editar el plan no cambia deudas confirmadas y la base impide reescribir su historial',async()=>{
 const result=await request('/api/admin/finanzas/planes/'+planId,{...conditions(),total:'120',cuotas:[{concepto:'A',vencimiento:'2027-03-01',monto:'60'},{concepto:'B',vencimiento:'2027-04-01',monto:'60'}]});assert.equal(result.status,200);plan=(await result.json()).plan;
 assert.equal((await summary()).cuenta.total_centavos,'10001');assert.equal((await summary()).cuenta.plan_version,1);
 await assert.rejects(pool.query('update cuentas_pasajeros set total_centavos=12000 where id=$1',[account.id]),/historial/);
 await assert.rejects(pool.query('delete from cuotas_pasajeros where cuenta_id=$1',[account.id]),/historial/);
});
test('cobros actualizan saldo; imputación manual es idempotente y no acepta otra persona ni sobreasignación',async()=>{
 const p=await payment('pax-cuenta','50');const other=await payment('otro-pax','100');let data=await summary();assert.equal(data.pagado_centavos,'5000');assert.equal(data.saldo_centavos,'5001');assert.equal(data.sin_imputar_centavos,'5000');assert.equal(data.cuotas[0].imputado_centavos,'0');
 assert.equal((await allocation(other,data.cuotas[0],'1')).status,400);
 const id=crypto.randomUUID();assert.equal((await allocation(p,data.cuotas[0],'40',id)).status,201);assert.equal((await allocation(p,data.cuotas[0],'40',id)).status,200);
 assert.equal((await allocation(p,data.cuotas[1],'11')).status,409);
 assert.equal((await allocation(p,data.cuotas[1],'10')).status,201);data=await summary();assert.equal(data.cuotas[0].estado,'pagada');assert.equal(data.cuotas[1].pendiente_centavos,'5001');assert.equal(data.sin_imputar_centavos,'0');
 const current=(await (await request('/api/admin/pagos')).json()).pagos.find(row=>row.id===p.id);assert.equal((await request('/api/admin/pagos/'+p.id+'/anular',{version:current._version,motivo:'Anulación de prueba'})).status,200);
 data=await summary();assert.equal(data.pagado_centavos,'0');assert.equal(data.saldo_centavos,'10001');assert.equal(data.cuotas[0].imputado_centavos,'0');assert.equal((await pool.query('select count(*)::int as n from imputaciones_pagos')).rows[0].n,2);
});
test('un saldo a favor se distingue de deuda; concurrencia no imputa dos veces el mismo importe disponible',async()=>{
 const p=await payment('pax-cuenta','120');let data=await summary();assert.equal(data.saldo_centavos,'0');assert.equal(data.saldo_favor_centavos,'1999');
 const responses=await Promise.all([allocation(p,data.cuotas[0],'40'),allocation(p,data.cuotas[0],'40')]);assert.deepEqual(responses.map(r=>r.status).sort(),[201,409]);
 assert.equal((await summary()).cuotas[0].imputado_centavos,'4000');assert.ok((await pool.query("select count(*)::int as n from eventos_administrativos where entidad in ('condiciones_plan','cuenta_pasajero','imputacion_pago')")).rows[0].n>=6);
});
test('la base también rechaza una imputación directa que supera el saldo de la cuota',async()=>{
 const data=await summary();const pay=(await (await request('/api/admin/pagos')).json()).pagos.find(row=>row.estado==='confirmado'&&row.pasajero_legacy_id===passengerIds['pax-cuenta']);
 await assert.rejects(pool.query('insert into imputaciones_pagos(id,pago_id,cuota_id,monto_centavos,actor_username) values ($1,$2,$3,1,$4)',[crypto.randomUUID(),pay.id,data.cuotas[0].id,'test']),/supera/);
 for(const table of ['condiciones_planes','cuentas_pasajeros','cuotas_pasajeros','imputaciones_pagos'])assert.equal((await pool.query('select relrowsecurity from pg_class where relname=$1',[table])).rows[0].relrowsecurity,true);
});
test('dos administradores no pisan las condiciones del plan y un cuerpo nulo devuelve 400',async()=>{
 const input={...conditions(),total:'100.01'};
 const responses=await Promise.all([request('/api/admin/finanzas/planes/'+planId,input),request('/api/admin/finanzas/planes/'+planId,input)]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
 const bad=await fetch(base+'/api/admin/finanzas/planes/'+planId,{method:'POST',headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json'},body:'null'});assert.equal(bad.status,400);
 assert.equal((await request('/api/admin/finanzas/pasajeros/no-existe')).status,404);
});
