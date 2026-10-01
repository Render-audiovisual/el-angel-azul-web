// lib/ficha-pdf.js
// PDF de la Ficha de Adhesión generado en el servidor a partir de la ficha
// guardada. Misma plantilla y mismas posiciones que usaba el navegador
// (calibradas sobre un lienzo de 1240x1754 px), convertidas a puntos A4.
const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const PLANTILLA = path.join(__dirname, "..", "assets", "pdf", "ficha-adhesion-template.png");
const LIENZO_ANCHO = 1240;
const A4 = { ancho: 595.28, alto: 841.89 };
const ESCALA = A4.ancho / LIENZO_ANCHO;
const SUBIDA_LINEA = 8;
const SANGRIA = 10;
const AZUL = rgb(0x06 / 255, 0x4f / 255, 0x9e / 255);

const CAMPOS = {
  contrato: { x: 626, y: 200, width: 185, size: 17, minSize: 12 },
  destino: { x: 626, y: 267, width: 175, size: 17, minSize: 11 },
  colegio: { x: 626, y: 337, width: 455, size: 17, minSize: 8 },
  pasajeroNombre: { x: 292, y: 489, width: 870, size: 17, minSize: 10 },
  pasajeroDocumento: { x: 292, y: 533, width: 320, size: 16, minSize: 10 },
  pasajeroNacimientoDia: { x: 768, y: 533, width: 55, size: 16, minSize: 10 },
  pasajeroNacimientoMes: { x: 842, y: 533, width: 48, size: 16, minSize: 10 },
  pasajeroNacimientoAnio: { x: 908, y: 533, width: 80, size: 16, minSize: 10 },
  pasajeroSexo: { x: 1050, y: 533, width: 95, size: 16, minSize: 9 },
  responsableNombre: { x: 292, y: 658, width: 870, size: 17, minSize: 10 },
  responsableDocumento: { x: 292, y: 700, width: 320, size: 16, minSize: 10 },
  responsableNacimientoDia: { x: 768, y: 700, width: 55, size: 16, minSize: 10 },
  responsableNacimientoMes: { x: 842, y: 700, width: 48, size: 16, minSize: 10 },
  responsableNacimientoAnio: { x: 908, y: 700, width: 80, size: 16, minSize: 10 },
  responsableParentesco: { x: 1082, y: 700, width: 72, size: 13, minSize: 7 },
  responsableEmail: { x: 365, y: 742, width: 335, size: 13, minSize: 8 },
  responsableCuilCuit: { x: 882, y: 742, width: 275, size: 15, minSize: 10 },
  domicilioCalle: { x: 148, y: 868, width: 470, size: 16, minSize: 8 },
  domicilioNumero: { x: 680, y: 868, width: 130, size: 16, minSize: 10 },
  domicilioPiso: { x: 906, y: 868, width: 90, size: 16, minSize: 10 },
  domicilioDepartamento: { x: 1060, y: 868, width: 90, size: 16, minSize: 10 },
  domicilioLocalidad: { x: 210, y: 912, width: 435, size: 16, minSize: 10 },
  domicilioProvincia: { x: 764, y: 912, width: 365, size: 16, minSize: 9 },
  domicilioTelefono: { x: 136, y: 958, width: 210, size: 16, minSize: 10 },
  domicilioCelular: { x: 404, y: 958, width: 245, size: 16, minSize: 10 },
  domicilioCodigoPostal: { x: 1050, y: 958, width: 120, size: 16, minSize: 10 },
  fechaInscripcionDia: { x: 322, y: 1112, width: 55, size: 15, minSize: 10 },
  fechaInscripcionMes: { x: 392, y: 1112, width: 55, size: 15, minSize: 10 },
  fechaInscripcionAnio: { x: 462, y: 1112, width: 90, size: 15, minSize: 10 },
  cuotas: { x: 92, y: 1196, width: 80, size: 15, minSize: 10 },
  // El renglón "cuotas de $ ... 00" es para el monto; el nombre del plan va
  // en el espacio libre a su derecha.
  planPago: { x: 440, y: 1196, width: 700, size: 15, minSize: 9 },
  aclaracion: { x: 850, y: 1591, width: 300, size: 14, minSize: 8 }
};
const FIRMA = { x: 136, y: 1516, ancho: 320, alto: 62 };

let plantillaCache = null;

// Helvetica estándar codifica WinAnsi (incluye tildes, ñ, ü, °, º, ·).
// Cualquier otro carácter (emoji, etc.) se descarta en vez de romper el PDF.
function textoSeguro(valor) {
  return Array.from(String(valor ?? "").replace(/\s+/g, " ").trim())
    .filter((c) => { const code = c.codePointAt(0); return code >= 0x20 && code <= 0xff; })
    .join("");
}

function partesFecha(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  return m ? { dia: m[3], mes: m[2], anio: m[1] } : { dia: "", mes: "", anio: "" };
}

function nombreCompleto(apellido, nombre) {
  return [textoSeguro(apellido), textoSeguro(nombre)].filter(Boolean).join(", ");
}

