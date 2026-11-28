const test=require('node:test'),assert=require('node:assert/strict');
Object.assign(process.env,{NODE_ENV:'test',DATABASE_URL:'pglite-en-memoria',EAA_POSTGRES_MIGRATION_ENABLED:'true',EAA_ADMIN_PASSWORD:'Prueba-inscripcion-local-42',EAA_AGENTE1_PASSWORD:'Prueba-inscripcion-agencia-42'});
const db=require('../lib/db'),{crearPoolLocal}=require('./helpers/pglite-pool'),{createAppServer}=require('../server'),fixture=require('./helpers/ficha-ficticia');
let pool,server,base,cookie,agency,school,group,trip,contract,plan;const adminPath=()=>'/api/admin/inscripciones/contratos/'+contract;
async function request(path,body,session=cookie,origin=base){return fetch(base+path,{method:body?'POST':'GET',headers:{Origin:origin,...(session?{Cookie:session}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});}
async function settings(){return(await(await request(adminPath())).json()).contrato;}
async function configure(abierta,rotar=false,session=cookie,version){const row=await settings();return request(adminPath(),{abierta,rotar,version:version||row._version},session);}
const contextParams=()=>new URLSearchParams({colegioId:school,nivel:'Secundaria',viaje:'Bariloche 2027',grado:'5°',division:'A'});
const context=async code=>(await(await request('/api/public/inscripcion-context?'+(code?'codigo='+code:contextParams()))).json());
test.before(async()=>{
 pool=await crearPoolLocal();db.__test.setPool(pool);server=createAppServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 for(const [username,password]of[['admin',process.env.EAA_ADMIN_PASSWORD],['agente1',process.env.EAA_AGENTE1_PASSWORD]]){const response=await request('/api/admin/login',{username,password},null);const value=response.headers.get('set-cookie').split(';')[0];if(username==='admin')cookie=value;else agency=value;}
 school=(await pool.query("insert into colegios(nombre) values('Colegio de prueba inscripción por enlace') returning id")).rows[0].id;trip=(await pool.query("insert into viajes(categoria,nivel,destino,titulo) values('estudiantil','Secundaria','Bariloche 2027','Bariloche 2027') returning id")).rows[0].id;group=(await pool.query("insert into grupos(viaje_id,colegio_id,curso,division) values($1,$2,'5°','A') returning id",[trip,school])).rows[0].id;contract=(await pool.query("insert into contratos(viaje_id,grupo_id,codigo_contrato,estado) values($1,$2,'ENLACE-PRUEBA','activo') returning id",[trip,group])).rows[0].id;plan=(await pool.query("insert into planes_pago(contrato_id,nombre,cuotas) values($1,'Plan de prueba',2) returning id",[contract])).rows[0].id;
});
test.after(async()=>{if(server?.listening)await new Promise(r=>server.close(r));await pool?.close();});
test('habilitación automática solo con contrato, grupo y colegio activos; metadatos públicos mínimos',async()=>{
 const row=await settings();assert.match(row.enlace,/#\/inscripcion\?contrato=/);const body=await context(row.inscripcion_codigo);assert.equal(body.estado,'habilitada');assert.equal(body.contrato.codigo,'ENLACE-PRUEBA');assert.equal(body.seleccion.colegioId,school);assert.equal(body.planes[0].id,plan);for(const key of ['observaciones','documento','firma','actor_username','pdf','inscripcion_codigo'])assert.equal(Object.hasOwn(body,key),false);assert.equal((await context('invalido')).estado,'enlace_invalido');
});
test('permisos de agencia permiten habilitar/pausar pero no borrar; origen y sesión obligatorios',async()=>{
 assert.equal((await request(adminPath(),null,null)).status,401);assert.equal((await request(adminPath(),{abierta:false},cookie,'https://ajeno.invalid')).status,403);assert.equal((await configure(false,false,agency)).status,200);assert.equal((await context()).estado,'pausada');assert.equal((await fetch(base+adminPath(),{method:'DELETE',headers:{Cookie:agency}})).status,405);assert.equal((await configure(true)).status,200);
});
test('varios contratos activos nunca eligen el último: enlace explícito resuelve la ambigüedad',async()=>{
 const extra=(await pool.query("insert into contratos(viaje_id,grupo_id,codigo_contrato,estado) values($1,$2,'OTRO-CONTRATO','activo') returning id",[trip,group])).rows[0].id;assert.equal((await context()).estado,'ambiguo');const response=await request('/api/public/fichas',fixture({colegioId:school,planPagoId:plan}),null);assert.equal(response.status,409);assert.match((await response.json()).error,/más de un contrato/);const row=await settings();assert.equal((await context(row.inscripcion_codigo)).contrato.id,contract);await pool.query("update contratos set estado='inactivo' where id=$1",[extra]);
});
test('un enlace no permite cambiar de colegio o curso; el envío correcto conserva sus vínculos',async()=>{
 const row=await settings();const data={...fixture({colegioId:school,planPagoId:plan}),inscripcionCodigo:row.inscripcion_codigo};assert.equal((await request('/api/public/fichas',{...data,division:'B'},null)).status,400);assert.equal((await request('/api/public/fichas',data,null)).status,201);const saved=(await pool.query('select colegio_id,grupo_id,contrato_id,plan_pago_id from inscripciones')).rows[0];assert.deepEqual(saved,{colegio_id:school,grupo_id:group,contrato_id:contract,plan_pago_id:plan});
});
test('pausa y renovación invalidan enlaces anteriores sin borrar fichas recibidas',async()=>{
 const old=await settings();await configure(false);assert.equal((await context(old.inscripcion_codigo)).estado,'pausada');const response=await request('/api/public/fichas',{...fixture({colegioId:school,planPagoId:plan,documento:'45111223'}),inscripcionCodigo:old.inscripcion_codigo},null);assert.equal(response.status,409);await configure(true,true);const row=await settings();assert.notEqual(row.inscripcion_codigo,old.inscripcion_codigo);assert.equal((await context(old.inscripcion_codigo)).estado,'enlace_invalido');assert.equal((await context(row.inscripcion_codigo)).estado,'habilitada');assert.equal((await pool.query('select count(*)::int as n from inscripciones')).rows[0].n,1);
});
test('inactivar grupo o colegio impide abrir y usar el enlace',async()=>{
 const row=await settings();await pool.query("update grupos set estado='cancelado' where id=$1",[group]);assert.equal((await context(row.inscripcion_codigo)).estado,'pausada');assert.equal((await configure(true)).status,400);await pool.query("update grupos set estado='activo' where id=$1",[group]);await pool.query('update colegios set activo=false where id=$1',[school]);assert.equal((await context(row.inscripcion_codigo)).estado,'pausada');await pool.query('update colegios set activo=true where id=$1',[school]);
});
test('concurrencia avisa en lugar de pisar y cada cambio queda auditado',async()=>{
 const row=await settings();const responses=await Promise.all([configure(false,false,cookie,row._version),configure(true,true,cookie,row._version)]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);assert.ok((await pool.query("select count(*)::int as n from eventos_administrativos where entidad='enlace_inscripcion'")).rows[0].n>=5);await configure(true);
});
test('la escritura revalida el contrato y el enlace después de resolver el contexto',async()=>{
 const row=await settings();const resolved=await db.contextoInscripcion({codigo:row.inscripcion_codigo});await configure(true,true);await assert.rejects(db.insertFichaPublica(fixture({colegioId:school,planPagoId:plan,documento:'45111224'}),resolved),/cambió o está pausada/);assert.equal((await pool.query('select count(*)::int as n from inscripciones')).rows[0].n,1);
});
