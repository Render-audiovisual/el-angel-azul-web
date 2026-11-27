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
    await page.locator('[data-admin-pasajeros-search]').fill('Fernández');
    assert.match(await page.locator('[data-admin-pasajeros-results]').innerText(),/José/);
    await page.locator('[data-admin-pasajeros-clear-filters]').click();
  });
  await caso('Pagos: importe argentino, error de red, reintento sin duplicación y ficha conectada',async()=>{
    await page.goto(base+'/#/admin/pagos');
    const form=page.locator('[data-payment-form]');await form.waitFor();
    await form.locator('[name="pasajeroId"]').selectOption({index:1});
    const paymentPassenger=await form.locator('[name="pasajeroId"]').inputValue();
    await form.locator('[name="monto"]').fill('12.500,50');
    await form.locator('[name="medio"]').selectOption('transferencia');
    await form.locator('[name="concepto"]').fill('Cuota de prueba');
    await form.locator('[name="referencia"]').fill('REF-UI-001');
    let posts=0;
    await page.route('**/api/admin/pagos',async route=>{
      if(route.request().method()!=='POST')return route.continue();
      posts++;await route.fetch();await route.abort('failed');
    });
    await form.locator('[type="submit"]').click();
    await page.locator('[data-payment-error]').filter({hasText:/No se pudo|Failed|fetch/i}).waitFor();
    assert.equal(await form.locator('[name="monto"]').inputValue(),'12.500,50');
    assert.equal(posts,1);
    await page.unroute('**/api/admin/pagos');
    await form.locator('[type="submit"]').click();
    await page.getByRole('status').filter({hasText:'Pago guardado'}).waitFor();
    const payments=await (await context.request.get(base+'/api/admin/pagos')).json();
    assert.equal(payments.pagos.length,1);assert.equal(Number(payments.pagos[0].monto_centavos),1250050);
    assert.match(await page.locator('.admin-payment-dashboard').innerText(),/12\.500,50/);
    await page.reload();await page.locator('[data-payment-profile]').first().click();
    await page.locator('[data-admin-pasajeros-open-edit]').waitFor();
    assert.match(await page.locator('.admin-main').innerText(),/12\.500,50/);
    assert.match(await page.locator('.admin-main').innerText(),/Cuota de prueba/);
    await page.locator('[data-admin-payment-for]').click();
    await page.locator('[data-payment-form]').waitFor();
    assert.equal(await page.locator('[name="pasajeroId"]').inputValue(),paymentPassenger);
  });
  await caso('Pagos: búsqueda, anulación con motivo y totales actualizados',async()=>{
    await page.goto(base+'/#/admin/pagos');await page.locator('[data-payment-search-form]').waitFor();
    await page.locator('[name="buscar"]').fill('REF-UI-001');
    await page.locator('[data-payment-search-form] button').click();
    assert.equal(await page.locator('[data-payment-annul]').count(),1);
    await page.locator('[data-payment-annul]').click();
    await page.locator('[name="motivo"]').fill('Transferencia devuelta de prueba');
    await page.locator('[data-payment-annul-form] [type="submit"]').click();
    await page.getByRole('status').filter({hasText:'Pago anulado'}).waitFor();
    assert.equal(await page.locator('[data-payment-annul]').count(),0);
    assert.match(await page.locator('.admin-payment-ledger').innerText(),/Transferencia devuelta de prueba/);
    assert.match(await page.locator('.admin-payment-dashboard strong').first().innerText(),/0,00/);
    await capture(page,'pagos-historial');
    const ledger=await (await context.request.get(base+'/api/admin/pagos')).json();
    assert.equal(ledger.pagos.length,1);assert.equal(ledger.pagos[0].estado,'anulado');
    assert.equal(Number(ledger.pagos[0].monto_centavos),1250050);
  });
  await caso('Pagos: base sin migración informa el problema y permite reintentar',async()=>{
    await page.route('**/api/admin/pagos',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({ok:false,error:'El registro manual de pagos todavía no está habilitado en esta base.'})}));
    await page.goto(base+'/#/admin/pagos');await page.reload();await page.locator('[data-payment-retry]').waitFor();
    assert.equal(await page.locator('[data-payment-form]').count(),0);
    assert.equal(await page.locator('.admin-payment-dashboard').count(),0);
    await page.unroute('**/api/admin/pagos');
    await page.locator('[data-payment-retry]').click();await page.locator('[data-payment-form]').waitFor();
  });
  await caso('Contratos: error al guardar conserva el formulario y su borrador',async()=>{
    await page.goto(base+'/#/admin/contratos');await page.locator('[data-admin-contrato-edit]').first().click();
    const form=page.locator('[data-admin-contrato-edit-form]');
    await form.locator('[name="observaciones"]').fill('Observación de prueba que debe conservarse');
    await page.route('**/api/google-sheets',route=>route.request().method()==='POST'?route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({ok:false,error:'Fallo simulado de guardado'})}):route.continue());
    await form.locator('[type="submit"]').click();
    await page.getByText(/No se pudo guardar/).first().waitFor();
    assert.equal(await form.locator('[name="observaciones"]').inputValue(),'Observación de prueba que debe conservarse');
    await page.unroute('**/api/google-sheets');
    const responsePromise=page.waitForResponse(r=>r.url()===base+'/api/google-sheets'&&r.request().method()==='POST');
    await form.locator('[type="submit"]').click();
    const response=await responsePromise;assert.equal(response.status(),200,await response.text());
    await form.waitFor({state:'detached'});
    const rows=await (await context.request.get(base+'/api/google-sheets?sheet=CONTRATOS')).json();
    assert.match(JSON.stringify(rows),/Observación de prueba que debe conservarse/);
  });
  await caso('Pasajeros: error de guardado conserva la edición y permite corregirla',async()=>{
    await page.goto(base+'/#/admin/pasajeros');
    await page.locator('[data-admin-pasajeros-open-profile]').first().click();
    await page.locator('[data-admin-pasajeros-open-edit]').click();
    const form=page.locator('[data-admin-pasajeros-edit-form]');
    await form.locator('[name="telefono"]').fill('3794999999');
    await page.route('**/api/google-sheets',route=>route.request().method()==='POST'?route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({ok:false,error:'Fallo simulado de guardado'})}):route.continue());
    await form.locator('[type="submit"]').click();
    await page.getByText(/No se pudo guardar/).first().waitFor();
    assert.equal(await form.locator('[name="telefono"]').inputValue(),'3794999999');
    await page.unroute('**/api/google-sheets');
    const responsePromise=page.waitForResponse(r=>r.url()===base+'/api/google-sheets'&&r.request().method()==='POST');
    await form.locator('[type="submit"]').click();
    const response=await responsePromise;assert.equal(response.status(),200,await response.text());
    await form.waitFor({state:'detached'});
    const rows=await (await context.request.get(base+'/api/google-sheets?sheet=PASAJEROS')).json();
    assert.match(JSON.stringify(rows),/3794999999/);
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
  await caso('Ficha: un error al crear pasajero no aprueba; un error posterior permite completar sin duplicar',async()=>{
    await page.goto(base+'/#/admin/fichas');await page.reload();
    await page.locator('[data-ficha-select]').first().click();
    await page.locator('[data-ficha-start-review]').click();
    await page.locator('[data-ficha-aprobar]').waitFor();
    if(await page.locator('[data-ficha-aprobar]').isDisabled()) {
      await page.locator('[data-ficha-assign-field="grupoId"]').selectOption('grupo-ui');
      await page.locator('[data-ficha-assign-field="contratoId"]').selectOption('contrato-ui');
      await page.locator('[data-ficha-save-assignment]').click();
    }
    assert.equal(await page.locator('[data-ficha-aprobar]').isEnabled(),true,await page.locator('.admin-fichas-detail').innerText());
    const before=Number((await pool.query('select count(*) as n from pasajeros')).rows[0].n);
    let failSheet='PASAJEROS';
    await page.route('**/api/google-sheets',route=>route.request().method()==='POST'&&route.request().postDataJSON().sheet===failSheet?route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({ok:false,error:'Fallo simulado de aprobación'})}):route.continue());
    await page.locator('[data-ficha-aprobar]').click();
    await page.getByText(/No se aprobó la ficha/).first().waitFor();
    assert.equal(Number((await pool.query('select count(*) as n from pasajeros')).rows[0].n),before);
    assert.equal((await pool.query('select estado_revision from fichas_adhesion')).rows[0].estado_revision,'revisada');
    failSheet='FICHAS_ADHESION';
    await page.locator('[data-ficha-aprobar]').click();
    await page.getByText(/El pasajero quedó guardado/).first().waitFor();
    assert.equal(Number((await pool.query('select count(*) as n from pasajeros')).rows[0].n),before+1);
    await page.unroute('**/api/google-sheets');
    await page.reload();
    await page.locator('[data-admin-fichas-filter="revision"]').click();
    await page.locator('[data-ficha-select]').first().click();
    await page.locator('[data-ficha-aprobar]').click();
    await page.getByText(/Ficha aprobada y pasajero creado/).first().waitFor();
    assert.equal(Number((await pool.query('select count(*) as n from pasajeros')).rows[0].n),before+1);
    assert.equal((await pool.query('select estado_revision from fichas_adhesion')).rows[0].estado_revision,'aprobada');
    const downloadPromise=page.waitForEvent('download');
    await page.locator('[data-ficha-pdf]').first().click();
    const pdf=await downloadPromise;
    const bytes=fs.readFileSync(await pdf.path());
    const document=await require('pdf-lib').PDFDocument.load(bytes);
    assert.ok(document.getPageCount()>0);assert.match(pdf.suggestedFilename(),/\.pdf$/);
    await page.goto(base+'/#/admin/pasajeros');
    await page.locator('[data-admin-pasajeros-search]').fill('45222333');
    await page.locator('[data-admin-pasajeros-open-profile]').first().click();
    await page.locator('[data-admin-payment-for]').click();
    const form=page.locator('[data-payment-form]');await form.waitFor();
    const id=(await pool.query("select p.legacy_id from pasajeros p join personas pe on pe.id=p.persona_id where pe.numero_documento='45222333'")).rows[0].legacy_id;
    assert.equal(await form.locator('[name="pasajeroId"]').inputValue(),id,'El pasajero recién creado debe usar su identificador guardado');
    await form.locator('[name="monto"]').fill('0,01');
    await form.locator('[name="medio"]').selectOption('efectivo');
    await form.locator('[name="concepto"]').fill('Pago posterior a aprobación');
    await form.locator('[type="submit"]').click();
    await page.getByRole('status').filter({hasText:'Pago guardado'}).waitFor();

  });
  await caso('Exportación: informa si falta la herramienta y descarga columnas reales de pasajeros',async()=>{
    await page.goto(base+'/#/admin/pasajeros');await page.reload();
    await page.locator('[data-admin-pasajeros-export]').click();
    await page.locator('[data-export-error]').waitFor();
    assert.match(await page.locator('[data-export-error]').innerText(),/Excel/);
    assert.ok(process.env.E2E_XLSX_PATH,'Indicá la copia local verificada de la biblioteca existente con E2E_XLSX_PATH');
    const library='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    await page.route(library,route=>route.fulfill({path:process.env.E2E_XLSX_PATH,contentType:'application/javascript',headers:{'access-control-allow-origin':'*'}}));
    await page.addScriptTag({url:library});
    await page.locator('[data-admin-pasajeros-search]').fill('45111222');
    const downloadPromise=page.waitForEvent('download');
    await page.locator('[data-admin-pasajeros-export]').click();
    const download=await downloadPromise;
    const xlsx=require(process.env.E2E_XLSX_PATH);
    const workbook=xlsx.read(fs.readFileSync(await download.path()),{type:'buffer'});
    const data=xlsx.utils.sheet_to_json(workbook.Sheets.Pasajeros);
    assert.equal(data.length,1);
    assert.equal(data[0].Apellido,'Fernández de los Ángeles');assert.equal(data[0].DNI,'45111222');
    assert.equal(data[0].Plan,'12 cuotas mensuales');assert.equal(data[0]['División'],'B');
    assert.equal(data[0]['Tutor apellido'],'Fernández');assert.equal(data[0].Email,(await db.listPasajerosAdmin()).find(p=>p.dni==='45111222').responsable_email);
    await page.locator('[data-admin-pasajeros-clear-filters]').click();
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
    await p.goto(base+'/#/admin/pagos');await p.locator('[data-payment-form]').waitFor();
    assert.equal(await p.locator('[data-payment-annul]').count(),0);
    const denied=await agent.request.post(base+'/api/admin/pagos/11111111-2222-4333-8444-555555555555/anular',{headers:{Origin:base},data:{motivo:'No autorizado'}});
    assert.equal(denied.status(),403);
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
