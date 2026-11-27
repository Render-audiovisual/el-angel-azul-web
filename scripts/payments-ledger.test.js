const test=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
process.env.NODE_ENV='test';process.env.DATABASE_URL='pglite-en-memoria';
process.env.EAA_POSTGRES_MIGRATION_ENABLED='true';
process.env.EAA_ADMIN_PASSWORD='Prueba-local-admin-pagos';process.env.EAA_AGENTE1_PASSWORD='Prueba-local-agencia-pagos';
const db=require('../lib/db');
const ledger=require('../lib/payments-ledger');
const {crearPoolLocal}=require('./helpers/pglite-pool');
const {createAppServer}=require('../server');
let pool,server,base,admin,agent;
const pago=(extra={})=>({id:randomUUID(),pasajeroId:'pasajero-pagos',fecha:'2026-11-27',monto:'1234.56',medio:'transferencia',concepto:'Cuota noviembre',referencia:'REC-001',...extra});
async function req(path,body,cookie=admin,origin=base){return fetch(base+path,{method:body?'POST':'GET',headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});}
test.before(async()=>{
 pool=await crearPoolLocal();db.__test.setPool(pool);
 const person=(await pool.query("insert into personas (numero_documento,nombre,apellido) values ('45111222','José María','Núñez') returning id")).rows[0].id;
 const viaje=(await pool.query("insert into viajes (categoria,nivel,destino,titulo) values ('estudiantil','Secundaria','Bariloche 2027','Bariloche 2027') returning id")).rows[0].id;
 await pool.query("insert into pasajeros (legacy_id,persona_id,viaje_id) values ('pasajero-pagos',$1,$2)",[person,viaje]);
 server=createAppServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 for(const [username,password] of [['admin',process.env.EAA_ADMIN_PASSWORD],['agente1',process.env.EAA_AGENTE1_PASSWORD]]){
  const r=await req('/api/admin/login',{username,password},null);assert.equal(r.status,200);
  const cookie=r.headers.get('set-cookie').split(';')[0];if(username==='admin')admin=cookie;else agent=cookie;
 }
});
test.after(async()=>{if(server?.listening)await new Promise(r=>server.close(r));if(pool)await pool.close();});

test('pagos manuales: sin sesión 401 y sin origen propio 403',async()=>{
 assert.equal((await req('/api/admin/pagos',null,null)).status,401);
 assert.equal((await req('/api/admin/pagos',pago(),admin,'https://otro.invalid')).status,403);
});
test('valida monto exacto, moneda, fecha, pasajero, concepto y medio',async()=>{
 for(const over of [{monto:'0'},{monto:'-1'},{monto:'1.234'},{monto:'1,20'},{monto:'9999999999'},{fecha:'2026-02-30'},{medio:'cualquiera'},{concepto:''},{moneda:'USD'},{id:'invalido'},{referencia:'x'.repeat(121)}]){
  assert.equal((await req('/api/admin/pagos',pago(over))).status,400,JSON.stringify(over));
 }
 assert.equal((await req('/api/admin/pagos',pago({pasajeroId:'ya-no-existe'}))).status,404);
 assert.equal((await ledger.list()).length,0);
});
test('agencia registra centavos exactos, actor y pasajero; listado autenticado persiste',async()=>{
 const r=await req('/api/admin/pagos',pago(),agent);assert.equal(r.status,201);
 const {pago:guardado}=await r.json();assert.equal(guardado.monto_centavos,'123456');assert.equal(guardado.actor_username,'agente1');
 assert.equal(guardado.fecha,'2026-11-27');assert.equal(guardado.pasajero_legacy_id,'pasajero-pagos');
 const listado=await (await req('/api/admin/pagos')).json();assert.equal(listado.pagos[0].id,guardado.id);
 assert.equal((await pool.query("select count(*)::int as n from eventos_administrativos where entidad='pago_manual'")).rows[0].n,1);
});
test('doble envío concurrente y reintento no duplican pago ni auditoría',async()=>{
 const data=pago({monto:'0.01',referencia:'CENTAVO'});
 const before=(await ledger.list()).length;
 const rs=await Promise.all([req('/api/admin/pagos',data),req('/api/admin/pagos',data)]);
 assert.deepEqual(rs.map(r=>r.status).sort(),[200,201]);
 assert.equal((await ledger.list()).length,before+1);
 assert.equal((await req('/api/admin/pagos',{...data,monto:'0.02'})).status,409);
 assert.equal((await pool.query("select count(*)::int as n from eventos_administrativos where entidad_id=$1",[data.id])).rows[0].n,1);
});
test('anulación: solo admin, requiere motivo y versión; conserva historial y autor',async()=>{
 const data=pago();const {pago:row}=await (await req('/api/admin/pagos',data)).json();
 const payload={motivo:'Se registró dos veces',version:row._version};
 assert.equal((await req(`/api/admin/pagos/${row.id}/anular`,payload,agent)).status,403);
 assert.equal((await req(`/api/admin/pagos/${row.id}/anular`,{...payload,motivo:''})).status,400);
 assert.equal((await req(`/api/admin/pagos/${row.id}/anular`,{...payload,version:'vieja'})).status,409);
 const r=await req(`/api/admin/pagos/${row.id}/anular`,payload);assert.equal(r.status,200);
 const {pago:updated}=await r.json();assert.equal(updated.estado,'anulado');assert.equal(updated.anulado_por,'admin');
 assert.equal(updated.monto_centavos,row.monto_centavos);
 assert.equal((await req(`/api/admin/pagos/${row.id}/anular`,payload)).status,200);
 assert.equal((await pool.query("select count(*)::int as n from eventos_administrativos where entidad_id=$1",[row.id])).rows[0].n,2);
});
test('si falla la auditoría, el pago se revierte completo',async()=>{
 const before=(await ledger.list()).length;
 await pool.query("create function rechazar_auditoria_pago() returns trigger language plpgsql as $$ begin if NEW.entidad='pago_manual' then raise exception 'prueba local'; end if; return NEW; end $$");
 await pool.query("create trigger fallo_auditoria before insert on eventos_administrativos for each row execute function rechazar_auditoria_pago()");
 try{assert.equal((await req('/api/admin/pagos',pago())).status,500);assert.equal((await ledger.list()).length,before);}
 finally{await pool.query('drop trigger fallo_auditoria on eventos_administrativos');}
});
test('base sin migración devuelve un mensaje 503 sin exponer configuración',async()=>{
 await pool.query('alter table pagos_manuales rename to pagos_temporales');
 try{const r=await req('/api/admin/pagos');assert.equal(r.status,503);assert.match((await r.json()).error,/todavía no está habilitado/);}
 finally{await pool.query('alter table pagos_temporales rename to pagos_manuales');}
});
