// E2E de la Ficha de Adhesión pública (PAX y Tutor). Manual: no corre con `npm test`.
//   PLAYWRIGHT_PATH=<ruta a node_modules/playwright> node scripts/e2e/ficha.e2e.js
// Levanta el servidor real con la capa `db` simulada en memoria: NUNCA toca la base real.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://nadie:nadie@127.0.0.1:1/nada";
const assert = require("node:assert/strict");
const { chromium, devices } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const db = require("../../lib/db");
const { createAppServer } = require("../../server");

const COLEGIO = "3f1c2a8e-5b6d-4c7e-8f9a-0b1c2d3e4f5a";
const PLAN = "11111111-2222-4333-8444-555555555555";
const guardadas = { pax: [], tutor: [] };
const sim = { planes: [{ id: PLAN, nombre: "Plan 6 cuotas", cuotas: 6 }], contextoFalla: 0, insertFalla: false };
db.contextoInscripcion = async () => {
  if (sim.contextoFalla > 0) { sim.contextoFalla -= 1; throw new Error("db caída"); }
  return { contrato: { codigo: "C-1" }, grupoId: null, planes: sim.planes };
};
db.insertFichaPublica = async (datos) => {
  if (sim.insertFalla) throw new Error("db caída");
  guardadas.pax.push(datos); return { id: String(guardadas.pax.length) };
};
db.insertFichaTutor = async (datos) => {
  if (sim.insertFalla) throw new Error("db caída");
  guardadas.tutor.push(datos); return { id: String(guardadas.tutor.length) };
};
db.setFichaEmailResultado = async () => {};
db.listColegiosPublicos = async () => [];

const PAX_URL = (extra = "") => `/#/inscripcion/ficha-adhesion?nivel=Secundaria&destino=Bariloche&anio=2027&colegioId=${COLEGIO}&grado=5%C2%B0&division=B${extra}`;
const results = [];
async function caso(nombre, fn) {
  try { await fn(); results.push(["ok", nombre]); }
  catch (error) { results.push(["FALLA", nombre, error.message.split("\n")[0]]); }
}
async function llenar(page, valores) {
  for (const [name, valor] of Object.entries(valores)) {
    const el = page.locator(`[name="${name}"]`);
    if ((await el.evaluate((n) => n.tagName)) === "SELECT") await el.selectOption(valor);
    else await el.fill(valor);
  }
}
async function fecha(page, nombre, d, m, a) {
  const g = page.locator(`[data-dob-group="${nombre}"]`);
  await g.locator("[data-dob-day]").fill(d); await g.locator("[data-dob-month]").fill(m); await g.locator("[data-dob-year]").fill(a);
}
async function firmar(page) {
  await page.locator("[data-ficha-signature]").scrollIntoViewIfNeeded();
  const box = await page.locator("[data-ficha-signature]").boundingBox();
  await page.mouse.move(box.x + 20, box.y + 20); await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + 60, { steps: 5 }); await page.mouse.up();
}
const PAX = {
  pasajeroNombre: "José María", pasajeroApellido: "Fernández Núñez", pasajeroNumeroDocumento: "45123456", pasajeroSexo: "Masculino",
  responsableNombre: "María", responsableApellido: "Núñez", responsableNumeroDocumento: "12345678", responsableParentesco: "Madre",
  responsableCuilCuit: "20-12345678-6", responsableEmail: "maria@gmail.com", responsableCelular: "3794 123456",
  domicilioCalle: "Av. 3 de Abril", domicilioNumero: "1234", domicilioLocalidad: "Corrientes", domicilioProvincia: "Corrientes", domicilioCodigoPostal: "3400"
};
let base, server, browser;
async function abrirPax(page, extra) {
  await page.goto(base + PAX_URL(extra));
  await page.waitForSelector("[data-ficha-adhesion-form]");
  await page.waitForFunction(() => document.querySelector("[data-ficha-contrato]").textContent !== "buscando…");
}
async function completarPax(page, over = {}) {
  await llenar(page, { ...PAX, ...over });
  await fecha(page, "pasajeroNacimiento", "14", "03", "2009");
  await fecha(page, "responsableNacimiento", "02", "05", "1980");
  await page.locator('input[name="planPagoId"]').first().check().catch(() => {});
  await page.locator('[name="aceptaCondiciones"]').check();
  await firmar(page);
}
const exito = (page) => page.getByText("Recibimos tu ficha correctamente.").isVisible();
const submit = (page) => page.locator(".ficha-adhesion-submit").click();
const okTexto = (page) => page.getByText("Recibimos tu ficha correctamente.").waitFor({ timeout: 5000 });

