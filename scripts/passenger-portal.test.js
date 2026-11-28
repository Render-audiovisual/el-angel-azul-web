const test=require('node:test');const assert=require('node:assert/strict');
Object.assign(process.env,{NODE_ENV:'test',DATABASE_URL:'pglite-en-memoria',EAA_POSTGRES_MIGRATION_ENABLED:'true',EAA_ADMIN_PASSWORD:'Prueba-portal-local-42',EAA_AGENTE1_PASSWORD:'Prueba-portal-agencia-42'});
const db=require('../lib/db');const {crearPoolLocal}=require('./helpers/pglite-pool');const {createAppServer}=require('../server');
let pool,server,base,admin,agency,guardian,otherGuardian,school,plan;const pax=[];let cookie;
async function request(path,data,session=admin,origin=base){return fetch(base+path,{method:data?'POST':'GET',headers:{Origin:origin,...(session?{Cookie:session}:{}),...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});}
function cookieOf(response){return response.headers.get('set-cookie')?.split(';')[0] || '';}
async function invite(id=pax[0],who=guardian){const response=await request(`/api/admin/portal/pasajeros/${id}/invitar`,{tipo:'responsable',destinatarioId:who,canalVerificado:true,horas:24});assert.equal(response.status,201);const data=await response.json();return data.enlace.split('acceso=')[1];}
async function access(token){return request('/api/portal/acceso',{token},null);}
const FIRMA='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
test.before(async()=>{
 pool=await crearPoolLocal();db.__test.setPool(pool);server=createAppServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 admin=cookieOf(await request('/api/admin/login',{username:'admin',password:process.env.EAA_ADMIN_PASSWORD},null));agency=cookieOf(await request('/api/admin/login',{username:'agente1',password:process.env.EAA_AGENTE1_PASSWORD},null));
 school=(await pool.query("insert into colegios(nombre) values('Colegio ficticio portal') returning id")).rows[0].id;
 const trip=(await pool.query("insert into viajes(categoria,nivel,destino,titulo,anio,estado) values('estudiantil','Secundaria','Bariloche 2027','Bariloche 2027',2027,'activo') returning id")).rows[0].id;
 const group=(await pool.query("insert into grupos(viaje_id,colegio_id,curso,division) values($1,$2,'5°','A') returning id",[trip,school])).rows[0].id;
 const contract=(await pool.query("insert into contratos(viaje_id,grupo_id,codigo_contrato,estado) values($1,$2,'PORTAL-FICTICIO','activo') returning id",[trip,group])).rows[0].id;
 plan=(await pool.query("insert into planes_pago(contrato_id,nombre,cuotas) values($1,'Plan de prueba',2) returning id",[contract])).rows[0].id;
 for(let i=0;i<3;i++){const person=(await pool.query('insert into personas(nombre,apellido,numero_documento) values($1,$2,$3) returning id',['Pasajero '+i,'De Prueba',String(45111222+i)])).rows[0].id;pax.push((await pool.query('insert into pasajeros(persona_id,viaje_id,grupo_id,contrato_id,plan_pago_id) values($1,$2,$3,$4,$5) returning id',[person,trip,group,contract,plan])).rows[0].id);}
 guardian=(await pool.query("insert into responsables(nombre,apellido,email,telefono) values('María','Prueba','responsable@example.com','3794123456') returning id")).rows[0].id;otherGuardian=(await pool.query("insert into responsables(nombre,apellido,email) values('Otro','Responsable','otro@example.com') returning id")).rows[0].id;
 for(const id of pax.slice(0,2))await pool.query("insert into pasajero_responsables values($1,$2,'Madre',true)",[id,guardian]);await pool.query("insert into pasajero_responsables values($1,$2,'Padre',true)",[pax[2],otherGuardian]);
 await pool.query("insert into pagos_manuales(id,pasajero_id,fecha,monto_centavos,medio,concepto,actor_username) values(gen_random_uuid(),$1,'2026-11-27',1234,'transferencia','Prueba portal','admin')",[pax[0]]);
});
test.after(async()=>{if(server?.listening)await new Promise(r=>server.close(r));await pool?.close();});
test('admin y portal son sesiones separadas; agencia no administra invitaciones y los POST exigen origen',async()=>{
 assert.equal((await request('/api/portal/me',null,admin)).status,401);assert.equal((await request('/api/admin/portal/pasajeros/'+pax[0],null,null)).status,401);assert.equal((await request('/api/admin/portal/pasajeros/'+pax[0],null,agency)).status,403);
 assert.equal((await request('/api/portal/acceso',{token:'inválido'},null,'https://ajeno.invalid')).status,403);
 const targets=(await(await request('/api/admin/portal/pasajeros/'+pax[0])).json()).destinatarios;assert.equal(targets.filter(row=>row.tipo==='responsable').length,1);
});
test('generar acceso exige un destinatario vinculado y canal verificado; solo guarda el hash',async()=>{
 const url='/api/admin/portal/pasajeros/'+pax[0]+'/invitar';
 assert.equal((await request(url,{tipo:'responsable',destinatarioId:guardian})).status,400);assert.equal((await request(url,{tipo:'responsable',destinatarioId:otherGuardian,canalVerificado:true})).status,403);
 const raw=await invite();const stored=(await pool.query('select token_hash from portal_invitaciones order by created_at desc limit 1')).rows[0];assert.equal(stored.token_hash===raw,false);assert.equal(/^[a-f0-9]{64}$/.test(stored.token_hash),true);
 const response=await access(raw);assert.equal(response.status,200);cookie=cookieOf(response);const flags=response.headers.get('set-cookie').split(';').slice(1).join(';');assert.match(flags,/HttpOnly/);assert.match(flags,/SameSite=Strict/);assert.match(flags,/Path=\/api\/portal/);assert.match(response.headers.get('cache-control'),/no-store/);
 assert.equal((await access(raw)).status,401);
});
test('el responsable ve sus dos pasajeros; no recibe DNI, domicilios ni usuarios administrativos',async()=>{
 const response=await request('/api/portal/me',null,cookie);assert.equal(response.status,200);const body=await response.json();assert.equal(body.pasajeros.length,2);assert.equal(body.pasajeros.some(row=>row.id===pax[2]),false);for(const row of body.pasajeros)for(const field of ['dni','numero_documento','domicilio','responsable_email','actor_username'])assert.equal(Object.hasOwn(row,field),false);
 assert.equal((await request('/api/admin/me',null,cookie)).status,200);assert.equal((await(await request('/api/admin/me',null,cookie)).json()).authenticated,false);
});
test('cada recurso comprueba pertenencia aunque se cambie el identificador',async()=>{
 for(const resource of ['cuenta','pagos','ficha.pdf'])assert.equal((await request(`/api/portal/pasajeros/${pax[2]}/${resource}`,null,cookie)).status,404);
 const ownAccount=await request(`/api/portal/pasajeros/${pax[0]}/cuenta`,null,cookie);assert.equal(ownAccount.status,200);assert.equal((await ownAccount.json()).cuenta,null);
 const payments=(await(await request(`/api/portal/pasajeros/${pax[0]}/pagos`,null,cookie)).json()).pagos;assert.equal(payments.length,1);assert.equal(payments[0].monto_centavos,'1234');assert.equal(Object.hasOwn(payments[0],'actor_username'),false);
});
test('el PDF propio se descarga con sesión y otro pasajero no puede solicitarlo',async()=>{
 const data={colegioId:school,nivel:'Secundaria',destino:'Bariloche',anio:'2027',grado:'5°',division:'A',planPagoId:plan,pasajeroNombre:'Pasajero',pasajeroApellido:'De Prueba',pasajeroTipoDocumento:'DNI',pasajeroNumeroDocumento:'45111222',pasajeroNacimiento:'2009-03-14',pasajeroSexo:'Femenino',responsableNombre:'María',responsableApellido:'Prueba',responsableTipoDocumento:'DNI',responsableNumeroDocumento:'12345678',responsableNacimiento:'1980-05-02',responsableParentesco:'Madre',responsableCuilCuit:'20123456786',responsableEmail:'responsable@example.com',responsableCelular:'3794123456',domicilioCalle:'San Martín',domicilioNumero:'123',domicilioLocalidad:'Goya',domicilioProvincia:'Corrientes',domicilioCodigoPostal:'3450',aceptaCondiciones:true,firma:FIRMA};
 const created=await request('/api/public/fichas',data,null);assert.equal(created.status,201,await created.clone().text());
 const pdf=await request(`/api/portal/pasajeros/${pax[0]}/ficha.pdf`,null,cookie);assert.equal(pdf.status,200);assert.equal(pdf.headers.get('content-type'),'application/pdf');assert.equal((await pdf.text()).slice(0,5),'%PDF-');
 assert.equal((await request(`/api/portal/pasajeros/${pax[0]}/ficha.pdf`,null,null)).status,401);
});
test('revocar invalida sesiones y enlaces sin usar, incluido un acceso simultáneo',async()=>{
 const raw=await invite();const responses=await Promise.all([access(raw),request('/api/admin/portal/pasajeros/'+pax[0]+'/revocar',{tipo:'responsable',destinatarioId:guardian,motivo:'Revocación de prueba'})]);assert.equal(responses[1].status,200);
 assert.equal((await request('/api/portal/me',null,cookie)).status,401);if(responses[0].status===200)assert.equal((await request('/api/portal/me',null,cookieOf(responses[0]))).status,401);else assert.equal(responses[0].status,401);assert.equal((await access(raw)).status,401);
});
test('una invitación solo se consume una vez aun con dos pedidos simultáneos',async()=>{
 const raw=await invite();const results=await Promise.all([access(raw),access(raw)]);assert.deepEqual(results.map(row=>row.status).sort(),[200,401]);cookie=cookieOf(results.find(row=>row.status===200));
 const logged=await request('/api/portal/logout',{},cookie);assert.equal(logged.status,200);assert.match(logged.headers.get('set-cookie').split(';').slice(1).join(';'),/Max-Age=0/);assert.equal((await request('/api/portal/me',null,cookie)).status,401);
});
test('vencimiento y cambios de vínculo se aplican en el servidor; todas las tablas tienen RLS',async()=>{
 let raw=await invite();await pool.query("update portal_invitaciones set expires_at=now()-interval '1 minute' where usada_at is null");assert.equal((await access(raw)).status,401);
 raw=await invite();cookie=cookieOf(await access(raw));await pool.query('delete from pasajero_responsables where pasajero_id=$1 and responsable_id=$2',[pax[1],guardian]);assert.equal((await request(`/api/portal/pasajeros/${pax[1]}/pagos`,null,cookie)).status,404);
 await pool.query("update portal_sesiones set expires_at=now()-interval '1 minute'");assert.equal((await request('/api/portal/me',null,cookie)).status,401);
 for(const name of ['portal_identidades','portal_invitaciones','portal_sesiones'])assert.equal((await pool.query('select relrowsecurity from pg_class where relname=$1',[name])).rows[0].relrowsecurity,true);
});

test('más de treinta accesos válidos desde una misma conexión no bloquean una reunión de familias',async()=>{
 for(let i=0;i<35;i++){const raw=await invite();assert.equal((await access(raw)).status,200);}
});
