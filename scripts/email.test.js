// scripts/email.test.js
const assert = require("node:assert/strict");
const test = require("node:test");
const email = require("../lib/email");

const env = { RESEND_API_KEY: "re_test", EAA_EMAIL_FROM: "El Ángel Azul <fichas@example.com>", EAA_EMAIL_COPIA: "agencia@example.com" };
const fila = {
  id: "3f1c2a8e-5b6d-4c7e-8f9a-0b1c2d3e4f5a", pasajero_nombre: "José María", pasajero_apellido: "Fernández <b>",
  pasajero_dni: "45123456", responsable_nombre: "María", responsable_apellido: "Núñez",
  responsable_email: "maria@gmail.com", responsable_celular: "3794111222", viaje: "Bariloche 2027",
  colegio: "Colegio San José", nivel: "Secundaria", grado: "5°", division: "B", plan_nombre: "12 cuotas"
};

test("configuración y enmascarado", () => {
  assert.equal(email.correoConfigurado({}), false);
  assert.equal(email.correoConfigurado(env), true);
  assert.equal(email.enmascararEmail("maria@gmail.com"), "m***@gmail.com");
});

test("arma asunto, destinatarios, HTML escapado y adjunto", () => {
  const p = email.armarCorreoFicha(fila, new Uint8Array([37, 80, 68, 70]), env);
  assert.equal(p.subject, "Ficha de adhesión – Fernández <b>, José María – Bariloche 2027");
  assert.deepEqual(p.to, ["maria@gmail.com"]);
  assert.deepEqual(p.bcc, ["agencia@example.com"]);
  assert.match(p.html, /Fernández &lt;b&gt;/);
  assert.doesNotMatch(p.html, /<b>,/);
  assert.equal(p.attachments[0].content, Buffer.from("%PDF").toString("base64"));
  assert.match(p.attachments[0].filename, /\.pdf$/);
});

test("envía con clave de idempotencia y devuelve el id", async () => {
  let llamada;
  const fetchImpl = async (url, opciones) => {
    llamada = { url, opciones };
    return { ok: true, status: 200, json: async () => ({ id: "email_123" }) };
  };
  const id = await email.enviarCorreoFicha(fila, new Uint8Array([1]), { env, fetchImpl });
  assert.equal(id, "email_123");
  assert.equal(llamada.url, "https://api.resend.com/emails");
  assert.equal(llamada.opciones.headers["Idempotency-Key"], `ficha-${fila.id}`);
  assert.equal(llamada.opciones.headers.Authorization, "Bearer re_test");
});

test("traduce errores de Resend a mensajes legibles", async () => {
  const falla = (status) => async () => ({ ok: false, status, json: async () => ({ message: "x" }) });
  await assert.rejects(email.enviarCorreoFicha(fila, new Uint8Array([1]), { env, fetchImpl: falla(429) }), (e) => /Límite/.test(e.friendlyMessage));
  await assert.rejects(email.enviarCorreoFicha(fila, new Uint8Array([1]), { env, fetchImpl: falla(403) }), (e) => /dominio/.test(e.friendlyMessage));
});
