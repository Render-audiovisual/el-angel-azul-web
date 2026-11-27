const assert = require("node:assert/strict");
const test = require("node:test");

process.env.NODE_ENV = "test";
// Siempre una URL falsa: el pool real nunca se crea (se usa PGlite en memoria).
process.env.DATABASE_URL = "postgresql://nadie:nadie@127.0.0.1:1/nada";
const db = require("../lib/db");
const { crearPoolLocal } = require("./helpers/pglite-pool");

const ID = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
let pool;

test.before(async () => {
  pool = await crearPoolLocal();
  db.__test.setPool(pool);
  // La ficha pública ya no crea viajes: los carga el administrador.
  await pool.query(`insert into viajes (categoria, nivel, destino, titulo, anio, estado) values ('estudiantil', 'Secundaria', 'Bariloche 2027', 'Bariloche 2027', 2027, 'activo')`);
});
test.after(async () => { await pool.close(); });

test("alta y edición de colegio: nombre, provincia y localidad", async () => {
  const alta = await db.saveColegiosAdmin([{ id: ID(1), nombre: "Escuela Normal", provincia: "Corrientes", localidad: "Goya", codigo_oficial: "", activo: "TRUE" }]);
  assert.deepEqual(alta.failed, []);
  await db.saveColegiosAdmin([{ id: ID(1), nombre: "Escuela Normal N° 1", provincia: "Corrientes", localidad: "Corrientes", codigo_oficial: "", activo: "TRUE" }]);
  const [c] = (await db.listColegiosAdmin()).filter((x) => x.id === ID(1));
  assert.equal(c.nombre, "Escuela Normal N° 1");
  assert.equal(c.localidad, "Corrientes");
  assert.equal(c.activo, "TRUE");
});

test("baja lógica: el colegio queda inactivo, no se borra, y sale de la lista pública", async () => {
  await db.saveColegiosAdmin([], [ID(1)]);
  const [c] = (await db.listColegiosAdmin()).filter((x) => x.id === ID(1));
  assert.equal(c.activo, "FALSE");
  assert.equal((await db.listColegiosPublicos()).some((x) => x.id === ID(1)), false);
  await db.saveColegiosAdmin([{ ...c, activo: "TRUE" }]);
  assert.equal((await db.listColegiosPublicos()).some((x) => x.id === ID(1)), true);
});

test("nombre repetido (sin importar mayúsculas) falla con mensaje claro", async () => {
  const r = await db.saveColegiosAdmin([{ id: ID(2), nombre: "ESCUELA NORMAL N° 1", provincia: "", localidad: "", codigo_oficial: "", activo: "TRUE" }]);
  assert.equal(r.updated, 0);
  assert.match(r.failed[0].error, /Ya existe un colegio/);
});

test("nombre muy corto o id inválido se rechazan", async () => {
  const r = await db.saveColegiosAdmin([{ id: ID(3), nombre: "ab" }, { id: "no-uuid", nombre: "Colegio válido" }]);
  assert.equal(r.updated, 0);
  assert.equal(r.failed.length, 2);
});

const FIRMA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const v = require("../assets/js/modules/ficha-validation.js");

async function fichaConColegioTexto() {
  const { datos } = v.validarFichaPax({
    nivel: "Secundaria", destino: "Bariloche", anio: "2027", colegioId: "", colegioTexto: "Mi Colegio Nuevo",
    grado: "5°", division: "B", pasajeroNombre: "Ana", pasajeroApellido: "Pérez", pasajeroTipoDocumento: "DNI",
    pasajeroNumeroDocumento: "45123456", pasajeroNacimiento: "2009-03-14", pasajeroSexo: "Femenino",
    responsableNombre: "María", responsableApellido: "Núñez", responsableTipoDocumento: "DNI", responsableNumeroDocumento: "12345678",
    responsableNacimiento: "1980-05-02", responsableParentesco: "Madre", responsableCuilCuit: "20-12345678-6",
    responsableEmail: "m@gmail.com", responsableCelular: "3794123456", domicilioCalle: "Calle", domicilioNumero: "1",
    domicilioLocalidad: "Corrientes", domicilioProvincia: "Corrientes", domicilioCodigoPostal: "3400",
    aceptaCondiciones: true, firma: FIRMA
  }, { hoy: new Date("2026-09-15T12:00:00Z") });
  return db.insertFichaPublica(datos, { contrato: null, grupoId: null, planes: [] });
}

