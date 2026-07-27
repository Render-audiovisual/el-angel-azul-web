const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const appSource = fs.readFileSync(
  path.join(__dirname, "..", "assets", "js", "app.js"),
  "utf8"
);

test("Turismo vacío ofrece una importación autenticada de los dos viajes públicos", () => {
  assert.match(appSource, /data-admin-import-public-trips/);
  assert.match(appSource, /trip\?\.estado === "activo"/);
  assert.match(appSource, /trip\.destino === "Bariloche"/);
  assert.match(appSource, /trip\.destino === "Brasil"/);
  assert.match(appSource, /await saveAdminTurismoTripsWithFeedback\(\)/);
});

test("la importación revierte el estado local cuando la escritura falla", () => {
  assert.match(appSource, /adminTurismoTrips = previousTrips/);
  assert.match(appSource, /localStorage\.setItem\(ADMIN_TURISMO_STORAGE_KEY, JSON\.stringify\(previousTrips/);
});

test("los precios numéricos de Postgres conservan un formato visible en la web", () => {
  assert.match(appSource, /function turismoDisplayPrice/);
  assert.match(appSource, /new Intl\.NumberFormat\("es-AR"/);
  assert.match(appSource, /precioDesde: visiblePrice \|\| "Consultar"/);
});
