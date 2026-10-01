// scripts/ficha-validation.test.js
const assert = require("node:assert/strict");
const test = require("node:test");
const v = require("../assets/js/modules/ficha-validation.js");

const HOY = new Date("2026-09-15T12:00:00Z");
const FIRMA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function fichaValida(extra = {}) {
  return {
    nivel: "Secundaria", destino: "Bariloche", anio: "2027",
    colegioId: "3f1c2a8e-5b6d-4c7e-8f9a-0b1c2d3e4f5a", colegioTexto: "",
    grado: "5°", division: "b", planPagoId: "",
    pasajeroNombre: "José  María", pasajeroApellido: "Fernández Núñez",
    pasajeroTipoDocumento: "DNI", pasajeroNumeroDocumento: "45.123.456",
    pasajeroNacimiento: "2009-03-14", pasajeroSexo: "Masculino",
    responsableNombre: "María", responsableApellido: "Núñez",
    responsableTipoDocumento: "DNI", responsableNumeroDocumento: "12345678",
    responsableNacimiento: "1980-05-02", responsableParentesco: "Madre",
    responsableCuilCuit: "20-12345678-6", responsableEmail: "Maria@Gmail.com",
    responsableCelular: "+54 9 3794 11-1222", responsableTelefono: "",
    domicilioCalle: "Av. 3 de Abril", domicilioNumero: "s/n", domicilioPiso: "", domicilioDepartamento: "",
    domicilioBarrio: "Laguna Seca", domicilioLocalidad: "Corrientes", domicilioProvincia: "Corrientes",
    domicilioCodigoPostal: "3400", aceptaCondiciones: true, firma: FIRMA,
    ...extra
  };
}

test("CUIL: dígito verificador y coincidencia con DNI", () => {
  assert.equal(v.cuilValido("20-12345678-6"), true);
  assert.equal(v.cuilValido("20123456786", "12345678"), true);
  assert.equal(v.cuilValido("20123456786", "12345679"), false);
  assert.equal(v.cuilValido("20123456785"), false);
  assert.equal(v.cuilValido("30123456786"), false);
  assert.equal(v.cuilValido("2012345678"), false);
});

test("sugerencia de email para dominios mal escritos", () => {
  assert.equal(v.sugerenciaEmail("ana@gmail.con"), "ana@gmail.com");
  assert.equal(v.sugerenciaEmail("ana@hotmial.com"), "ana@hotmail.com");
  assert.equal(v.sugerenciaEmail("ana@gmail.com"), "");
});

test("una ficha PAX completa es válida y se normaliza", () => {
  const r = v.validarFichaPax(fichaValida(), { hoy: HOY });
  assert.deepEqual(r.errores, {});
  assert.equal(r.ok, true);
  assert.equal(r.datos.pasajeroNombre, "José María");
  assert.equal(r.datos.pasajeroNumeroDocumento, "45123456");
  assert.equal(r.datos.division, "B");
  assert.equal(r.datos.domicilioNumero, "S/N");
  assert.equal(r.datos.responsableEmail, "maria@gmail.com");
  assert.equal(r.datos.responsableCuilCuit, "20123456786");
});

test("faltantes y formatos inválidos devuelven error por campo", () => {
  const r = v.validarFichaPax(fichaValida({
    pasajeroApellido: "", responsableCuilCuit: "20123456785", domicilioCodigoPostal: "34",
    grado: "7°", responsableEmail: "maria@", aceptaCondiciones: false, firma: ""
  }), { hoy: HOY });
  assert.equal(r.ok, false);
  for (const campo of ["pasajeroApellido", "responsableCuilCuit", "domicilioCodigoPostal", "grado", "responsableEmail", "aceptaCondiciones", "firma"]) {
    assert.ok(r.errores[campo], `falta error en ${campo}`);
  }
});

test("colegio: id o texto de al menos 3 letras", () => {
  assert.ok(v.validarFichaPax(fichaValida({ colegioId: "", colegioTexto: "" }), { hoy: HOY }).errores.colegio);
  assert.equal(v.validarFichaPax(fichaValida({ colegioId: "", colegioTexto: "Normal N° 2" }), { hoy: HOY }).ok, true);
});

test("plan obligatorio solo si el contrato tiene planes, y debe ser uno de ellos", () => {
  const planes = ["a1b2c3d4-0000-4000-8000-000000000001"];
  assert.ok(v.validarFichaPax(fichaValida(), { hoy: HOY, planesDisponibles: planes }).errores.planPagoId);
  assert.ok(v.validarFichaPax(fichaValida({ planPagoId: "otro" }), { hoy: HOY, planesDisponibles: planes }).errores.planPagoId);
  assert.equal(v.validarFichaPax(fichaValida({ planPagoId: planes[0] }), { hoy: HOY, planesDisponibles: planes }).ok, true);
});

test("edades: pasajero 5–25 y tutor mayor de edad", () => {
  assert.ok(v.validarFichaPax(fichaValida({ pasajeroNacimiento: "1990-01-01" }), { hoy: HOY }).errores.pasajeroNacimiento);
  assert.ok(v.validarFichaPax(fichaValida({ responsableNacimiento: "2010-01-01" }), { hoy: HOY }).errores.responsableNacimiento);
  assert.ok(v.validarFichaPax(fichaValida({ pasajeroNacimiento: "2009-02-30" }), { hoy: HOY }).errores.pasajeroNacimiento);
});

test("nombres admiten tildes, ñ y apóstrofo, pero no números", () => {
  assert.equal(v.validarFichaPax(fichaValida({ pasajeroApellido: "O'Higgins Muñoz" }), { hoy: HOY }).ok, true);
  assert.ok(v.validarFichaPax(fichaValida({ pasajeroNombre: "Juan2" }), { hoy: HOY }).errores.pasajeroNombre);
});

test("ficha de tutor válida e inválida", () => {
  const base = {
    pasajeroNombre: "José María", pasajeroApellido: "Fernández", pasajeroNumeroDocumento: "45123456",
    nombre: "Carlos", apellido: "Fernández", tipoDocumento: "DNI", numeroDocumento: "12345678",
    cuilCuit: "20123456786", celular: "3794111222", email: "carlos@gmail.com", parentesco: "Padre",
    aceptaCondiciones: true
  };
  assert.equal(v.validarFichaTutor(base, { hoy: HOY }).ok, true);
  const r = v.validarFichaTutor({ ...base, cuilCuit: "", pasajeroNumeroDocumento: "12" }, { hoy: HOY });
  assert.ok(r.errores.cuilCuit);
  assert.ok(r.errores.pasajeroNumeroDocumento);
});
