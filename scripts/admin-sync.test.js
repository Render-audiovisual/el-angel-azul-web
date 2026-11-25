const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function browser(fetch) {
  const window = { location: { origin: "http://local.test" }, localStorage: { getItem: () => null } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../assets/js/modules/persistence.js"), "utf8"), { window, fetch, URL });
  return window.ElAngelAzulPersistence;
}

test("120 fichas con firma: editar una envía una sola fila y su versión, no supera 1 MB", async () => {
  const requests = [];
  const p = browser(async (_url, options) => {
    requests.push(options.body);
    return { ok: true, json: async () => ({ ok: true, versions: { "ficha-8": "nueva" } }) };
  });
  const source = Array.from({ length: 120 }, (_, i) => ({ id: `ficha-${i}`, firma_data_url: "x".repeat(12000), estado_revision: "pendiente", observaciones: "", _version: `version-${i}` }));
  p.captureAdminSheet("FICHAS_ADHESION", source, source);
  const edited = source.map((row) => ({ ...row, updated_at: "ahora", ...(row.id === "ficha-8" ? { observaciones: "Nueva nota" } : {}) }));
  await p.writeGoogleSheetRows("FICHAS_ADHESION", edited);
  const payload = JSON.parse(requests[0]);
  assert.equal(payload.rows.length, 1);
  assert.equal(payload.rows[0].id, "ficha-8");
  assert.equal(payload.expectedVersions["ficha-8"], "version-8");
  assert.ok(Buffer.byteLength(JSON.stringify(edited)) > 1000000);
  assert.ok(Buffer.byteLength(requests[0]) < 20000);
  await p.writeGoogleSheetRows("FICHAS_ADHESION", edited);
  assert.equal(requests.length, 1, "sin cambios no hay POST");
});

test("un conflicto conserva cambios y versión original; un reintento no usa una versión nueva sin leerla", async () => {
  const requests = [];
  const p = browser(async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return { ok: false, status: 409, json: async () => ({ ok: false, error: "Otro usuario modificó el registro. Recargá el panel." }) };
  });
  const row = { id: "uno", nombre: "Colegio", _version: "original" };
  p.captureAdminSheet("COLEGIOS", [row], [row]);
  for (let i = 0; i < 2; i++) {
    await assert.rejects(p.writeGoogleSheetRows("COLEGIOS", [{ ...row, nombre: "Mi edición" }]), (error) => error.status === 409);
  }
  assert.equal(requests.length, 2);
  assert.equal(requests[1].rows[0].nombre, "Mi edición");
  assert.equal(requests[1].expectedVersions.uno, "original");
});

test("editar durante el envío no se pierde; las bajas son explícitas y llevan versión", async () => {
  let respond;
  const requests = [];
  const p = browser(async (_url, options) => {
    requests.push(JSON.parse(options.body));
    if (requests.length === 1) await new Promise((resolve) => { respond = resolve; });
    return { ok: true, json: async () => ({ ok: true, versions: { uno: `v${requests.length + 1}` } }) };
  });
  p.captureAdminSheet("COLEGIOS", [{ id: "uno", nombre: "Original" }], [{ id: "uno", _version: "v1" }]);
  const draft = { id: "uno", nombre: "Primera edición" };
  const pending = p.writeGoogleSheetRows("COLEGIOS", [draft]);
  draft.nombre = "Segunda edición";
  respond();
  await pending;
  await p.writeGoogleSheetRows("COLEGIOS", [draft]);
  assert.equal(requests[1].rows[0].nombre, "Segunda edición");
  assert.equal(requests[1].expectedVersions.uno, "v2");
  await p.writeGoogleSheetRows("COLEGIOS", []);
  assert.equal(requests.length, 2, "omitir una fila no la borra");
  await p.writeGoogleSheetRows("COLEGIOS", [], ["uno"]);
  assert.equal(requests[2].deleteIds[0], "uno");
  assert.equal(requests[2].expectedVersions.uno, "v3");
});
