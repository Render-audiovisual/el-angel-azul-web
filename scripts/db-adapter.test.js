const assert = require("node:assert/strict");
const test = require("node:test");

process.env.NODE_ENV = "test";
const db = require("../lib/db");
const {
  parseNumeric,
  parseDate,
  parseBool,
  safeJsonArray,
  normalizeSignatureDataUrl
} = db.__test;

test("los enums desconocidos fallan y los vacíos usan el default", () => {
  assert.equal(db.grupoEstadoMap.toDb(""), "activo");
  assert.equal(db.pagoEstadoMap.toDb("Al día"), "al_dia");
  assert.throws(() => db.grupoEstadoMap.toDb("inventado"), /Valor no reconocido/);
});

test("los números inválidos no se convierten silenciosamente a null", () => {
  assert.equal(parseNumeric("", "precio"), null);
  assert.equal(parseNumeric("1250.50", "precio"), 1250.5);
  assert.throws(() => parseNumeric("doce", "precio"), /debe ser numérico/);
});

test("las fechas se validan por formato y calendario", () => {
  assert.equal(parseDate("", "salida"), null);
  assert.equal(parseDate("2028-02-29", "salida"), "2028-02-29");
  assert.throws(() => parseDate("29/02/2028", "salida"), /formato YYYY-MM-DD/);
  assert.throws(() => parseDate("2027-02-29", "salida"), /fecha inválida/);
});

test("los booleanos solo aceptan valores explícitos", () => {
  assert.equal(parseBool("TRUE", "destacado"), true);
  assert.equal(parseBool("FALSE", "destacado"), false);
  assert.equal(parseBool("", "destacado"), false);
  assert.throws(() => parseBool("sí", "destacado"), /TRUE o FALSE/);
});

test("los arrays JSON inválidos no borran datos en silencio", () => {
  assert.deepEqual(safeJsonArray("", "fotos"), []);
  assert.deepEqual(safeJsonArray("[1,2]", "fotos"), [1, 2]);
  assert.throws(() => safeJsonArray("{\"a\":1}", "fotos"), /lista JSON/);
  assert.throws(() => safeJsonArray("[", "fotos"), /JSON inválido/);
});

test("la firma pública solo admite PNG base64", () => {
  const validPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  assert.equal(normalizeSignatureDataUrl(""), null);
  assert.equal(normalizeSignatureDataUrl(validPng), validPng);
  assert.throws(() => normalizeSignatureDataUrl("javascript:alert(1)"), /formato PNG válido/);
  assert.throws(
    () => normalizeSignatureDataUrl(`data:image/png;base64,${Buffer.from("<svg></svg>").toString("base64")}`),
    /imagen PNG válida/
  );
  assert.throws(
    () => normalizeSignatureDataUrl(`data:image/png;base64,${"A".repeat(250000)}`),
    /límite máximo/
  );
});

test("el admin no puede reescribir consentimiento ni firma legal", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const source = fs.readFileSync(path.join(__dirname, "..", "lib", "db.js"), "utf8");
  const start = source.indexOf("async function updateFichasAdmin");
  const end = source.indexOf("// ============ GRUPOS", start);
  const updateSource = source.slice(start, end);
  assert.doesNotMatch(updateSource, /acepta_condiciones\s*=/);
  assert.doesNotMatch(updateSource, /firma_storage_path\s*=/);
  assert.doesNotMatch(updateSource, /row\.acepta_condiciones/);
  assert.doesNotMatch(updateSource, /row\.firma_data_url/);
});
