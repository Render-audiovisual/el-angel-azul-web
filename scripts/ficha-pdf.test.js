// scripts/ficha-pdf.test.js
const assert = require("node:assert/strict");
const test = require("node:test");
const { PDFDocument } = require("pdf-lib");
const { generarPdfFicha, nombreArchivoPdf, textoSeguro } = require("../lib/ficha-pdf");

const fila = {
  id: "3f1c2a8e-5b6d-4c7e-8f9a-0b1c2d3e4f5a", codigo_contrato: "C-2027-01", viaje: "Bariloche 2027",
  colegio: "Colegio San José", nivel: "Secundaria", grado: "5°", division: "B",
  pasajero_nombre: "José María", pasajero_apellido: "Fernández Núñez", pasajero_tipo_documento: "DNI",
  pasajero_dni: "45123456", pasajero_nacimiento: "2009-03-14", pasajero_sexo: "Masculino",
  responsable_nombre: "María", responsable_apellido: "Núñez", responsable_tipo_documento: "DNI",
  responsable_numero_documento: "12345678", responsable_nacimiento: "1980-05-02", responsable_parentesco: "Madre",
  responsable_email: "maria@gmail.com", responsable_cuil_cuit: "20123456786", responsable_celular: "3794111222",
  responsable_telefono: "", domicilio_calle: "Pasaje Doctor Juan Ramón Fernández", domicilio_numero: "S/N",
  domicilio_piso: "", domicilio_departamento: "", domicilio_barrio: "Laguna Seca", domicilio_localidad: "Santa Ana",
  domicilio_provincia: "Corrientes", domicilio_codigo_postal: "3401", plan_nombre: "12 cuotas", plan_cuotas: "12",
  firma_data_url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  created_at: "2026-09-15T12:00:00Z"
};

test("el PDF conserva fecha y bytes para reintentos idempotentes de correo", async () => {
  const primero = await generarPdfFicha(fila);
  const segundo = await generarPdfFicha(fila);
  const documento = await PDFDocument.load(primero, { updateMetadata: false });
  assert.equal(documento.getCreationDate().toISOString(), fila.created_at.replace("Z", ".000Z"));
  assert.equal(documento.getModificationDate().toISOString(), fila.created_at.replace("Z", ".000Z"));
  assert.deepEqual(Buffer.from(primero), Buffer.from(segundo));
});

test("genera un PDF A4 de una página con tildes, ñ y °", async () => {
  const bytes = await generarPdfFicha(fila);
  assert.equal(Buffer.from(bytes.subarray(0, 5)).toString(), "%PDF-");
  const doc = await PDFDocument.load(bytes);
  assert.equal(doc.getPageCount(), 1);
  const { width, height } = doc.getPage(0).getSize();
  assert.ok(Math.abs(width - 595.28) < 1 && Math.abs(height - 841.89) < 1);
});

test("no falla con caracteres fuera de WinAnsi", async () => {
  await generarPdfFicha({ ...fila, domicilio_barrio: "Barrio 🏠 Ñandú" });
});

test("las letras fuera de Latin-1 se transliteran en vez de perderse («Mićić» salía «Mii»)", () => {
  assert.equal(textoSeguro("Fernández Mićić"), "Fernández Micic");
  assert.equal(textoSeguro("Łukasz Wójcik"), "Lukasz Wójcik");
  assert.equal(textoSeguro("Đorđe Šimić"), "Dorde Simic");
  assert.equal(textoSeguro("D’Angelo – Núñez"), "D'Angelo - Núñez");
});

test("lo que no se puede escribir se ve como «?» y no desaparece, y tildes y ñ no se tocan", () => {
  assert.equal(textoSeguro("李明"), "??");
  assert.equal(textoSeguro("José 😀"), "José ?");
  assert.equal(textoSeguro("  Núñez   Peña  "), "Núñez Peña");
  assert.equal(textoSeguro(null), "");
});

test("nombres con letras de otros alfabetos no rompen el PDF", async () => {
  const bytes = await generarPdfFicha({
    ...fila,
    pasajero_apellido: "Mićić", pasajero_nombre: "Đorđe", responsable_apellido: "µÿ Łukasz", domicilio_calle: "Дмитрий 李明"
  });
  assert.equal((await PDFDocument.load(bytes)).getPageCount(), 1);
});

test("nombre de archivo sin tildes ni espacios", () => {
  assert.equal(nombreArchivoPdf(fila), "ficha-fernandez-nunez-jose-maria-45123456.pdf");
});

test("la fecha de inscripción del PDF es la de Argentina, no la UTC", () => {
  const { fechaArgentina } = require("../lib/ficha-pdf");
  // 22:30 del 15/09 en Argentina (UTC-3) ya es 16/09 en UTC.
  assert.equal(fechaArgentina("2026-09-16T01:30:00Z"), "2026-09-15");
  assert.equal(fechaArgentina("2026-09-15T12:00:00Z"), "2026-09-15");
  assert.equal(fechaArgentina(""), "");
});
