// Pendientes de la auditoría del 28/11: auditoría de ingresos, hojas PAGOS/CUOTAS retiradas y tope de documentos de la familia.
const test = require("node:test"), assert = require("node:assert/strict"), crypto = require("node:crypto");
Object.assign(process.env, { NODE_ENV: "test", DATABASE_URL: "pglite-en-memoria", EAA_POSTGRES_MIGRATION_ENABLED: "true", EAA_ADMIN_PASSWORD: "Prueba-pendientes-local-42", EAA_AGENTE1_PASSWORD: "Prueba-pendientes-agencia-42" });
const { PDFDocument } = require("pdf-lib"), db = require("../lib/db"), documents = require("../lib/documents"), { crearPoolLocal } = require("./helpers/pglite-pool"), { createAppServer } = require("../server");

let pool, server, base, admin, portal, pdfBytes, pax;
const objects = new Map();
async function request(path, body, cookie = admin) {
  return fetch(base + path, { method: body ? "POST" : "GET", headers: { Origin: base, ...(cookie ? { Cookie: cookie } : {}), ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
async function login(username, password) {
  const response = await request("/api/admin/login", { username, password }, null);
  assert.equal(response.status, 200);
  return response.headers.get("set-cookie").split(";")[0];
}
async function eventosDeSesion() {
  for (let i = 0; i < 50; i++) { // la auditoría de sesión se escribe sin frenar la respuesta
    const rows = (await pool.query("select accion, actor_username, detalle from eventos_administrativos where entidad='sesion_admin' order by id")).rows;
    if (rows.length) return rows;
    await new Promise((r) => setTimeout(r, 20));
  }
  return [];
}

test.before(async () => {
  pool = await crearPoolLocal();
  db.__test.setPool(pool);
  documents.__test.setStorage({ configured: () => true, put: async (p, d) => objects.set(p, Buffer.from(d)), get: async (p) => objects.get(p), remove: async (p) => objects.delete(p) });
  const pdf = await PDFDocument.create(); pdf.addPage(); pdfBytes = Buffer.from(await pdf.save());
  server = createAppServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + server.address().port;
  admin = await login("admin", process.env.EAA_ADMIN_PASSWORD);
  const school = (await pool.query("insert into colegios(nombre) values('Colegio de prueba pendientes') returning id")).rows[0].id;
  const trip = (await pool.query("insert into viajes(categoria,nivel,destino,titulo) values('estudiantil','Secundaria','Bariloche 2027','Bariloche 2027') returning id")).rows[0].id;
  const group = (await pool.query("insert into grupos(viaje_id,colegio_id,curso,division) values($1,$2,'5°','A') returning id", [trip, school])).rows[0].id;
  const contract = (await pool.query("insert into contratos(viaje_id,grupo_id,codigo_contrato,estado) values($1,$2,'PEND-PRUEBA','activo') returning id", [trip, group])).rows[0].id;
  const person = (await pool.query("insert into personas(nombre,numero_documento) values('PAX de prueba','45111229') returning id")).rows[0].id;
  pax = (await pool.query("insert into pasajeros(persona_id,viaje_id,grupo_id,contrato_id) values($1,$2,$3,$4) returning id", [person, trip, group, contract])).rows[0].id;
  const invite = await request("/api/admin/portal/pasajeros/" + pax + "/invitar", { tipo: "pasajero", destinatarioId: person, canalVerificado: true });
  const token = new URL("http://local.test" + (await invite.json()).enlace).hash.split("acceso=")[1];
  portal = (await request("/api/portal/acceso", { token }, null)).headers.get("set-cookie").split(";")[0];
});
test.after(async () => { if (server?.listening) await new Promise((r) => server.close(r)); await pool?.close(); });

test("el ingreso y la salida del panel quedan auditados, sin IP ni clave", async () => {
  const eventos = await eventosDeSesion();
  assert.deepEqual(eventos.map((e) => e.accion), ["ingresar"]);
  assert.equal(eventos[0].actor_username, "admin");
  assert.deepEqual(eventos[0].detalle, { rol: "admin" });
  await request("/api/admin/logout", {});
  for (let i = 0; i < 50; i++) {
    const total = (await pool.query("select count(*)::int as n from eventos_administrativos where entidad='sesion_admin' and accion='salir'")).rows[0].n;
    if (total) return assert.equal(total, 1);
    await new Promise((r) => setTimeout(r, 20));
  }
  assert.fail("no se auditó la salida");
});

test("un ingreso fallido no genera eventos de sesión", async () => {
  const antes = (await pool.query("select count(*)::int as n from eventos_administrativos where entidad='sesion_admin'")).rows[0].n;
  const response = await request("/api/admin/login", { username: "admin", password: "clave-incorrecta" }, null);
  assert.equal(response.status, 401);
  const despues = (await pool.query("select count(*)::int as n from eventos_administrativos where entidad='sesion_admin'")).rows[0].n;
  assert.equal(despues, antes);
});

test("las hojas PAGOS y CUOTAS ya no se leen por Google Sheets: 410 en vez de 500", async () => {
  admin = await login("admin", process.env.EAA_ADMIN_PASSWORD);
  for (const sheet of ["PAGOS", "CUOTAS"]) {
    const response = await request("/api/google-sheets?sheet=" + sheet);
    assert.equal(response.status, 410, sheet);
    assert.match((await response.json()).error, /ya no se usa/);
  }
});

test("la familia no puede pasar de 30 documentos por pasajero; la agencia no tiene ese tope", async () => {
  const subir = (cookie, ruta) => request(ruta, { id: crypto.randomUUID(), nombre: "Comprobante.pdf", mime: "application/pdf", contenidoBase64: pdfBytes.toString("base64"), tipo: "comprobante_pago" }, cookie);
  for (let i = 0; i < 30; i++) {
    const id = crypto.randomUUID();
    await pool.query("insert into documentos(id,entidad_tipo,entidad_id,tipo_documento,storage_bucket,storage_path,pasajero_id,nombre_original,mime_type,tamano_bytes,sha256,uploaded_actor,visible_familia) values($1,'pasajero',$2,'otro','documentos',$3,$2,$4,'application/pdf',1,$5,'admin',true)", [id, pax, `privados/${id}/${crypto.randomUUID()}.pdf`, `Previo ${i}.pdf`, "0".repeat(64)]);
  }
  const familia = await subir(portal, `/api/portal/pasajeros/${pax}/documentos`);
  assert.equal(familia.status, 409);
  assert.match((await familia.json()).error, /máximo de documentos/);
  const antes = objects.size;
  assert.equal(antes, 0, "el objeto de un envío rechazado se limpia");
  const agencia = await subir(admin, `/api/admin/documentos/pasajeros/${pax}`);
  assert.equal(agencia.status, 201);
});

test("en celular el login oculta la presentación de módulos y gana a la regla de admin-workspace.css", () => {
  const css = require("node:fs").readFileSync(require("node:path").join(__dirname, "..", "assets", "css", "admin-workspace.css"), "utf8");
  assert.match(css, /@media \(max-width: 720px\) \{[^}]*body\[data-app-entry="admin"\] :is\(\.admin-login-brand, \.admin-login-highlights, \.admin-login-footer\) \{ display: none; \}/);
});

test("el ETag se reconoce aunque un intermediario quite el prefijo W/ o mande una lista", async () => {
  const primera = await fetch(base + "/assets/css/styles.css");
  const etag = primera.headers.get("etag");
  assert.match(etag, /^W\//);
  for (const valor of [etag.replace(/^W\//, ""), `"otro", ${etag}`]) {
    const response = await fetch(base + "/assets/css/styles.css", { headers: { "If-None-Match": valor } });
    assert.equal(response.status, 304, valor);
  }
  assert.equal((await fetch(base + "/assets/css/styles.css", { headers: { "If-None-Match": '"distinto"' } })).status, 200);
});
