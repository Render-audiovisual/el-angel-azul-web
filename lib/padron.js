// Importación del Padrón Oficial de Establecimientos Educativos (Ministerio de
// Educación de la Nación) a la tabla `colegios`. Sin dependencias: lee el .xlsx
// con zlib y regex sobre el XML (la hoja pesa ~87 MB descomprimida).
const zlib = require("node:zlib");

const PROVINCIAS_POR_DEFECTO = ["Corrientes", "Misiones"];

// ---------- ZIP mínimo (stored y deflate; sin zip64) ----------

function leerEntradaZip(buffer, nombreBuscado) {
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("El archivo no es un .xlsx válido (no es un zip).");
  const total = buffer.readUInt16LE(eocd + 10);
  let pos = buffer.readUInt32LE(eocd + 16);
  for (let n = 0; n < total; n++) {
    if (buffer.readUInt32LE(pos) !== 0x02014b50) throw new Error("Directorio del zip dañado.");
    const metodo = buffer.readUInt16LE(pos + 10);
    const tamComprimido = buffer.readUInt32LE(pos + 20);
    const largoNombre = buffer.readUInt16LE(pos + 28);
    const largoExtra = buffer.readUInt16LE(pos + 30);
    const largoComentario = buffer.readUInt16LE(pos + 32);
    const offsetLocal = buffer.readUInt32LE(pos + 42);
    const nombre = buffer.toString("utf8", pos + 46, pos + 46 + largoNombre);
    if (nombre === nombreBuscado) {
      const inicio = offsetLocal + 30 + buffer.readUInt16LE(offsetLocal + 26) + buffer.readUInt16LE(offsetLocal + 28);
      const datos = buffer.subarray(inicio, inicio + tamComprimido);
      if (metodo === 0) return datos.toString("utf8");
      if (metodo === 8) return zlib.inflateRawSync(datos).toString("utf8");
      throw new Error(`Método de compresión ${metodo} no soportado.`);
    }
    pos += 46 + largoNombre + largoExtra + largoComentario;
  }
  throw new Error(`Falta ${nombreBuscado} dentro del .xlsx.`);
}

// ---------- XML de la hoja ----------

const ENTIDADES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function decodificar(texto) {
  return texto.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e) => {
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTIDADES[e.toLowerCase()];
  });
}

