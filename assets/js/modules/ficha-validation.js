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
