# Ficha de Adhesión v2 — Fase 1 — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ficha de Adhesión estable y validada (PAX y Tutor), guardada correctamente en Supabase, visible con toda su pertenencia en el admin, con PDF generado en el servidor y correo automático listo para activar.

**Architecture:** Un módulo de validación compartido (UMD) usado por navegador y servidor. Rutas públicas propias (`/api/public/*`) para enviar fichas; el admin sigue usando el contrato plano `/api/google-sheets?sheet=X` ya existente, extendido con columnas y hojas nuevas (`FICHAS_TUTOR`, `PLANES_PAGO`, `COLEGIOS`). PDF con `pdf-lib` y correo con la API HTTP de Resend vía `fetch`, ambos en el servidor.

**Tech Stack:** Node ≥20 sin framework (`server.js`), `pg`, `pdf-lib` (nuevo), Supabase Postgres 17, HTML/JS vanilla (`assets/js/app.js`), SheetJS ya cargado por CDN, `node --test`.

**Spec:** `docs/superpowers/specs/2026-09-15-ficha-adhesion-design.md`

## Global Constraints

- Node ≥ 20; sin frameworks nuevos. Única dependencia nueva: `pdf-lib@1.17.1`.
- Todo texto visible en español rioplatense (vos), con tildes correctas.
- Cuotas de un plan: entre 1 y 18.
- Curso = nivel (`Primaria` | `Secundaria`); Grado Primaria `1°`–`7°`, Secundaria `1°`–`6°`; División 1–3 alfanuméricos en mayúsculas.
- La base se reinicia (solo datos de prueba). Obligatorios exigidos también en Postgres.
- Tablas nuevas con RLS activado y sin policies.
- Nunca mostrar éxito de envío sin respuesta `201` del servidor.
- El correo nunca bloquea ni revierte el guardado de una ficha; sin variables configuradas queda `email_estado = 'sin_configurar'`.
- Variables de correo: `RESEND_API_KEY`, `EAA_EMAIL_FROM`, `EAA_EMAIL_COPIA` (opcional).
- CSP: `connect-src 'self' https://apis.datos.gob.ar`.
- Secretos jamás en el repo ni en logs.
- Commits en la rama `feat/ficha-adhesion-v2`, terminando con `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- Comando de pruebas: `npm test` (corre `node --test scripts/*.test.js`).

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `assets/js/modules/ficha-validation.js` | Crear | Reglas de validación y normalización PAX/Tutor, listas (provincias, grados, parentescos), CUIL, sugerencia de email |
| `scripts/ficha-validation.test.js` | Crear | Pruebas del módulo anterior |
| `supabase/migrations/0003_ficha_adhesion_v2.sql` | Crear | Esquema v2 |
| `scripts/db-check.js` | Modificar | Chequear tablas nuevas |
| `lib/db.js` | Modificar | Inserción pública v2, contexto exacto, colegios, planes, fichas de tutor, email, pasajeros con apellido/plan |
| `lib/ficha-pdf.js` | Crear | PDF de la ficha sobre la plantilla PNG |
| `scripts/ficha-pdf.test.js` | Crear | Prueba de generación |
| `lib/email.js` | Crear | Armado y envío por Resend |
| `scripts/email.test.js` | Crear | Pruebas con `fetch` simulado |
| `server.js` | Modificar | Rutas públicas y de admin nuevas, SCHEMA, CSP, baja de la escritura pública vieja |
| `scripts/server-routes.test.js` | Modificar | Rutas nuevas |
| `index.html`, `admin/index.html`, `admin/*/index.html` | Modificar | Cargar `ficha-validation.js` |
| `assets/js/app.js` | Modificar | Formulario PAX y Tutor, admin Fichas, Contratos (planes), Pasajeros |
| `assets/css/styles.css` | Modificar | Estilos de selector PAX/Tutor, errores por campo, pertenencia |
| `scripts/frontend-regression.test.js` | Modificar | Ajustar pruebas del PDF viejo y del envío |
| `README.md` | Modificar | Variables nuevas y rutas |

---

### Task 1: Módulo de validación compartido

**Files:**
- Create: `assets/js/modules/ficha-validation.js`
- Test: `scripts/ficha-validation.test.js`

**Interfaces:**
- Produces (global `window.ElAngelAzulFichaValidation` y `require`):
  - `PROVINCIAS: string[]`, `TIPOS_DOCUMENTO`, `SEXOS`, `PARENTESCOS`, `NIVELES`, `GRADOS: { Primaria: string[], Secundaria: string[] }`, `ETIQUETAS: Record<campo, string>`
  - `cuilValido(cuil: string, dni?: string): boolean`
  - `sugerenciaEmail(email: string): string` ("" si no hay sugerencia)
  - `validarFichaPax(input: object, opciones?: { hoy?: Date, planesDisponibles?: string[] }): { ok: boolean, errores: Record<string,string>, sugerencias: Record<string,string>, datos: object }`
  - `validarFichaTutor(input: object, opciones?: { hoy?: Date }): { ok, errores, sugerencias, datos }`
  - Campos PAX (camelCase): `nivel, destino, anio, colegioId, colegioTexto, grado, division, planPagoId, pasajeroNombre, pasajeroApellido, pasajeroTipoDocumento, pasajeroNumeroDocumento, pasajeroNacimiento, pasajeroSexo, responsableNombre, responsableApellido, responsableTipoDocumento, responsableNumeroDocumento, responsableNacimiento, responsableParentesco, responsableCuilCuit, responsableEmail, responsableCelular, responsableTelefono, domicilioCalle, domicilioNumero, domicilioPiso, domicilioDepartamento, domicilioBarrio, domicilioLocalidad, domicilioProvincia, domicilioCodigoPostal, aceptaCondiciones, firma`
  - Campos Tutor: `pasajeroNombre, pasajeroApellido, pasajeroNumeroDocumento, nombre, apellido, tipoDocumento, numeroDocumento, cuilCuit, celular, email, parentesco, aceptaCondiciones`

- [ ] **Step 1: Escribir las pruebas**

```js
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
```

- [ ] **Step 2: Correr y ver que falla**

Run: `node --test scripts/ficha-validation.test.js`
Expected: FAIL — `Cannot find module '../assets/js/modules/ficha-validation.js'`

- [ ] **Step 3: Implementar el módulo**

```js
// assets/js/modules/ficha-validation.js
// Reglas de la Ficha de Adhesión compartidas por el formulario (navegador)
// y por server.js. Un solo lugar para que cliente y servidor no se
// desincronicen: el servidor repite exactamente la misma validación.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ElAngelAzulFichaValidation = api;
})(typeof self !== "undefined" ? self : this, function () {
  const PROVINCIAS = [
    "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Ciudad Autónoma de Buenos Aires", "Córdoba",
    "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones",
    "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe",
    "Santiago del Estero", "Tierra del Fuego, Antártida e Islas del Atlántico Sur", "Tucumán"
  ];
  const TIPOS_DOCUMENTO = ["DNI", "Pasaporte", "LC", "LE"];
  const SEXOS = ["Femenino", "Masculino", "X"];
  const PARENTESCOS = ["Madre", "Padre", "Tutor legal", "Otro"];
  const NIVELES = ["Primaria", "Secundaria"];
  const GRADOS = {
    Primaria: ["1°", "2°", "3°", "4°", "5°", "6°", "7°"],
    Secundaria: ["1°", "2°", "3°", "4°", "5°", "6°"]
  };
  const EMAIL_TYPOS = {
    "gmail.con": "gmail.com", "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gamil.com": "gmail.com",
    "gmail.co": "gmail.com", "gmail.cm": "gmail.com", "hotmial.com": "hotmail.com", "hotmail.con": "hotmail.com",
    "hotmal.com": "hotmail.com", "hotmail.co": "hotmail.com", "outlok.com": "outlook.com",
    "outlook.con": "outlook.com", "yahoo.con": "yahoo.com", "yaho.com": "yahoo.com", "live.con": "live.com"
  };
  const ETIQUETAS = {
    colegio: "Colegio", grado: "Grado/Año", division: "División", nivel: "Curso", destino: "Destino", anio: "Año del viaje",
    planPagoId: "Plan de pago",
    pasajeroNombre: "Nombre/s del pasajero", pasajeroApellido: "Apellido/s del pasajero",
    pasajeroTipoDocumento: "Tipo de documento del pasajero", pasajeroNumeroDocumento: "Documento del pasajero",
    pasajeroNacimiento: "Fecha de nacimiento del pasajero", pasajeroSexo: "Sexo del pasajero",
    responsableNombre: "Nombre/s del tutor", responsableApellido: "Apellido/s del tutor",
    responsableTipoDocumento: "Tipo de documento del tutor", responsableNumeroDocumento: "Documento del tutor",
    responsableNacimiento: "Fecha de nacimiento del tutor", responsableParentesco: "Parentesco",
    responsableCuilCuit: "CUIL/CUIT del tutor", responsableEmail: "Correo electrónico", responsableCelular: "Celular",
    responsableTelefono: "Teléfono alternativo",
    domicilioCalle: "Calle", domicilioNumero: "Número", domicilioPiso: "Piso", domicilioDepartamento: "Departamento",
    domicilioBarrio: "Barrio", domicilioLocalidad: "Localidad", domicilioProvincia: "Provincia",
    domicilioCodigoPostal: "Código postal", aceptaCondiciones: "Condiciones", firma: "Firma",
    nombre: "Nombre/s del tutor", apellido: "Apellido/s del tutor", tipoDocumento: "Tipo de documento",
    numeroDocumento: "Documento del tutor", cuilCuit: "CUIL/CUIT", celular: "Celular", email: "Correo electrónico",
    parentesco: "Parentesco"
  };

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const NOMBRE_RE = /^[\p{L}][\p{L}' -]{1,79}$/u;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const FIRMA_RE = /^data:image\/png;base64,[a-z0-9+/]+={0,2}$/i;

  const limpiar = (valor) => String(valor ?? "").replace(/\s+/g, " ").trim();
  const digitos = (valor) => String(valor ?? "").replace(/\D+/g, "");
  const aceptado = (valor) => valor === true || String(valor ?? "").trim().toLowerCase() === "true" || valor === "si";

  function cuilValido(valor, dni) {
    const d = digitos(valor);
    if (d.length !== 11 || !["20", "23", "24", "27"].includes(d.slice(0, 2))) return false;
    const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const suma = pesos.reduce((acc, peso, i) => acc + peso * Number(d[i]), 0);
    let verificador = 11 - (suma % 11);
    if (verificador === 11) verificador = 0;
    if (verificador === 10 || verificador !== Number(d[10])) return false;
    if (dni && d.slice(2, 10) !== digitos(dni).padStart(8, "0")) return false;
    return true;
  }

  function sugerenciaEmail(email) {
    const [usuario, dominio] = limpiar(email).toLowerCase().split("@");
    const correccion = dominio && EMAIL_TYPOS[dominio];
    return correccion ? `${usuario}@${correccion}` : "";
  }

  function edadEn(iso, hoy) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    const [anio, mes, dia] = iso.split("-").map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) return null;
    let edad = hoy.getUTCFullYear() - anio;
    if (hoy.getUTCMonth() + 1 < mes || (hoy.getUTCMonth() + 1 === mes && hoy.getUTCDate() < dia)) edad -= 1;
    return edad;
  }

  function crearValidador(input, hoy) {
    const errores = {};
    const sugerencias = {};
    const datos = {};
    const error = (campo, mensaje) => { if (!errores[campo]) errores[campo] = mensaje; };
    const texto = (campo, { requerido = true, min = 2, max = 80 } = {}) => {
      const valor = limpiar(input[campo]);
      datos[campo] = valor;
      if (!valor) { if (requerido) error(campo, `Completá ${ETIQUETAS[campo] || campo}.`); return valor; }
      if (valor.length < min || valor.length > max) error(campo, `${ETIQUETAS[campo]}: entre ${min} y ${max} caracteres.`);
      return valor;
    };
    const nombre = (campo) => {
      const valor = texto(campo);
      if (valor && !NOMBRE_RE.test(valor)) error(campo, `${ETIQUETAS[campo]}: usá solo letras (con tildes), espacios, guion o apóstrofo.`);
    };
    const lista = (campo, opciones) => {
      const valor = limpiar(input[campo]);
      datos[campo] = valor;
      if (!valor) error(campo, `Elegí ${ETIQUETAS[campo]}.`);
      else if (!opciones.includes(valor)) error(campo, `${ETIQUETAS[campo]}: opción no válida.`);
      return valor;
    };
    const documento = (campoTipo, campoNumero) => {
      const tipo = lista(campoTipo, TIPOS_DOCUMENTO);
      const crudo = limpiar(input[campoNumero]);
      const valor = tipo === "Pasaporte" ? crudo.replace(/[\s.-]/g, "").toUpperCase() : digitos(crudo);
      datos[campoNumero] = valor;
      if (!crudo) return error(campoNumero, `Completá ${ETIQUETAS[campoNumero]}.`);
      const valido = tipo === "Pasaporte" ? /^[A-Z0-9]{6,15}$/.test(valor)
        : tipo === "DNI" ? /^\d{7,8}$/.test(valor)
        : /^\d{6,8}$/.test(valor);
      if (!valido) error(campoNumero, `${ETIQUETAS[campoNumero]}: número inválido.`);
    };
    const nacimiento = (campo, minima, maxima) => {
      const valor = limpiar(input[campo]);
      datos[campo] = valor;
      if (!valor) return error(campo, `Completá ${ETIQUETAS[campo]}.`);
      const edad = edadEn(valor, hoy);
      if (edad === null) return error(campo, `${ETIQUETAS[campo]}: fecha inválida.`);
      if (edad < minima || edad > maxima) error(campo, `${ETIQUETAS[campo]}: revisá el año (edad fuera de rango).`);
    };
    const cuil = (campo, campoDni, campoTipo) => {
      const valor = digitos(input[campo]);
      datos[campo] = valor;
      if (!valor) return error(campo, `Completá ${ETIQUETAS[campo]}.`);
      const dni = limpiar(input[campoTipo]) === "DNI" ? input[campoDni] : "";
      if (!cuilValido(valor, dni)) {
        error(campo, dni && cuilValido(valor)
          ? `${ETIQUETAS[campo]}: no coincide con el DNI cargado.`
          : `${ETIQUETAS[campo]}: número inválido. Revisá los 11 dígitos.`);
      }
    };
    const email = (campo) => {
      const valor = limpiar(input[campo]).toLowerCase();
      datos[campo] = valor;
      if (!valor) return error(campo, `Completá ${ETIQUETAS[campo]}.`);
      if (!EMAIL_RE.test(valor)) return error(campo, `${ETIQUETAS[campo]}: formato inválido.`);
      const sugerida = sugerenciaEmail(valor);
      if (sugerida) sugerencias[campo] = `¿Quisiste decir ${sugerida}?`;
    };
    const telefono = (campo, requerido) => {
      const valor = digitos(input[campo]);
      datos[campo] = valor;
      if (!valor) { if (requerido) error(campo, `Completá ${ETIQUETAS[campo]}.`); return; }
      if (valor.length < 10 || valor.length > 13) error(campo, `${ETIQUETAS[campo]}: ingresá característica y número (10 a 13 dígitos).`);
    };
    const condiciones = () => {
      datos.aceptaCondiciones = aceptado(input.aceptaCondiciones);
      if (!datos.aceptaCondiciones) error("aceptaCondiciones", "Tenés que aceptar las condiciones.");
    };
    return { errores, sugerencias, datos, error, texto, nombre, lista, documento, nacimiento, cuil, email, telefono, condiciones };
  }

  function resultado(val) {
    return { ok: Object.keys(val.errores).length === 0, errores: val.errores, sugerencias: val.sugerencias, datos: val.datos };
  }

  function validarFichaPax(input = {}, { hoy = new Date(), planesDisponibles = [] } = {}) {
    const val = crearValidador(input, hoy);
    const { datos, error } = val;

    const nivel = val.lista("nivel", NIVELES);
    val.texto("destino", { max: 80 });
    datos.anio = digitos(input.anio);
    if (!/^20\d{2}$/.test(datos.anio)) error("anio", "Elegí el año del viaje.");

    datos.colegioId = limpiar(input.colegioId);
    datos.colegioTexto = limpiar(input.colegioTexto);
    if (datos.colegioId) {
      if (!UUID_RE.test(datos.colegioId)) error("colegio", "Elegí un colegio de la lista.");
      datos.colegioTexto = "";
    } else if (datos.colegioTexto.length < 3 || datos.colegioTexto.length > 120) {
      error("colegio", "Elegí tu colegio o escribí su nombre completo.");
    }
    const grado = limpiar(input.grado);
    datos.grado = grado;
    if (!grado) error("grado", "Elegí el Grado/Año.");
    else if (!(GRADOS[nivel] || []).includes(grado)) error("grado", "Grado/Año no válido para el curso elegido.");
    datos.division = limpiar(input.division).toUpperCase();
    if (!datos.division) error("division", "Completá la División.");
    else if (!/^[A-Z0-9]{1,3}$/.test(datos.division)) error("division", "División: hasta 3 letras o números (ej.: B).");

    datos.planPagoId = limpiar(input.planPagoId);
    if (planesDisponibles.length && !planesDisponibles.includes(datos.planPagoId)) {
      error("planPagoId", "Elegí un plan de pago.");
    }
    if (!planesDisponibles.length) datos.planPagoId = "";

    val.nombre("pasajeroNombre");
    val.nombre("pasajeroApellido");
    val.documento("pasajeroTipoDocumento", "pasajeroNumeroDocumento");
    val.nacimiento("pasajeroNacimiento", 5, 25);
    val.lista("pasajeroSexo", SEXOS);

    val.nombre("responsableNombre");
    val.nombre("responsableApellido");
    val.documento("responsableTipoDocumento", "responsableNumeroDocumento");
    val.nacimiento("responsableNacimiento", 18, 110);
    val.lista("responsableParentesco", PARENTESCOS);
    val.cuil("responsableCuilCuit", "responsableNumeroDocumento", "responsableTipoDocumento");
    val.email("responsableEmail");
    val.telefono("responsableCelular", true);
    val.telefono("responsableTelefono", false);

    val.texto("domicilioCalle", { max: 100 });
    const numero = limpiar(input.domicilioNumero).toUpperCase().replace(/^S\s*\/?\s*N$/, "S/N");
    datos.domicilioNumero = numero;
    if (!numero) error("domicilioNumero", "Completá el Número (o S/N).");
    else if (!/^(\d{1,6}|S\/N)$/.test(numero)) error("domicilioNumero", "Número: solo dígitos o S/N.");
    val.texto("domicilioPiso", { requerido: false, min: 1, max: 4 });
    val.texto("domicilioDepartamento", { requerido: false, min: 1, max: 6 });
    val.texto("domicilioBarrio", { requerido: false, min: 2, max: 80 });
    val.texto("domicilioLocalidad", { max: 80 });
    val.lista("domicilioProvincia", PROVINCIAS);
    const cp = limpiar(input.domicilioCodigoPostal).toUpperCase().replace(/\s+/g, "");
    datos.domicilioCodigoPostal = cp;
    if (!cp) error("domicilioCodigoPostal", "Completá el Código postal.");
    else if (!/^(\d{4}|[A-Z]\d{4}[A-Z]{3})$/.test(cp)) error("domicilioCodigoPostal", "Código postal: 4 dígitos (ej.: 3400) o formato CPA (ej.: W3400ABC).");

    val.condiciones();
    datos.firma = String(input.firma || "");
    if (!FIRMA_RE.test(datos.firma)) error("firma", "Falta la firma del tutor.");
    return resultado(val);
  }

  function validarFichaTutor(input = {}, { hoy = new Date() } = {}) {
    const val = crearValidador(input, hoy);
    val.nombre("pasajeroNombre");
    val.nombre("pasajeroApellido");
    val.datos.pasajeroNumeroDocumento = digitos(input.pasajeroNumeroDocumento);
    if (!/^\d{7,8}$/.test(val.datos.pasajeroNumeroDocumento)) val.error("pasajeroNumeroDocumento", "Documento del pasajero: DNI de 7 u 8 dígitos.");
    val.nombre("nombre");
    val.nombre("apellido");
    val.documento("tipoDocumento", "numeroDocumento");
    val.cuil("cuilCuit", "numeroDocumento", "tipoDocumento");
    val.telefono("celular", true);
    val.email("email");
    val.lista("parentesco", PARENTESCOS);
    val.condiciones();
    return resultado(val);
  }

  return {
    PROVINCIAS, TIPOS_DOCUMENTO, SEXOS, PARENTESCOS, NIVELES, GRADOS, ETIQUETAS,
    cuilValido, sugerenciaEmail, validarFichaPax, validarFichaTutor
  };
});
```

- [ ] **Step 4: Correr las pruebas**

Run: `node --test scripts/ficha-validation.test.js`
Expected: PASS (9 tests)

- [ ] **Step 5: Cargar el módulo en todas las entradas HTML**

En `index.html`, `admin/index.html` y cada `admin/*/index.html` y `admin-turismo/index.html`, agregar antes de `assets/js/app.js`:

```html
<script src="assets/js/modules/ficha-validation.js?v=20260915-ficha-v2"></script>
```

- [ ] **Step 6: Commit**

```bash
git add assets/js/modules/ficha-validation.js scripts/ficha-validation.test.js index.html admin
git commit -m "feat: reglas de validación compartidas de la ficha de adhesión"
```

---

### Task 2: Migración 0003 (esquema v2)

**Files:**
- Create: `supabase/migrations/0003_ficha_adhesion_v2.sql`
- Modify: `scripts/db-check.js` (lista de tablas esperadas)

**Interfaces:**
- Produces: tablas `planes_pago`, `fichas_tutor`; `inscripciones` y `fichas_adhesion` recreadas; columnas nuevas `colegios.activo/provincia/localidad/codigo_oficial`, `personas.apellido`, `responsables.apellido`, `pasajeros.plan_pago_id`.

- [ ] **Step 1: Escribir la migración**

```sql
-- El Ángel Azul — Ficha de Adhesión v2 (15/09/2026)
-- Ver docs/superpowers/specs/2026-09-15-ficha-adhesion-design.md §3.
-- La base solo tenía datos de prueba: inscripciones y fichas_adhesion se
-- recrean con los obligatorios exigidos en la propia base.
-- grupos.curso guarda el Grado/Año ("5°") y grupos.division la división;
-- el Curso (Primaria/Secundaria) es viajes.nivel.

drop table if exists fichas_adhesion;
drop table if exists inscripciones;

-- ============ CATÁLOGO ============
alter table colegios
  add column activo boolean not null default true,
  add column provincia text,
  add column localidad text,
  add column codigo_oficial text;
create unique index colegios_codigo_oficial_uk on colegios (codigo_oficial) where codigo_oficial is not null;
create index colegios_activo_idx on colegios (activo);

alter table personas add column apellido text;
alter table responsables add column apellido text;

create table planes_pago (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references contratos(id) on delete restrict,
  nombre text not null check (length(btrim(nombre)) >= 2),
  cuotas integer not null check (cuotas between 1 and 18),
  descripcion text,
  activo boolean not null default true,
  orden integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index planes_pago_contrato_idx on planes_pago (contrato_id);
create trigger trg_planes_pago_updated_at before update on planes_pago
  for each row execute function set_updated_at();

alter table pasajeros add column plan_pago_id uuid references planes_pago(id) on delete restrict;

-- ============ INSCRIPCIONES ============
create table inscripciones (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references personas(id) on delete restrict,
  viaje_id uuid not null references viajes(id) on delete restrict,
  colegio_id uuid references colegios(id) on delete restrict,
  colegio_texto text,
  nivel text not null check (nivel in ('Primaria', 'Secundaria')),
  grado text not null check (grado ~ '^[1-7]°$'),
  division text not null check (division ~ '^[A-Z0-9]{1,3}$'),
  grupo_id uuid references grupos(id) on delete restrict,
  contrato_id uuid references contratos(id) on delete restrict,
  pasajero_id uuid references pasajeros(id) on delete restrict,
  plan_pago_id uuid references planes_pago(id) on delete restrict,
  estado text not null default 'ficha_enviada'
    check (estado in ('iniciada','ficha_enviada','duplicada','cancelada')),
  duplicada_de_id uuid references inscripciones(id) on delete restrict,
  origen text not null default 'web'
    check (origen in ('web','whatsapp','admin_manual','campana','referido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (colegio_id is not null or length(btrim(coalesce(colegio_texto, ''))) >= 3),
  check (estado <> 'duplicada' or duplicada_de_id is not null)
);
create index inscripciones_persona_idx on inscripciones (persona_id);
create index inscripciones_viaje_idx on inscripciones (viaje_id);
create index inscripciones_colegio_idx on inscripciones (colegio_id);
create index inscripciones_estado_created_idx on inscripciones (estado, created_at);
create trigger trg_inscripciones_updated_at before update on inscripciones
  for each row execute function set_updated_at();

-- ============ FICHAS DE ADHESIÓN (PAX) ============
create table fichas_adhesion (
  id uuid primary key default gen_random_uuid(),
  inscripcion_id uuid not null unique references inscripciones(id) on delete restrict,

  pasajero_nombre text not null check (length(btrim(pasajero_nombre)) >= 2),
  pasajero_apellido text not null check (length(btrim(pasajero_apellido)) >= 2),
  pasajero_tipo_documento text not null check (pasajero_tipo_documento in ('DNI','Pasaporte','LC','LE')),
  pasajero_numero_documento text not null check (pasajero_numero_documento ~ '^[A-Z0-9]{6,15}$'),
  pasajero_nacimiento date not null,
  pasajero_sexo text not null,

  responsable_nombre text not null check (length(btrim(responsable_nombre)) >= 2),
  responsable_apellido text not null check (length(btrim(responsable_apellido)) >= 2),
  responsable_tipo_documento text not null check (responsable_tipo_documento in ('DNI','Pasaporte','LC','LE')),
  responsable_numero_documento text not null check (responsable_numero_documento ~ '^[A-Z0-9]{6,15}$'),
  responsable_nacimiento date not null,
  responsable_parentesco text not null,
  responsable_cuil_cuit text not null check (responsable_cuil_cuit ~ '^[0-9]{11}$'),
  responsable_email text not null check (responsable_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'),
  responsable_celular text not null check (responsable_celular ~ '^[0-9]{10,13}$'),
  responsable_telefono text,

  domicilio_calle text not null check (length(btrim(domicilio_calle)) >= 2),
  domicilio_numero text not null check (domicilio_numero ~ '^([0-9]{1,6}|S/N)$'),
  domicilio_piso text,
  domicilio_departamento text,
  domicilio_barrio text,
  domicilio_localidad text not null check (length(btrim(domicilio_localidad)) >= 2),
  domicilio_provincia text not null,
  domicilio_codigo_postal text not null check (domicilio_codigo_postal ~ '^([0-9]{4}|[A-Z][0-9]{4}[A-Z]{3})$'),

  acepta_condiciones boolean not null check (acepta_condiciones = true),
  firma_storage_path text not null,
  firma_bucket text not null default 'firmas',

  estado_revision text not null default 'pendiente'
    check (estado_revision in ('pendiente','revisada','observada','duplicada','aprobada','rechazada')),
  documentacion_estado text not null default 'pendiente',
  ficha_medica_estado text not null default 'pendiente',
  autorizacion_estado text not null default 'pendiente',
  motivo_rechazo text,
  observaciones text,

  email_estado text not null default 'pendiente'
    check (email_estado in ('pendiente','enviado','error','sin_configurar')),
  email_enviado_at timestamptz,
  email_error text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index fichas_estado_revision_idx on fichas_adhesion (estado_revision);
create index fichas_dni_idx on fichas_adhesion (pasajero_numero_documento);
create index fichas_apellido_idx on fichas_adhesion (lower(pasajero_apellido));
create index fichas_created_idx on fichas_adhesion (created_at);
create trigger trg_fichas_updated_at before update on fichas_adhesion
  for each row execute function set_updated_at();

-- ============ FICHAS DE TUTOR (formulario corto) ============
create table fichas_tutor (
  id uuid primary key default gen_random_uuid(),
  pasajero_nombre text not null check (length(btrim(pasajero_nombre)) >= 2),
  pasajero_apellido text not null check (length(btrim(pasajero_apellido)) >= 2),
  pasajero_numero_documento text not null check (pasajero_numero_documento ~ '^[0-9]{7,8}$'),
  nombre text not null check (length(btrim(nombre)) >= 2),
  apellido text not null check (length(btrim(apellido)) >= 2),
  tipo_documento text not null check (tipo_documento in ('DNI','Pasaporte','LC','LE')),
  numero_documento text not null check (numero_documento ~ '^[A-Z0-9]{6,15}$'),
  cuil_cuit text not null check (cuil_cuit ~ '^[0-9]{11}$'),
  celular text not null check (celular ~ '^[0-9]{10,13}$'),
  email text not null check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'),
  parentesco text not null,
  acepta_condiciones boolean not null check (acepta_condiciones = true),
  estado_revision text not null default 'pendiente'
    check (estado_revision in ('pendiente','revisada','observada','rechazada')),
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index fichas_tutor_pasajero_dni_idx on fichas_tutor (pasajero_numero_documento);
create trigger trg_fichas_tutor_updated_at before update on fichas_tutor
  for each row execute function set_updated_at();

alter table planes_pago enable row level security;
alter table inscripciones enable row level security;
alter table fichas_adhesion enable row level security;
alter table fichas_tutor enable row level security;
```

- [ ] **Step 2: Agregar las tablas nuevas a `scripts/db-check.js`**

Buscar el array de tablas esperadas en `scripts/db-check.js` y agregar `"planes_pago"` y `"fichas_tutor"`.

- [ ] **Step 3: Verificación estática**

Run: `node --check scripts/db-check.js`
Expected: sin salida. (La aplicación contra Supabase se hace en la Task 11, cuando la base esté reactivada.)

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0003_ficha_adhesion_v2.sql scripts/db-check.js
git commit -m "feat(db): esquema v2 de fichas, planes de pago y fichas de tutor"
```

---

### Task 3: Adaptador de base (`lib/db.js`)

**Files:**
- Modify: `lib/db.js`
- Test: `scripts/db-adapter.test.js`

**Interfaces:**
- Consumes: `datos` normalizados de `validarFichaPax` / `validarFichaTutor` (Task 1).
- Produces:
  - `listColegiosPublicos(): Promise<{id, nombre, localidad, provincia}[]>`
  - `contextoInscripcion({ colegioId, nivel, viaje, grado, division }): Promise<{ contrato: {id, codigo} | null, grupoId: string|null, planes: {id, nombre, cuotas, descripcion}[] }>` (ids internos uuid)
  - `insertFichaPublica(datos, contexto): Promise<{ id, createdAt }>` — lanza error con `statusCode 400` y `errores` si el colegio no está activo
  - `insertFichaTutor(datos): Promise<{ id }>`
  - `listFichasAdmin(id?): Promise<FilaFicha[]>` — fila plana (ver columnas en Task 4, `SCHEMA.FICHAS_ADHESION`)
  - `updateFichasAdmin(rows, actor)` — igual contrato actual, más `colegio_id`, `plan_pago_id`
  - `setFichaEmailResultado(id, { estado, error? })`
  - `listFichasTutorAdmin()`, `saveFichasTutorAdmin(rows, deleteIds, actor)` (solo `estado_revision`, `observaciones`)
  - `listPlanesPagoAdmin()`, `savePlanesPagoAdmin(rows, deleteIds, actor)` (ids uuid del cliente; `contrato_id` es el legacy id del contrato; `deleteIds` desactiva)
  - `listColegiosAdmin()`, `saveColegiosAdmin(rows, deleteIds, actor)` (ids uuid del cliente; `deleteIds` desactiva)
  - `listPasajerosAdmin()` agrega `apellido, responsable_apellido, responsable_email, plan_pago_id, plan_nombre, plan_cuotas`
  - `savePasajerosAdmin()` persiste `apellido`, `responsable_apellido`, `responsable_email`, `plan_pago_id` y vincula tutores adicionales de `fichas_tutor` (mismo DNI, no rechazados)
  - `__test.mapFichaParaInsert(datos, contexto)` (función pura con el orden de parámetros del insert)

- [ ] **Step 1: Prueba de la función pura de mapeo**

Agregar a `scripts/db-adapter.test.js`:

```js
test("la ficha pública v2 mapea nombres, apellidos y pertenencia", () => {
  const { mapFichaParaInsert } = db.__test;
  const datos = {
    nivel: "Secundaria", destino: "Bariloche", anio: "2027", colegioId: "", colegioTexto: "Normal 2",
    grado: "5°", division: "B", planPagoId: "",
    pasajeroNombre: "José María", pasajeroApellido: "Fernández", pasajeroTipoDocumento: "DNI",
    pasajeroNumeroDocumento: "45123456", pasajeroNacimiento: "2009-03-14", pasajeroSexo: "Masculino",
    responsableNombre: "María", responsableApellido: "Núñez", responsableTipoDocumento: "DNI",
    responsableNumeroDocumento: "12345678", responsableNacimiento: "1980-05-02", responsableParentesco: "Madre",
    responsableCuilCuit: "20123456786", responsableEmail: "maria@gmail.com", responsableCelular: "3794111222",
    responsableTelefono: "", domicilioCalle: "Junín", domicilioNumero: "S/N", domicilioPiso: "", domicilioDepartamento: "",
    domicilioBarrio: "", domicilioLocalidad: "Corrientes", domicilioProvincia: "Corrientes", domicilioCodigoPostal: "3400",
    aceptaCondiciones: true, firma: "data:image/png;base64,AAAA"
  };
  const m = mapFichaParaInsert(datos, { contrato: null, grupoId: null, planes: [] });
  assert.equal(m.viajeTexto, "Bariloche 2027");
  assert.equal(m.inscripcion.colegio_id, null);
  assert.equal(m.inscripcion.colegio_texto, "Normal 2");
  assert.equal(m.inscripcion.plan_pago_id, null);
  assert.equal(m.ficha.pasajero_apellido, "Fernández");
  assert.equal(m.ficha.responsable_telefono, null);
  assert.equal(m.ficha.domicilio_barrio, null);
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `node --test scripts/db-adapter.test.js`
Expected: FAIL — `mapFichaParaInsert is not a function`

- [ ] **Step 3: Implementar en `lib/db.js`**

1. `findOrCreatePersona(queryable, { numeroDocumento, nombre, apellido, nacimiento, telefono })`: agregar `apellido` al insert y `apellido = coalesce(personas.apellido, excluded.apellido)` en el `do update`. Aceptar documentos alfanuméricos: reemplazar `normalizeDigits(numeroDocumento)` por `normalizeText(numeroDocumento).toUpperCase()` (el validador ya normalizó).
2. `findOrCreateResponsable(queryable, { nombre, apellido, numeroDocumento, telefono, email, cuilCuit })`: agregar `apellido` y `email` con `coalesce(nullif(excluded.x,''), responsables.x)`.
3. Borrar `findOrCreateColegio` y su uso en `saveGruposAdmin`: el grupo recibe `colegio_id` (uuid) en la fila; si falta o no existe → `friendlyError("Elegí un colegio de la lista.")`. `listGruposAdmin` agrega `col.id::text as colegio_id`. Agregar `"colegio_id"` a `SCHEMA.GRUPOS` en la Task 4.
4. Funciones nuevas:

```js
async function listColegiosPublicos() {
  const result = await getPool().query(
    `select id::text as id, nombre, coalesce(localidad, '') as localidad, coalesce(provincia, '') as provincia
     from colegios where activo order by nombre`
  );
  return result.rows;
}

// Coincidencia EXACTA de contrato: colegio + curso (nivel) + destino +
// grado + división. Reemplaza la búsqueda difusa por texto. El grado se
// compara por dígitos para tolerar "5°", "5to" o "5" en grupos viejos.
async function contextoInscripcion({ colegioId, nivel, viaje, grado, division }) {
  const vacio = { contrato: null, grupoId: null, planes: [] };
  if (!FICHA_UUID_RE.test(String(colegioId || ""))) return vacio;
  const contrato = await getPool().query(
    `select c.id::text as id, coalesce(c.codigo_contrato, '') as codigo, g.id::text as grupo_id
     from contratos c
     join grupos g on g.id = c.grupo_id
     join viajes v on v.id = c.viaje_id
     where g.colegio_id = $1 and c.estado = 'activo'
       and lower(coalesce(v.nivel, '')) = lower($2) and lower(v.destino) = lower($3)
       and regexp_replace(g.curso, '\\D', '', 'g') = regexp_replace($4, '\\D', '', 'g')
       and upper(g.division) = upper($5)
     order by c.created_at desc
     limit 1`,
    [colegioId, normalizeText(nivel), normalizeText(viaje), normalizeText(grado), normalizeText(division)]
  );
  if (!contrato.rows.length) return vacio;
  const planes = await getPool().query(
    `select id::text as id, nombre, cuotas, coalesce(descripcion, '') as descripcion
     from planes_pago where contrato_id = $1 and activo
     order by orden nulls last, cuotas`,
    [contrato.rows[0].id]
  );
  const { id, codigo, grupo_id: grupoId } = contrato.rows[0];
  return { contrato: { id, codigo }, grupoId, planes: planes.rows };
}

const vacioANull = (valor) => (normalizeText(valor) ? normalizeText(valor) : null);

function mapFichaParaInsert(datos, contexto) {
  return {
    viajeTexto: `${datos.destino} ${datos.anio}`,
    inscripcion: {
      colegio_id: datos.colegioId || null,
      colegio_texto: datos.colegioId ? null : datos.colegioTexto,
      nivel: datos.nivel,
      grado: datos.grado,
      division: datos.division,
      grupo_id: contexto.grupoId || null,
      contrato_id: contexto.contrato?.id || null,
      plan_pago_id: datos.planPagoId || null
    },
    ficha: {
      pasajero_nombre: datos.pasajeroNombre,
      pasajero_apellido: datos.pasajeroApellido,
      pasajero_tipo_documento: datos.pasajeroTipoDocumento,
      pasajero_numero_documento: datos.pasajeroNumeroDocumento,
      pasajero_nacimiento: datos.pasajeroNacimiento,
      pasajero_sexo: datos.pasajeroSexo,
      responsable_nombre: datos.responsableNombre,
      responsable_apellido: datos.responsableApellido,
      responsable_tipo_documento: datos.responsableTipoDocumento,
      responsable_numero_documento: datos.responsableNumeroDocumento,
      responsable_nacimiento: datos.responsableNacimiento,
      responsable_parentesco: datos.responsableParentesco,
      responsable_cuil_cuit: datos.responsableCuilCuit,
      responsable_email: datos.responsableEmail,
      responsable_celular: datos.responsableCelular,
      responsable_telefono: vacioANull(datos.responsableTelefono),
      domicilio_calle: datos.domicilioCalle,
      domicilio_numero: datos.domicilioNumero,
      domicilio_piso: vacioANull(datos.domicilioPiso),
      domicilio_departamento: vacioANull(datos.domicilioDepartamento),
      domicilio_barrio: vacioANull(datos.domicilioBarrio),
      domicilio_localidad: datos.domicilioLocalidad,
      domicilio_provincia: datos.domicilioProvincia,
      domicilio_codigo_postal: datos.domicilioCodigoPostal,
      acepta_condiciones: datos.aceptaCondiciones === true,
      firma_storage_path: datos.firma
    }
  };
}

function insertSql(tabla, fila) {
  const columnas = Object.keys(fila);
  return {
    text: `insert into ${tabla} (${columnas.join(", ")}) values (${columnas.map((_, i) => `$${i + 1}`).join(", ")})`,
    values: Object.values(fila)
  };
}

async function insertFichaPublica(datos, contexto) {
  const m = mapFichaParaInsert(datos, contexto);
  if (m.inscripcion.colegio_id) {
    const activo = await getPool().query(`select 1 from colegios where id = $1 and activo`, [m.inscripcion.colegio_id]);
    if (!activo.rows.length) {
      const error = friendlyError("El colegio elegido ya no está disponible. Elegilo de nuevo.");
      error.statusCode = 400;
      error.errores = { colegio: error.message };
      throw error;
    }
  }
  const personaId = await findOrCreatePersona(getPool(), {
    numeroDocumento: datos.pasajeroNumeroDocumento,
    nombre: datos.pasajeroNombre,
    apellido: datos.pasajeroApellido,
    nacimiento: datos.pasajeroNacimiento
  });
  const viajeId = await findOrCreateViaje(getPool(), { nivel: datos.nivel, viajeTexto: m.viajeTexto });
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const insc = insertSql("inscripciones", { persona_id: personaId, viaje_id: viajeId, ...m.inscripcion });
    const inscripcion = await client.query(`${insc.text} returning id`, insc.values);
    const fic = insertSql("fichas_adhesion", { inscripcion_id: inscripcion.rows[0].id, ...m.ficha });
    const ficha = await client.query(`${fic.text} returning id::text as id, created_at`, fic.values);
    await client.query("COMMIT");
    return { id: ficha.rows[0].id, createdAt: ficha.rows[0].created_at };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function insertFichaTutor(datos) {
  const sql = insertSql("fichas_tutor", {
    pasajero_nombre: datos.pasajeroNombre,
    pasajero_apellido: datos.pasajeroApellido,
    pasajero_numero_documento: datos.pasajeroNumeroDocumento,
    nombre: datos.nombre,
    apellido: datos.apellido,
    tipo_documento: datos.tipoDocumento,
    numero_documento: datos.numeroDocumento,
    cuil_cuit: datos.cuilCuit,
    celular: datos.celular,
    email: datos.email,
    parentesco: datos.parentesco,
    acepta_condiciones: datos.aceptaCondiciones === true
  });
  const result = await getPool().query(`${sql.text} returning id::text as id`, sql.values);
  return { id: result.rows[0].id };
}

async function setFichaEmailResultado(id, { estado, error = null }) {
  await getPool().query(
    `update fichas_adhesion
     set email_estado = $2, email_error = $3,
         email_enviado_at = case when $2 = 'enviado' then now() else email_enviado_at end
     where id = $1`,
    [id, estado, error]
  );
}
```

5. `listFichasAdmin(id = null)`: reemplazar la consulta por la siguiente (el filtro por id sirve para PDF y correo):

```js
async function listFichasAdmin(id = null) {
  const result = await getPool().query(`
    select
      f.id::text as id,
      'pax' as tipo,
      f.pasajero_numero_documento as pasajero_dni,
      f.pasajero_nombre, f.pasajero_apellido, f.pasajero_tipo_documento,
      to_char(f.pasajero_nacimiento, 'YYYY-MM-DD') as pasajero_nacimiento,
      f.pasajero_sexo,
      f.responsable_nombre, f.responsable_apellido, f.responsable_tipo_documento,
      f.responsable_numero_documento,
      to_char(f.responsable_nacimiento, 'YYYY-MM-DD') as responsable_nacimiento,
      f.responsable_parentesco, f.responsable_email,
      coalesce(f.responsable_telefono, '') as responsable_telefono,
      f.responsable_celular, f.responsable_cuil_cuit,
      f.domicilio_calle, f.domicilio_numero,
      coalesce(f.domicilio_piso, '') as domicilio_piso,
      coalesce(f.domicilio_departamento, '') as domicilio_departamento,
      coalesce(f.domicilio_barrio, '') as domicilio_barrio,
      f.domicilio_localidad, f.domicilio_provincia, f.domicilio_codigo_postal,
      case when f.acepta_condiciones then 'true' else 'false' end as acepta_condiciones,
      f.firma_storage_path as firma_data_url,
      i.nivel,
      v.destino as viaje,
      coalesce(i.colegio_id::text, '') as colegio_id,
      coalesce(col.nombre, i.colegio_texto, '') as colegio,
      coalesce(i.colegio_texto, '') as colegio_texto,
      case when i.colegio_id is null then 'FALSE' else 'TRUE' end as colegio_vinculado,
      i.grado, i.division,
      i.grado || ' ' || i.division as curso_division,
      coalesce(i.plan_pago_id::text, '') as plan_pago_id,
      coalesce(pp.nombre, '') as plan_nombre,
      coalesce(pp.cuotas::text, '') as plan_cuotas,
      coalesce(g.legacy_id, '') as grupo_asignado_id,
      coalesce(ct.legacy_id, '') as contrato_id,
      coalesce(ct.codigo_contrato, '') as codigo_contrato,
      f.estado_revision, f.documentacion_estado, f.ficha_medica_estado, f.autorizacion_estado,
      coalesce(f.motivo_rechazo, '') as motivo_rechazo,
      coalesce(f.observaciones, '') as observaciones,
      f.email_estado,
      coalesce(f.email_error, '') as email_error,
      coalesce(to_char(f.email_enviado_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '') as email_enviado_at,
      to_char(f.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
      to_char(f.updated_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
    from fichas_adhesion f
    join inscripciones i on i.id = f.inscripcion_id
    join viajes v on v.id = i.viaje_id
    left join colegios col on col.id = i.colegio_id
    left join planes_pago pp on pp.id = i.plan_pago_id
    left join grupos g on g.id = i.grupo_id
    left join contratos ct on ct.id = i.contrato_id
    where ($1::uuid is null or f.id = $1::uuid)
    order by f.created_at desc
  `, [id]);
  return result.rows;
}
```

6. `updateFichasAdmin`: los datos personales ya no se editan desde el admin. El `update fichas_adhesion` queda solo con `estado_revision, documentacion_estado, ficha_medica_estado, autorizacion_estado, motivo_rechazo, observaciones`. El `update inscripciones` pasa a:

```js
await client.query(
  `update inscripciones set
     colegio_id = coalesce($2::uuid, colegio_id),
     plan_pago_id = coalesce($3::uuid, plan_pago_id),
     grupo_id = coalesce((select id from grupos where legacy_id = nullif($4, '')), grupo_id),
     contrato_id = coalesce((select id from contratos where legacy_id = nullif($5, '')), contrato_id),
     pasajero_id = coalesce($6, pasajero_id)
   where id = (select inscripcion_id from fichas_adhesion where id = $1)`,
  [row.id, vacioANull(row.colegio_id), vacioANull(row.plan_pago_id), normalizeText(row.grupo_asignado_id), normalizeText(row.contrato_id), pasajeroId]
);
```

y la búsqueda del pasajero para aprobar usa `per.numero_documento = upper($2)` con `normalizeText(row.pasajero_dni)`.

7. Fichas de tutor, planes y colegios (admin):

```js
async function listFichasTutorAdmin() {
  const result = await getPool().query(`
    select id::text as id, 'tutor' as tipo, pasajero_nombre, pasajero_apellido,
      pasajero_numero_documento as pasajero_dni, nombre, apellido, tipo_documento, numero_documento,
      cuil_cuit, celular, email, parentesco, estado_revision, coalesce(observaciones, '') as observaciones,
      to_char(created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
      to_char(updated_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
    from fichas_tutor order by created_at desc
  `);
  return result.rows;
}

async function saveFichasTutorAdmin(rows) {
  return runBatch(rows, async (row) => {
    if (!FICHA_UUID_RE.test(String(row.id || ""))) throw friendlyError("Ficha de tutor inválida.");
    await getPool().query(
      `update fichas_tutor set estado_revision = $2, observaciones = $3 where id = $1`,
      [row.id, normalizeText(row.estado_revision) || "pendiente", normalizeText(row.observaciones)]
    );
  });
}

async function listPlanesPagoAdmin() {
  const result = await getPool().query(`
    select pp.id::text as id, c.legacy_id as contrato_id, pp.nombre, pp.cuotas::text as cuotas,
      coalesce(pp.descripcion, '') as descripcion, case when pp.activo then 'TRUE' else 'FALSE' end as activo,
      coalesce(pp.orden::text, '') as orden
    from planes_pago pp join contratos c on c.id = pp.contrato_id
    order by c.legacy_id, pp.orden nulls last, pp.cuotas
  `);
  return result.rows;
}

async function savePlanesPagoAdmin(rows, deleteIds = []) {
  const pool = getPool();
  const desactivados = await runBatch(deleteIds.map((id) => ({ id })), async (row) => {
    await pool.query(`update planes_pago set activo = false where id = $1`, [row.id]);
  });
  const guardados = await runBatch(rows, async (row) => {
    if (!FICHA_UUID_RE.test(String(row.id || ""))) throw friendlyError("Plan de pago con id inválido.");
    const cuotas = parseNumeric(row.cuotas, "cuotas");
    if (!Number.isInteger(cuotas) || cuotas < 1 || cuotas > 18) throw friendlyError("Las cuotas deben ser entre 1 y 18.");
    const contrato = await pool.query(`select id from contratos where legacy_id = $1`, [normalizeText(row.contrato_id)]);
    if (!contrato.rows.length) throw friendlyError("Guardá el contrato antes de cargarle planes.");
    await pool.query(
      `insert into planes_pago (id, contrato_id, nombre, cuotas, descripcion, activo, orden)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update set nombre = excluded.nombre, cuotas = excluded.cuotas,
         descripcion = excluded.descripcion, activo = excluded.activo, orden = excluded.orden`,
      [row.id, contrato.rows[0].id, normalizeText(row.nombre), cuotas, normalizeText(row.descripcion),
        parseBool(row.activo || "TRUE", "activo"), parseNumeric(row.orden, "orden")]
    );
  });
  return { updated: guardados.updated, failed: [...guardados.failed, ...desactivados.failed], deleted: desactivados.updated };
}

async function listColegiosAdmin() {
  const result = await getPool().query(`
    select id::text as id, nombre, coalesce(provincia, '') as provincia, coalesce(localidad, '') as localidad,
      coalesce(codigo_oficial, '') as codigo_oficial, case when activo then 'TRUE' else 'FALSE' end as activo
    from colegios order by nombre
  `);
  return result.rows;
}

async function saveColegiosAdmin(rows, deleteIds = []) {
  const pool = getPool();
  const desactivados = await runBatch(deleteIds.map((id) => ({ id })), async (row) => {
    await pool.query(`update colegios set activo = false where id = $1`, [row.id]);
  });
  const guardados = await runBatch(rows, async (row) => {
    if (!FICHA_UUID_RE.test(String(row.id || ""))) throw friendlyError("Colegio con id inválido.");
    if (normalizeText(row.nombre).length < 3) throw friendlyError("El nombre del colegio es muy corto.");
    await pool.query(
      `insert into colegios (id, nombre, provincia, localidad, codigo_oficial, activo)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do update set nombre = excluded.nombre, provincia = excluded.provincia,
         localidad = excluded.localidad, codigo_oficial = excluded.codigo_oficial, activo = excluded.activo`,
      [row.id, normalizeText(row.nombre), vacioANull(row.provincia), vacioANull(row.localidad),
        vacioANull(row.codigo_oficial), parseBool(row.activo || "TRUE", "activo")]
    );
  });
  return { updated: guardados.updated, failed: [...guardados.failed, ...desactivados.failed], deleted: desactivados.updated };
}
```

8. `listPasajerosAdmin`: agregar al select `coalesce(per.apellido, '') as apellido, coalesce(r.apellido, '') as responsable_apellido, coalesce(r.email, '') as responsable_email, coalesce(p.plan_pago_id::text, '') as plan_pago_id, coalesce(pp.nombre, '') as plan_nombre, coalesce(pp.cuotas::text, '') as plan_cuotas` y `left join planes_pago pp on pp.id = p.plan_pago_id`.
9. `savePasajerosAdmin`: pasar `apellido: row.apellido` a `findOrCreatePersona`; pasar `apellido: row.responsable_apellido, email: row.responsable_email` a `findOrCreateResponsable`; en el insert/upsert de `pasajeros` agregar `plan_pago_id` (`vacioANull(row.plan_pago_id)`). Después de insertar el vínculo principal, dentro de la misma transacción:

```js
const adicionales = await client.query(
  `select nombre, apellido, tipo_documento, numero_documento, cuil_cuit, celular, email, parentesco
   from fichas_tutor where pasajero_numero_documento = $1 and estado_revision <> 'rechazada'`,
  [dni]
);
for (const tutor of adicionales.rows) {
  if (normalizeDigits(tutor.numero_documento) === normalizeDigits(row.responsable_dni)) continue;
  const tutorId = await findOrCreateResponsable(client, {
    nombre: tutor.nombre, apellido: tutor.apellido, numeroDocumento: tutor.numero_documento,
    telefono: tutor.celular, email: tutor.email, cuilCuit: tutor.cuil_cuit
  });
  await client.query(
    `insert into pasajero_responsables (pasajero_id, responsable_id, vinculo, es_principal)
     values ($1, $2, $3, false) on conflict do nothing`,
    [pasajeroId, tutorId, tutor.parentesco]
  );
}
```

10. Actualizar `module.exports` (agregar las funciones nuevas, quitar `findOrCreateColegio`) y `__test` (agregar `mapFichaParaInsert`).

- [ ] **Step 4: Pruebas**

Run: `node --test scripts/db-adapter.test.js`
Expected: PASS. La prueba "el admin no puede reescribir consentimiento ni firma legal" debe seguir pasando.

- [ ] **Step 5: Commit**

```bash
git add lib/db.js scripts/db-adapter.test.js
git commit -m "feat(db): adaptador de fichas v2, planes, colegios y fichas de tutor"
```

---

### Task 4: PDF en el servidor (`lib/ficha-pdf.js`)

**Files:**
- Create: `lib/ficha-pdf.js`
- Test: `scripts/ficha-pdf.test.js`
- Modify: `package.json` (dependencia `pdf-lib`)

**Interfaces:**
- Consumes: fila plana de `listFichasAdmin(id)` (Task 3).
- Produces: `generarPdfFicha(fila): Promise<Uint8Array>`, `nombreArchivoPdf(fila): string`

- [ ] **Step 1: Instalar dependencia**

Run: `npm install pdf-lib@1.17.1`
Expected: `added 4 packages` (aprox.), `package.json` con `"pdf-lib": "^1.17.1"`.

- [ ] **Step 2: Escribir la prueba**

```js
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
```

- [ ] **Step 3: Correr y ver que falla**

Run: `node --test scripts/ficha-pdf.test.js`
Expected: FAIL — `Cannot find module '../lib/ficha-pdf'`

- [ ] **Step 4: Implementar**

```js
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
  domicilioCalle: { x: 148, y: 868, width: 500, size: 16, minSize: 8 },
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
  formaPago: { x: 292, y: 1196, width: 230, size: 15, minSize: 8 },
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
  escribir(fila.responsable_cuil_cuit, CAMPOS.responsableCuilCuit);
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
  escribir(fila.plan_nombre || "A definir", CAMPOS.formaPago);
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
```

- [ ] **Step 5: Correr las pruebas**

Run: `node --test scripts/ficha-pdf.test.js`
Expected: PASS (3 tests)

- [ ] **Step 6: Verificación visual**

Generar un PDF de muestra en el scratchpad con un script `node` que use la `fila` de la prueba. Rasterizarlo con Playwright abriendo una página que cargue `pdfjs-dist` desde `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.min.mjs`, renderice la página 1 en un `<canvas>` a escala 2 y tome una captura. Comparar contra la captura del PDF anterior (`eaa-pdf-crop.png` del scratchpad): el texto debe quedar apoyado sobre cada renglón, sin tapar etiquetas. Corregir coordenadas si algún valor se corre más de 3 px.

- [ ] **Step 7: Commit**

```bash
git add lib/ficha-pdf.js scripts/ficha-pdf.test.js package.json package-lock.json
git commit -m "feat: PDF de la ficha generado en el servidor con pdf-lib"
```

---

### Task 5: Correo con Resend (`lib/email.js`)

**Files:**
- Create: `lib/email.js`
- Test: `scripts/email.test.js`

**Interfaces:**
- Consumes: fila plana de `listFichasAdmin(id)`, bytes de `generarPdfFicha`.
- Produces:
  - `correoConfigurado(env?): boolean`
  - `enmascararEmail(email): string` (`"m***@gmail.com"`)
  - `armarCorreoFicha(fila, pdfBytes, env?): object` (payload Resend)
  - `enviarCorreoFicha(fila, pdfBytes, { env?, fetchImpl?, idempotencyKey? }): Promise<string>` (id de Resend) — lanza `Error` con `friendlyMessage`

- [ ] **Step 1: Escribir las pruebas**

```js
// scripts/email.test.js
const assert = require("node:assert/strict");
const test = require("node:test");
const email = require("../lib/email");

const env = { RESEND_API_KEY: "re_test", EAA_EMAIL_FROM: "El Ángel Azul <fichas@example.com>", EAA_EMAIL_COPIA: "agencia@example.com" };
const fila = {
  id: "3f1c2a8e-5b6d-4c7e-8f9a-0b1c2d3e4f5a", pasajero_nombre: "José María", pasajero_apellido: "Fernández <b>",
  pasajero_dni: "45123456", responsable_nombre: "María", responsable_apellido: "Núñez",
  responsable_email: "maria@gmail.com", responsable_celular: "3794111222", viaje: "Bariloche 2027",
  colegio: "Colegio San José", nivel: "Secundaria", grado: "5°", division: "B", plan_nombre: "12 cuotas"
};

test("configuración y enmascarado", () => {
  assert.equal(email.correoConfigurado({}), false);
  assert.equal(email.correoConfigurado(env), true);
  assert.equal(email.enmascararEmail("maria@gmail.com"), "m***@gmail.com");
});

test("arma asunto, destinatarios, HTML escapado y adjunto", () => {
  const p = email.armarCorreoFicha(fila, new Uint8Array([37, 80, 68, 70]), env);
  assert.equal(p.subject, "Ficha de adhesión – Fernández <b>, José María – Bariloche 2027");
  assert.deepEqual(p.to, ["maria@gmail.com"]);
  assert.deepEqual(p.bcc, ["agencia@example.com"]);
  assert.match(p.html, /Fernández &lt;b&gt;/);
  assert.doesNotMatch(p.html, /<b>,/);
  assert.equal(p.attachments[0].content, Buffer.from("%PDF").toString("base64"));
  assert.match(p.attachments[0].filename, /\.pdf$/);
});

test("envía con clave de idempotencia y devuelve el id", async () => {
  let llamada;
  const fetchImpl = async (url, opciones) => {
    llamada = { url, opciones };
    return { ok: true, status: 200, json: async () => ({ id: "email_123" }) };
  };
  const id = await email.enviarCorreoFicha(fila, new Uint8Array([1]), { env, fetchImpl });
  assert.equal(id, "email_123");
  assert.equal(llamada.url, "https://api.resend.com/emails");
  assert.equal(llamada.opciones.headers["Idempotency-Key"], `ficha-${fila.id}`);
  assert.equal(llamada.opciones.headers.Authorization, "Bearer re_test");
});

test("traduce errores de Resend a mensajes legibles", async () => {
  const falla = (status) => async () => ({ ok: false, status, json: async () => ({ message: "x" }) });
  await assert.rejects(email.enviarCorreoFicha(fila, new Uint8Array([1]), { env, fetchImpl: falla(429) }), (e) => /Límite/.test(e.friendlyMessage));
  await assert.rejects(email.enviarCorreoFicha(fila, new Uint8Array([1]), { env, fetchImpl: falla(403) }), (e) => /dominio/.test(e.friendlyMessage));
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `node --test scripts/email.test.js`
Expected: FAIL — `Cannot find module '../lib/email'`

- [ ] **Step 3: Implementar**

```js
// lib/email.js
// Envío de la ficha por correo con la API HTTP de Resend (sin SDK). Queda
// inactivo hasta cargar RESEND_API_KEY y EAA_EMAIL_FROM: el dominio de la
// agencia todavía no tiene DNS operativos (ver spec §9).
const { nombreArchivoPdf } = require("./ficha-pdf");

const RESEND_URL = "https://api.resend.com/emails";
const WHATSAPP = "+54 9 3794 33-1380";

function correoConfigurado(env = process.env) {
  return Boolean(env.RESEND_API_KEY && env.EAA_EMAIL_FROM);
}

function escapar(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function enmascararEmail(valor) {
  const [usuario, dominio] = String(valor || "").split("@");
  return usuario && dominio ? `${usuario[0]}***@${dominio}` : "";
}

function armarCorreoFicha(fila, pdfBytes, env = process.env) {
  const pasajero = `${fila.pasajero_apellido}, ${fila.pasajero_nombre}`;
  const tutor = `${fila.responsable_apellido}, ${fila.responsable_nombre}`;
  const filas = [
    ["Colegio", fila.colegio],
    ["Curso", [fila.nivel, fila.grado, fila.division].filter(Boolean).join(" ")],
    ["Viaje", fila.viaje],
    ["Plan de pago", fila.plan_nombre || "A definir con administración"],
    ["Pasajero", `${pasajero} (DNI ${fila.pasajero_dni})`],
    ["Tutor", `${tutor} · ${fila.responsable_celular}`]
  ];
  const html = `
    <div style="font-family:Arial,sans-serif;color:#10202b;max-width:560px">
      <h2 style="color:#0d69a1;margin:0 0 12px">Recibimos la ficha de adhesión</h2>
      <p>Hola ${escapar(fila.responsable_nombre)}, te enviamos una copia de la ficha que completaste. Queda pendiente de revisión por administración.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        ${filas.map(([k, v]) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #d9e7ef;font-weight:bold">${escapar(k)}</td><td style="padding:6px 8px;border-bottom:1px solid #d9e7ef">${escapar(v)}</td></tr>`).join("")}
      </table>
      <p>La ficha completa va adjunta en PDF. Si encontrás un dato incorrecto, escribinos por WhatsApp al ${WHATSAPP}.</p>
      <p style="color:#44545f;font-size:13px">El Ángel Azul · Viajes estudiantiles</p>
    </div>`;
  const payload = {
    from: env.EAA_EMAIL_FROM,
    to: [fila.responsable_email],
    subject: `Ficha de adhesión – ${pasajero} – ${fila.viaje}`,
    html,
    attachments: [{ filename: nombreArchivoPdf(fila), content: Buffer.from(pdfBytes).toString("base64") }]
  };
  if (env.EAA_EMAIL_COPIA) payload.bcc = [env.EAA_EMAIL_COPIA];
  return payload;
}

async function enviarCorreoFicha(fila, pdfBytes, { env = process.env, fetchImpl = fetch, idempotencyKey = `ficha-${fila.id}` } = {}) {
  const respuesta = await fetchImpl(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify(armarCorreoFicha(fila, pdfBytes, env))
  });
  if (respuesta.ok) return (await respuesta.json()).id;
  const mensaje = respuesta.status === 429
    ? "Límite de envíos de correo alcanzado. Reintentá más tarde."
    : [401, 403].includes(respuesta.status)
      ? "Resend rechazó el envío: revisá la clave o que el dominio esté verificado."
      : respuesta.status === 422
        ? "Resend rechazó los datos del correo (revisá el email del tutor)."
        : `No se pudo enviar el correo (Resend respondió ${respuesta.status}).`;
  const error = new Error(mensaje);
  error.friendlyMessage = mensaje;
  throw error;
}

module.exports = { correoConfigurado, enmascararEmail, armarCorreoFicha, enviarCorreoFicha };
```

- [ ] **Step 4: Correr las pruebas**

Run: `node --test scripts/email.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/email.js scripts/email.test.js
git commit -m "feat: correo de la ficha con Resend (inactivo hasta configurar)"
```

---

### Task 6: Rutas del servidor

**Files:**
- Modify: `server.js`
- Test: `scripts/server-routes.test.js`

**Interfaces:**
- Consumes: Tasks 1, 3, 4, 5.
- Produces (HTTP):
  - `GET /api/public/colegios` → `200 { ok, colegios: [{id, nombre, localidad, provincia}] }`
  - `GET /api/public/inscripcion-context?colegioId&nivel&viaje&grado&division` → `200 { ok, contrato: {id, codigo} | null, planes: [...] }`
  - `POST /api/public/fichas` (JSON campos PAX) → `201 { ok, id, emailDestino }` | `400 { ok:false, error, errores }` | `403` | `429` | `500`
  - `POST /api/public/fichas-tutor` → `201 { ok, id }` | `400` | `403` | `429` | `500`
  - `GET /api/admin/fichas/:id/pdf` (sesión) → `200 application/pdf` | `401` | `404`
  - `POST /api/admin/fichas/:id/reenviar-correo` (sesión + mismo origen) → `200 { ok, email_estado, email_error }`
  - Hojas nuevas en `/api/google-sheets`: `FICHAS_TUTOR`, `PLANES_PAGO`, `COLEGIOS` (con sesión)

- [ ] **Step 1: Escribir las pruebas (sin base de datos)**

Agregar a `scripts/server-routes.test.js` (reusa `request` y `port` existentes):

```js
test("POST /api/public/fichas sin Origin se rechaza", async () => {
  const response = await request({ method: "POST", path: "/api/public/fichas", body: {} });
  assert.equal(response.status, 403);
});

test("POST /api/public/fichas incompleta devuelve errores por campo sin tocar la base", async () => {
  const origin = `http://127.0.0.1:${port}`;
  const response = await request({
    method: "POST", path: "/api/public/fichas",
    headers: { origin, host: `127.0.0.1:${port}` },
    body: { nivel: "Secundaria", colegioTexto: "Normal 2", pasajeroNombre: "José" }
  });
  assert.equal(response.status, 400);
  assert.equal(response.json.ok, false);
  assert.ok(response.json.errores.pasajeroApellido);
  assert.ok(response.json.errores.responsableCuilCuit);
  assert.ok(response.json.errores.firma);
});

test("POST /api/public/fichas-tutor incompleta devuelve errores por campo", async () => {
  const origin = `http://127.0.0.1:${port}`;
  const response = await request({
    method: "POST", path: "/api/public/fichas-tutor",
    headers: { origin, host: `127.0.0.1:${port}` },
    body: { nombre: "Carlos" }
  });
  assert.equal(response.status, 400);
  assert.ok(response.json.errores.cuilCuit);
});

test("la escritura pública vieja de FICHAS_ADHESION ya no existe", async () => {
  const origin = `http://127.0.0.1:${port}`;
  const response = await request({
    method: "POST", path: "/api/google-sheets",
    headers: { origin, host: `127.0.0.1:${port}` },
    body: { sheet: "FICHAS_ADHESION", rows: [{ pasajero_nombre: "X" }] }
  });
  assert.equal(response.status, 401);
});

test("el PDF de una ficha exige sesión", async () => {
  const response = await request({ path: "/api/admin/fichas/3f1c2a8e-5b6d-4c7e-8f9a-0b1c2d3e4f5a/pdf" });
  assert.equal(response.status, 401);
});

test("la CSP permite consultar Georef", async () => {
  const response = await request({ path: "/" });
  assert.match(response.headers["content-security-policy"], /connect-src 'self' https:\/\/apis\.datos\.gob\.ar/);
});
```

Borrar la prueba existente "una ficha pública con firma falsa se rechaza antes de tocar la base" (usa la ruta vieja) y cualquier otra que postee `FICHAS_ADHESION` sin sesión; su cobertura queda en las pruebas nuevas.

- [ ] **Step 2: Correr y ver que fallan**

Run: `node --test scripts/server-routes.test.js`
Expected: FAIL en las 6 pruebas nuevas.

- [ ] **Step 3: Implementar en `server.js`**

1. Imports arriba:

```js
const fichaValidation = require("./assets/js/modules/ficha-validation.js");
const fichaPdf = require("./lib/ficha-pdf");
const email = require("./lib/email");
```

2. `SCHEMA`:
   - `GRUPOS`: agregar `"colegio_id"` después de `"colegio"`.
   - `PASAJEROS`: agregar `"apellido", "responsable_apellido", "responsable_email", "plan_pago_id", "plan_nombre", "plan_cuotas"`.
   - `FICHAS_ADHESION`: reemplazar por
     ```js
     ["id", "tipo", "pasajero_dni", "pasajero_nombre", "pasajero_apellido", "pasajero_tipo_documento", "pasajero_nacimiento", "pasajero_sexo",
      "responsable_nombre", "responsable_apellido", "responsable_tipo_documento", "responsable_numero_documento", "responsable_nacimiento",
      "responsable_parentesco", "responsable_email", "responsable_telefono", "responsable_celular", "responsable_cuil_cuit",
      "domicilio_calle", "domicilio_numero", "domicilio_piso", "domicilio_departamento", "domicilio_barrio", "domicilio_localidad",
      "domicilio_provincia", "domicilio_codigo_postal", "acepta_condiciones", "firma_data_url",
      "nivel", "viaje", "colegio_id", "colegio", "colegio_texto", "colegio_vinculado", "grado", "division", "curso_division",
      "plan_pago_id", "plan_nombre", "plan_cuotas", "grupo_asignado_id", "contrato_id", "codigo_contrato",
      "estado_revision", "documentacion_estado", "ficha_medica_estado", "autorizacion_estado", "motivo_rechazo", "observaciones",
      "email_estado", "email_error", "email_enviado_at", "created_at", "updated_at"]
     ```
   - Nuevas:
     ```js
     FICHAS_TUTOR: ["id", "tipo", "pasajero_nombre", "pasajero_apellido", "pasajero_dni", "nombre", "apellido", "tipo_documento", "numero_documento", "cuil_cuit", "celular", "email", "parentesco", "estado_revision", "observaciones", "created_at", "updated_at"],
     PLANES_PAGO: ["id", "contrato_id", "nombre", "cuotas", "descripcion", "activo", "orden"],
     COLEGIOS: ["id", "nombre", "provincia", "localidad", "codigo_oficial", "activo"],
     ```
3. `WRITE_ALLOWED`: agregar `"FICHAS_TUTOR", "PLANES_PAGO", "COLEGIOS"`.
4. `POSTGRES_SHEETS`: agregar `"FICHAS_TUTOR", "PLANES_PAGO", "COLEGIOS"`; `POSTGRES_LIST_FN` y `POSTGRES_SAVE_FN` con `db.listFichasTutorAdmin / db.saveFichasTutorAdmin`, `db.listPlanesPagoAdmin / db.savePlanesPagoAdmin`, `db.listColegiosAdmin / db.saveColegiosAdmin`.
5. `PUBLIC_WRITE_SHEETS = new Set()` y borrar el bloque `if (sheet === "FICHAS_ADHESION" && !isAdmin) { ... }` completo, junto con `validPublicFicha`.
6. CSP: `"connect-src 'self' https://apis.datos.gob.ar"`.
7. Funciones nuevas (antes de `createAppServer`):

```js
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_FICHA_BODY_BYTES = 400_000;

// Genera el PDF y envía el correo de una ficha ya guardada. Nunca lanza:
// el resultado queda en fichas_adhesion.email_estado para verlo en el admin.
async function procesarCorreoFicha(id, idempotencyKey) {
  try {
    if (!email.correoConfigurado()) {
      await db.setFichaEmailResultado(id, { estado: "sin_configurar" });
      return;
    }
    const [fila] = await db.listFichasAdmin(id);
    if (!fila) return;
    const pdf = await fichaPdf.generarPdfFicha(fila);
    await email.enviarCorreoFicha(fila, pdf, idempotencyKey ? { idempotencyKey } : {});
    await db.setFichaEmailResultado(id, { estado: "enviado" });
  } catch (error) {
    console.error("Error al enviar el correo de la ficha:", safeErrorForLog(error));
    await db.setFichaEmailResultado(id, {
      estado: "error",
      error: error.friendlyMessage || "No se pudo generar o enviar el correo."
    }).catch(() => {});
  }
}

async function handlePublicFicha(req, res) {
  if (requireSameOrigin(req, res)) return;
  const ip = clientIp(req);
  if (fichaSubmitRateLimited(ip)) {
    return json(res, 429, { ok: false, error: "Se alcanzó el límite de envíos. Probá de nuevo más tarde o consultanos por WhatsApp." });
  }
  const body = await readJsonBody(req, MAX_FICHA_BODY_BYTES);
  const previa = fichaValidation.validarFichaPax(body);
  if (!previa.ok && Object.keys(previa.errores).some((campo) => campo !== "planPagoId")) {
    return json(res, 400, { ok: false, error: "Revisá los datos marcados.", errores: previa.errores });
  }
  try {
    body.firma = db.normalizeSignatureDataUrl(body.firma);
  } catch (error) {
    return json(res, 400, { ok: false, error: "Revisá los datos marcados.", errores: { firma: error.friendlyMessage || "Firma inválida." } });
  }
  const contexto = UUID_RE.test(previa.datos.colegioId)
    ? await db.contextoInscripcion({
      colegioId: previa.datos.colegioId,
      nivel: previa.datos.nivel,
      viaje: `${previa.datos.destino} ${previa.datos.anio}`,
      grado: previa.datos.grado,
      division: previa.datos.division
    })
    : { contrato: null, grupoId: null, planes: [] };
  const validacion = fichaValidation.validarFichaPax(body, { planesDisponibles: contexto.planes.map((plan) => plan.id) });
  if (!validacion.ok) {
    return json(res, 400, { ok: false, error: "Revisá los datos marcados.", errores: validacion.errores });
  }
  registerFichaSubmit(ip);
  let guardada;
  try {
    guardada = await db.insertFichaPublica(validacion.datos, contexto);
  } catch (error) {
    if (error.statusCode === 400) return json(res, 400, { ok: false, error: error.message, errores: error.errores || {} });
    console.error("Error al guardar ficha de adhesión:", safeErrorForLog(error));
    return json(res, 500, { ok: false, error: "No se pudo guardar la ficha. Tus datos siguen cargados: intentá de nuevo en unos minutos o consultanos por WhatsApp." });
  }
  json(res, 201, { ok: true, id: guardada.id, emailDestino: email.enmascararEmail(validacion.datos.responsableEmail) });
  setImmediate(() => procesarCorreoFicha(guardada.id));
}

async function handlePublicFichaTutor(req, res) {
  if (requireSameOrigin(req, res)) return;
  const ip = clientIp(req);
  if (fichaSubmitRateLimited(ip)) {
    return json(res, 429, { ok: false, error: "Se alcanzó el límite de envíos. Probá de nuevo más tarde o consultanos por WhatsApp." });
  }
  const body = await readJsonBody(req, 20_000);
  const validacion = fichaValidation.validarFichaTutor(body);
  if (!validacion.ok) {
    return json(res, 400, { ok: false, error: "Revisá los datos marcados.", errores: validacion.errores });
  }
  registerFichaSubmit(ip);
  try {
    const guardada = await db.insertFichaTutor(validacion.datos);
    return json(res, 201, { ok: true, id: guardada.id });
  } catch (error) {
    console.error("Error al guardar ficha de tutor:", safeErrorForLog(error));
    return json(res, 500, { ok: false, error: "No se pudo guardar el registro. Intentá de nuevo en unos minutos." });
  }
}

async function handleAdminFicha(req, res, url) {
  const match = /^\/api\/admin\/fichas\/([^/]+)\/(pdf|reenviar-correo)$/.exec(url.pathname);
  if (!match) return false;
  if (!currentAdminSession(req)) {
    json(res, 401, { ok: false, error: "Necesitás iniciar sesión." });
    return true;
  }
  const [, id, accion] = match;
  if (!UUID_RE.test(id)) {
    json(res, 404, { ok: false, error: "Ficha no encontrada." });
    return true;
  }
  if (accion === "pdf" && req.method === "GET") {
    const [fila] = await db.listFichasAdmin(id);
    if (!fila) { json(res, 404, { ok: false, error: "Ficha no encontrada." }); return true; }
    const pdf = await fichaPdf.generarPdfFicha(fila);
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fichaPdf.nombreArchivoPdf(fila)}"`,
      "Cache-Control": "no-store",
      ...securityHeaders(req)
    });
    res.end(Buffer.from(pdf));
    return true;
  }
  if (accion === "reenviar-correo" && req.method === "POST") {
    if (requireSameOrigin(req, res)) return true;
    await procesarCorreoFicha(id, `ficha-${id}-reenvio-${Date.now()}`);
    const [fila] = await db.listFichasAdmin(id);
    json(res, 200, { ok: true, email_estado: fila?.email_estado || "", email_error: fila?.email_error || "" });
    return true;
  }
  json(res, 405, { ok: false, error: "Método no permitido" });
  return true;
}
```

8. En `createAppServer`, reemplazar el bloque de `/api/admin/` y `inscripcion-context` por:

```js
if (url.pathname.startsWith("/api/admin/fichas/")) {
  if (await handleAdminFicha(req, res, url)) return;
}
if (url.pathname.startsWith("/api/admin/")) return await handleAdminAuth(req, res, url);
if (url.pathname === "/api/public/colegios" && req.method === "GET") {
  return json(res, 200, { ok: true, colegios: await db.listColegiosPublicos() });
}
if (url.pathname === "/api/public/inscripcion-context" && req.method === "GET") {
  const p = url.searchParams;
  const contexto = await db.contextoInscripcion({
    colegioId: p.get("colegioId"), nivel: p.get("nivel"), viaje: p.get("viaje"),
    grado: p.get("grado"), division: p.get("division")
  });
  return json(res, 200, { ok: true, contrato: contexto.contrato, planes: contexto.planes });
}
if (url.pathname === "/api/public/fichas" && req.method === "POST") return await handlePublicFicha(req, res);
if (url.pathname === "/api/public/fichas-tutor" && req.method === "POST") return await handlePublicFichaTutor(req, res);
```

9. Borrar `normalizePublicMatch`, `publicMatchScore`, `publicInscripcionContext` y su export en `__test` (y la prueba que los usa en `server-routes.test.js`).

- [ ] **Step 4: Correr todas las pruebas**

Run: `npm test`
Expected: PASS en todo `scripts/*.test.js` salvo las pruebas de `frontend-regression.test.js` que dependen de código del navegador que cambia en las Tasks 7–9 (se ajustan ahí).

- [ ] **Step 5: Commit**

```bash
git add server.js scripts/server-routes.test.js
git commit -m "feat(api): rutas públicas de fichas PAX/Tutor, PDF y reenvío de correo"
```

---

### Task 7: Formulario público (inscripción PAX y Tutor)

**Files:**
- Modify: `assets/js/app.js` (`renderInscripcion`, `bindInscripcion`, `fichaAdhesionContextFromParams`, `hasValidFichaAdhesionContext`, `renderFichaAdhesion`, `bindFichaAdhesion`, `render`)
- Modify: `assets/css/styles.css`
- Test: `scripts/frontend-regression.test.js`

**Interfaces:**
- Consumes: `window.ElAngelAzulFichaValidation` (Task 1); `GET /api/public/colegios`, `GET /api/public/inscripcion-context`, `POST /api/public/fichas`, `POST /api/public/fichas-tutor` (Task 6); Georef `https://apis.datos.gob.ar/georef/api/localidades`.
- Produces: rutas `#/inscripcion` (selector PAX/Tutor + paso 1), `#/inscripcion/ficha-adhesion?...` (paso 2), `#/inscripcion/tutor`.
- Parámetros del hash del paso 2: `nivel, destino, anio, colegioId, colegioTexto, colegioNombre, grado, division`.

- [ ] **Step 1: Pruebas de regresión (estáticas, estilo del archivo)**

Agregar a `scripts/frontend-regression.test.js`:

```js
test("la ficha pública espera la respuesta del servidor antes de mostrar éxito", () => {
  const source = functionSource("bindFichaAdhesion", "render");
  assert.match(source, /fetch\("\/api\/public\/fichas"/);
  assert.match(source, /response\.status === 201/);
  assert.doesNotMatch(source, /fichaAdhesionCollection\.save/);
  assert.doesNotMatch(source, /queueGoogleSheetsWrite/);
});

test("la ficha pública pide nombre y apellido por separado", () => {
  const source = functionSource("renderFichaAdhesion", "bindFichaAdhesion");
  for (const name of ["pasajeroNombre", "pasajeroApellido", "responsableNombre", "responsableApellido", "responsableCuilCuit", "domicilioBarrio", "domicilioProvincia"]) {
    assert.match(source, new RegExp(`name="${name}"`));
  }
  assert.match(source, /tal como figuran en el DNI/);
});

test("la inscripción ofrece elegir PAX o Tutor y usa la lista de colegios", () => {
  const source = functionSource("bindInscripcion", "fichaAdhesionContextFromParams");
  assert.match(source, /\/api\/public\/colegios/);
  assert.match(source, /Mi colegio no está/);
  assert.match(appSource, /#\/inscripcion\/tutor/);
});
```

Borrar la prueba "la plantilla PDF usa una ruta absoluta válida desde cualquier entrada admin" (el PDF pasa al servidor en la Task 8).

- [ ] **Step 2: Correr y ver que fallan**

Run: `node --test scripts/frontend-regression.test.js`
Expected: FAIL en las 3 pruebas nuevas.

- [ ] **Step 3: Implementar `renderInscripcion` / `bindInscripcion`**

- Pantalla inicial dentro de `.public-inscripcion-card`, antes del stepper: bloque `data-inscripcion-tipo` con dos botones grandes:
  - `Pasajero (PAX)` — "Completá la ficha de adhesión del alumno que viaja." → muestra el formulario de selección (`hidden` hasta elegir).
  - `Tutor` — "Registrá a un tutor adicional de un pasajero." → `location.hash = "/inscripcion/tutor"`.
- Paso 1 (reemplaza el bloque "4 · Tu institución"):
  - `<input data-inscripcion-colegio-buscar list="colegios-lista" placeholder="Buscá tu colegio">` + `<datalist id="colegios-lista">` con los colegios de `GET /api/public/colegios` (formato de opción: `"Nombre — Localidad"`). Al elegir una opción exacta se guarda `colegioId`/`colegioNombre`.
  - Checkbox `data-inscripcion-colegio-no-esta` "Mi colegio no está": oculta el buscador y muestra `<input data-inscripcion-colegio-texto maxlength="120">`.
  - `<select data-inscripcion-grado>` con `ElAngelAzulFichaValidation.GRADOS[nivel]`; se regenera al cambiar el nivel.
  - `<input data-inscripcion-division maxlength="3" autocapitalize="characters">` (se pasa a mayúsculas en `input`).
  - Resultado de contrato: `GET /api/public/inscripcion-context?colegioId&nivel&viaje=${destino} ${anio}&grado&division` con debounce de 300 ms → "Encontramos el contrato {codigo}" o "No encontramos un contrato activo: podés continuar igual, administración lo vincula después." (con "Mi colegio no está" no se consulta).
  - `allSelectionValid`: nivel, destino, anio, grado, división (`/^[A-Z0-9]{1,3}$/`) y (`colegioId` o `colegioTexto.length >= 3`).
  - Submit: `location.hash = "/inscripcion/ficha-adhesion?" + new URLSearchParams({ nivel, destino, anio, colegioId, colegioTexto, colegioNombre, grado, division })`.
- Borrar: `resolveInscripcionContract`, `inscripcionContractCandidate`, `schoolSimilarityScore`, `normalizeInscripcionSchool` y demás helpers de matching difuso que queden sin uso (verificar con búsqueda de texto antes de borrar).

- [ ] **Step 4: Implementar `fichaAdhesionContextFromParams` / `hasValidFichaAdhesionContext`**

```js
function fichaAdhesionContextFromParams(params = currentHashParams()) {
  return {
    nivel: params.get("nivel") || "",
    destino: params.get("destino") || "",
    anio: params.get("anio") || "",
    colegioId: params.get("colegioId") || "",
    colegioTexto: params.get("colegioTexto") || "",
    colegioNombre: params.get("colegioNombre") || params.get("colegioTexto") || "",
    grado: params.get("grado") || "",
    division: params.get("division") || ""
  };
}

function hasValidFichaAdhesionContext(params = currentHashParams()) {
  const c = fichaAdhesionContextFromParams(params);
  const grados = window.ElAngelAzulFichaValidation.GRADOS[c.nivel] || [];
  return Boolean(c.destino && /^20\d{2}$/.test(c.anio) && grados.includes(c.grado) &&
    /^[A-Z0-9]{1,3}$/.test(c.division) && (c.colegioId || c.colegioTexto.trim().length >= 3));
}
```

En `render()`, la ruta `/inscripcion/ficha-adhesion` ya no llama `hydrateGoogleSheetsData()`; se agrega `if (path === "/inscripcion/tutor") { renderFichaTutor(); return; }`. La ruta `/inscripcion` tampoco hidrata.

- [ ] **Step 5: Implementar `renderFichaAdhesion`**

Contexto visible: `Curso · Destino Año · Colegio · Grado División` y contrato (se consulta al cargar con el mismo endpoint del paso 1). Fieldsets, en orden, con `required` en los obligatorios, `autocomplete` y `inputmode` adecuados:

1. **Datos del pasajero** — nota destacada `<p class="ficha-nombre-aviso">Escribí nombre/s y apellido/s completos, tal como figuran en el DNI y con tildes (ej.: José María / Fernández Núñez).</p>`; `pasajeroNombre`, `pasajeroApellido`, `pasajeroTipoDocumento` (opciones de `TIPOS_DOCUMENTO`), `pasajeroNumeroDocumento` (`inputmode="numeric"`), fecha de nacimiento (control de 3 partes existente), `pasajeroSexo` (`SEXOS`).
2. **Datos del tutor responsable** — `responsableNombre`, `responsableApellido`, `responsableTipoDocumento`, `responsableNumeroDocumento`, fecha de nacimiento, `responsableParentesco` (`PARENTESCOS`), `responsableCuilCuit` (`inputmode="numeric"`, placeholder `20-12345678-6`), `responsableEmail` (`type="email"`), `responsableCelular` (`type="tel"`, placeholder `3794 123456`), `responsableTelefono` (opcional).
3. **Domicilio** — `domicilioCalle`, `domicilioNumero` (placeholder `1234 o S/N`), `domicilioPiso`, `domicilioDepartamento`, `domicilioBarrio` (opcional), `domicilioProvincia` (`<select>` con `PROVINCIAS`, `Corrientes` seleccionada), `domicilioLocalidad` (`list="localidades-lista"` + `<datalist id="localidades-lista">`), `domicilioCodigoPostal` (`inputmode="numeric"`, `maxlength="8"`). Calle y número en `.ficha-fila-calle` (grid 2fr/1fr también en mobile).
4. **Plan de pago** — `<fieldset data-ficha-planes hidden>` con radios `name="planPagoId"`; se muestra solo si el contexto trae planes (`"{nombre} · {cuotas} cuotas"` + descripción).
5. **Condiciones** y **Firma** — iguales a hoy.
6. `<div class="ficha-adhesion-error" data-ficha-error hidden role="alert"></div>` y botón `Enviar ficha`.

Todos los campos llevan un `<small class="ficha-campo-error" data-error-for="{name}" hidden></small>` debajo.

- [ ] **Step 6: Implementar `bindFichaAdhesion`**

Mantener el control de fecha en 3 partes y el lienzo de firma existentes. Agregar:

```js
const validacion = window.ElAngelAzulFichaValidation;
let planesDisponibles = [];

const mostrarErrores = (errores = {}, sugerencias = {}) => {
  form.querySelectorAll("[data-error-for]").forEach((nodo) => {
    const campo = nodo.dataset.errorFor;
    const mensaje = errores[campo] || sugerencias[campo] || "";
    nodo.textContent = mensaje;
    nodo.hidden = !mensaje;
    nodo.classList.toggle("is-sugerencia", !errores[campo] && Boolean(sugerencias[campo]));
    form.querySelectorAll(`[name="${campo}"]`).forEach((input) => input.setAttribute("aria-invalid", errores[campo] ? "true" : "false"));
  });
  const campos = Object.keys(errores);
  errorBox.hidden = campos.length === 0;
  errorBox.innerHTML = campos.length
    ? `<strong>Faltan completar o corregir ${campos.length} dato(s):</strong><ul>${campos.map((c) => `<li>${escapeHtml(validacion.ETIQUETAS[c] || c)}</li>`).join("")}</ul>`
    : "";
  const primero = campos.length && (form.querySelector(`[name="${campos[0]}"]`) || form.querySelector(`[data-error-for="${campos[0]}"]`));
  if (primero) { primero.scrollIntoView({ behavior: "smooth", block: "center" }); primero.focus?.({ preventScroll: true }); }
};

const leerFormulario = () => {
  const fd = new FormData(form);
  const valor = (k) => String(fd.get(k) || "");
  const contexto = fichaAdhesionContextFromParams();
  return {
    ...contexto,
    ...Object.fromEntries(["pasajeroNombre", "pasajeroApellido", "pasajeroTipoDocumento", "pasajeroNumeroDocumento", "pasajeroNacimiento", "pasajeroSexo",
      "responsableNombre", "responsableApellido", "responsableTipoDocumento", "responsableNumeroDocumento", "responsableNacimiento",
      "responsableParentesco", "responsableCuilCuit", "responsableEmail", "responsableCelular", "responsableTelefono",
      "domicilioCalle", "domicilioNumero", "domicilioPiso", "domicilioDepartamento", "domicilioBarrio", "domicilioLocalidad",
      "domicilioProvincia", "domicilioCodigoPostal", "planPagoId"].map((k) => [k, valor(k)])),
    aceptaCondiciones: fd.get("aceptaCondiciones") === "si",
    firma: hasSignature ? canvas.toDataURL("image/png") : ""
  };
};
```

Contexto de contrato y planes al cargar:

```js
const ctx = fichaAdhesionContextFromParams();
if (ctx.colegioId) {
  const qs = new URLSearchParams({ colegioId: ctx.colegioId, nivel: ctx.nivel, viaje: `${ctx.destino} ${ctx.anio}`, grado: ctx.grado, division: ctx.division });
  fetch(`/api/public/inscripcion-context?${qs}`, { cache: "no-store" })
    .then((r) => r.json())
    .then((payload) => {
      planesDisponibles = (payload.planes || []).map((plan) => plan.id);
      renderPlanes(payload.planes || []);
      renderContrato(payload.contrato);
    })
    .catch(() => {});
}
```

Georef (localidades por provincia, debounce 250 ms, mínimo 2 letras, errores ignorados):

```js
const localidadInput = form.querySelector('[name="domicilioLocalidad"]');
const provinciaSelect = form.querySelector('[name="domicilioProvincia"]');
const localidadesLista = document.getElementById("localidades-lista");
let georefTimer = null;
localidadInput.addEventListener("input", () => {
  clearTimeout(georefTimer);
  const nombre = localidadInput.value.trim();
  if (nombre.length < 2) return;
  georefTimer = setTimeout(async () => {
    try {
      const qs = new URLSearchParams({ provincia: provinciaSelect.value, nombre, max: "10", campos: "nombre" });
      const r = await fetch(`https://apis.datos.gob.ar/georef/api/localidades?${qs}`);
      const payload = await r.json();
      const nombres = [...new Set((payload.localidades || []).map((l) => l.nombre))];
      localidadesLista.innerHTML = nombres.map((n) => `<option value="${escapeHtml(n)}"></option>`).join("");
    } catch (_) {
      // Georef caído: la localidad se escribe a mano igual.
    }
  }, 250);
});
```

Sugerencia de email al salir del campo: `responsableEmail.addEventListener("blur", ...)` que muestra `validacion.sugerenciaEmail(valor)` en `[data-error-for="responsableEmail"]` con clase `is-sugerencia` y un botón "Usar" que reemplaza el valor.

Envío:

```js
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector(".ficha-adhesion-submit");
  if (submitButton.disabled) return;
  const ficha = leerFormulario();
  const local = validacion.validarFichaPax(ficha, { planesDisponibles });
  if (!local.ok) return mostrarErrores(local.errores, local.sugerencias);
  submitButton.disabled = true;
  submitButton.textContent = "Enviando…";
  try {
    const response = await fetch("/api/public/fichas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ficha)
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 201 && payload.ok) {
      renderFichaAdhesion({ emailDestino: payload.emailDestino || "" });
      return;
    }
    if (payload.errores && Object.keys(payload.errores).length) {
      mostrarErrores(payload.errores);
    } else {
      errorBox.hidden = false;
      errorBox.textContent = payload.error || "No pudimos enviar la ficha. Tus datos siguen cargados: volvé a intentar.";
    }
  } catch (_) {
    errorBox.hidden = false;
    errorBox.textContent = "No hay conexión con el servidor. Tus datos siguen cargados: revisá tu internet y volvé a intentar.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Enviar ficha";
  }
});
```

`renderFichaAdhesion(exito)` recibe `{ emailDestino }` en lugar de `successMessage` y la pantalla de éxito dice "Recibimos tu ficha correctamente." + (si hay `emailDestino`) "Te enviamos una copia a {emailDestino}. Si no la ves, revisá la carpeta de spam." + "Queda pendiente de revisión por administración."

Borrar del flujo público: `loadFichasAdhesionDemo().unshift`, `fichaAdhesionCollection.save`, `queueGoogleSheetsWrite(["FICHAS_ADHESION"])`, `googleSheetsSyncState` y el objeto `administracion`.

- [ ] **Step 7: Implementar `renderFichaTutor` / `bindFichaTutor`**

Nueva vista `#/inscripcion/tutor` con el mismo layout (`.ficha-adhesion-layout`): fieldset "Pasajero a cargo" (`pasajeroNombre`, `pasajeroApellido`, `pasajeroNumeroDocumento`) y fieldset "Datos del tutor" (`nombre`, `apellido`, `tipoDocumento`, `numeroDocumento`, `cuilCuit`, `celular`, `email`, `parentesco`), checkbox `aceptaCondiciones` ("Confirmo que soy tutor de este pasajero y que los datos son correctos."). Misma función `mostrarErrores` (extraerla a nivel de módulo como `mostrarErroresFormulario(form, errorBox, errores, sugerencias)` y usarla en ambos binds), `validacion.validarFichaTutor` antes de enviar y `POST /api/public/fichas-tutor`; éxito solo con `201`: "Registramos tus datos como tutor. Administración los vincula con el pasajero."

- [ ] **Step 8: CSS**

Agregar en `assets/css/styles.css` junto a los estilos de `.ficha-adhesion-form`:

```css
.inscripcion-tipo-grid { display: grid; gap: 14px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.inscripcion-tipo-grid button { background: #fff; border: 2px solid #d9e7ef; border-radius: 18px; cursor: pointer; display: grid; gap: 6px; padding: 22px; text-align: left; }
.inscripcion-tipo-grid button:hover, .inscripcion-tipo-grid button:focus-visible { border-color: var(--color-primary); }
.inscripcion-tipo-grid strong { color: var(--color-primary-strong); font-size: 1.15rem; }
.ficha-nombre-aviso { background: #fff7e0; border-left: 4px solid #f2b705; border-radius: 10px; grid-column: 1 / -1; margin: 0; padding: 10px 12px; }
.ficha-campo-error { color: #b42318; font-weight: 600; }
.ficha-campo-error.is-sugerencia { color: #0a4f79; }
.ficha-adhesion-form [aria-invalid="true"] { border-color: #b42318; box-shadow: 0 0 0 3px rgba(180, 35, 24, .12); }
.ficha-adhesion-error ul { margin: 6px 0 0; padding-left: 18px; }
.ficha-fila-calle { display: grid; gap: 12px; grid-column: 1 / -1; grid-template-columns: 2fr 1fr; }
.ficha-planes-opciones { display: grid; gap: 10px; grid-column: 1 / -1; }
.ficha-planes-opciones label { align-items: center; border: 1px solid #d9e7ef; border-radius: 12px; display: flex; gap: 10px; padding: 12px; }
@media (max-width: 720px) { .inscripcion-tipo-grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 9: Pruebas**

Run: `node --check assets/js/app.js && node --test scripts/frontend-regression.test.js`
Expected: sin errores de sintaxis; PASS en las pruebas nuevas.

- [ ] **Step 10: Commit**

```bash
git add assets/js/app.js assets/css/styles.css scripts/frontend-regression.test.js
git commit -m "feat(inscripcion): ficha PAX y Tutor con validación y envío confirmado"
```

---

### Task 8: Admin — Bandeja de Fichas

**Files:**
- Modify: `assets/js/app.js` (`hydrateGoogleSheetsData`, `applyGoogleSheetsRows`, `sheetFichaFromRow`, `googleSheetsFichaRows`, `fichaAdhesionDemoRows`, `renderAdminFichasRecibidas`, `renderAdminFichasFilters`, `renderAdminFichaDetail`, `bindAdminFichasRecibidas`, `approveFichaAdhesionAndCreatePassenger`, funciones del PDF en el navegador)
- Modify: `assets/css/styles.css`
- Test: `scripts/frontend-regression.test.js`

**Interfaces:**
- Consumes: hojas `FICHAS_ADHESION`, `FICHAS_TUTOR`, `COLEGIOS`, `PLANES_PAGO` (Task 6); `GET /api/admin/fichas/:id/pdf`, `POST /api/admin/fichas/:id/reenviar-correo`.
- Produces: estado global `adminColegios` (array de filas COLEGIOS), `adminPlanesPago` (array de filas PLANES_PAGO), `adminFichasTutor` (array de filas FICHAS_TUTOR), `adminFichasTipo` (`"pax" | "tutor"`), `adminFichasSinVincular` (boolean). Helpers `saveAdminColegios()`, `saveAdminPlanesPago()`, `saveAdminFichasTutor()` que llaman `queueGoogleSheetsWrite([...])`.

- [ ] **Step 1: Pruebas de regresión**

```js
test("el PDF de la ficha se descarga desde el servidor", () => {
  assert.match(appSource, /\/api\/admin\/fichas\/\$\{encodeURIComponent\(id\)\}\/pdf/);
  assert.doesNotMatch(appSource, /function createFichaAdhesionPdfBlob/);
  assert.doesNotMatch(appSource, /function createImagePdfBlob/);
});

test("el detalle de ficha muestra la pertenencia en orden", () => {
  const source = functionSource("renderAdminFichaDetail", "approveFichaAdhesionAndCreatePassenger");
  const orden = ["Colegio", "Curso", "Grado/Año", "División", "Plan", "Contrato"].map((label) => source.indexOf(`"${label}"`));
  assert.ok(orden.every((i) => i > -1), "faltan etiquetas de pertenencia");
  assert.deepEqual([...orden].sort((a, b) => a - b), orden);
  assert.doesNotMatch(source, /fichaStudentFirstName/);
});

test("la bandeja hidrata fichas de tutor, colegios y planes", () => {
  const source = functionSource("hydrateGoogleSheetsData", "queueGoogleSheetsWrite");
  for (const hoja of ["FICHAS_TUTOR", "COLEGIOS", "PLANES_PAGO"]) assert.match(source, new RegExp(`"${hoja}"`));
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `node --test scripts/frontend-regression.test.js`
Expected: FAIL en las 3 pruebas nuevas.

- [ ] **Step 3: Hidratación y guardado**

- `hydrateGoogleSheetsData`: en admin, pedir también `FICHAS_TUTOR`, `COLEGIOS`, `PLANES_PAGO` (mismo patrón `.catch(() => null)` y el mismo corte si alguna es `null`). Guardar en `adminFichasTutor`, `adminColegios`, `adminPlanesPago` (arrays de filas planas tal cual llegan).
- `queueGoogleSheetsWrite`: agregar `FICHAS_TUTOR` → `adminFichasTutor`, `COLEGIOS` → `adminColegios`, `PLANES_PAGO` → `adminPlanesPago`, e incluirlas en la lista de hojas permitidas del bucle.
- `sheetFichaFromRow`: agregar `tipo, pasajeroApellido, responsableApellido, colegioId, colegioTexto, colegioVinculado (=== "TRUE"), grado, division, planPagoId, planNombre, planCuotas, domicilioBarrio, motivoRechazo, emailEstado, emailError, emailEnviadoAt`.
- `googleSheetsFichaRows`: agregar las mismas claves en snake_case (`pasajero_apellido`, `responsable_apellido`, `colegio_id`, `plan_pago_id`, `grupo_asignado_id`, `contrato_id`, `motivo_rechazo`, ...). El servidor solo usa `colegio_id`, `plan_pago_id`, `grupo_asignado_id`, `contrato_id` y los estados.

- [ ] **Step 4: Tabla, filtros y detalle**

- `renderAdminFichasRecibidas`: selector de tipo sobre las pestañas (`data-admin-fichas-tipo="pax" | "tutor"`); checkbox "Solo colegio sin vincular" (`data-admin-fichas-sin-vincular`). Con tipo `tutor` se muestra `renderAdminFichasTutorTabla(adminFichasTutor)` en lugar de la tabla PAX.
- `fichaAdhesionDemoRows`: columnas `Apellido y nombre` (`{apellido}, {nombre}` + `DNI`), `Colegio` (+ badge `Sin vincular` cuando `!colegioVinculado`), `Grado/División`, `Plan` (`planNombre` o `Pendiente`), `Estado`, `Correo` (badge: `Enviado` / `Error` / `Sin configurar` / `Pendiente`), `Acciones`.
- `renderAdminFichaDetail`, cards en este orden:
  1. **Pertenencia**: `renderFichaValue("Colegio", ficha.colegio)`, `("Curso", ficha.nivel)`, `("Grado/Año", ficha.grado)`, `("División", ficha.division)`, `("Plan", ficha.planNombre ? \`${ficha.planNombre} · ${ficha.planCuotas} cuotas\` : "")`, `("Contrato", ficha.codigoContrato)`. Si `!ficha.colegioVinculado`: aviso "La familia escribió: {colegioTexto}" + `<select data-ficha-vincular-colegio>` con `adminColegios` activos + botón `Vincular` + botón `Crear colegio "{colegioTexto}"`.
  2. **Pasajero**: Nombre/s, Apellido/s, tipo y número de documento, nacimiento, sexo.
  3. **Tutor principal**: Nombre/s, Apellido/s, documento, nacimiento, parentesco, CUIL/CUIT, correo, celular, teléfono. **Tutores adicionales**: filas de `adminFichasTutor` con `pasajero_dni === ficha.pasajeroNumeroDocumento` (nombre, parentesco, celular, email, estado) o "Sin tutores adicionales".
  4. **Domicilio**: calle, número, piso, depto, barrio, localidad, provincia, CP.
  5. **Firma y documentación** (igual que hoy).
  6. **Correo**: estado, fecha de envío, `emailError` y botón `Reenviar correo` (`data-ficha-reenviar-correo`).
  7. Columna de asignación/aprobación existente.
- Borrar `fichaStudentFirstName` y `fichaStudentLastName`.

- [ ] **Step 5: Acciones**

En `bindAdminFichasRecibidas`:

```js
// Descargar PDF generado por el servidor
document.querySelectorAll("[data-ficha-pdf]").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.fichaPdf;
    window.location.href = `/api/admin/fichas/${encodeURIComponent(id)}/pdf`;
  });
});

// Reenviar correo
document.querySelector("[data-ficha-reenviar-correo]")?.addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = "Enviando…";
  try {
    const response = await fetch(`/api/admin/fichas/${encodeURIComponent(adminFichasSelectedId)}/reenviar-correo`, {
      method: "POST", credentials: "same-origin"
    });
    const payload = await response.json();
    adminFichasMessage = payload.email_estado === "enviado"
      ? "Correo reenviado."
      : `No se pudo reenviar: ${payload.email_error || payload.error || payload.email_estado}`;
  } catch (_) {
    adminFichasMessage = "No se pudo contactar al servidor para reenviar el correo.";
  }
  await hydrateGoogleSheetsData(true);
  renderAdminFichasRecibidas();
});

// Vincular colegio existente o crearlo
document.querySelector("[data-ficha-vincular-colegio-btn]")?.addEventListener("click", async () => {
  const colegioId = document.querySelector("[data-ficha-vincular-colegio]")?.value;
  if (!colegioId) return;
  await updateFichaAdhesionStatus(adminFichasSelectedId, currentEstado(), { colegioId, colegioVinculado: true }, "Colegio vinculado.");
});
document.querySelector("[data-ficha-crear-colegio]")?.addEventListener("click", async (event) => {
  const nombre = event.currentTarget.dataset.fichaCrearColegio;
  const colegio = { id: crypto.randomUUID(), nombre, provincia: "", localidad: "", codigo_oficial: "", activo: "TRUE" };
  adminColegios.push(colegio);
  const ok = await queueGoogleSheetsWrite(["COLEGIOS"]);
  if (!ok) { adminFichasMessage = googleSheetsSyncState.message; renderAdminFichasRecibidas(); return; }
  await updateFichaAdhesionStatus(adminFichasSelectedId, currentEstado(), { colegioId: colegio.id, colegioVinculado: true }, `Colegio "${nombre}" creado y vinculado.`);
});
```

Donde `currentEstado()` es `loadFichasAdhesionDemo().find((f) => f.id === adminFichasSelectedId)?.estadoRevision || "pendiente"`. Después de guardar, `hydrateGoogleSheetsData(true)` para traer `colegio` y `colegio_vinculado` recalculados por el servidor.

Tutor: `renderAdminFichasTutorTabla` con columnas `Tutor`, `Pasajero a cargo` (nombre + DNI + "Registrado"/"Todavía no registrado" según exista una ficha PAX o pasajero con ese DNI), `Contacto`, `Estado` (`<select data-ficha-tutor-estado="{id}">` pendiente/revisada/observada/rechazada) — al cambiar, actualizar la fila en `adminFichasTutor` y `queueGoogleSheetsWrite(["FICHAS_TUTOR"])`.

- [ ] **Step 6: Aprobación**

En `approveFichaAdhesionAndCreatePassenger`, el objeto que se agrega a `group.pasajeros` suma:

```js
apellido: String(ficha.pasajeroApellido || "").trim(),
responsableApellido: String(ficha.responsableApellido || "").trim(),
responsableEmail: String(ficha.responsableEmail || "").trim(),
responsableTelefono: String(ficha.responsableCelular || "").trim(),
planPagoId: String(ficha.planPagoId || "").trim(),
planNombre: String(ficha.planNombre || "").trim(),
```

y `telefono` pasa a `ficha.responsableCelular`. Borrar `planPago: "Regular"`.

- [ ] **Step 7: Borrar el PDF del navegador**

Borrar `fichaPdfFileName`, `fichaMoneyValue`, `fichaPdfDate`, `fichaPdfDateParts`, `loadPdfImage`, `createImagePdfBlob`, `createFichaAdhesionPdfBlob`, `downloadFichaAdhesionPdf` y cualquier helper que quede sin uso (`fitCanvasFont`, `wrapCanvasText`, `dataUrlToBytes`): buscar cada nombre con Grep antes de borrar y conservar los que tengan otros usos.

- [ ] **Step 8: Pruebas**

Run: `node --check assets/js/app.js && npm test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add assets/js/app.js assets/css/styles.css scripts/frontend-regression.test.js
git commit -m "feat(admin): bandeja de fichas con pertenencia, tutores, colegio y correo"
```

---

### Task 9: Admin — Planes de pago en Contratos y Pasajeros

**Files:**
- Modify: `assets/js/app.js` (`renderAdminContratos` y su modal de edición, `bindAdminContratos`, `sheetPassengerFromRow`, `googleSheetsPassengerRows`, `renderAdminPasajerosTableRows`, `renderAdminPasajeros`, `renderAdminPasajerosProfile`, `renderAdminGruposCreateForm`, `createAdminPasajerosGroup`, `googleSheetsGroupRows`, `sheetGroupFromRow`)
- Test: `scripts/frontend-regression.test.js`

**Interfaces:**
- Consumes: `adminPlanesPago`, `adminColegios`, `adminFichasTutor` (Task 8).

- [ ] **Step 1: Pruebas de regresión**

```js
test("los planes de pago se administran dentro del contrato con 1 a 18 cuotas", () => {
  const source = functionSource("renderAdminContratos", "bindAdminContratos");
  assert.match(source, /Planes de pago/);
  assert.match(source, /min="1"[^>]*max="18"|max="18"[^>]*min="1"/);
});

test("la tabla de pasajeros muestra colegio, grado, división, plan y tutor", () => {
  const source = functionSource("renderAdminPasajerosTableRows", "bindAdminPasajerosProfileButtons");
  for (const texto of ["planNombre", "responsableApellido", "group.colegio", "group.curso", "group.division"]) {
    assert.match(source, new RegExp(texto.replace(".", "\\.")));
  }
});

test("los grupos eligen el colegio de la lista", () => {
  const source = functionSource("renderAdminGruposCreateForm", "renderAdminGrupos");
  assert.match(source, /adminColegios/);
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `node --test scripts/frontend-regression.test.js`
Expected: FAIL en las 3 pruebas nuevas.

- [ ] **Step 3: Planes en el modal de edición de contrato**

Dentro del modal que abre `openAdminContratoEdit` (render en `renderAdminContratos` cuando `adminContratosEditId`), agregar una sección:

```html
<section class="admin-contrato-planes">
  <h3>Planes de pago</h3>
  <ul> <!-- por cada plan de adminPlanesPago con contrato_id === contrato.id -->
    <li>
      <strong>{nombre}</strong> · {cuotas} cuotas {descripcion}
      <span class="admin-pasajeros-status">{Activo|Inactivo}</span>
      <button type="button" data-plan-toggle="{id}">{Desactivar|Activar}</button>
    </li>
  </ul>
  <div class="admin-contrato-plan-form">
    <input data-plan-nombre placeholder="Ej.: 12 cuotas sin interés" maxlength="80">
    <input data-plan-cuotas type="number" min="1" max="18" step="1" placeholder="Cuotas">
    <input data-plan-descripcion placeholder="Descripción (opcional)" maxlength="200">
    <button type="button" data-plan-agregar>Agregar plan</button>
  </div>
  <p class="admin-contrato-plan-error" data-plan-error hidden></p>
</section>
```

En `bindAdminContratos`:

```js
document.querySelector("[data-plan-agregar]")?.addEventListener("click", async () => {
  const nombre = document.querySelector("[data-plan-nombre]").value.trim();
  const cuotas = Number(document.querySelector("[data-plan-cuotas]").value);
  const descripcion = document.querySelector("[data-plan-descripcion]").value.trim();
  const errorNode = document.querySelector("[data-plan-error]");
  if (nombre.length < 2 || !Number.isInteger(cuotas) || cuotas < 1 || cuotas > 18) {
    errorNode.textContent = "Cargá un nombre y una cantidad de cuotas entre 1 y 18.";
    errorNode.hidden = false;
    return;
  }
  adminPlanesPago.push({ id: crypto.randomUUID(), contrato_id: adminContratosEditId, nombre, cuotas: String(cuotas), descripcion, activo: "TRUE", orden: "" });
  await queueGoogleSheetsWrite(["PLANES_PAGO"]);
  renderAdminContratos();
});
document.querySelectorAll("[data-plan-toggle]").forEach((button) => {
  button.addEventListener("click", async () => {
    const plan = adminPlanesPago.find((item) => item.id === button.dataset.planToggle);
    if (!plan) return;
    plan.activo = plan.activo === "TRUE" ? "FALSE" : "TRUE";
    await queueGoogleSheetsWrite(["PLANES_PAGO"]);
    renderAdminContratos();
  });
});
```

Si el contrato todavía no está guardado en la base (id sin fila en el servidor), el servidor responde el error "Guardá el contrato antes de cargarle planes." y se muestra con `googleSheetsSyncState.message`.

- [ ] **Step 4: Grupos con colegio de la lista**

- `renderAdminGruposCreateForm` / `openAdminPasajerosGroupModal`: el campo colegio pasa a `<select name="colegio_id">` con `adminColegios.filter((c) => c.activo === "TRUE")`; el curso pasa a `<select name="curso">` con `ElAngelAzulFichaValidation.GRADOS[nivel]`.
- `createAdminPasajerosGroup` recibe `colegioId` y guarda `colegio` con el nombre del colegio elegido.
- `sheetGroupFromRow` agrega `colegioId: row.colegio_id`; `googleSheetsGroupRows` agrega `colegio_id: group.colegioId`.
- Si `adminColegios` está vacío, el formulario muestra "Todavía no hay colegios cargados." (la sección Colegios llega en la Fase 2; en la Fase 1 se cargan por SQL).

- [ ] **Step 5: Pasajeros**

- `sheetPassengerFromRow`: agregar `apellido, responsableApellido: row.responsable_apellido, responsableEmail: row.responsable_email, planPagoId: row.plan_pago_id, planNombre: row.plan_nombre, planCuotas: row.plan_cuotas`.
- `googleSheetsPassengerRows`: agregar `apellido`, `responsable_apellido`, `responsable_email`, `plan_pago_id`.
- `renderAdminPasajerosTableRows`: primera celda `"{apellido}, {nombre}"` (o solo `nombre` si no hay apellido); columna de grupo con `group.colegio · group.curso group.division`; columna nueva `Plan` (`passenger.planNombre || "Pendiente"`); columna `Tutor` con `"{responsableApellido}, {responsable}"`. Ajustar `<thead>` en `renderAdminPasajeros` y el `colspan` del estado vacío.
- `renderAdminPasajerosProfile`: bloque **Pertenencia** en este orden: Colegio → Curso (`group.nivel`) → Grado/Año (`group.curso`) → División → Plan → Contrato; bloque **Tutores**: principal (nombre, parentesco, celular, email, CUIL/CUIT) + adicionales desde `adminFichasTutor` con `pasajero_dni === passenger.dni`.
- Formulario de alta/edición manual de pasajero: agregar input `apellido` junto a `nombre`.

- [ ] **Step 6: Pruebas**

Run: `node --check assets/js/app.js && npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add assets/js/app.js assets/css/styles.css scripts/frontend-regression.test.js
git commit -m "feat(admin): planes de pago por contrato y pertenencia completa del pasajero"
```

---

### Task 10: Documentación

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Actualizar README**

- En "Variables privadas" agregar:
  ```bash
  # Correo (inactivo hasta verificar el dominio en Resend)
  RESEND_API_KEY=...
  EAA_EMAIL_FROM="El Ángel Azul <fichas@DOMINIO>"
  EAA_EMAIL_COPIA=agencia@DOMINIO   # opcional, copia oculta
  ```
- Reemplazar "### Fichas de adhesión" por: formulario PAX (`POST /api/public/fichas`) y Tutor (`POST /api/public/fichas-tutor`), validación compartida en `assets/js/modules/ficha-validation.js`, PDF en `GET /api/admin/fichas/:id/pdf`, correo automático y reenvío, estados de `email_estado`.
- En "Rutas principales" agregar `/#/inscripcion/tutor`.
- En "Base de datos" mencionar `0003_ficha_adhesion_v2.sql`, `planes_pago`, `fichas_tutor`.

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: variables de correo y flujo de fichas v2"
```

---

### Task 11: Base reiniciada, migración y verificación de punta a punta

**Precondición:** proyecto Supabase `gruwkiuswpnbzywcoftz` reactivado (Franco quita a Render-audiovisual de la organización) y `.env` local con `DATABASE_URL` (lo carga Franco, no circula por chat).

- [ ] **Step 1: Revisar el contenido antes de borrar**

Con `mcp__claude_ai_Supabase__execute_sql`:

```sql
select 'colegios' t, count(*) from colegios union all select 'viajes', count(*) from viajes
union all select 'personas', count(*) from personas union all select 'grupos', count(*) from grupos
union all select 'contratos', count(*) from contratos union all select 'pasajeros', count(*) from pasajeros
union all select 'inscripciones', count(*) from inscripciones union all select 'fichas_adhesion', count(*) from fichas_adhesion
union all select 'responsables', count(*) from responsables;
select nombre, numero_documento from personas limit 20;
```

Mostrar el resultado a Franco y confirmar que son datos de prueba antes de seguir.

- [ ] **Step 2: Vaciar datos de prueba**

```sql
truncate table fichas_adhesion, inscripciones, pasajero_responsables, pasajeros, contratos, grupos,
  responsables, personas, colegios, documentos, legacy_id_map, eventos_administrativos restart identity cascade;
delete from viajes where categoria in ('estudiantil', 'mixto');
```

(Los viajes de Turismo y `config` se conservan.)

- [ ] **Step 3: Aplicar la migración**

`mcp__claude_ai_Supabase__apply_migration` con `name: "0003_ficha_adhesion_v2"` y el contenido de `supabase/migrations/0003_ficha_adhesion_v2.sql`. Luego `get_advisors` (security) y confirmar RLS activo en `planes_pago`, `fichas_tutor`, `inscripciones`, `fichas_adhesion`.

- [ ] **Step 4: Datos semilla de prueba**

```sql
insert into colegios (nombre, provincia, localidad) values
  ('Colegio San José', 'Corrientes', 'Corrientes'),
  ('Escuela Normal Dr. Juan Pujol', 'Corrientes', 'Corrientes');
```

Crear desde el admin local un grupo (Secundaria, Bariloche 2027, Colegio San José, 5°, B), un contrato activo para ese grupo y dos planes (6 y 12 cuotas).

- [ ] **Step 5: `npm run db:check`**

Run: `node --env-file=.env scripts/db-check.js`
Expected: conexión OK y todas las tablas presentes, incluidas `planes_pago` y `fichas_tutor`.

- [ ] **Step 6: Prueba de punta a punta con Playwright (script en el scratchpad, fuera del repo)**

Con el servidor local (`node --env-file=.env server.js`) verificar y guardar capturas:
1. Inscripción PAX con Colegio San José / 5° / B → se ve el contrato y los 2 planes.
2. Enviar sin datos → lista de faltantes, errores por campo, no hay POST exitoso.
3. CUIL que no coincide con el DNI → error específico.
4. `gmail.con` → sugerencia.
5. Envío completo → respuesta 201 y pantalla de éxito con email enmascarado; en la base la ficha tiene `plan_pago_id`, `colegio_id` y `email_estado = 'sin_configurar'`.
6. "Mi colegio no está" → la ficha entra con `colegio_texto`.
7. Formulario de Tutor → 201.
8. Admin: la ficha aparece con pertenencia completa, tutor adicional visible, vincular colegio de la ficha sin colegio, descargar PDF (abrir y revisar: apellido y nombre separados por coma, colegio con grado y división, plan).
9. Aprobar la ficha → el pasajero aparece en Pasajeros con plan y tutores.
10. Servidor caído a mitad del envío (detener el proceso) → mensaje de error y datos conservados.

- [ ] **Step 7: Limpiar datos de prueba de la verificación**

Repetir el `truncate` del Step 2 (conservando los colegios semilla solo si Franco lo pide).

- [ ] **Step 8: Push de la rama**

```bash
git push
```

---

## Fuera de esta fase

- Sección Colegios del admin e importación del Padrón (Fase 2).
- Exportación a Excel y Supabase Storage (Fase 3).
- Activación del correo (requiere dominio con DNS y cuenta de Resend).
- Keep-alive de Supabase gratuito (pendiente de confirmación de Franco).