function leerTextosCompartidos(xml) {
  const textos = [];
  for (const si of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    let texto = "";
    for (const t of si[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) texto += t[1];
    textos.push(decodificar(texto));
  }
  return textos;
}

function* filasDeLaHoja(xml, textos) {
  for (const fila of xml.matchAll(/<row r="(\d+)"[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const celdas = {};
    for (const c of (fila[2] || "").matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const cuerpo = c[3];
      if (!cuerpo) continue;
      const tipo = /\st="(\w+)"/.exec(c[2])?.[1];
      let valor;
      if (tipo === "inlineStr") {
        valor = decodificar([...cuerpo.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(""));
      } else {
        const v = /<v>([\s\S]*?)<\/v>/.exec(cuerpo);
        if (!v) continue;
        valor = tipo === "s" ? textos[Number(v[1])] : decodificar(v[1]);
      }
      celdas[c[1]] = String(valor ?? "").replace(/\s+/g, " ").trim();
    }
    yield { numero: Number(fila[1]), celdas };
  }
}

const sinAcentos = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Devuelve los establecimientos comunes con primario o secundario de las
// provincias pedidas: [{ codigo, nombre, provincia, localidad }].
function colegiosDelPadron(sheetXml, sharedStringsXml, { provincias = PROVINCIAS_POR_DEFECTO } = {}) {
  const textos = leerTextosCompartidos(sharedStringsXml);
  const buscadas = new Set(provincias.map(sinAcentos));
  let columnas = null; // nombre normalizado -> letra de la primera columna con ese título
  const colegios = [];
  const vistos = new Set();
  for (const { celdas } of filasDeLaHoja(sheetXml, textos)) {
    if (!columnas) {
      const nombres = Object.entries(celdas).map(([letra, t]) => [sinAcentos(t), letra]);
      if (nombres.some(([n]) => n === "cueanexo") && nombres.some(([n]) => n === "jurisdiccion")) {
        columnas = {};
        // Los niveles se repiten bajo Especial y Adultos: vale la primera columna (Común).
        for (const [n, letra] of nombres) if (!(n in columnas)) columnas[n] = letra;
        for (const requerida of ["jurisdiccion", "cueanexo", "nombre", "localidad", "comun", "primario", "secundario"]) {
          if (!columnas[requerida]) throw new Error(`El Padrón no tiene la columna «${requerida}»: cambió el formato.`);
        }
      }
      continue;
    }
    const provincia = celdas[columnas.jurisdiccion];
    if (!buscadas.has(sinAcentos(provincia))) continue;
    const ofrece = (n) => celdas[columnas[n]] === "1";
    if (!ofrece("comun") || !(ofrece("primario") || ofrece("secundario") || ofrece("secundario - inet"))) continue;
    const codigo = celdas[columnas.cueanexo];
    const nombre = celdas[columnas.nombre];
    if (!codigo || !nombre || nombre.length < 3 || vistos.has(codigo)) continue;
    vistos.add(codigo);
    colegios.push({ codigo, nombre, provincia, localidad: celdas[columnas.localidad] || "" });
  }
  if (!columnas) throw new Error("No encontré la fila de títulos del Padrón (Jurisdicción / Cueanexo).");
  return colegios;
}

function leerPadron(bufferXlsx, opciones) {
  return colegiosDelPadron(
    leerEntradaZip(bufferXlsx, "xl/worksheets/sheet1.xml"),
    leerEntradaZip(bufferXlsx, "xl/sharedStrings.xml"),
    opciones
  );
}

// ---------- Upsert en la base ----------

// Reglas: el código oficial manda. Si ya existe, solo se completan
// provincia/localidad vacías (no se pisan nombre ni "activo" editados a mano).
// Si hay un colegio cargado a mano con el mismo nombre y sin código, se
// vincula. Si no, se crea; si el nombre ya está tomado por otro código se
// desambigua con la localidad y, de ser necesario, con el código.
// `queryable` debe estar dentro de una transacción (el que llama decide
// confirmar o revertir).
async function importarColegios(queryable, colegios) {
  const { rows } = await queryable.query("select id, lower(nombre) as nombre, codigo_oficial from colegios");
  const porCodigo = new Map(rows.filter((r) => r.codigo_oficial).map((r) => [r.codigo_oficial, r.id]));
  const sinCodigoPorNombre = new Map(rows.filter((r) => !r.codigo_oficial).map((r) => [r.nombre, r.id]));
  const nombresTomados = new Set(rows.map((r) => r.nombre));
  const resumen = { nuevos: 0, vinculados: 0, existentes: 0, renombradosPorDuplicado: 0 };

  for (const c of colegios) {
    const idExistente = porCodigo.get(c.codigo);
    if (idExistente) {
      await queryable.query(
        "update colegios set provincia = coalesce(provincia, $2), localidad = coalesce(localidad, nullif($3, '')) where id = $1",
        [idExistente, c.provincia, c.localidad]
      );
      resumen.existentes++;
      continue;
    }
    const idManual = sinCodigoPorNombre.get(c.nombre.toLowerCase());
    if (idManual) {
      await queryable.query(
        "update colegios set codigo_oficial = $2, provincia = coalesce(provincia, $3), localidad = coalesce(localidad, nullif($4, '')) where id = $1",
        [idManual, c.codigo, c.provincia, c.localidad]
      );
      sinCodigoPorNombre.delete(c.nombre.toLowerCase());
      porCodigo.set(c.codigo, idManual);
      resumen.vinculados++;
      continue;
    }
    let nombre = c.nombre;
    if (nombresTomados.has(nombre.toLowerCase())) {
      nombre = c.localidad ? `${c.nombre} (${c.localidad})` : `${c.nombre} (${c.codigo})`;
      if (nombresTomados.has(nombre.toLowerCase())) nombre = `${c.nombre} (${c.localidad ? `${c.localidad} · ` : ""}${c.codigo})`;
      resumen.renombradosPorDuplicado++;
    }
    const creado = await queryable.query(
      "insert into colegios (nombre, provincia, localidad, codigo_oficial, activo) values ($1, $2, nullif($3, ''), $4, true) returning id",
      [nombre, c.provincia, c.localidad, c.codigo]
    );
    porCodigo.set(c.codigo, creado.rows[0].id);
    nombresTomados.add(nombre.toLowerCase());
    resumen.nuevos++;
  }
  return resumen;
}

module.exports = { PROVINCIAS_POR_DEFECTO, leerEntradaZip, colegiosDelPadron, leerPadron, importarColegios };
