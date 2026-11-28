// Hallazgo de la prueba manual del 28/11: editar un pasajero recién creado, sin recargar el panel, respondía OK
// pero al recargar volvía el apellido viejo (el panel sigue usando su id temporal; el servidor guardó otro id estable).
const test = require("node:test"), assert = require("node:assert/strict");
Object.assign(process.env, { NODE_ENV: "test", DATABASE_URL: "pglite-en-memoria", EAA_POSTGRES_MIGRATION_ENABLED: "true", EAA_ADMIN_PASSWORD: "Prueba-edicion-local-42" });
const db = require("../lib/db"), { crearPoolLocal } = require("./helpers/pglite-pool"), { createAppServer } = require("../server");
let pool, server, base, cookie;
async function request(path, data) {
  return fetch(base + path, { method: data ? "POST" : "GET", headers: { Origin: base, Cookie: cookie, ...(data ? { "Content-Type": "application/json" } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) });
}
async function write(sheet, row, version = null) {
  const response = await request("/api/google-sheets", { sheet, rows: [row], expectedVersions: { [row.id]: version } });
  return response.json();
}
const listar = async () => (await (await request("/api/google-sheets?sheet=PASAJEROS")).json()).rows;

test.before(async () => {
  pool = await crearPoolLocal();
  db.__test.setPool(pool);
  server = createAppServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + server.address().port;
  const login = await fetch(base + "/api/admin/login", { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ username: "admin", password: process.env.EAA_ADMIN_PASSWORD }) });
  cookie = login.headers.get("set-cookie").split(";")[0];
  const school = (await pool.query("insert into colegios(nombre) values ('Colegio ficticio edición') returning id")).rows[0].id;
  assert.equal((await write("GRUPOS", { id: "grupo-edicion", colegio_id: school, nivel: "Secundaria", viaje: "Bariloche 2027", curso: "5°", division: "A", estado: "Activo" })).ok, true);
});
test.after(async () => { if (server?.listening) await new Promise((r) => server.close(r)); await pool?.close(); });

test("editar un pasajero recién creado con su id temporal guarda el cambio (no queda el dato viejo)", async () => {
  const alta = { id: "p-temporal-1", grupo_id: "grupo-edicion", dni: "45999001", nombre: "ZZ-PRUEBA Muñoz", apellido: "Ñandú", telefono: "3794000000", estado: "Activo" };
  const creado = await write("PASAJEROS", alta);
  assert.equal(creado.ok, true);
  let filas = await listar();
  assert.equal(filas.filter((f) => f.dni === "45999001").length, 1);

  // El panel no recarga: vuelve a mandar el mismo id temporal con otro apellido y otro nombre.
  // Igual que el panel: usa la versión que el servidor devolvió bajo ese id temporal.
  const edicion = await write("PASAJEROS", { ...alta, nombre: "ZZ-PRUEBA Editado José", apellido: "Güemes Peña", telefono: "3794111111" }, creado.versions[alta.id]);
  assert.equal(edicion.ok, true, JSON.stringify(edicion));

  filas = await listar();
  const guardadas = filas.filter((f) => f.dni === "45999001");
  assert.equal(guardadas.length, 1, "no debe duplicar al pasajero");
  assert.equal(guardadas[0].nombre, "ZZ-PRUEBA Editado José");
  assert.equal(guardadas[0].apellido, "Güemes Peña");
  assert.equal(guardadas[0].telefono, "3794111111");
});

test("un DNI ya cargado en el mismo viaje se edita, no crea otra persona ni se ignora en silencio", async () => {
  const filas = await listar();
  const existente = filas.find((f) => f.dni === "45999001");
  const otraVez = await write("PASAJEROS", { id: "p-temporal-2", grupo_id: "grupo-edicion", dni: "45999001", nombre: "ZZ-PRUEBA Otra vez", apellido: "Mismo DNI", estado: "Activo" }, existente._version);
  assert.equal(otraVez.ok, true, JSON.stringify(otraVez));
  const despues = (await listar()).filter((f) => f.dni === "45999001");
  assert.equal(despues.length, 1);
  assert.equal(despues[0].id, existente.id, "conserva el id estable");
  assert.equal(despues[0].apellido, "Mismo DNI");
  assert.equal((await pool.query("select count(*)::int as n from personas where numero_documento='45999001'")).rows[0].n, 1);
});
