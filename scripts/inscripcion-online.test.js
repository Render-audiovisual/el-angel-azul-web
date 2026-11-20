const assert = require("node:assert/strict");
const test = require("node:test");

// Circuito HTTP real + Postgres en memoria. Nunca usa credenciales externas.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://nadie:nadie@127.0.0.1:1/nada";
process.env.EAA_POSTGRES_MIGRATION_ENABLED = "true";
process.env.EAA_ADMIN_PASSWORD = "solo-prueba-local";
for (const key of ["RESEND_API_KEY", "EAA_EMAIL_FROM", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) delete process.env[key];

const db = require("../lib/db");
const { crearPoolLocal } = require("./helpers/pglite-pool");
const { createAppServer } = require("../server");
const COLEGIO = "00000000-0000-4000-8000-000000000001";
const PLAN = "00000000-0000-4000-8000-000000000002";
const FIRMA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
let pool, server, base, cookie;

async function request(path, body, admin = false) {
  return fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: { origin: base, ...(body ? { "content-type": "application/json" } : {}), ...(admin ? { cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
}
async function rows(sheet) {
  const response = await request(`/api/google-sheets?sheet=${sheet}`, null, true);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  return payload.rows;
}
async function save(sheet, row) {
  const response = await request("/api/google-sheets", { sheet, rows: [row] }, true);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
}

test.before(async () => {
  pool = await crearPoolLocal();
  db.__test.setPool(pool);
  server = createAppServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
  const login = await request("/api/admin/login", { username: "admin", password: "solo-prueba-local" });
  assert.equal(login.status, 200);
  cookie = login.headers.get("set-cookie").split(";")[0];
  await save("COLEGIOS", { id: COLEGIO, nombre: "Colegio San José", provincia: "Corrientes", localidad: "Goya", activo: "TRUE" });
  await save("GRUPOS", { id: "grupo-online", colegio_id: COLEGIO, nivel: "Secundaria", viaje: "Bariloche 2027", curso: "5°", division: "B", estado: "Activo" });
  await save("CONTRATOS", { id: "contrato-online", grupo_id: "grupo-online", codigo_contrato: "C-ONLINE", estado: "Activo" });
  await save("PLANES_PAGO", { id: PLAN, contrato_id: "contrato-online", nombre: "Plan 6 cuotas", cuotas: "6", activo: "TRUE" });
});
test.after(async () => {
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
  if (pool) await pool.close();
});

test("inscripción online: selección, validación, guardado, tutor, admin y PDF", async () => {
  const listado = await (await request("/api/public/colegios")).json();
  assert.equal(listado.colegios[0].nombre, "Colegio San José");
  const params = new URLSearchParams({ colegioId: COLEGIO, nivel: "Secundaria", viaje: "Bariloche 2027", grado: "5°", division: "B" });
  const contexto = await (await request(`/api/public/inscripcion-context?${params}`)).json();
  assert.equal(contexto.contrato.codigo, "C-ONLINE");
  assert.equal(contexto.planes[0].id, PLAN);
  const ficha = {
    colegioId: COLEGIO, nivel: "Secundaria", destino: "Bariloche", anio: "2027", grado: "5°", division: "B", planPagoId: PLAN,
    pasajeroNombre: "José María", pasajeroApellido: "Fernández Núñez", pasajeroTipoDocumento: "DNI", pasajeroNumeroDocumento: "45123456",
    pasajeroNacimiento: "2009-03-14", pasajeroSexo: "Masculino", responsableNombre: "María", responsableApellido: "Núñez",
    responsableTipoDocumento: "DNI", responsableNumeroDocumento: "12345678", responsableNacimiento: "1980-05-02", responsableParentesco: "Madre",
    responsableCuilCuit: "20-12345678-6", responsableEmail: "familia@example.com", responsableCelular: "3794 123456",
    domicilioCalle: "Av. 3 de Abril", domicilioNumero: "S/N", domicilioBarrio: "Laguna Seca", domicilioLocalidad: "Goya",
    domicilioProvincia: "Corrientes", domicilioCodigoPostal: "W3450ABC", aceptaCondiciones: true, firma: FIRMA
  };
  const incompleta = await request("/api/public/fichas", { ...ficha, domicilioCalle: "", planPagoId: "" });
  assert.equal(incompleta.status, 400);
  const errores = (await incompleta.json()).errores;
  assert.ok(errores.domicilioCalle);
  assert.equal((await rows("FICHAS_ADHESION")).length, 0);
  const sinPlan = await request("/api/public/fichas", { ...ficha, planPagoId: "" });
  assert.equal(sinPlan.status, 400);
  assert.ok((await sinPlan.json()).errores.planPagoId);
  const enviada = await request("/api/public/fichas", ficha);
  const recibo = await enviada.json();
  assert.equal(enviada.status, 201, JSON.stringify(recibo));
  const [guardada] = await rows("FICHAS_ADHESION");
  assert.equal(guardada.id, recibo.id);
  for (const [campo, valor] of Object.entries({ colegio: "Colegio San José", grado: "5°", division: "B", plan_nombre: "Plan 6 cuotas", pasajero_nombre: "José María", pasajero_apellido: "Fernández Núñez", responsable_cuil_cuit: "20123456786", domicilio_numero: "S/N", domicilio_codigo_postal: "W3450ABC" })) {
    assert.equal(guardada[campo], valor, campo);
  }
  assert.equal((await request("/api/public/fichas", ficha)).status, 409);
  assert.equal((await rows("FICHAS_ADHESION")).length, 1);
  const tutor = await request("/api/public/fichas-tutor", {
    pasajeroNombre: "José María", pasajeroApellido: "Fernández Núñez", pasajeroNumeroDocumento: "45123456",
    nombre: "Carlos", apellido: "Fernández", tipoDocumento: "DNI", numeroDocumento: "30111222", cuilCuit: "20301112220",
    celular: "3794111222", email: "tutor@example.com", parentesco: "Padre", aceptaCondiciones: true
  });
  assert.equal(tutor.status, 201);
  assert.equal((await rows("FICHAS_TUTOR"))[0].pasajero_dni, ficha.pasajeroNumeroDocumento);
  assert.equal((await request(`/api/admin/fichas/${guardada.id}/pdf`)).status, 401);
  const pdf = await request(`/api/admin/fichas/${guardada.id}/pdf`, null, true);
  assert.equal(pdf.status, 200);
  assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0, 5).toString(), "%PDF-");
  // Se guarda primero el pasajero, igual que el flujo de aprobación del frontend.
  await save("PASAJEROS", {
    id: "pasajero-online", grupo_id: "grupo-online", contrato_id: "contrato-online", dni: ficha.pasajeroNumeroDocumento,
    nombre: ficha.pasajeroNombre, apellido: ficha.pasajeroApellido, nacimiento: ficha.pasajeroNacimiento,
    responsable_nombre: ficha.responsableNombre, responsable_apellido: ficha.responsableApellido, responsable_dni: ficha.responsableNumeroDocumento,
    responsable_telefono: ficha.responsableCelular, responsable_email: ficha.responsableEmail, responsable_cuil_cuit: "20123456786",
    vinculo: "Madre", plan_pago_id: PLAN, estado: "Activo"
  });
  await save("FICHAS_ADHESION", { ...guardada, estado_revision: "aprobada" });
  const [pasajero] = await rows("PASAJEROS");
  assert.equal(pasajero.grupo_id, "grupo-online");
  assert.equal(pasajero.plan_nombre, "Plan 6 cuotas");
  assert.equal(pasajero.responsable_apellido, "Núñez");
  assert.equal(pasajero.responsable_email, "familia@example.com");
  assert.equal((await rows("FICHAS_ADHESION"))[0].estado_revision, "aprobada");
  const vinculos = await pool.query("select count(*)::integer as cantidad from pasajero_responsables");
  assert.equal(vinculos.rows[0].cantidad, 2);
  // El recibo nunca debe afirmar que se envió un correo inexistente.
  assert.equal(recibo.emailEstado, "sin_configurar");
});
