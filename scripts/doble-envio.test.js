const assert = require("node:assert/strict");
const test = require("node:test");

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://nadie:nadie@127.0.0.1:1/nada";
const db = require("../lib/db");
const { crearPoolLocal } = require("./helpers/pglite-pool");
const v = require("../assets/js/modules/ficha-validation.js");

const FIRMA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
let pool;

test.before(async () => {
  pool = await crearPoolLocal();
  db.__test.setPool(pool);
});
test.after(async () => { await pool.close(); });

function datosPax(dni) {
  return v.validarFichaPax({
    nivel: "Secundaria", destino: "Bariloche", anio: "2027", colegioId: "", colegioTexto: "Colegio Doble Envío",
    grado: "5°", division: "B", pasajeroNombre: "Ana", pasajeroApellido: "Pérez", pasajeroTipoDocumento: "DNI",
    pasajeroNumeroDocumento: dni, pasajeroNacimiento: "2009-03-14", pasajeroSexo: "Femenino",
    responsableNombre: "María", responsableApellido: "Núñez", responsableTipoDocumento: "DNI", responsableNumeroDocumento: "12345678",
    responsableNacimiento: "1980-05-02", responsableParentesco: "Madre", responsableCuilCuit: "20-12345678-6",
    responsableEmail: "m@gmail.com", responsableCelular: "3794123456", domicilioCalle: "Calle", domicilioNumero: "1",
    domicilioLocalidad: "Corrientes", domicilioProvincia: "Corrientes", domicilioCodigoPostal: "3400",
    aceptaCondiciones: true, firma: FIRMA
  }, { hoy: new Date("2026-09-15T12:00:00Z") }).datos;
}
const CTX = { contrato: null, grupoId: null, planes: [] };

// Pool que simula la carrera: la consulta "ya existe" no ve la ficha del otro envío.
function poolCiego() {
  return { ...pool, query: (t, p) => (/from fichas_adhesion f join inscripciones/.test(t) ? { rows: [] } : pool.query(t, p)) };
}

test("carrera de fichas PAX: el segundo envío simultáneo da 409, no 500", async () => {
  await db.insertFichaPublica(datosPax("45000001"), CTX);
  db.__test.setPool(poolCiego());
  await assert.rejects(db.insertFichaPublica(datosPax("45000001"), CTX), (e) => e.statusCode === 409 && /Ya recibimos/.test(e.message));
  db.__test.setPool(pool);
});

test("rechazar la ficha libera al pasajero para volver a cargarla; reabrir con otra vigente da error claro", async () => {
  const [f1] = (await db.listFichasAdmin()).filter((f) => f.pasajero_dni === "45000001");
  const r = await db.updateFichasAdmin([{ id: f1.id, estado_revision: "rechazada", motivo_rechazo: "x" }], "t");
  assert.deepEqual(r.failed, []);
  const nueva = await db.insertFichaPublica(datosPax("45000001"), CTX);
  const reabrir = await db.updateFichasAdmin([{ id: f1.id, estado_revision: "pendiente" }], "t");
  assert.match(reabrir.failed[0].error, /otra ficha vigente/);
  assert.ok(nueva.id);
});

test("carrera de fichas de tutor: 409 y rechazada permite reenviar", async () => {
  const tutor = { pasajeroNombre: "Ana", pasajeroApellido: "Pérez", pasajeroNumeroDocumento: "45000001", nombre: "Luis", apellido: "Gómez",
    tipoDocumento: "DNI", numeroDocumento: "30111222", cuilCuit: "20301112226", celular: "3794123456", email: "l@gmail.com",
    parentesco: "Padre", aceptaCondiciones: true };
  await db.insertFichaTutor(tutor);
  db.__test.setPool({ ...pool, query: (t, p) => (/from fichas_tutor/.test(t) && /select 1/.test(t) ? { rows: [] } : pool.query(t, p)) });
  await assert.rejects(db.insertFichaTutor(tutor), (e) => e.statusCode === 409 && /Ya registramos/.test(e.message));
  db.__test.setPool(pool);
});
