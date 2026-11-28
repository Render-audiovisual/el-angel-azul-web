// Recorrido real del catálogo. Exclusivamente PGlite y contenido ficticio.
require('../helpers/sin-secretos');
Object.assign(process.env,{NODE_ENV:'test',DATABASE_URL:'pglite-en-memoria',EAA_POSTGRES_MIGRATION_ENABLED:'true',EAA_ADMIN_PASSWORD:'Prueba-catalogo-local-42'});
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'playwright');
const {crearPoolLocal}=require('../helpers/pglite-pool');
const db=require('../../lib/db');
const {createAppServer}=require('../../server');
let pool,server,browser,base;
const results=[];
async function caso(name,fn){try{await fn();results.push(['ok',name]);}catch(error){results.push(['FALLA',name,error.message]);}console.log(results.at(-1).join(' | '));}
async function openBlocks(page){await page.locator('[data-admin-turismo-form] details').evaluateAll(nodes=>nodes.forEach(node=>node.open=true));}
async function saved(page){await page.locator('.admin-turismo-save-feedback.is-ok').filter({hasText:'Cambios confirmados'}).waitFor();}
async function capture(page,name){if(process.env.E2E_SCREENSHOTS){fs.mkdirSync(process.env.E2E_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.E2E_SCREENSHOTS,name+'.png'),fullPage:false});}}
(async()=>{
 pool=await crearPoolLocal();db.__test.setPool(pool);server=createAppServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL || 'chrome'});
 const admin=await browser.newContext();const publicContext=await browser.newContext();
 for(const context of [admin,publicContext])await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
 const auth=await admin.request.post(base+'/api/admin/login',{headers:{Origin:base},data:{username:'admin',password:process.env.EAA_ADMIN_PASSWORD}});assert.equal(auth.status(),200);
 const page=await admin.newPage();const client=await publicContext.newPage();page.setDefaultTimeout(8000);client.setDefaultTimeout(8000);
 const errors=[];for(const p of [page,client])p.on('pageerror',e=>errors.push(e.message));
 await caso('Crear: agregar fotos e itinerario conserva todos los campos sin guardar un paquete vacío',async()=>{
  await page.goto(base+'/#/admin/turismo');await page.locator('[data-admin-new]').click();await openBlocks(page);
  await page.locator('[name="destino"]').fill('Cataratas');await page.locator('[name="titulo"]').fill('Cataratas de prueba integral');await page.locator('[name="duracion"]').fill('4 días');await page.locator('[name="descripcionCorta"]').fill('Paquete ficticio para verificar publicación y edición.');await page.locator('[name="precioDesde"]').fill('12500.50');await page.locator('[name="moneda"]').selectOption('ARS');await page.locator('[name="fechaSalida"]').fill('2027-04-10');await page.locator('[name="fechaRegreso"]').fill('2027-04-13');
  await page.locator('#new-foto-url').fill('assets/img/turismo/hero/cataratas-iguazu.webp');await page.locator('[data-add-foto]').click();
  assert.equal(await page.locator('[name="titulo"]').inputValue(),'Cataratas de prueba integral');await openBlocks(page);await page.locator('[data-add-dia]').click();await openBlocks(page);await page.locator('[name="itinerario_titulo_0"]').fill('Llegada');await page.locator('[name="itinerario_desc_0"]').fill('Recepción del grupo de prueba.');
  assert.equal((await (await admin.request.get(base+'/api/google-sheets?sheet=TURISMO')).json()).rows.length,0);
  await page.locator('[data-admin-guardar-viaje]').click();await saved(page);
  assert.equal((await (await publicContext.request.get(base+'/api/public/paquetes')).json()).paquetes.length,0);
 });
 await caso('Publicar desde el panel conecta tarjeta, precio y detalle anónimos',async()=>{
  await page.locator('[data-admin-publish]').click();await saved(page);await client.goto(base+'/#/turismo/paquetes');await client.locator('[data-tur-count]').filter({hasText:'1 viaje'}).waitFor();
  assert.match(await client.locator('[data-tur-resultados]').innerText(),/Cataratas de prueba integral/);assert.match(await client.locator('[data-tur-resultados]').innerText(),/12.500,5/);
  const row=(await (await publicContext.request.get(base+'/api/public/paquetes')).json()).paquetes[0];await client.goto(base+'/#/turismo/'+row.slug);await client.locator('h1').filter({hasText:'Cataratas de prueba integral'}).waitFor();
  assert.equal(await client.locator('.footer-internal-access').count(),0);
 });
 await caso('Editar precio conserva centavos y se actualiza al volver a abrir el catálogo',async()=>{
  await openBlocks(page);await page.locator('[name="precioDesde"]').fill('9999.99');await page.locator('[data-admin-guardar-viaje]').click();await saved(page);
  await client.goto(base+'/#/turismo/paquetes');await client.reload();await client.locator('[data-tur-resultados]').filter({hasText:'9.999,99'}).waitFor();
 });
 await caso('Filtros de destino y fecha funcionan; no hay controles cortados ni cabecera superpuesta',async()=>{
  for(const width of [1440,390,320]){
   await client.setViewportSize({width,height:960});await client.reload();await client.locator('[data-tur-count]').filter({hasText:'1 viaje'}).waitFor();
   await client.locator('.tur-filters').evaluate(node=>node.open=true);
   await client.locator('[name="desde"]').fill('2028-01-01');await client.locator('[data-tur-count]').filter({hasText:'0 viajes'}).waitFor();
   await client.locator('[name="desde"]').fill('2027-01-01');await client.locator('[data-tur-count]').filter({hasText:'1 viaje'}).waitFor();
   const geometry=await client.evaluate(()=>({crumbTop:document.querySelector('.tur-crumbs').getBoundingClientRect().top+scrollY,headerBottom:document.querySelector('.site-header').getBoundingClientRect().bottom,cut:[...document.querySelectorAll('.tur-filters input,.tur-filters select,.tur-sort select')].filter(n=>{const r=n.getBoundingClientRect();return r.left<0||r.right>innerWidth+1;}).map(n=>n.name)}));
   assert.deepEqual(geometry.cut,[],JSON.stringify(geometry));assert.ok(geometry.crumbTop>=geometry.headerBottom,JSON.stringify(geometry));await client.evaluate(()=>scrollTo(0,0));await capture(client,'catalogo-publicado-'+width);
  }
 });
 await caso('Conflicto de guardado conserva el formulario completo y permite reintentar',async()=>{
  await openBlocks(page);await page.locator('[name="titulo"]').fill('Cataratas editado sin perder datos');
  await page.route('**/api/google-sheets',route=>route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({ok:false,error:'El paquete cambió. Actualizá la lista.'})}));
  await page.locator('[data-admin-guardar-viaje]').click();await page.locator('.admin-turismo-save-feedback.is-error').waitFor();assert.equal(await page.locator('[name="titulo"]').inputValue(),'Cataratas editado sin perder datos');assert.equal(await page.locator('[data-admin-guardar-viaje]').isEnabled(),true);
  await page.unroute('**/api/google-sheets');await page.locator('[data-admin-guardar-viaje]').click();await saved(page);
 });
 await caso('Duplicar crea otro borrador y despublicar retira el original sin borrarlo',async()=>{
  await page.locator('[data-admin-duplicate]').click();await page.locator('.admin-turismo-save-feedback').filter({hasText:'Copia creada'}).waitFor();
  const rows=(await (await admin.request.get(base+'/api/google-sheets?sheet=TURISMO')).json()).rows;assert.equal(rows.length,2);assert.equal(rows.filter(row=>row.estado==='borrador').length,1);
  const original=rows.find(row=>row.estado==='activo');await page.locator(`[data-admin-edit="${original.id}"]`).click();await page.locator('[data-admin-deactivate]').click();await saved(page);
  assert.equal((await (await publicContext.request.get(base+'/api/public/paquetes')).json()).paquetes.length,0);
 });
 await caso('Publicación rechazada conserva el borrador y muestra el error del servidor',async()=>{
  await openBlocks(page);await page.locator('[name="duracion"]').fill('');await page.locator('[data-admin-publish]').click();await page.locator('.admin-turismo-save-feedback.is-error').waitFor();assert.equal(await page.locator('[name="duracion"]').inputValue(),'');
  const rows=(await (await admin.request.get(base+'/api/google-sheets?sheet=TURISMO')).json()).rows;assert.equal(rows.filter(row=>row.estado==='activo').length,0);
 });
 await caso('Error de red público se distingue del catálogo vacío y ofrece un reintento real',async()=>{
  await client.route('**/api/public/paquetes',route=>route.abort());await client.goto(base+'/#/turismo/paquetes');await client.reload();await client.locator('[data-turismo-retry]').waitFor();assert.match(await client.locator('[role="alert"]').innerText(),/No pudimos cargar/);await client.unroute('**/api/public/paquetes');await client.locator('[data-turismo-retry]').click();await client.locator('[data-tur-count]').filter({hasText:'Todavía no hay viajes publicados'}).waitFor();
 });
 for(const width of [1440,390,320])await caso(`${width}px: filtros, controles de publicación y formulario sin desbordes`,async()=>{
  for(const p of [page,client])await p.setViewportSize({width,height:960});await client.goto(base+'/#/turismo/paquetes');await client.locator('[data-tur-count]').waitFor();
  for(const [p,label] of [[page,'admin'],[client,'publico']]){assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' desborda');await capture(p,`catalogo-${label}-${width}`);}
 });
 await caso('Las cachés personales heredadas desaparecen al abrir la web y al salir del panel',async()=>{
  const keys=['angelAzulAdminPasajerosDemoV4','angelAzulContratosV2','angelAzulFichaAdhesionDemoV1'];
  await client.evaluate(keys=>keys.forEach(key=>localStorage.setItem(key,'[{"nombre":"No debe persistir"}]')),keys);await client.reload();await client.locator('[data-tur-count]').waitFor();assert.equal(await client.evaluate(keys=>keys.some(key=>localStorage.getItem(key)!==null),keys),false);
  await page.locator('[data-admin-logout]').click();await page.locator('[data-admin-login-form]').waitFor();assert.equal(await page.evaluate(keys=>keys.some(key=>localStorage.getItem(key)!==null),keys),false);
 });
 assert.deepEqual(errors,[]);console.log(`${results.filter(r=>r[0]==='ok').length}/${results.length} aprobados; solo PGlite.`);if(results.some(r=>r[0]!=='ok'))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();if(server?.listening)await new Promise(r=>server.close(r));await pool?.close();});
