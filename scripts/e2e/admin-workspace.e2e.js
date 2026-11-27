// Revisión manual del espacio de trabajo. Solo servidor propio y PGlite en memoria.
// PLAYWRIGHT_PATH=<ruta a playwright> PLAYWRIGHT_CHANNEL=chrome node scripts/e2e/admin-workspace.e2e.js
require('../helpers/sin-secretos');
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'pglite-en-memoria';
process.env.EAA_POSTGRES_MIGRATION_ENABLED = 'true';
process.env.EAA_ADMIN_PASSWORD = 'Prueba-local-admin-42';
process.env.EAA_AGENTE1_PASSWORD = 'Prueba-local-agencia-42';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const { crearPoolLocal } = require('../helpers/pglite-pool');
const db = require('../../lib/db');
const { createAppServer } = require('../../server');
let pool, server, browser, base;
const results = [];
const FIRMA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const routes = ['', 'colegios', 'pasajeros', 'pagos', 'grupos', 'contratos', 'fichas', 'turismo', 'configuracion'];
const widths = process.env.E2E_WIDTHS ? process.env.E2E_WIDTHS.split(',').map(Number) : [1920, 1440, 1024, 768, 390, 320];
async function caso(name, run) {
  try { await run(); results.push(['ok',name]); }
  catch(e) { results.push(['FALLA',name,e.message.replace(/\s+/g,' ')]); }
  console.log(results.at(-1).join(' | '));
}
async function auth(context, agencia = false) {
  const r = await context.request.post(base+'/api/admin/login', {headers:{Origin:base}, data:{username:agencia?'agente1':'admin',password:agencia?process.env.EAA_AGENTE1_PASSWORD:process.env.EAA_ADMIN_PASSWORD}});
  assert.equal(r.status(),200);
}
async function save(context, sheet, row) {
  const r = await context.request.post(base+'/api/google-sheets',{headers:{Origin:base},data:{sheet,rows:[row],expectedVersions:{[row.id]:null}}});
  assert.equal(r.status(),200,await r.text());
}
async function seed(context) {
  const colegio=(await pool.query("insert into colegios (nombre,provincia,localidad) values ('Escuela Normal de Prueba con Nombre Extenso','Corrientes','Goya') returning id")).rows[0].id;
  await save(context,'GRUPOS',{id:'grupo-ui',colegio_id:colegio,nivel:'Secundaria',viaje:'Bariloche 2027',curso:'5°',division:'B',estado:'Activo'});
  await save(context,'CONTRATOS',{id:'contrato-ui',grupo_id:'grupo-ui',codigo_contrato:'UI-001',estado:'Activo'});
  const plan='11111111-2222-4333-8444-555555555555';
  await save(context,'PLANES_PAGO',{id:plan,contrato_id:'contrato-ui',nombre:'12 cuotas mensuales',cuotas:'12',activo:'TRUE'});
  await save(context,'PASAJEROS',{id:'pasajero-ui',grupo_id:'grupo-ui',contrato_id:'contrato-ui',dni:'45111222',nombre:'José María',apellido:'Fernández de los Ángeles',nacimiento:'2009-03-14',responsable_nombre:'María',responsable_apellido:'Fernández',responsable_dni:'12345678',responsable_telefono:'3794123456',responsable_email:'responsable-de-prueba@example.com',responsable_cuil_cuit:'20123456786',vinculo:'Madre',plan_pago_id:plan,estado:'Activo'});
  await save(context,'TURISMO',{id:'turismo-ui',slug:'viaje-de-prueba-ui',titulo:'Escapada a Bariloche de prueba',destino:'Bariloche',estado:'borrador'});
  const r=await context.request.post(base+'/api/public/fichas',{headers:{Origin:base},data:{colegioId:colegio,nivel:'Secundaria',destino:'Bariloche',anio:'2027',grado:'5°',division:'B',planPagoId:plan,pasajeroNombre:'Lucía',pasajeroApellido:'González de Prueba',pasajeroTipoDocumento:'DNI',pasajeroNumeroDocumento:'45222333',pasajeroNacimiento:'2009-03-14',pasajeroSexo:'Femenino',responsableNombre:'María',responsableApellido:'Núñez',responsableTipoDocumento:'DNI',responsableNumeroDocumento:'12345678',responsableNacimiento:'1980-05-02',responsableParentesco:'Madre',responsableCuilCuit:'20123456786',responsableEmail:'familia@example.com',responsableCelular:'3794123456',domicilioCalle:'San Martín',domicilioNumero:'123',domicilioLocalidad:'Goya',domicilioProvincia:'Corrientes',domicilioCodigoPostal:'3450',aceptaCondiciones:true,firma:FIRMA}});
  assert.equal(r.status(),201,await r.text());
}
async function checkLayout(page, width) {
  const data=await page.locator('.admin-layout').evaluate(el=>{
    const visible=n=>n.getClientRects().length>0;
    const buttons=[...el.querySelectorAll('button')].filter(visible);
    const small=buttons.filter(b=>b.getBoundingClientRect().height<43.5).map(b=>b.textContent.trim());
    const cut=buttons.filter(b=>b.scrollWidth>b.clientWidth+2).map(b=>b.textContent.trim());
    const metrics=[...el.querySelectorAll('.admin-payment-dashboard strong')].filter(visible).filter(n=>n.scrollWidth>n.clientWidth+2).map(n=>n.textContent.trim());
    const outer=el.getBoundingClientRect();
    const main=el.querySelector('.admin-main').getBoundingClientRect();
    return {viewport:innerWidth,scroll:document.documentElement.scrollWidth,small,cut,metrics,main:main.width,outer:outer.width};
  });
  assert.ok(data.scroll<=data.viewport+1,JSON.stringify(data));
  assert.deepEqual(data.small,[],'Botones de menos de 44px');
  assert.deepEqual(data.cut,[],'Texto cortado dentro del botón');
  assert.deepEqual(data.metrics,[],'Importes cortados en el resumen');
  if(width>=1440) assert.ok(data.main>width*.7,'El contenido no aprovecha el ancho');
}
async function capture(page,name) {
  if(!process.env.E2E_SCREENSHOTS) return;
  fs.mkdirSync(process.env.E2E_SCREENSHOTS,{recursive:true});
  await page.screenshot({path:path.join(process.env.E2E_SCREENSHOTS,name+'.png'),fullPage:false});
}
(async()=>{
  pool=await crearPoolLocal();db.__test.setPool(pool);
  server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{});
  const loginContext=await browser.newContext();
  await loginContext.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  const loginPage=await loginContext.newPage();
  loginPage.setDefaultTimeout(8000);
  for(const width of [1440,1158,390,320]) await caso(`${width}px: acceso completo, logo, campos y botones`,async()=>{
    await loginPage.setViewportSize({width,height:900});
    await loginPage.goto(base+'/#/admin');
    await loginPage.locator('[data-admin-login-form]').waitFor();
    assert.equal(await loginPage.locator('.admin-login-logo-link img').getAttribute('src'),'assets/img/logo-completo-azul.svg');
    assert.equal(await loginPage.locator('.admin-login-highlights span').count(),7);
    const geometry=await loginPage.locator('.admin-login-card').evaluate(el=>({width:el.getBoundingClientRect().width,scroll:document.documentElement.scrollWidth,viewport:innerWidth,small:[...el.querySelectorAll('button,input')].filter(n=>n.getBoundingClientRect().height<44).length}));
    assert.ok(geometry.scroll<=geometry.viewport+1,JSON.stringify(geometry));
    assert.equal(geometry.small,0);
    if(width>=1158) assert.ok(geometry.width>=width-70,'Acceso demasiado estrecho');
    if(width===1158) await capture(loginPage,'acceso-completo');
  });
  await caso('Acceso: mostrar contraseña y entrar al panel completo',async()=>{
    await loginPage.setViewportSize({width:1440,height:900});
    await loginPage.locator('[name="usuario"]').fill('admin');
    await loginPage.locator('[name="password"]').fill(process.env.EAA_ADMIN_PASSWORD);
    await loginPage.locator('[data-admin-password-toggle]').click();
    assert.equal(await loginPage.locator('[name="password"]').getAttribute('type'),'text');
    assert.equal(await loginPage.locator('[data-admin-password-toggle]').getAttribute('aria-label'),'Ocultar contraseña');
    assert.equal(await loginPage.locator('.admin-password-eye-slash').isVisible(),true);
    await loginPage.locator('[data-admin-password-toggle]').click();
    assert.equal(await loginPage.locator('[name="password"]').getAttribute('type'),'password');
    assert.equal(await loginPage.locator('.admin-password-eye-slash').isVisible(),false);
    await loginPage.route('**/api/admin/login',async route=>{await new Promise(r=>setTimeout(r,500));await route.continue();});
    await loginPage.locator('[type="submit"]').click();
    assert.equal(await loginPage.locator('[type="submit"]').isDisabled(),true);
    assert.equal(await loginPage.locator('[data-admin-password-toggle]').isEnabled(),true);
    await loginPage.locator('.admin-main').waitFor();
    assert.equal(await loginPage.locator('.admin-sidebar nav a').count(),8);
  });
  await loginContext.close();
  const context=await browser.newContext();
  await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  await auth(context);await seed(context);
  const page=await context.newPage();page.setDefaultTimeout(8000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const width of widths) {
    await page.setViewportSize({width,height:960});
    for(const route of routes) await caso(`${width}px: ${route||'resumen'}`,async()=>{
      await page.goto(base+'/#/admin'+(route?'/'+route:''));
      await page.locator('.admin-main').waitFor();
      await checkLayout(page,width);
      if(width<=900){
        assert.equal(await page.locator('.admin-sidebar nav').isVisible(),false);
        await page.locator('[data-admin-nav-toggle]').click();
        await page.locator('.admin-sidebar nav').waitFor();
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.admin-sidebar nav').isVisible(),false);
      }
      if(width>=1440&&route==='colegios') assert.equal(await page.locator('.admin-pasajeros-table-wrap').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'Colegios requiere scroll en escritorio');
      if(['colegios','pagos','pasajeros'].includes(route)&&[1440,390].includes(width)) await capture(page,`${route}-${width}`);
    });
  }
  await page.setViewportSize({width:1440,height:960});
  await caso('Colegios: editar, guardar y cancelar conservan la tabla y el estado',async()=>{
    await page.goto(base+'/#/admin/colegios');
    await page.locator('[data-admin-colegios-editar]').first().click();
    const field=page.locator('[data-admin-colegios-form] [name="nombre"]');
    await field.fill('Colegio editado en prueba local');
    await page.locator('[data-admin-colegios-form] button[type="submit"]').click();
    await page.locator('[data-admin-colegios-status]').waitFor();
    assert.match(await page.locator('.admin-colegios-table').innerText(),/Colegio editado en prueba local/);
    await page.locator('[data-admin-colegios-editar]').first().click();
    await page.locator('[data-admin-colegios-cancelar]').click();
    assert.equal(await page.locator('[data-admin-colegios-cancelar]').count(),0);
  });
  await caso('Contratos: editar y cerrar conserva el registro',async()=>{
    await page.goto(base+'/#/admin/contratos');
    await page.locator('[data-admin-contrato-edit]').first().click();
    await page.locator('.admin-contrato-modal').waitFor();await checkLayout(page,1440);
    await capture(page,'contrato-modal');
    await page.locator('[data-admin-contrato-edit-cancel]').first().click();
  });
  await caso('Pasajeros: cargar/cancelar y filtrar no pierden la fila',async()=>{
    await page.goto(base+'/#/admin/pasajeros');
    await page.locator('[data-admin-pasajeros-open-form]').click();
    await page.locator('[data-admin-pasajeros-form]').waitFor();await checkLayout(page,1440);
    await page.locator('[data-admin-pasajeros-cancel]').first().click();
    await page.locator('[data-admin-pasajeros-search]').fill('José');
    assert.match(await page.locator('[data-admin-pasajeros-results]').innerText(),/José/);
    await page.locator('[data-admin-pasajeros-clear-filters]').click();
  });
  await caso('Pagos: aviso visible y detalle secundario desplegable',async()=>{
    await page.goto(base+'/#/admin/pagos');
    assert.equal(await page.locator('.admin-demo-banner').isVisible(),true);
    const details=page.locator('.admin-payment-architecture');
    assert.notEqual(await details.getAttribute('open'),null);
    assert.equal(await details.locator('.admin-payment-architecture-grid').isVisible(),true);
    await details.locator('summary').focus();await page.keyboard.press('Enter');
    assert.equal(await details.locator('.admin-payment-architecture-grid').isVisible(),false);
  });
  await caso('Fichas y Turismo: controles de revisión y editor accesibles',async()=>{
    await page.goto(base+'/#/admin/fichas');
    await page.locator('[data-ficha-select]').first().click();
    await page.locator('.admin-fichas-detail').waitFor();await checkLayout(page,1440);
    await capture(page,'ficha-detalle');
    await page.goto(base+'/#/admin/turismo');
    await page.locator('[data-admin-new]').click();
    await page.locator('[data-admin-turismo-editor]').waitFor();await checkLayout(page,1440);
    await capture(page,'turismo-editor');
  });
  for(const width of [390,320]) await caso(`${width}px: edición de contratos y alta de pasajeros`,async()=>{
    await page.setViewportSize({width,height:900});
    await page.goto(base+'/#/admin/contratos');
    await page.locator('[data-admin-contrato-edit]').first().click();
    await page.locator('.admin-contrato-modal').waitFor();
    await checkLayout(page,width);
    await page.locator('[data-admin-contrato-edit-cancel]').first().click();
    await page.goto(base+'/#/admin/pasajeros');
    await page.locator('[data-admin-pasajeros-open-form]').click();
    await page.locator('[data-admin-pasajeros-form]').waitFor();
    await checkLayout(page,width);
    await page.locator('[data-admin-pasajeros-cancel]').first().click();
  });
  await caso('Agencia: navegación sin Configuración ni acciones de eliminar',async()=>{
    const agent=await browser.newContext();await agent.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());await auth(agent,true);
    const p=await agent.newPage();await p.goto(base+'/#/admin/turismo');await p.locator('.admin-main').waitFor();
    assert.equal(await p.locator('[data-admin-delete]').count(),0);
    assert.equal(await p.locator('.admin-sidebar a[href="#/admin/configuracion"]').count(),0);
    await agent.close();
  });
  assert.deepEqual(errors,[],'Errores de JavaScript');
  const failures=results.filter(r=>r[0]==='FALLA').length;
  console.log(`${results.length-failures}/${results.length} aprobados; solo PGlite.`);
  process.exitCode=failures?1:0;
})().catch(e=>{console.error(e.message);process.exitCode=2;}).finally(async()=>{
  if(browser) await browser.close();
  if(server?.listening) await new Promise(resolve=>server.close(resolve));
  if(pool) await pool.close();
});
