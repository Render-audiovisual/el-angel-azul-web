// scripts/storage.test.js
const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const storage = require("../lib/storage");

const env = { SUPABASE_URL: "https://proyecto.supabase.co/", SUPABASE_SERVICE_ROLE_KEY: "service_key" };
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

test("configuración y detección de ruta vs data URL", () => {
  assert.equal(storage.storageConfigurado({}), false);
  assert.equal(storage.storageConfigurado(env), true);
  assert.equal(storage.esRutaStorage("firmas/a.png"), true);
  assert.equal(storage.esRutaStorage(PNG), false);
  assert.equal(storage.esRutaStorage(""), false);
});

test("sube el PNG al bucket privado con la service role y devuelve la ruta", async () => {
  let llamada;
  const fetchImpl = async (url, opciones) => { llamada = { url, opciones }; return { ok: true, status: 200 }; };
  const ruta = await storage.subirFirma(PNG, "abc", { env, fetchImpl });
  assert.equal(ruta, "firmas/abc.png");
  assert.equal(llamada.url, "https://proyecto.supabase.co/storage/v1/object/fichas/firmas/abc.png");
  assert.equal(llamada.opciones.headers.Authorization, "Bearer service_key");
  assert.equal(llamada.opciones.headers["Content-Type"], "image/png");
  assert.equal(llamada.opciones.body.subarray(1, 4).toString(), "PNG");
});

test("un fallo de Storage lanza error 502", async () => {
  const fetchImpl = async () => ({ ok: false, status: 400 });
  await assert.rejects(storage.subirFirma(PNG, "abc", { env, fetchImpl }), (e) => e.statusCode === 502);
  await assert.rejects(storage.descargarFirma("firmas/abc.png", { env, fetchImpl }), (e) => e.statusCode === 502);
});

test("bytesFirma lee de Storage las rutas y decodifica las data URL viejas", async () => {
  const fetchImpl = async () => ({ ok: true, status: 200, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer });
  assert.deepEqual([...await storage.bytesFirma("firmas/abc.png", { env, fetchImpl })], [1, 2, 3]);
  assert.equal((await storage.bytesFirma(PNG)).subarray(1, 4).toString(), "PNG");
  assert.equal(await storage.bytesFirma(""), null);
});

test("el servidor sirve la firma solo por la ruta admin y la migración crea el bucket privado", () => {
  const server = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");
  assert.match(server, /\(pdf\|reenviar-correo\|firma\)/);
  assert.match(server, /accion === "firma"/);
  const sql = fs.readFileSync(path.join(__dirname, "..", "supabase", "migrations", "0005_storage_firmas.sql"), "utf8");
  assert.match(sql, /'fichas', 'fichas', false/);
});

test("borrarFirma hace DELETE sobre la ruta y tolera 404", async () => {
  const llamadas = [];
  const fetchImpl = async (url, opciones) => { llamadas.push([url, opciones.method]); return { ok: false, status: 404 }; };
  await storage.borrarFirma("firmas/abc.png", { env, fetchImpl });
  assert.deepEqual(llamadas, [["https://proyecto.supabase.co/storage/v1/object/fichas/firmas/abc.png", "DELETE"]]);
  await assert.rejects(
    storage.borrarFirma("firmas/abc.png", { env, fetchImpl: async () => ({ ok: false, status: 500 }) }),
    (e) => e.statusCode === 502
  );
});

test("si la ficha no se guarda, el servidor borra la firma ya subida", () => {
  const server = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");
  assert.match(server, /if \(firmaSubida\)[\s\S]{0,80}storage\.borrarFirma\(firmaSubida\)/);
});