test("'mi colegio no está': la ficha queda sin vincular y el admin la vincula a un colegio de la lista", async () => {
  const { id } = await fichaConColegioTexto();
  const antes = (await db.listFichasAdmin(id))[0];
  assert.equal(antes.colegio_vinculado, "FALSE");
  assert.equal(antes.colegio_texto, "Mi Colegio Nuevo");
  await db.saveColegiosAdmin([{ id: ID(10), nombre: "Colegio Real", provincia: "Corrientes", localidad: "Corrientes", activo: "TRUE" }]);
  const r = await db.updateFichasAdmin([{ ...antes, colegio_id: ID(10) }], "test");
  assert.deepEqual(r.failed, []);
  const despues = (await db.listFichasAdmin(id))[0];
  assert.equal(despues.colegio_vinculado, "TRUE");
  assert.equal(despues.colegio, "Colegio Real");
});

test("auditoría: crear, editar y eliminar dejan rastro con el usuario, sin copiar los valores", async () => {
  const adminWrite = require("../lib/admin-write");
  const guardar = async (rows, deleteIds, expectedVersions, actor) => adminWrite.write({
    pool: db.getPool(), sheet: "COLEGIOS", rows, deleteIds, expectedVersions, actor,
    list: db.listColegiosAdmin, save: () => db.saveColegiosAdmin(rows, deleteIds)
  });
  const eventos = async () => (await pool.query(
    `select accion, actor_username, entidad, entidad_id::text as entidad_id, detalle from eventos_administrativos where entidad = 'colegios' order by id`
  )).rows;
  const id = ID(90);
  const fila = { id, nombre: "Colegio Auditado Secreto", provincia: "Corrientes", localidad: "Goya", codigo_oficial: "", activo: "TRUE" };

  assert.deepEqual((await guardar([fila], [], {}, "ana")).failed, []);
  const version = (await db.listColegiosAdmin()).map((r) => adminWrite.versionedRows([r])[0]).find((r) => r.id === id)._version;
  assert.deepEqual((await guardar([{ ...fila, localidad: "Esquina" }], [], { [id]: version }, "luis")).failed, []);
  const version2 = adminWrite.versionedRows([(await db.listColegiosAdmin()).find((r) => r.id === id)])[0]._version;
  assert.deepEqual((await guardar([], [id], { [id]: version2 }, "luis")).failed, []);

  const log = await eventos();
  assert.deepEqual(log.map((e) => [e.accion, e.actor_username]), [["crear", "ana"], ["editar", "luis"], ["eliminar", "luis"]]);
  assert.ok(log.every((e) => e.entidad_id === id), "los colegios usan uuid y quedan enlazados");
  assert.deepEqual(log[1].detalle.campos, ["localidad"]);
  assert.ok(!JSON.stringify(log).includes("Esquina") && !JSON.stringify(log).includes("Secreto"), "la bitácora guarda nombres de campos, no valores");
});

test("auditoría: si el guardado falla no queda ningún evento", async () => {
  const adminWrite = require("../lib/admin-write");
  const antes = (await pool.query(`select count(*)::int n from eventos_administrativos`)).rows[0].n;
  const rows = [{ id: ID(91), nombre: "ab" }];
  const r = await adminWrite.write({ pool: db.getPool(), sheet: "COLEGIOS", rows, deleteIds: [], expectedVersions: {}, actor: "ana", list: db.listColegiosAdmin, save: () => db.saveColegiosAdmin(rows, []) });
  assert.equal(r.failed.length, 1);
  assert.equal((await pool.query(`select count(*)::int n from eventos_administrativos`)).rows[0].n, antes);
});
