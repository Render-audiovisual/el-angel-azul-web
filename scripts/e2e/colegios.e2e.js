// E2E del ABM de Colegios del admin contra una base local (PGlite). Manual: no corre con `npm test`.
//   PLAYWRIGHT_PATH=<ruta a node_modules/playwright> node scripts/e2e/colegios.e2e.js
// El pool real de Supabase nunca se crea: DATABASE_URL es falsa y db usa PGlite en memoria.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://nadie:nadie@127.0.0.1:1/nada";
process.env.EAA_POSTGRES_MIGRATION_ENABLED = "true";
process.env.EAA_ADMIN_PASSWORD = "clave-de-prueba";
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const db = require("../../lib/db");
const { crearPoolLocal } = require("../helpers/pglite-pool");
const { createAppServer } = require("../../server");

const results = [];
async function caso(nombre, fn) {
  try { await fn(); results.push(["ok", nombre]); }
  catch (error) { results.push(["FALLA", nombre, error.message.split("\n").slice(0, 3).join(" ")]); }
}

(async () => {
  const pool = await crearPoolLocal();
  db.__test.setPool(pool);
  const server = createAppServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const page = await (await browser.newContext()).newPage();
  await page.route("**/cdn.jsdelivr.net/**", (route) => route.abort());
  page.on("dialog", (dialog) => dialog.accept());
  const filas = () => page.locator(".admin-colegios tbody tr");
  const enBase = async () => (await pool.query("select nombre, provincia, localidad, activo from colegios order by nombre")).rows;
  const agregar = async (nombre, provincia, localidad) => {
    await page.locator('[data-admin-colegios-form] [name="nombre"]').fill(nombre);
    await page.locator('[data-admin-colegios-form] [name="provincia"]').selectOption(provincia);
    await page.locator('[data-admin-colegios-form] [name="localidad"]').fill(localidad);
    await page.locator('[data-admin-colegios-form] button[type="submit"]').click();
  };

  await caso("login y la pantalla Colegios aparece en el menú", async () => {
    await page.goto(`${base}/#/admin/colegios`);
    await page.locator('[name="usuario"]').fill("admin");
    await page.locator('[name="password"]').fill("clave-de-prueba");
    await page.locator('[data-admin-login-form] button[type="submit"]').click();
    await page.locator("[data-admin-colegios-form]").waitFor({ timeout: 8000 });
    assert.ok(await page.locator('.admin-sidebar a:has-text("Colegios")').count());
  });
  await caso("alta: queda en la lista y en la base", async () => {
    await agregar("Escuela Normal Nº 1", "Corrientes", "Goya");
    await page.getByText("agregado.").waitFor({ timeout: 8000 });
    assert.equal(await filas().count(), 1);
    assert.deepEqual(await enBase(), [{ nombre: "Escuela Normal Nº 1", provincia: "Corrientes", localidad: "Goya", activo: true }]);
  });
  await caso("nombre duplicado y nombre corto: error visible, nada se guarda", async () => {
    await agregar("escuela normal nº 1", "Corrientes", "");
    await page.locator("[data-admin-colegios-error]:not([hidden])").waitFor({ timeout: 3000 });
    assert.match(await page.locator("[data-admin-colegios-error]").textContent(), /Ya existe/);
    await page.locator('[data-admin-colegios-form] [name="nombre"]').fill("ab");
    await page.locator('[data-admin-colegios-form] button[type="submit"]').click();
    assert.match(await page.locator("[data-admin-colegios-error]").textContent(), /muy corto/);
    assert.equal((await enBase()).length, 1);
  });
  await caso("edición: cambia nombre, provincia y localidad", async () => {
    await page.locator("[data-admin-colegios-editar]").first().click();
    await page.locator('[data-admin-colegios-form] [name="nombre"]').fill("Escuela Normal Nº 1 Sarmiento");
    await page.locator('[data-admin-colegios-form] [name="provincia"]').selectOption("Chaco");
    await page.locator('[data-admin-colegios-form] [name="localidad"]').fill("Resistencia");
    await page.locator('[data-admin-colegios-form] button[type="submit"]').click();
    await page.getByText("actualizado.").waitFor({ timeout: 8000 });
    assert.equal(await filas().count(), 1);
    assert.deepEqual(await enBase(), [{ nombre: "Escuela Normal Nº 1 Sarmiento", provincia: "Chaco", localidad: "Resistencia", activo: true }]);
  });
  await caso("baja lógica: desaparece de la lista y de la inscripción pero sigue en la base; reactivar la devuelve", async () => {
    await page.locator("[data-admin-colegios-estado]").first().click();
    await page.getByText("dado de baja.").waitFor({ timeout: 8000 });
    assert.equal(await filas().count(), 1); // fila "no hay colegios"
    assert.equal((await enBase())[0].activo, false);
    const publica = await (await fetch(`${base}/api/public/colegios`)).json();
    assert.equal(publica.colegios.length, 0);
    await page.locator("[data-admin-colegios-inactivos]").check();
    await page.locator("[data-admin-colegios-estado]").first().click();
    await page.getByText("reactivado.").waitFor({ timeout: 8000 });
    assert.equal((await enBase())[0].activo, true);
    assert.equal((await (await fetch(`${base}/api/public/colegios`)).json()).colegios.length, 1);
  });
  await caso("recargar la página conserva los colegios (vienen de la base)", async () => {
    await page.reload();
    await page.locator("[data-admin-colegios-form]").waitFor({ timeout: 8000 });
    assert.equal(await filas().count(), 1);
    assert.match(await filas().first().textContent(), /Resistencia/);
  });

  await browser.close(); server.close(); await pool.close();
  for (const r of results) console.log(r.join(" | "));
  const fallas = results.filter((r) => r[0] === "FALLA").length;
  console.log(`\n${results.length - fallas}/${results.length} ok`);
  process.exit(fallas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
