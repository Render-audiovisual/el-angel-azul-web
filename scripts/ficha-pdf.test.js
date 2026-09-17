// scripts/ficha-pdf.test.js
const assert = require("node:assert/strict");
const test = require("node:test");
const { PDFDocument } = require("pdf-lib");
const { generarPdfFicha, nombreArchivoPdf } = require("../lib/ficha-pdf");

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

test("nombre de archivo sin tildes ni espacios", () => {
  assert.equal(nombreArchivoPdf(fila), "ficha-fernandez-nunez-jose-maria-45123456.pdf");
});
