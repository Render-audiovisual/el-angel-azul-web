const test = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV='test';process.env.DATABASE_URL='pglite-en-memoria';process.env.EAA_POSTGRES_MIGRATION_ENABLED='true';
process.env.EAA_ADMIN_PASSWORD='Prueba-catalogo-local-42';
const db=require('../lib/db');
const {crearPoolLocal}=require('./helpers/pglite-pool');
const {createAppServer}=require('../server');
let pool,server,base,cookie;
async function request(path,data,session=cookie,origin=base){return fetch(base+path,{method:data?'POST':'GET',headers:{Origin:origin,...(session?{Cookie:session}:{}),...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});}
async function current(){return (await (await request('/api/google-sheets?sheet=TURISMO')).json()).rows;}
async function save(row){const before=(await current()).find(item=>item.id===row.id);return (await request('/api/google-sheets',{sheet:'TURISMO',rows:[row],expectedVersions:{[row.id]:before?before._version:null}})).json();}
const draft={id:'paquete-integrado',slug:'cataratas-integrado',destino:'Cataratas',titulo:'Cataratas de prueba',estado:'borrador',duracion:'4 días',descripcion_corta:'Salida ficticia para verificar integración',precio_desde:'12500.50',precio_valor:'12500.50',moneda:'ARS',categorias:'nacional|familiar',fotos:JSON.stringify([{url:'assets/img/turismo/hero/cataratas-iguazu.webp',principal:true}])};
test.before(async()=>{pool=await crearPoolLocal();db.__test.setPool(pool);server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port;const r=await request('/api/admin/login',{username:'admin',password:process.env.EAA_ADMIN_PASSWORD},null);assert.equal(r.status,200);cookie=r.headers.get('set-cookie').split(';')[0];});
test.after(async()=>{if(server?.listening)await new Promise(resolve=>server.close(resolve));if(pool)await pool.close();});
test('un borrador guardado no aparece en ninguna de las dos APIs públicas',async()=>{
 assert.equal((await save(draft)).ok,true);
 assert.equal((await current()).length,1);
 const modern=await (await request('/api/public/paquetes',null,null)).json();assert.equal(modern.paquetes.length,0);
 const legacy=await (await request('/api/google-sheets?sheet=TURISMO',null,null)).json();assert.equal(legacy.rows.length,0);
 assert.equal((await request('/api/public/paquetes/'+draft.slug,null,null)).status,404);
});
test('publicar desde admin aparece en un cliente anónimo y sus cambios se leen sin caché',async()=>{
 assert.equal((await save({...draft,estado:'activo'})).ok,true);
 const first=await (await request('/api/public/paquetes',null,null)).json();assert.equal(first.paquetes.length,1);assert.equal(first.paquetes[0].titulo,draft.titulo);
 for(const key of ['id','_version','created_at','updated_at','actor_username'])assert.equal(Object.hasOwn(first.paquetes[0],key),false,key);
 assert.equal((await save({...draft,estado:'activo',precio_desde:'9999.99',titulo:'Cataratas actualizado'})).ok,true);
 const changed=await (await request('/api/public/paquetes/'+draft.slug,null,null)).json();assert.equal(changed.paquete.precio_desde,'9999.99');assert.equal(changed.paquete.titulo,'Cataratas actualizado');
 assert.equal((await (await request('/api/public/paquetes?q=cataratas&categoria=nacional',null,null)).json()).paquetes.length,1);
 assert.equal((await (await request('/api/public/paquetes?destino=Brasil',null,null)).json()).paquetes.length,0);
});
test('servidor rechaza publicación incompleta, precio inválido, fechas cruzadas y multimedia ejecutable',async()=>{
 for(const patch of [{titulo:''},{descripcion_corta:''},{fotos:'[]'},{precio_desde:'-1'},{precio_valor:'1.234'},{fecha_salida:'2027-03-02',fecha_regreso:'2027-03-01'},{fecha_salida:'2027-02-30'},{fotos:JSON.stringify([{url:'javascript:alert(1)'}])},{moneda:'inventada'}]){
  const result=await save({...draft,estado:'activo',...patch});assert.equal(result.ok,false,JSON.stringify(patch));
 }
 assert.equal((await current())[0].titulo,'Cataratas actualizado');
});
test('duplicar requiere sesión, origen y versión; crea un borrador auditado sin duplicar la publicación',async()=>{
 const source=(await current())[0];const endpoint=`/api/admin/paquetes/${source.id}/duplicar`;
 assert.equal((await request(endpoint,{version:source._version},null)).status,401);
 assert.equal((await request(endpoint,{version:source._version},cookie,'https://ajeno.invalid')).status,403);
 assert.equal((await request(endpoint,{version:'vieja'})).status,409);
 const r=await request(endpoint,{version:source._version});assert.equal(r.status,201,await r.clone().text());
 const {paquete}=await r.json();assert.equal(paquete.estado,'borrador');assert.notEqual(paquete.slug,source.slug);assert.notEqual(paquete.id,source.id);
 assert.equal((await current()).length,2);assert.equal((await (await request('/api/public/paquetes',null,null)).json()).paquetes.length,1);
 assert.ok((await pool.query("select count(*)::int as n from eventos_administrativos where entidad='turismo' and actor_username='admin'")).rows[0].n>=3);
});
test('despublicar retira lista y detalle; una salida vencida tampoco queda a la venta',async()=>{
 const source=(await current()).find(item=>item.id===draft.id);
 assert.equal((await save({...source,estado:'inactivo'})).ok,true);
 assert.equal((await (await request('/api/public/paquetes',null,null)).json()).paquetes.length,0);
 assert.equal((await request('/api/public/paquetes/'+draft.slug,null,null)).status,404);
 assert.equal((await save({...draft,estado:'activo',fecha_salida:'2020-01-01',fecha_regreso:'2020-01-03'})).ok,true);
 assert.equal((await (await request('/api/public/paquetes',null,null)).json()).paquetes.length,0);
});
