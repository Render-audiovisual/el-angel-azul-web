const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const appSource = fs.readFileSync(
  path.join(__dirname, "..", "assets", "js", "app.js"),
  "utf8"
);

function functionSource(name, nextName) {
  const start = appSource.indexOf(`function ${name}(`);
  const end = appSource.indexOf(`function ${nextName}(`, start + 1);
  assert.notEqual(start, -1, `No se encontró ${name}`);
  assert.notEqual(end, -1, `No se encontró el límite posterior de ${name}`);
  return appSource.slice(start, end);
}

test("Pasajeros solo ofrece contratos reales persistidos", () => {
  const source = functionSource("adminContratoOptionsForGroup", "passengerContratoId");
  assert.match(source, /adminContratosDemo\.filter/);
  assert.doesNotMatch(source, /adminContratoFromGroup/);
  assert.doesNotMatch(source, /adminContratosRows/);
});

test("las páginas públicas no solicitan Pasajeros, Fichas ni Turismo admin", () => {
  const source = functionSource("hydrateGoogleSheetsData", "queueGoogleSheetsWrite");
  assert.match(source, /const adminEntry = isAdminEntry\(\)/);
  for (const collection of ["PASAJEROS", "FICHAS_ADHESION", "TURISMO"]) {
    assert.match(
      source,
      new RegExp(`adminEntry[\\s\\S]*fetchGoogleSheetRows\\(\"${collection}\"\\)[\\s\\S]*Promise\\.resolve\\(null\\)`)
    );
  }
  assert.match(source, /includePrivate: adminEntry/);
});

test("las rutas admin con hash se reconocen como entrada privada", () => {
  const source = functionSource("isAdminEntry", "adminPathFromLocation");
  assert.match(source, /hashPath === "\/admin"/);
  assert.match(source, /hashPath\.startsWith\("\/admin\/"\)/);
});

test("Configuración queda bloqueada para cuentas de agente incluso por URL directa", () => {
  const source = functionSource("adminCanAccessPath", "fetchAdminSession");
  assert.match(source, /path !== "\/admin\/configuracion"/);
  assert.match(source, /=== "admin"/);
  assert.match(appSource, /if \(!adminCanAccessPath\(path\)\)/);
});
