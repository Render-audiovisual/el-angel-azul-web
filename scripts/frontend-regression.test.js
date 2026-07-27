const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const appSource = fs.readFileSync(
  path.join(__dirname, "..", "assets", "js", "app.js"),
  "utf8"
);
const stylesSource = fs.readFileSync(
  path.join(__dirname, "..", "assets", "css", "styles.css"),
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

test("las fichas preservan y vuelven a mostrar todos los datos del formulario", () => {
  const encodeSource = functionSource("googleSheetsFichaRows", "downloadGoogleSheetSchemaCsv");
  const decodeSource = functionSource("sheetFichaFromRow", "applyGoogleSheetsRows");
  const detailSource = functionSource("renderAdminFichaDetail", "approveFichaAdhesionAndCreatePassenger");

  for (const field of [
    "pasajeroNacimiento",
    "pasajeroSexo",
    "responsableNumeroDocumento",
    "responsableNacimiento",
    "responsableParentesco",
    "responsableEmail",
    "responsableCuilCuit",
    "domicilioCalle",
    "domicilioLocalidad",
    "domicilioProvincia",
    "domicilioCodigoPostal",
    "aceptaCondiciones"
  ]) {
    assert.match(encodeSource, new RegExp(field));
    assert.match(detailSource, new RegExp(field));
  }
  assert.match(encodeSource, /firma_data_url/);
  assert.match(decodeSource, /firma_data_url/);
  assert.match(detailSource, /fichaSignatureDataUrl/);
  assert.match(detailSource, /firmaRegistrada/);
});

test("abrir una ficha no cambia su estado ni la mueve de bandeja", () => {
  const source = functionSource("viewFichaAdhesionDetail", "startFichaAdhesionReview");
  assert.match(source, /adminFichasSelectedId = id/);
  assert.doesNotMatch(source, /updateFichaAdhesionStatus/);
  assert.doesNotMatch(source, /adminFichasFilter = "revision"/);
});

test("la búsqueda de fichas conserva foco, cursor y scroll", () => {
  const source = functionSource("bindAdminFichasRecibidas", "renderAdminPagos");
  assert.match(source, /selectionStart/);
  assert.match(source, /focus\(\{ preventScroll: true \}\)/);
  assert.match(source, /setSelectionRange/);
  assert.match(source, /window\.scrollTo\(scrollX, scrollY\)/);
});

test("la búsqueda de fichas ignora mayúsculas y acentos", () => {
  const normalizeSource = functionSource("normalizeFichaSearchText", "fichaMatchesText");
  const matchSource = functionSource("fichaMatchesText", "fichaFilterValue");
  assert.match(normalizeSource, /\.normalize\("NFD"\)/);
  assert.match(normalizeSource, /\.toLowerCase\(\)/);
  assert.match(matchSource, /normalizeFichaSearchText\(search\)/);
  assert.match(matchSource, /normalizeFichaSearchText\(value\)\.includes\(needle\)/);
});

test("la búsqueda es global y cada fila permite abrir o descargar su propia ficha", () => {
  const renderSource = functionSource("renderAdminFichasRecibidas", "renderAdminPasajeros");
  const rowsSource = functionSource("fichaAdhesionDemoRows", "parseAdminMoney");
  assert.match(renderSource, /adminFichasSearch\s*\?\s*fichas/);
  assert.doesNotMatch(renderSource, /selectedFichaCandidate \|\| visibleFichas\[0\]/);
  assert.match(rowsSource, /data-ficha-select/);
  assert.match(rowsSource, /data-ficha-pdf/);
});

test("la plantilla PDF usa una ruta absoluta válida desde cualquier entrada admin", () => {
  const source = functionSource("createFichaAdhesionPdfBlob", "downloadFichaAdhesionPdf");
  assert.match(source, /loadPdfImage\(\"\/assets\/pdf\/ficha-adhesion-template\.png\"\)/);
});

test("el ícono de validación no comprime la etiqueta Estado sugerido", () => {
  assert.match(stylesSource, /\.admin-fichas-approval-checklist li > span\s*\{/);
  assert.doesNotMatch(stylesSource, /\.admin-fichas-approval-checklist span\s*\{/);
});

test("los selectores de asignación respetan el ancho de su columna", () => {
  assert.match(stylesSource, /\.admin-fichas-assignment-grid label\s*\{[\s\S]*?min-width:\s*0;/);
  assert.match(stylesSource, /\.admin-fichas-assignment-grid select\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?width:\s*100%;/);
  assert.match(stylesSource, /grid-template-columns:\s*[\s\S]*?minmax\(0,\s*0\.82fr\)[\s\S]*?minmax\(0,\s*1\.45fr\)/);
});

test("Turismo usa tarjetas visuales y una sola acción para crear viajes", () => {
  const rowsSource = functionSource("renderAdminTurismoTripRows", "renderAdminTurismoForm");
  const contentSource = functionSource("renderAdminTurismoContent", "renderAdminTurismo");
  assert.match(rowsSource, /admin-turismo-trip-cover/);
  assert.match(rowsSource, /adminTurismoCoverPhoto/);
  assert.match(rowsSource, /data-admin-edit/);
  assert.match(rowsSource, /data-admin-delete/);
  assert.equal((contentSource.match(/data-admin-new/g) || []).length, 1);
  assert.match(contentSource, /admin-turismo-create-panel/);
  assert.match(contentSource, /\$\{summary\.activos\}<\/strong><span>Visibles en web/);
  assert.doesNotMatch(contentSource, /\$\{summary\.publicado/);
  assert.doesNotMatch(contentSource, /admin-turismo-list-head/);
  assert.match(stylesSource, /\.admin-turismo-list\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,/);
  assert.match(stylesSource, /@media \(max-width:\s*760px\)[\s\S]*?\.admin-turismo-list\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(stylesSource, /\.admin-turismo-create-panel > button\s*\{[\s\S]*?background:\s*#0d69a1;/);
  assert.match(stylesSource, /\.admin-turismo-row-actions button:first-child\s*\{[\s\S]*?background:\s*#0d69a1;/);
});

test("los selectores de Turismo conservan inputs nativos con una interfaz propia", () => {
  const formSource = functionSource("renderAdminTurismoForm", "adminIconSvg");
  assert.match(formSource, /type="radio" name="fotoPrincipal"/);
  assert.match(formSource, /admin-turismo-foto-principal/);
  assert.match(formSource, /name="categorias" type="checkbox"/);
  assert.match(formSource, /admin-turismo-category-option/);
  assert.match(formSource, /admin-turismo-selection-icon/);
  assert.match(stylesSource, /\.admin-turismo-form \.admin-turismo-category-option:has\(input:checked\)/);
  assert.match(stylesSource, /\.admin-turismo-form \.admin-turismo-foto-principal:has\(input:checked\)/);
  assert.match(stylesSource, /\.admin-turismo-form \.admin-turismo-category-option input,[\s\S]*?\.admin-turismo-form \.admin-turismo-foto-principal input\s*\{[\s\S]*?position:\s*absolute;/);
});

test("el estado operativo de Turismo aparece primero y Configuración queda como Catálogo", () => {
  const formSource = functionSource("renderAdminTurismoForm", "adminIconSvg");
  assert.ok(formSource.indexOf("admin-turismo-quick-status") < formSource.indexOf('block("Información básica"'));
  assert.match(formSource, /name="estado" type="radio"/);
  assert.doesNotMatch(formSource, /<select name="estado">/);
  assert.match(formSource, /block\("Catálogo"/);
  assert.match(stylesSource, /\.admin-turismo-status-options\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,/);
  assert.match(stylesSource, /\.admin-turismo-form \.admin-turismo-status-option:has\(input:checked\)/);
  assert.match(stylesSource, /\.admin-turismo-form \.admin-turismo-check--featured:has\(input:checked\)/);
});