function nombreArchivoPdf(fila) {
  const base = `ficha ${fila.pasajero_apellido || ""} ${fila.pasajero_nombre || ""} ${fila.pasajero_dni || ""}`
    .normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${base}.pdf`;
}

async function generarPdfFicha(fila) {
  const doc = await PDFDocument.create();
  const pagina = doc.addPage([A4.ancho, A4.alto]);
  plantillaCache = plantillaCache || fs.readFileSync(PLANTILLA);
  const plantilla = await doc.embedPng(plantillaCache);
  pagina.drawImage(plantilla, { x: 0, y: 0, width: A4.ancho, height: A4.alto });
  const fuente = await doc.embedFont(StandardFonts.HelveticaBold);

  const escribir = (valor, campo, { mayusculas = true } = {}) => {
    let texto = textoSeguro(valor);
    if (!texto) return;
    if (mayusculas) texto = texto.toLocaleUpperCase("es-AR");
    const anchoMax = campo.width * ESCALA;
    let tamanio = campo.size * ESCALA;
    const minimo = campo.minSize * ESCALA;
    while (tamanio > minimo && fuente.widthOfTextAtSize(texto, tamanio) > anchoMax) tamanio -= 0.25;
    while (texto.length > 1 && fuente.widthOfTextAtSize(texto, tamanio) > anchoMax) texto = texto.slice(0, -1);
    pagina.drawText(texto, {
      x: (campo.x + SANGRIA) * ESCALA,
      y: A4.alto - (campo.y - SUBIDA_LINEA) * ESCALA,
      size: tamanio,
      font: fuente,
      color: AZUL
    });
  };

  const colegio = [fila.colegio, [fila.nivel, fila.grado, fila.division].filter(Boolean).join(" ")]
    .filter(Boolean).join(" · ");
  const calle = [fila.domicilio_calle, fila.domicilio_barrio ? `Bº ${fila.domicilio_barrio}` : ""]
    .filter(Boolean).join(", ");
  const nacPax = partesFecha(fila.pasajero_nacimiento);
  const nacResp = partesFecha(fila.responsable_nacimiento);
  const inscripcion = partesFecha(fila.created_at);

  escribir(fila.codigo_contrato, CAMPOS.contrato);
  escribir(fila.viaje, CAMPOS.destino);
  escribir(colegio, CAMPOS.colegio);
  escribir(nombreCompleto(fila.pasajero_apellido, fila.pasajero_nombre), CAMPOS.pasajeroNombre);
  escribir(`${fila.pasajero_tipo_documento || "DNI"} ${fila.pasajero_dni || ""}`, CAMPOS.pasajeroDocumento);
  escribir(nacPax.dia, CAMPOS.pasajeroNacimientoDia);
  escribir(nacPax.mes, CAMPOS.pasajeroNacimientoMes);
  escribir(nacPax.anio, CAMPOS.pasajeroNacimientoAnio);
  escribir(fila.pasajero_sexo, CAMPOS.pasajeroSexo);
  escribir(nombreCompleto(fila.responsable_apellido, fila.responsable_nombre), CAMPOS.responsableNombre);
  escribir(`${fila.responsable_tipo_documento || "DNI"} ${fila.responsable_numero_documento || ""}`, CAMPOS.responsableDocumento);
  escribir(nacResp.dia, CAMPOS.responsableNacimientoDia);
  escribir(nacResp.mes, CAMPOS.responsableNacimientoMes);
  escribir(nacResp.anio, CAMPOS.responsableNacimientoAnio);
  escribir(fila.responsable_parentesco, CAMPOS.responsableParentesco);
  escribir(fila.responsable_email, CAMPOS.responsableEmail, { mayusculas: false });
  escribir(String(fila.responsable_cuil_cuit || "").replace(/^(\d{2})(\d{8})(\d)$/, "$1-$2-$3"), CAMPOS.responsableCuilCuit);
  escribir(calle, CAMPOS.domicilioCalle);
  escribir(fila.domicilio_numero, CAMPOS.domicilioNumero);
  escribir(fila.domicilio_piso, CAMPOS.domicilioPiso);
  escribir(fila.domicilio_departamento, CAMPOS.domicilioDepartamento);
  escribir(fila.domicilio_localidad, CAMPOS.domicilioLocalidad);
  escribir(fila.domicilio_provincia, CAMPOS.domicilioProvincia);
  escribir(fila.responsable_telefono, CAMPOS.domicilioTelefono);
  escribir(fila.responsable_celular, CAMPOS.domicilioCelular);
  escribir(fila.domicilio_codigo_postal, CAMPOS.domicilioCodigoPostal);
  escribir(inscripcion.dia, CAMPOS.fechaInscripcionDia);
  escribir(inscripcion.mes, CAMPOS.fechaInscripcionMes);
  escribir(inscripcion.anio, CAMPOS.fechaInscripcionAnio);
  escribir(fila.plan_cuotas, CAMPOS.cuotas);
  escribir(`Plan: ${fila.plan_nombre || "a definir con administración"}`, CAMPOS.planPago);
  escribir(nombreCompleto(fila.responsable_apellido, fila.responsable_nombre), CAMPOS.aclaracion);

  const firma = /^data:image\/png;base64,(.+)$/.exec(String(fila.firma_data_url || ""));
  if (firma) {
    const imagen = await doc.embedPng(Buffer.from(firma[1], "base64"));
    const ratio = Math.min(FIRMA.ancho / imagen.width, FIRMA.alto / imagen.height);
    const ancho = imagen.width * ratio;
    const alto = imagen.height * ratio;
    pagina.drawImage(imagen, {
      x: (FIRMA.x + (FIRMA.ancho - ancho) / 2) * ESCALA,
      y: A4.alto - (FIRMA.y + (FIRMA.alto + alto) / 2) * ESCALA,
      width: ancho * ESCALA,
      height: alto * ESCALA
    });
  }
  return doc.save();
}

module.exports = { generarPdfFicha, nombreArchivoPdf };
