const test=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');
Object.assign(process.env,{NODE_ENV:'test',DATABASE_URL:'pglite-en-memoria',EAA_POSTGRES_MIGRATION_ENABLED:'true',EAA_ADMIN_PASSWORD:'Prueba-academico-local-42',EAA_AGENTE1_PASSWORD:'Prueba-academico-agencia-42'});
const db=require('../lib/db');const {crearPoolLocal}=require('./helpers/pglite-pool');const {createAppServer}=require('../server');let pool,server,base,admin,agency;const schools=[],trips=[],groups=[],passengers=[],promotions=[],departures=[];
async function request(path,data,session=admin,origin=base){return fetch(base+path,{method:data?'POST':'GET',headers:{Origin:origin,...(session?{Cookie:session}:{}),...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});}
async function meta(){const r=await request('/api/admin/academico');assert.equal(r.status,200);return r.json();}
async function save(type,data){const r=await request('/api/admin/academico/'+type,data);assert.ok([200,201].includes(r.status),await r.clone().text());return(await r.json()).registro;}
async function link(index,promotion,targets,version){const row=(await meta()).grupos.find(row=>row.id===groups[index]);return request('/api/admin/academico/grupos/'+row.id,{promocionId:promotion,contingentes:targets,version:version||row._version});}
async function assign(index,target,version){const row=(await meta()).pasajeros.find(row=>row.id===passengers[index]);return request('/api/admin/academico/pasajeros/'+row.id,{contingenteId:target,version:version||row._version});}
test.before(async()=>{
 pool=await crearPoolLocal();db.__test.setPool(pool);server=createAppServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;for(const [name,password] of [['admin',process.env.EAA_ADMIN_PASSWORD],['agente1',process.env.EAA_AGENTE1_PASSWORD]]){const r=await request('/api/admin/login',{username:name,password},null);const cookie=r.headers.get('set-cookie').split(';')[0];if(name==='admin')admin=cookie;else agency=cookie;}
 for(const name of ['Colegio A de prueba','Colegio B de prueba'])schools.push((await pool.query('insert into colegios(nombre) values($1) returning id',[name])).rows[0].id);
 for(const destination of ['Bariloche 2027','Carlos Paz 2027'])trips.push((await pool.query("insert into viajes(categoria,nivel,destino,titulo) values('estudiantil','Secundaria',$1,$1) returning id",[destination])).rows[0].id);
 for(const [trip,school,division]of[[0,0,'A'],[0,0,'B'],[0,1,'A'],[1,0,'C']])groups.push((await pool.query("insert into grupos(viaje_id,colegio_id,curso,division) values($1,$2,'5°',$3) returning id",[trips[trip],schools[school],division])).rows[0].id);
 for(let i=0;i<3;i++){const person=(await pool.query('insert into personas(nombre,numero_documento) values($1,$2) returning id',['PAX de prueba '+i,String(45111222+i)])).rows[0].id;passengers.push((await pool.query('insert into pasajeros(persona_id,viaje_id,grupo_id) values($1,$2,$3) returning id',[person,trips[0],groups[i===2?2:0]])).rows[0].id);}
});
test.after(async()=>{if(server?.listening)await new Promise(r=>server.close(r));await pool?.close();});
test('metadatos privados, escrituras con origen y agencia habilitada para crear/editar',async()=>{
 assert.equal((await request('/api/admin/academico',null,null)).status,401);assert.equal((await request('/api/admin/academico',null,agency)).status,200);assert.equal((await request('/api/admin/academico/promociones',{nombre:'Prueba'},admin,'https://ajeno.invalid')).status,403);const r=await fetch(base+'/api/admin/academico',{method:'DELETE',headers:{Cookie:agency}});assert.equal(r.status,405);
});
test('un colegio conserva varias promociones y rechaza datos o duplicados inválidos',async()=>{
 for(const [year,name]of[[2027,'Promoción 2027'],[2028,'Promoción 2028']])promotions.push(await save('promociones',{id:crypto.randomUUID(),version:null,colegioId:schools[0],nivel:'Secundaria',anioEgreso:year,nombre:name,activo:true}));
 const bad=await request('/api/admin/academico/promociones',{colegioId:schools[0],nivel:'Secundaria',anioEgreso:2027,nombre:'Promoción 2027',activo:true});assert.equal(bad.status,409);assert.equal((await request('/api/admin/academico/promociones',{colegioId:schools[0],nivel:'Secundaria',anioEgreso:'2027',nombre:'Mal año',activo:true})).status,400);assert.equal((await meta()).promociones.length,2);
});
test('un contingente admite grupos de diferentes colegios en el mismo viaje, sin mezclar otro destino',async()=>{
 for(const [name,from,to]of[['Salida conjunta','2027-05-01','2027-05-07'],['Segunda salida','2027-09-01','2027-09-07']])departures.push(await save('contingentes',{id:crypto.randomUUID(),version:null,viajeId:trips[0],nombre:name,fechaSalida:from,fechaRegreso:to,activo:true,observaciones:'Nota de prueba'}));
 assert.equal((await link(0,promotions[0].id,departures.map(row=>row.id))).status,200);assert.equal((await link(1,promotions[1].id,[departures[0].id])).status,200);assert.equal((await link(2,null,[departures[0].id])).status,200);assert.equal((await link(3,null,[departures[0].id])).status,400);
 const m=await meta();assert.equal(m.grupos.filter(row=>row.contingentes.includes(departures[0].id)).length,3);assert.equal(m.grupos.find(row=>row.id===groups[0]).promocion_id,promotions[0].id);assert.equal(m.grupos.find(row=>row.id===groups[1]).promocion_id,promotions[1].id);
});
test('la promoción corresponde al colegio y nivel del grupo; fechas cruzadas no se guardan',async()=>{
 assert.equal((await link(2,promotions[0].id,[departures[0].id])).status,400);const primary=await save('promociones',{colegioId:schools[0],nivel:'Primaria',anioEgreso:2027,nombre:'Primaria 2027',activo:true});assert.equal((await link(0,primary.id,[departures[0].id])).status,400);
 assert.equal((await request('/api/admin/academico/contingentes',{viajeId:trips[0],nombre:'Fecha inválida',fechaSalida:'2027-02-30',activo:true})).status,400);assert.equal((await request('/api/admin/academico/contingentes',{viajeId:trips[0],nombre:'Regreso antes',fechaSalida:'2027-05-01',fechaRegreso:'2027-04-01',activo:true})).status,400);
 await assert.rejects(pool.query("update promociones set nivel='Primaria' where id=$1",[promotions[0].id]),/nivel académico/);
});
test('pasajeros del mismo grupo pueden salir en distintos contingentes sin alterar sus datos académicos',async()=>{
 assert.equal((await assign(0,departures[0].id)).status,200);assert.equal((await assign(1,departures[1].id)).status,200);assert.equal((await assign(2,departures[1].id)).status,400);const rows=(await meta()).pasajeros;assert.equal(rows.find(row=>row.id===passengers[0]).contingente_id,departures[0].id);assert.equal(rows.find(row=>row.id===passengers[1]).contingente_id,departures[1].id);assert.equal(rows.find(row=>row.id===passengers[0]).grupo_id,rows.find(row=>row.id===passengers[1]).grupo_id);
});
test('no se desvincula una salida con pasajeros asignados; el cambio explícito libera el vínculo',async()=>{
 assert.equal((await link(0,promotions[0].id,[departures[0].id])).status,400);await assert.rejects(pool.query('delete from contingente_grupos where grupo_id=$1 and contingente_id=$2',[groups[0],departures[1].id]));assert.equal((await assign(1,null)).status,200);assert.equal((await link(0,promotions[0].id,[departures[0].id])).status,200);
});
test('concurrencia no pisa vínculos; archivar conserva historia y protege la pertenencia',async()=>{
 let row=(await meta()).grupos.find(row=>row.id===groups[0]);const results=await Promise.all([link(0,promotions[0].id,[departures[0].id],row._version),link(0,promotions[1].id,[departures[0].id],row._version)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 const departure=(await meta()).contingentes.find(row=>row.id===departures[0].id);await save('contingentes',{id:departure.id,version:departure._version,viajeId:departure.viaje_id,nombre:departure.nombre,fechaSalida:departure.fecha_salida,fechaRegreso:departure.fecha_regreso,activo:false});assert.equal((await assign(2,departure.id)).status,400);assert.equal((await meta()).pasajeros.find(row=>row.id===passengers[0]).contingente_id,departure.id);
 const promotion=(await meta()).promociones.find(row=>row.id===promotions[1].id);const changed=await request('/api/admin/academico/promociones',{id:promotion.id,version:promotion._version,colegioId:schools[1],nivel:'Secundaria',anioEgreso:promotion.anio_egreso,nombre:promotion.nombre,activo:true});assert.equal(changed.status,400);
});
test('las relaciones también se exigen en SQL y las tablas nuevas tienen RLS',async()=>{
 await assert.rejects(pool.query('insert into contingente_grupos(contingente_id,grupo_id,viaje_id) values($1,$2,$3)',[departures[0].id,groups[3],trips[0]]));await assert.rejects(pool.query('update pasajeros set contingente_id=$1 where id=$2',[departures[1].id,passengers[2]]));
 for(const name of ['promociones','contingentes','contingente_grupos'])assert.equal((await pool.query('select relrowsecurity from pg_class where relname=$1',[name])).rows[0].relrowsecurity,true);
 assert.ok((await pool.query("select count(*)::int as n from eventos_administrativos where entidad in('promocion','contingente','grupo_academico','salida_pasajero')")).rows[0].n>=10);
});
test('normalizar UUID en mayúsculas conserva los vínculos; un booleano nunca borra una asignación',async()=>{
 let m=await meta();const g=m.grupos.find(row=>row.id===groups[0]);const response=await request('/api/admin/academico/grupos/'+g.id,{version:g._version,promocionId:g.promocion_id.toUpperCase(),contingentes:g.contingentes.map(id=>id.toUpperCase())});assert.equal(response.status,200);assert.deepEqual((await response.json()).grupo.contingentes,g.contingentes);
 const pax=(await meta()).pasajeros.find(row=>row.id===passengers[0]);assert.equal((await request('/api/admin/academico/pasajeros/'+pax.id,{version:pax._version,contingenteId:false})).status,400);assert.equal((await meta()).pasajeros.find(row=>row.id===pax.id).contingente_id,pax.contingente_id);
});

test('los tipos inválidos se rechazan y omitir datos opcionales al editar no los borra',async()=>{
 const departure=(await meta()).contingentes.find(row=>row.id===departures[0].id);
 for(const patch of [{id:false},{viajeId:[departure.viaje_id]},{fechaSalida:false},{nombre:[]},{observaciones:{texto:'No válido'}}])assert.equal((await request('/api/admin/academico/contingentes',{id:departure.id,version:departure._version,viajeId:departure.viaje_id,nombre:departure.nombre,activo:departure.activo,...patch})).status,400);
 const edited=await save('contingentes',{id:departure.id,version:departure._version,viajeId:departure.viaje_id,nombre:'Salida renombrada',activo:departure.activo});assert.equal(edited.fecha_salida,departure.fecha_salida);assert.equal(edited.fecha_regreso,departure.fecha_regreso);assert.equal(edited.observaciones,'Nota de prueba');
 const person=(await meta()).pasajeros.find(row=>row.id===passengers[0]);assert.equal((await request('/api/admin/academico/pasajeros/'+person.id,{version:person._version})).status,400);assert.equal((await meta()).pasajeros.find(row=>row.id===person.id).contingente_id,person.contingente_id);
});
