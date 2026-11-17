const assert = require("node:assert/strict");
const test = require("node:test");
const zlib = require("node:zlib");

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://nadie:nadie@127.0.0.1:1/nada";
const { leerPadron, importarColegios } = require("../lib/padron");
const { crearPoolLocal } = require("./helpers/pglite-pool");

// Zip mínimo con deflate, solo para armar un .xlsx de prueba.
function crearZip(archivos) {
  const partes = [];
  const central = [];
  let offset = 0;
  for (const [nombre, contenido] of Object.entries(archivos)) {
    const nom = Buffer.from(nombre);
    const datos = zlib.deflateRawSync(Buffer.from(contenido));
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8);
    local.writeUInt32LE(datos.length, 18); local.writeUInt32LE(Buffer.byteLength(contenido), 22);
    local.writeUInt16LE(nom.length, 26);
    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0); dir.writeUInt16LE(20, 4); dir.writeUInt16LE(20, 6); dir.writeUInt16LE(8, 10);
    dir.writeUInt32LE(datos.length, 20); dir.writeUInt32LE(Buffer.byteLength(contenido), 24);
    dir.writeUInt16LE(nom.length, 28); dir.writeUInt32LE(offset, 42);
    partes.push(local, nom, datos);
    central.push(dir, nom);
    offset += local.length + nom.length + datos.length;
  }
  const centralBuf = Buffer.concat(central);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(central.length / 2, 8); fin.writeUInt16LE(central.length / 2, 10);
  fin.writeUInt32LE(centralBuf.length, 12); fin.writeUInt32LE(offset, 16);
  return Buffer.concat([...partes, centralBuf, fin]);
}

const TITULOS = ["Jurisdicción", "Localidad", "Cueanexo", "Nombre", "Común", "Primario", "Secundario", "Secundario - INET", "Especial", "Primario", "Secundario"];
const LETRAS = "ABCDEFGHIJK".split("");

function xlsxDePrueba(filas) {
  const textos = [];
  const idx = (t) => { let i = textos.indexOf(t); if (i < 0) { i = textos.length; textos.push(t); } return i; };
  const celda = (letra, n, v) => (v === "" || v == null ? `<c r="${letra}${n}" s="1"/>`
    : typeof v === "number" ? `<c r="${letra}${n}"><v>${v}</v></c>` : `<c r="${letra}${n}" t="s"><v>${idx(v)}</v></c>`);
  const fila = (n, valores) => `<row r="${n}">${valores.map((v, i) => celda(LETRAS[i], n, v)).join("")}</row>`;
  const hoja = `<?xml version="1.0"?><worksheet><sheetData>${fila(8, ["Listado de establecimientos"])}${fila(13, TITULOS)}${filas.map((f, i) => fila(14 + i, f)).join("")}</sheetData></worksheet>`;
  const sst = `<?xml version="1.0"?><sst>${textos.map((t) => `<si><t>${t.replace(/&/g, "&amp;")}</t></si>`).join("")}</sst>`;
  return crearZip({ "xl/worksheets/sheet1.xml": hoja, "xl/sharedStrings.xml": sst });
}

//        Jurisdicción  Localidad   Cueanexo     Nombre              Común Prim Sec  SecINET Esp Prim(Esp) Sec(Esp)
const FILAS = [
  ["Corrientes",   "Goya",       "180000100", "ESCUELA NORMAL N° 1", 1, 1, "", "", "", "", ""],
  ["Corrientes",   "Goya",       "180000101", "COLEGIO SAN JOSÉ & CÍA", 1, "", 1, "", "", "", ""],
  ["Misiones",     "Posadas",    "540000200", "COLEGIO SAN JOSÉ & CÍA", 1, "", "", 1, "", "", ""],
  ["Misiones",     "Oberá",      "540000300", "ESCUELA ESPECIAL 5", "", "", "", "", 1, 1, 1],
  ["Misiones",     "Oberá",      "540000301", "JARDÍN 7", 1, "", "", "", "", "", ""],
  ["Chaco",        "Resistencia", "220000400", "COLEGIO CHACO", 1, 1, 1, "", "", "", ""],
  ["Corrientes",   "Goya",       "180000100", "ESCUELA NORMAL N° 1", 1, 1, "", "", "", "", ""]
];

test("lee el .xlsx y filtra: provincias pedidas, nivel común primario/secundario, sin repetidos", () => {
  const colegios = leerPadron(xlsxDePrueba(FILAS));
  assert.deepEqual(colegios.map((c) => c.codigo), ["180000100", "180000101", "540000200"]);
  assert.equal(colegios[1].nombre, "COLEGIO SAN JOSÉ & CÍA");
  assert.deepEqual(colegios[2], { codigo: "540000200", nombre: "COLEGIO SAN JOSÉ & CÍA", provincia: "Misiones", localidad: "Posadas" });
  assert.deepEqual(leerPadron(xlsxDePrueba(FILAS), { provincias: ["chaco"] }).map((c) => c.codigo), ["220000400"]);
});

test("un formato distinto falla con mensaje claro", () => {
  const sinTitulos = crearZip({
    "xl/worksheets/sheet1.xml": '<worksheet><sheetData><row r="1"><c r="A1"><v>1</v></c></row></sheetData></worksheet>',
    "xl/sharedStrings.xml": "<sst></sst>"
  });
  assert.throws(() => leerPadron(sinTitulos), /fila de títulos/);
  assert.throws(() => leerPadron(Buffer.from("no es un zip")), /no es un zip/);
});

test("importarColegios: crea, vincula los cargados a mano, desambigua y es repetible", async () => {
  const pool = await crearPoolLocal();
  try {
    await pool.query("insert into colegios (nombre) values ('Escuela Normal N° 1')"); // cargado a mano, sin código
    const colegios = leerPadron(xlsxDePrueba(FILAS));
    const r1 = await importarColegios(pool, colegios);
    assert.deepEqual(r1, { nuevos: 2, vinculados: 1, existentes: 0, renombradosPorDuplicado: 1 });
    const { rows } = await pool.query("select nombre, codigo_oficial, provincia, localidad, activo from colegios order by codigo_oficial");
    assert.equal(rows.length, 3, "el cargado a mano se vinculó en vez de duplicarse");
    assert.equal(rows[0].nombre, "Escuela Normal N° 1", "no se pisa el nombre editado");
    assert.equal(rows[0].codigo_oficial, "180000100");
    assert.equal(rows[0].localidad, "Goya");
    assert.equal(rows[1].nombre, "COLEGIO SAN JOSÉ & CÍA");
    assert.equal(rows[2].nombre, "COLEGIO SAN JOSÉ & CÍA (Posadas)");
    assert.ok(rows.every((x) => x.activo));

    await pool.query("update colegios set activo = false where codigo_oficial = '180000101'");
    const r2 = await importarColegios(pool, colegios);
    assert.deepEqual(r2, { nuevos: 0, vinculados: 0, existentes: 3, renombradosPorDuplicado: 0 });
    const baja = await pool.query("select activo from colegios where codigo_oficial = '180000101'");
    assert.equal(baja.rows[0].activo, false, "reimportar no reactiva un colegio dado de baja");
  } finally {
    await pool.close();
  }
});
