const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
Object.assign(process.env,{NODE_ENV:'test',DATABASE_URL:'pglite-en-memoria',EAA_POSTGRES_MIGRATION_ENABLED:'true',EAA_ADMIN_PASSWORD:'Prueba-informacion-local-42',EAA_AGENTE1_PASSWORD:'Prueba-informacion-agencia-42'});
const db=require('../lib/db'),information=require('../lib/contract-information'),portalService=require('../lib/passenger-portal'),{crearPoolLocal}=require('./helpers/pglite-pool'),{createAppServer}=require('../server');
let pool,server,base,admin,agency,portal,contract,pax,other;const notice={id:crypto.randomUUID(),titulo:'Reunión ficticia',texto:'Aviso privado de prueba <script>no ejecutar</script>',publicado:true};
async function request(path,body,cookie=admin,origin=base,method=body?'POST':'GET') { return fetch(base+path,{method,headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})}); }
const route=()=>'/api/admin/contratos/'+contract+'/informacion';
test.before(async()=>{
 pool=await crearPoolLocal();db.__test.setPool(pool);server=createAppServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 for(const user of ['admin','agente1']) { const response=await request('/api/admin/login',{username:user,password:process.env[user==='admin'?'EAA_ADMIN_PASSWORD':'EAA_AGENTE1_PASSWORD']},null);const cookie=response.headers.get('set-cookie').split(';')[0];if(user==='admin')admin=cookie;else agency=cookie; }
 const school=(await pool.query("insert into colegios(nombre) values('Colegio ficticio de información') returning id")).rows[0].id;
 const trip=(await pool.query("insert into viajes(categoria,nivel,destino,titulo) values('estudiantil','Secundaria','Destino ficticio','Viaje ficticio') returning id")).rows[0].id;
 const group=(await pool.query("insert into grupos(viaje_id,colegio_id,curso,division) values($1,$2,'5°','A') returning id",[trip,school])).rows[0].id;
 contract=(await pool.query("insert into contratos(viaje_id,grupo_id,codigo_contrato,estado) values($1,$2,'INFORMACION-FICTICIA','activo') returning id",[trip,group])).rows[0].id;
 for(let i=0;i<2;i++) { const person=(await pool.query('insert into personas(nombre,numero_documento) values($1,$2) returning id',['Prueba '+i,'4555511'+i])).rows[0].id;
  const id=(await pool.query('insert into pasajeros(persona_id,viaje_id,grupo_id,contrato_id) values($1,$2,$3,$4) returning id',[person,trip,group,contract])).rows[0].id;
  if(i===0) { pax=id;const invitation=await portalService.invite(id,{tipo:'pasajero',destinatarioId:person,canalVerificado:true},'admin');const token=invitation.enlace.split('acceso=')[1];portal=portalService.COOKIE+'='+await portalService.consume(token); } else other=id;
 }
});
test.after(async()=>{if(server?.listening)await new Promise(r=>server.close(r));await pool?.close();});
test('configuración vacía no inventa documentación; requiere sesión y origen',async()=>{
 assert.deepEqual(await information.read(contract),{revision:0,requisitos:[],avisos:[]});assert.equal((await request(route(),null,null)).status,401);
 assert.equal((await request(route(),{revision:0,requisitos:[],avisos:[]},agency,'https://ajeno.invalid')).status,403);
 assert.equal((await request(route(),null,agency,base,'DELETE')).status,405);
});
test('agencia configura requisitos y avisos; conflictos conservan la versión confirmada y auditan el cambio',async()=>{
 const data={revision:0,requisitos:['dni_frente','ficha_medica'],avisos:[notice,{...notice,id:crypto.randomUUID(),titulo:'Borrador privado del operador',publicado:false}]};
 assert.equal((await request(route(),data,agency)).status,200);
 const responses=await Promise.all([request(route(),{...data,revision:1}),request(route(),{...data,revision:1})]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
 assert.equal((await information.read(contract)).revision,2);
 assert.equal((await pool.query("select count(*)::int n from eventos_administrativos where entidad='contrato_informacion'")).rows[0].n,2);
 assert.equal((await pool.query("select relrowsecurity from pg_class where oid='contratos_informacion'::regclass")).rows[0].relrowsecurity,true);
});
test('portal ve únicamente sus requisitos y avisos publicados; no puede escribir ni consultar otro pasajero',async()=>{
 const path='/api/portal/pasajeros/'+pax+'/informacion';const response=await request(path,null,portal);assert.equal(response.status,200);const info=await response.json();
 assert.equal(info.avisos.length,1);assert.equal(info.avisos[0].id,notice.id);assert.equal(Object.hasOwn(info,'revision'),false);assert.equal(info.requisitos[0].estado,'faltante');
 assert.equal((await request('/api/portal/pasajeros/'+other+'/informacion',null,portal)).status,404);
 assert.equal((await request(path,{requisitos:[]},portal)).status,405);
 assert.equal((await request(route(),null,portal)).status,401);
});
test('el seguimiento distingue documento pendiente, corrección y aprobación sin registrar pagos',async()=>{
 const id=crypto.randomUUID();await pool.query("insert into documentos(id,entidad_tipo,entidad_id,pasajero_id,tipo_documento,storage_path,nombre_original,mime_type,tamano_bytes,sha256,uploaded_actor,visible_familia) values($1,'pasajero',$2,$2,'dni_frente',$3,'Prueba.png','image/png',1,$4,'admin',true)",[id,pax,'privados/'+id+'/'+crypto.randomUUID()+'.png','a'.repeat(64)]);
 const identity=await portalService.session(portal.split('=')[1]);assert.equal((await information.passenger(pax,identity)).requisitos[0].estado,'pendiente');
 await pool.query("update documentos set estado='rechazado' where id=$1",[id]);assert.equal((await information.passenger(pax,identity)).requisitos[0].estado,'rechazado');
 await pool.query("update documentos set estado='aprobado' where id=$1",[id]);assert.equal((await information.passenger(pax,identity)).requisitos[0].estado,'aprobado');
 assert.equal((await pool.query('select count(*)::int n from pagos_manuales')).rows[0].n,0);
});
test('rechaza tipos desconocidos, duplicados y avisos inválidos; retirar publicación oculta el aviso',async()=>{
 for(const patch of [{requisitos:['inventado']},{requisitos:['otro','otro']},{avisos:[{...notice,publicado:'true'}]},{avisos:[notice,notice]},{avisos:[{...notice,texto:''}]}])assert.equal((await request(route(),{revision:2,requisitos:[],avisos:[],...patch})).status,400);
 assert.equal((await request(route(),{revision:2,requisitos:[],avisos:[{...notice,publicado:false}]})).status,200);
 assert.deepEqual((await information.passenger(pax,await portalService.session(portal.split('=')[1]))).avisos,[]);
});