(async () => {
  server = createAppServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
  const nuevaPagina = async (opts = {}) => {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    page.on("response", async (r) => { if (process.env.DBG && r.url().includes("/api/public/fichas")) console.log("RESP", r.status(), (await r.text()).slice(0, 300)); });
    await page.route("**/cdn.jsdelivr.net/**", (route) => route.abort());
    await page.route("**/apis.datos.gob.ar/**", (route) => route.fulfill({ json: { localidades: [{ nombre: "Corrientes" }, { nombre: "Capital" }] } }));
    return page;
  };

  await caso("PAX: envío válido → 201, éxito y datos normalizados", async () => {
    const page = await nuevaPagina(); await abrirPax(page); await completarPax(page); await submit(page);
    await okTexto(page);
    const f = guardadas.pax.at(-1);
    assert.equal(f.pasajeroNombre, "José María"); assert.equal(f.responsableCuilCuit, "20123456786"); assert.equal(f.planPagoId, PLAN);
  });

  const obligatorios = ["pasajeroNombre", "pasajeroApellido", "pasajeroNumeroDocumento", "pasajeroSexo", "responsableNombre", "responsableApellido",
    "responsableNumeroDocumento", "responsableParentesco", "responsableCuilCuit", "responsableEmail", "responsableCelular",
    "domicilioCalle", "domicilioNumero", "domicilioLocalidad", "domicilioCodigoPostal"];
  for (const campo of obligatorios) {
    await caso(`PAX: falta ${campo} → error visible, sin POST, datos intactos`, async () => {
      const page = await nuevaPagina(); await abrirPax(page);
      let posts = 0; page.on("request", (r) => { if (r.url().includes("/api/public/fichas")) posts += 1; });
      await completarPax(page, { [campo]: "" });
      await submit(page);
      await page.locator(`[data-error-for="${campo}"]:not([hidden])`).waitFor({ timeout: 3000 });
      assert.equal(posts, 0); assert.equal(await exito(page), false);
      assert.equal(await page.locator('[name="responsableEmail"]').inputValue(), campo === "responsableEmail" ? "" : "maria@gmail.com");
    });
  }
  for (const campo of ["pasajeroNacimiento", "responsableNacimiento"]) {
    await caso(`PAX: falta ${campo}`, async () => {
      const page = await nuevaPagina(); await abrirPax(page); await completarPax(page);
      await page.locator(`[data-dob-group="${campo}"] [data-dob-year]`).fill("");
      await submit(page);
      await page.locator(`[data-error-for="${campo}"]:not([hidden])`).waitFor({ timeout: 3000 });
    });
  }
  await caso("PAX: falta firma / condiciones", async () => {
    const page = await nuevaPagina(); await abrirPax(page); await completarPax(page);
    await page.locator('[name="aceptaCondiciones"]').uncheck(); await page.locator("[data-ficha-clear-signature]").click(); await submit(page);
    await page.locator('[data-error-for="aceptaCondiciones"]:not([hidden])').waitFor({ timeout: 3000 });
    await page.locator('[data-error-for="firma"]:not([hidden])').waitFor({ timeout: 3000 });
  });
  await caso("PAX: falta plan de pago", async () => {
    const page = await nuevaPagina(); await abrirPax(page); await completarPax(page);
    await page.locator('input[name="planPagoId"]').first().evaluate((n) => { n.checked = false; });
    await submit(page); await page.locator('[data-error-for="planPagoId"]:not([hidden])').waitFor({ timeout: 3000 });
  });
  await caso("PAX: CUIL con dígito verificador malo y CUIL que no coincide con DNI", async () => {
    const page = await nuevaPagina(); await abrirPax(page); await completarPax(page, { responsableCuilCuit: "20-12345678-5" });
    await submit(page);
    assert.match(await page.locator('[data-error-for="responsableCuilCuit"]').textContent(), /inválido/);
    await page.locator('[name="responsableCuilCuit"]').fill("27-11111111-2"); await submit(page);
    assert.match(await page.locator('[data-error-for="responsableCuilCuit"]').textContent(), /no coincide|inválido/);
  });
  await caso("PAX: correo con typo sugiere y 'Usar' lo corrige; celular inválido", async () => {
    const page = await nuevaPagina(); await abrirPax(page);
    await page.locator('[name="responsableEmail"]').fill("maria@gmail.con"); await page.locator('[name="responsableEmail"]').blur();
    await page.locator("[data-usar-email]").click();
    assert.equal(await page.locator('[name="responsableEmail"]').inputValue(), "maria@gmail.com");
    await completarPax(page, { responsableCelular: "123" }); await submit(page);
    await page.locator('[data-error-for="responsableCelular"]:not([hidden])').waitFor({ timeout: 3000 });
  });
  await caso("PAX: apóstrofo curvo y tilde descompuesta se aceptan end-to-end", async () => {
    const page = await nuevaPagina(); await abrirPax(page);
    await completarPax(page, { pasajeroApellido: "D’Angelo", pasajeroNombre: "José" }); await submit(page);
    await okTexto(page);
    assert.equal(guardadas.pax.at(-1).pasajeroApellido, "D'Angelo"); assert.equal(guardadas.pax.at(-1).pasajeroNombre, "José");
  });
  await caso("Dirección: Georef sugiere localidades", async () => {
    const page = await nuevaPagina(); await abrirPax(page);
    await page.locator('[name="domicilioLocalidad"]').fill("Cor");
    await page.waitForFunction(() => document.querySelectorAll("#localidades-lista option").length === 2);
  });
  await caso("Dirección: Georef caído (500/abort/html) → localidad a mano y envío OK", async () => {
    for (const modo of ["500", "abort", "html"]) {
      const page = await nuevaPagina();
      await page.route("**/apis.datos.gob.ar/**", (route) => modo === "abort" ? route.abort() : route.fulfill({ status: modo === "500" ? 500 : 200, body: "<html>no json</html>" }));
      await abrirPax(page); await completarPax(page, { domicilioLocalidad: "Lomas de Vallejos" }); await submit(page);
      await okTexto(page);
    }
  });
  await caso("Dirección: respuesta vieja de Georef de otra provincia no pisa la lista", async () => {
    const page = await nuevaPagina(); await abrirPax(page);
    await page.route("**/apis.datos.gob.ar/**", async (route) => {
      await new Promise((r) => setTimeout(r, 600));
      await route.fulfill({ json: { localidades: [{ nombre: "VIEJA" }] } });
    });
    await page.locator('[name="domicilioLocalidad"]').fill("Cor");
    await page.waitForTimeout(400);
    await page.locator('[name="domicilioProvincia"]').selectOption("Chaco");
    await page.waitForTimeout(1000);
    assert.equal(await page.locator("#localidades-lista option").count(), 0);
  });
  await caso("Dirección: CP inválido, número inválido, luego S/N y CPA válidos", async () => {
    const page = await nuevaPagina(); await abrirPax(page);
    await completarPax(page, { domicilioCodigoPostal: "34", domicilioNumero: "12a" }); await submit(page);
    await page.locator('[data-error-for="domicilioCodigoPostal"]:not([hidden])').waitFor({ timeout: 3000 });
    await page.locator('[data-error-for="domicilioNumero"]:not([hidden])').waitFor({ timeout: 3000 });
    await page.locator('[name="domicilioCodigoPostal"]').fill("W3400ABC"); await page.locator('[name="domicilioNumero"]').fill("s/n"); await submit(page);
    await okTexto(page);
  });
  await caso("Falla servidor 500 → sin éxito, datos y firma intactos, reintento OK", async () => {
    const page = await nuevaPagina(); await abrirPax(page); await completarPax(page);
    sim.insertFalla = true; await submit(page);
    await page.locator("[data-ficha-error]:not([hidden])").waitFor({ timeout: 5000 });
    assert.equal(await exito(page), false);
    assert.equal(await page.locator('[name="responsableEmail"]').inputValue(), "maria@gmail.com");
    sim.insertFalla = false; await submit(page);
    await okTexto(page);
  });
  await caso("Red caída → mensaje, sin éxito, botón reactivado", async () => {
    const page = await nuevaPagina(); await abrirPax(page); await completarPax(page);
    await page.route("**/api/public/fichas", (route) => route.abort());
    await submit(page); await page.locator("[data-ficha-error]:not([hidden])").waitFor({ timeout: 5000 });
    assert.equal(await exito(page), false); assert.equal(await page.locator(".ficha-adhesion-submit").isEnabled(), true);
  });
  await caso("200 / 202 no cuentan como éxito (solo 201)", async () => {
    const page = await nuevaPagina(); await abrirPax(page); await completarPax(page);
    await page.route("**/api/public/fichas", (route) => route.fulfill({ status: 200, json: { ok: true, id: "1" } }));
    await submit(page); await page.locator("[data-ficha-error]:not([hidden])").waitFor({ timeout: 5000 });
    assert.equal(await exito(page), false);
  });
  await caso("Doble clic en Enviar → una sola ficha", async () => {
    const page = await nuevaPagina(); await abrirPax(page); await completarPax(page);
    const antes = guardadas.pax.length;
    await page.locator(".ficha-adhesion-submit").dblclick();
    await okTexto(page);
    assert.equal(guardadas.pax.length - antes, 1);
  });
  await caso("Planes: contexto lento → el envío espera los planes y pide elegir uno (campo visible)", async () => {
    const page = await nuevaPagina();
    await page.route("**/api/public/inscripcion-context*", async (route) => { await new Promise((r) => setTimeout(r, 1200)); await route.continue(); });
    await page.goto(base + PAX_URL()); await page.waitForSelector("[data-ficha-adhesion-form]");
    await llenar(page, PAX); await fecha(page, "pasajeroNacimiento", "14", "03", "2009"); await fecha(page, "responsableNacimiento", "02", "05", "1980");
    await page.locator('[name="aceptaCondiciones"]').check(); await firmar(page); await submit(page);
    await page.locator('[data-error-for="planPagoId"]:not([hidden])').waitFor({ timeout: 6000 });
    assert.equal(await exito(page), false);
  });
  await caso("Planes: contexto falla al cargar → mensaje claro con datos intactos, y el reintento funciona", async () => {
    const page = await nuevaPagina(); sim.contextoFalla = 1;
    await page.goto(base + PAX_URL()); await page.waitForSelector("[data-ficha-adhesion-form]"); await page.waitForTimeout(500);
    await completarPax(page); sim.contextoFalla = 1; await submit(page);
    await page.locator("[data-ficha-error]:not([hidden])").waitFor({ timeout: 5000 });
    assert.match(await page.locator("[data-ficha-error]").textContent(), /planes de pago/);
    assert.equal(await page.locator('[name="responsableEmail"]').inputValue(), "maria@gmail.com");
    await page.locator('input[name="planPagoId"]').first().waitFor({ state: "attached", timeout: 100 }).catch(() => {});
    await submit(page);
    await page.locator('input[name="planPagoId"]').first().check({ timeout: 5000 }); await submit(page); await okTexto(page);
  });
  await caso("Colegio fuera de lista (texto) sin planes → envío válido", async () => {
    const page = await nuevaPagina();
    await page.goto(`${base}/#/inscripcion/ficha-adhesion?nivel=Primaria&destino=Bariloche&anio=2027&colegioTexto=Escuela%20Normal%202&grado=6%C2%B0&division=A`);
    await page.waitForSelector("[data-ficha-adhesion-form]"); await completarPax(page); await submit(page);
    await okTexto(page);
  });
  await caso("Contexto manipulado (hash inválido) → vuelve a /inscripcion", async () => {
    const page = await nuevaPagina(); await page.goto(`${base}/#/inscripcion/ficha-adhesion?nivel=Primaria&grado=9%C2%B0`);
    await page.waitForFunction(() => location.hash === "#/inscripcion", null, { timeout: 5000 });
  });

  // ---- Tutor ----
  const TUTOR = { pasajeroNombre: "Ana", pasajeroApellido: "Pérez", pasajeroNumeroDocumento: "45123456", nombre: "María", apellido: "Núñez",
    numeroDocumento: "12345678", cuilCuit: "20-12345678-6", parentesco: "Madre", celular: "3794123456", email: "maria@gmail.com" };
  const abrirTutor = async (page) => { await page.goto(`${base}/#/inscripcion/tutor`); await page.waitForSelector("[data-ficha-tutor-form]"); };
  await caso("Tutor: envío válido → 201 y pantalla de éxito", async () => {
    const page = await nuevaPagina(); await abrirTutor(page); await llenar(page, TUTOR); await page.locator('[name="aceptaCondiciones"]').check(); await submit(page);
    await page.getByText("Registramos tus datos como tutor.").waitFor({ timeout: 5000 });
    assert.equal(guardadas.tutor.at(-1).cuilCuit, "20123456786");
  });
  for (const campo of Object.keys(TUTOR)) {
    await caso(`Tutor: falta ${campo}`, async () => {
      const page = await nuevaPagina(); await abrirTutor(page); await llenar(page, { ...TUTOR, [campo]: "" });
      await page.locator('[name="aceptaCondiciones"]').check(); await submit(page);
      await page.locator(`[data-error-for="${campo}"]:not([hidden])`).waitFor({ timeout: 3000 });
      assert.equal(await page.getByText("Registramos tus datos como tutor.").isVisible(), false);
    });
  }
  await caso("Tutor: sin condiciones / CUIL inválido / CUIL≠DNI", async () => {
    const page = await nuevaPagina(); await abrirTutor(page); await llenar(page, TUTOR); await submit(page);
    await page.locator('[data-error-for="aceptaCondiciones"]:not([hidden])').waitFor({ timeout: 3000 });
    await page.locator('[name="aceptaCondiciones"]').check();
    await page.locator('[name="cuilCuit"]').fill("20-12345678-0"); await submit(page);
    assert.match(await page.locator('[data-error-for="cuilCuit"]').textContent(), /inválido/);
    await page.locator('[name="cuilCuit"]').fill("27-11111111-2"); await submit(page);
    assert.ok((await page.locator('[data-error-for="cuilCuit"]').textContent()).length > 0);
  });
  await caso("Tutor: falla 500 → sin éxito y datos intactos; red caída igual", async () => {
    const page = await nuevaPagina(); await abrirTutor(page); await llenar(page, TUTOR); await page.locator('[name="aceptaCondiciones"]').check();
    sim.insertFalla = true; await submit(page); await page.locator("[data-ficha-error]:not([hidden])").waitFor({ timeout: 5000 });
    assert.equal(await page.locator('[name="email"]').inputValue(), "maria@gmail.com");
    sim.insertFalla = false;
    await page.route("**/api/public/fichas-tutor", (route) => route.abort()); await submit(page);
    await page.locator("[data-ficha-error]:not([hidden])").waitFor({ timeout: 5000 });
    assert.equal(await page.getByText("Registramos tus datos como tutor.").isVisible(), false);
  });

  // ---- Mobile ----
  await caso("Mobile (iPhone 13): sin scroll horizontal, firma táctil y envío OK", async () => {
    const page = await nuevaPagina({ ...devices["iPhone 13"] }); await abrirPax(page);
    const ancho = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    assert.ok(ancho[0] <= ancho[1] + 1, `scroll horizontal ${ancho}`);
    await llenar(page, PAX); await fecha(page, "pasajeroNacimiento", "14", "03", "2009"); await fecha(page, "responsableNacimiento", "02", "05", "1980");
    await page.locator('input[name="planPagoId"]').first().check(); await page.locator('[name="aceptaCondiciones"]').check();
    const c = page.locator("[data-ficha-signature]"); await c.scrollIntoViewIfNeeded();
    const box = await c.boundingBox();
    await page.evaluate(({ x, y }) => {
      const el = document.querySelector("[data-ficha-signature]");
      const t = (type, dx, dy) => el.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === "touchend" ? [] : [new Touch({ identifier: 1, target: el, clientX: x + dx, clientY: y + dy })] }));
      t("touchstart", 10, 10); t("touchmove", 60, 30); t("touchmove", 120, 50); t("touchend", 0, 0);
    }, { x: box.x, y: box.y });
    await page.locator(".ficha-adhesion-submit").scrollIntoViewIfNeeded(); await submit(page);
    await okTexto(page);
  });
  await caso("Mobile (320px): PAX y tutor sin scroll horizontal", async () => {
    const page = await nuevaPagina({ ...devices["Pixel 5"], viewport: { width: 320, height: 640 } });
    await abrirPax(page);
    let ancho = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    assert.ok(ancho[0] <= ancho[1] + 1, `PAX scroll horizontal ${ancho}`);
    await abrirTutor(page);
    ancho = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    assert.ok(ancho[0] <= ancho[1] + 1, `tutor scroll horizontal ${ancho}`);
  });

  await browser.close(); server.close();
  for (const r of results) console.log(r.join(" | "));
  const fallas = results.filter((r) => r[0] === "FALLA").length;
  console.log(`\n${results.length - fallas}/${results.length} ok`);
  process.exit(fallas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
