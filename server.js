const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");
const db = require("./lib/db");
const fichaValidation = require("./assets/js/modules/ficha-validation.js");
const fichaPdf = require("./lib/ficha-pdf");
const email = require("./lib/email");

const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
  "17MlFV1VB32PUXm-J7wSocBRDxmepcsmbwRwJa2cGDnI";
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  "/root/.openclaw/credentials/google-sheets-service-account.json";
const GOOGLE_SHEETS_CREDENTIALS_JSON =
  process.env.GOOGLE_SHEETS_CREDENTIALS ||
  process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON ||
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
  "";
const ADMIN_SESSION_COOKIE = "eaa_admin_session";
const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 1_000_000;
const MAX_ADMIN_ROWS_PER_WRITE = 5000;
const MAX_DELETE_IDS_PER_WRITE = 1000;
const MAX_FIELD_LENGTH = 1000;
const MAX_RATE_LIMIT_KEYS = 10_000;
// SEGURIDAD: antes había una contraseña hardcodeada como fallback
// directamente en el código fuente. Como este repo es PÚBLICO en GitHub,
// ese valor quedaba visible para cualquiera,
// y si la variable de entorno no estaba bien configurada en el host,
// el admin quedaba accesible con una clave conocida públicamente.
// Ahora: si la variable de entorno no está configurada, esa cuenta
// queda deshabilitada (password null = nunca hace match) en vez de
// caer a un valor por defecto inseguro.
// 1 admin general + 5 agentes con cuenta propia (24/07) - antes "agencia"
// era una sola cuenta compartida entre todos los agentes: no se podía saber
// quién hizo qué cambio (actor_username quedaba "agencia" para los 5) ni
// dar de baja a uno solo sin cambiarle la contraseña a los demás. Mismo
// patrón de siempre (agregar una cuenta = agregar una variable de entorno,
// sin fallback inseguro), nada de Supabase Auth ni sesiones nuevas - el
// login/sesión es exactamente el mismo de antes, solo con más cuentas.
const ADMIN_USERS = {
  admin: {
    password: process.env.EAA_ADMIN_PASSWORD || null,
    role: "admin",
    label: "Admin"
  },
  agente1: {
    password: process.env.EAA_AGENTE1_PASSWORD || null,
    role: "agencia",
    label: "Agente 1"
  },
  agente2: {
    password: process.env.EAA_AGENTE2_PASSWORD || null,
    role: "agencia",
    label: "Agente 2"
  },
  agente3: {
    password: process.env.EAA_AGENTE3_PASSWORD || null,
    role: "agencia",
    label: "Agente 3"
  },
  agente4: {
    password: process.env.EAA_AGENTE4_PASSWORD || null,
    role: "agencia",
    label: "Agente 4"
  },
  agente5: {
    password: process.env.EAA_AGENTE5_PASSWORD || null,
    role: "agencia",
    label: "Agente 5"
  }
};
const adminSessions = new Map();

// SEGURIDAD: antes /api/admin/login no tenía ningún límite de intentos -
// alguien podía probar contraseñas sin parar con un script. Bloqueo simple
// en memoria: 5 intentos fallidos por IP, 15 minutos de espera después.
// No es un rate-limiter distribuido (se resetea si el proceso reinicia),
// pero corta un ataque de fuerza bruta automatizado básico.
const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map();

// Mismo patrón que el login: limita cuántas fichas de adhesión puede
// mandar una misma IP sin loguearse, para que no se pueda saturar el
// sistema (ni Sheets, ni la bandeja del admin) con envíos automatizados,
// aunque cada uno individualmente pase la validación de una sola fila.
// Auditoría 23/07: subido de 10 a 50/hora - el sistema tiene que soportar
// ~30 inscripciones llegando junto (ej. un colegio entero cargando la
// ficha desde la misma red/IP compartida), y 10/hora las bloqueaba.
const FICHA_SUBMIT_LIMIT = 50;
const FICHA_SUBMIT_WINDOW_MS = 60 * 60 * 1000;
const fichaSubmitAttempts = new Map();

// Auditoría 23/07: subido de 240 a 480/15min por el mismo motivo - 30
// personas cargando Inscripción a la vez desde una IP compartida hacen
// varias lecturas (GRUPOS/CONTRATOS/TURISMO) cada una antes de llegar a
// mandar la ficha.
const GENERAL_API_LIMIT = 480;
const GENERAL_API_WINDOW_MS = 15 * 60 * 1000;
const apiAttempts = new Map();

function genericRateLimited(store, key, limit, windowMs) {
  const record = store.get(key);
  if (!record) return false;
  if (Date.now() - record.firstAttemptAt > windowMs) {
    store.delete(key);
    return false;
  }
  return record.count >= limit;
}

function registerGenericAttempt(store, key, windowMs) {
  if (!store.has(key) && store.size >= MAX_RATE_LIMIT_KEYS) {
    const oldestKey = store.keys().next().value;
    if (oldestKey !== undefined) store.delete(oldestKey);
  }
  const record = store.get(key);
  if (!record || Date.now() - record.firstAttemptAt > windowMs) {
    store.set(key, { count: 1, firstAttemptAt: Date.now() });
    return;
  }
  record.count += 1;
}

function apiRateLimited(req, url) {
  const key = `${clientIp(req)}:${url.pathname}`;
  if (genericRateLimited(apiAttempts, key, GENERAL_API_LIMIT, GENERAL_API_WINDOW_MS)) return true;
  registerGenericAttempt(apiAttempts, key, GENERAL_API_WINDOW_MS);
  return false;
}

function fichaSubmitRateLimited(ip) {
  const record = fichaSubmitAttempts.get(ip);
  if (!record) return false;
  if (Date.now() - record.firstAttemptAt > FICHA_SUBMIT_WINDOW_MS) {
    fichaSubmitAttempts.delete(ip);
    return false;
  }
  return record.count >= FICHA_SUBMIT_LIMIT;
}

function registerFichaSubmit(ip) {
  if (!fichaSubmitAttempts.has(ip) && fichaSubmitAttempts.size >= MAX_RATE_LIMIT_KEYS) {
    const oldestKey = fichaSubmitAttempts.keys().next().value;
    if (oldestKey !== undefined) fichaSubmitAttempts.delete(oldestKey);
  }
  const record = fichaSubmitAttempts.get(ip);
  if (!record || Date.now() - record.firstAttemptAt > FICHA_SUBMIT_WINDOW_MS) {
    fichaSubmitAttempts.set(ip, { count: 1, firstAttemptAt: Date.now() });
    return;
  }
  record.count += 1;
}

function loginRateLimited(ip) {
  const record = loginAttempts.get(ip);
  if (!record) return false;
  if (Date.now() - record.firstAttemptAt > LOGIN_ATTEMPT_WINDOW_MS) {
    loginAttempts.delete(ip);
    return false;
  }
  return record.count >= LOGIN_ATTEMPT_LIMIT;
}

function registerFailedLogin(ip) {
  if (!loginAttempts.has(ip) && loginAttempts.size >= MAX_RATE_LIMIT_KEYS) {
    const oldestKey = loginAttempts.keys().next().value;
    if (oldestKey !== undefined) loginAttempts.delete(oldestKey);
  }
  const record = loginAttempts.get(ip);
  if (!record || Date.now() - record.firstAttemptAt > LOGIN_ATTEMPT_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttemptAt: Date.now() });
    return;
  }
  record.count += 1;
}

function clearLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

function clientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  // Render agrega la IP real al final de X-Forwarded-For. Tomar el primer
  // valor permitía que el cliente eligiera su IP aparente y eludiera todos
  // los límites. El último salto es el que agregó el proxy más cercano.
  return forwarded.at(-1) || req.socket.remoteAddress || "unknown";
}

const SCHEMA = {
  GRUPOS: ["id", "nivel", "viaje", "colegio", "colegio_id", "curso", "division", "pasajeros_esperados", "estado", "created_at", "updated_at"],
  CONTRATOS: ["id", "codigo_contrato", "colegio_id", "colegio_nombre", "grupo_id", "nivel", "viaje", "curso", "division", "estado", "fecha_creacion", "observaciones", "created_at", "updated_at"],
  PASAJEROS: ["id", "grupo_id", "contrato_id", "codigo_contrato", "nombre", "dni", "nacimiento", "telefono", "responsable_nombre", "responsable_dni", "responsable_telefono", "vinculo", "responsable_cuil_cuit", "estado", "documentacion_estado", "ficha_medica_estado", "pago_estado", "observaciones", "created_at", "updated_at", "apellido", "responsable_apellido", "responsable_email", "plan_pago_id", "plan_nombre", "plan_cuotas"],
  FICHAS_ADHESION: [
    "id", "tipo", "pasajero_dni", "pasajero_nombre", "pasajero_apellido", "pasajero_tipo_documento", "pasajero_nacimiento", "pasajero_sexo",
    "responsable_nombre", "responsable_apellido", "responsable_tipo_documento", "responsable_numero_documento", "responsable_nacimiento",
    "responsable_parentesco", "responsable_email", "responsable_telefono", "responsable_celular", "responsable_cuil_cuit",
    "domicilio_calle", "domicilio_numero", "domicilio_piso", "domicilio_departamento", "domicilio_barrio", "domicilio_localidad",
    "domicilio_provincia", "domicilio_codigo_postal", "acepta_condiciones", "firma_data_url",
    "nivel", "viaje", "colegio_id", "colegio", "colegio_texto", "colegio_vinculado", "grado", "division", "curso_division",
    "plan_pago_id", "plan_nombre", "plan_cuotas", "grupo_asignado_id", "contrato_id", "codigo_contrato",
    "estado_revision", "documentacion_estado", "ficha_medica_estado", "autorizacion_estado", "motivo_rechazo", "observaciones",
    "email_estado", "email_error", "email_enviado_at", "created_at", "updated_at"
  ],
  FICHAS_TUTOR: ["id", "tipo", "pasajero_nombre", "pasajero_apellido", "pasajero_dni", "nombre", "apellido", "tipo_documento", "numero_documento", "cuil_cuit", "celular", "email", "parentesco", "estado_revision", "observaciones", "created_at", "updated_at"],
  PLANES_PAGO: ["id", "contrato_id", "nombre", "cuotas", "descripcion", "activo", "orden"],
  COLEGIOS: ["id", "nombre", "provincia", "localidad", "codigo_oficial", "activo"],
  PAGOS: ["id", "pasajero_id", "pasajero_dni", "contrato_codigo", "fecha", "monto", "medio", "estado", "cuota_id", "comprobante_url", "observaciones", "created_at"],
  CUOTAS: ["id", "pasajero_id", "pasajero_dni", "contrato_codigo", "numero", "nombre", "monto", "vencimiento", "estado", "created_at", "updated_at"],
  CONFIG: ["clave", "valor", "descripcion", "updated_at"],
  TURISMO: ["id", "slug", "destino", "titulo", "duracion", "temporada", "fecha_salida", "fecha_regreso", "salida_garantizada", "precio_desde", "precio_valor", "moneda", "precio_base_doble", "suplemento_single", "precio_menor", "condicion_venta", "categorias", "descripcion_corta", "descripcion_larga", "incluye", "no_incluye", "formas_pago", "itinerario", "fotos", "estado", "destacado", "orden", "created_at", "updated_at"]
};

const WRITE_ALLOWED = new Set(["GRUPOS", "CONTRATOS", "PASAJEROS", "FICHAS_ADHESION", "TURISMO", "FICHAS_TUTOR", "PLANES_PAGO", "COLEGIOS"]);

// Migración a Supabase (24/07): Grupos, Contratos, Pasajeros y Turismo
// (admin) pasan de Google Sheets a Postgres, mismo principio que ya se usó
// para FICHAS_ADHESION - se preserva el contrato HTTP exacto
// (GET/POST /api/google-sheets?sheet=X, fila plana) así que assets/js/app.js
// no necesita ningún cambio de lógica. La activación se hace recién después
// de respaldar y migrar/verificar los datos reales existentes. Pagos/Cuotas
// quedan fuera (nunca se persistieron de verdad, WRITE_ALLOWED nunca las
// incluyó) y el export manual de Turismo a JSON sigue igual, sin tocar.
// El cambio de fuente se activa explícitamente. Esto permite desplegar y
// probar el código sin cortar producción antes de cargar DATABASE_URL y
// migrar/verificar los datos que todavía viven en Sheets.
const POSTGRES_MIGRATION_REQUESTED = process.env.EAA_POSTGRES_MIGRATION_ENABLED === "true";
const POSTGRES_MIGRATION_ENABLED = POSTGRES_MIGRATION_REQUESTED && Boolean(process.env.DATABASE_URL);
if (POSTGRES_MIGRATION_REQUESTED && !process.env.DATABASE_URL) {
  console.error(
    "EAA_POSTGRES_MIGRATION_ENABLED=true pero DATABASE_URL no está configurada. " +
    "Se mantiene Google Sheets para evitar cortar producción."
  );
}
const POSTGRES_SHEETS = new Set(
  POSTGRES_MIGRATION_ENABLED
    ? ["GRUPOS", "CONTRATOS", "PASAJEROS", "TURISMO", "CONFIG", "FICHAS_TUTOR", "PLANES_PAGO", "COLEGIOS"]
    : []
);
const POSTGRES_LIST_FN = {
  GRUPOS: db.listGruposAdmin,
  CONTRATOS: db.listContratosAdmin,
  PASAJEROS: db.listPasajerosAdmin,
  TURISMO: db.listTurismoAdmin,
  CONFIG: db.listConfigAdmin,
  FICHAS_TUTOR: db.listFichasTutorAdmin,
  PLANES_PAGO: db.listPlanesPagoAdmin,
  COLEGIOS: db.listColegiosAdmin
};
const POSTGRES_SAVE_FN = {
  GRUPOS: db.saveGruposAdmin,
  CONTRATOS: db.saveContratosAdmin,
  PASAJEROS: db.savePasajerosAdmin,
  TURISMO: db.saveTurismoAdmin,
  FICHAS_TUTOR: db.saveFichasTutorAdmin,
  PLANES_PAGO: db.savePlanesPagoAdmin,
  COLEGIOS: db.saveColegiosAdmin
};
let cachedToken = null;

function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const index = part.indexOf("=");
      if (index === -1) return [part, ""];
      return [decodeURIComponent(part.slice(0, index)), decodeURIComponent(part.slice(index + 1))];
    }));
}

function sessionCookie(token, maxAgeSeconds, isSecureRequest = false) {
  const secureFlag = isSecureRequest ? " Secure;" : "";
  return `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly;${secureFlag} SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}; Priority=High`;
}

function safePasswordEqual(expected, received) {
  const expectedHash = crypto.createHash("sha256").update(String(expected || "")).digest();
  const receivedHash = crypto.createHash("sha256").update(String(received || "")).digest();
  return crypto.timingSafeEqual(expectedHash, receivedHash);
}

function safeErrorForLog(error) {
  return {
    name: String(error?.name || "Error").slice(0, 80),
    code: String(error?.code || "INTERNAL_ERROR").slice(0, 80)
  };
}

// Railway (y la mayoría de los hosts con proxy) terminan HTTPS en el borde y
// reenvían por HTTP puro al contenedor, seteando x-forwarded-proto=https.
// En localhost (npm start) no hay proxy, así que esto da false correctamente
// y la cookie funciona igual en desarrollo sin el flag Secure (que el
// navegador ignoraría/bloquearía sobre HTTP de todos modos).
function isHttpsRequest(req) {
  if (!req || !req.headers) return false;
  // En producción Render siempre termina TLS antes de llegar al proceso.
  // No depender de una cabecera que un cliente puede intentar falsificar.
  if (process.env.NODE_ENV === "production") return true;
  return Boolean(req.socket?.encrypted);
}

function currentAdminSession(req) {
  const token = parseCookies(req)[ADMIN_SESSION_COOKIE];
  if (!token) return null;
  const session = adminSessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    adminSessions.delete(token);
    return null;
  }
  return { token, ...session };
}

function adminSessionPayload(session) {
  if (!session) return { authenticated: false };
  return {
    authenticated: true,
    user: session.user,
    role: session.role,
    label: session.label,
    expiresAt: session.expiresAt
  };
}

function securityHeaders(req) {
  req = req && req.headers ? req : { headers: {}, socket: {} };
  const headers = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Permitted-Cross-Domain-Policies": "none",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Origin-Agent-Cluster": "?1",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://apis.datos.gob.ar",
      "upgrade-insecure-requests"
    ].join("; ")
  };
  if (isHttpsRequest(req)) {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  }
  return headers;
}

function json(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...securityHeaders(res.req || {})
  });
  res.end(JSON.stringify(payload));
}

function jsonWithHeaders(req, res, status, payload, headers) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...securityHeaders(req),
    ...headers
  });
  res.end(JSON.stringify(payload));
}

function readBody(req, limitBytes = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    let body = "";
    let exceeded = false;
    req.on("data", (chunk) => {
      if (exceeded) return;
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > limitBytes) {
        exceeded = true;
        body = "";
        const error = new Error("Payload demasiado grande");
        error.statusCode = 413;
        reject(error);
      }
    });
    req.on("end", () => {
      if (!exceeded) resolve(body);
    });
    req.on("error", reject);
  });
}

async function readJsonBody(req, limitBytes = MAX_BODY_BYTES) {
  const raw = await readBody(req, limitBytes);
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    const invalidJson = new Error("JSON inválido");
    invalidJson.statusCode = 400;
    throw invalidJson;
  }
}

function isStateChangingMethod(method) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(String(method || "").toUpperCase());
}

// Auditoría 25/07 - hallazgo real: "sin Origin -> permitir" dejaba pasar
// cualquier POST de estado (login, logout, guardar datos) que no mandara el
// header Origin - un navegador real SIEMPRE lo manda en fetch/XHR para
// métodos de estado (GET no cuenta, y acá solo se llama para esos), sea
// mismo origen o no. Solo clientes sin navegador (curl, scripts, un CSRF
// vía <form> clásico en vez de fetch) podían omitirlo, justo el caso que
// esta función existe para bloquear. Ahora "sin Origin" se trata como
// origen no permitido, no como caso especial permitido.
function sameOriginRequest(req) {
  if (!req || !req.headers) return false;
  const origin = req.headers.origin;
  if (!origin) return false;
  const host = String(req.headers.host || "").trim().toLowerCase();
  const protocol = isHttpsRequest(req) ? "https" : "http";
  try {
    return new URL(origin).origin === `${protocol}://${host}`;
  } catch (error) {
    return false;
  }
}

function requireSameOrigin(req, res) {
  if (!isStateChangingMethod(req.method) || sameOriginRequest(req)) return false;
  json(res, 403, { ok: false, error: "Origen no permitido" });
  return true;
}

function credentials() {
  if (GOOGLE_SHEETS_CREDENTIALS_JSON) {
    return JSON.parse(GOOGLE_SHEETS_CREDENTIALS_JSON);
  }
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      "Credenciales de Google Sheets no configuradas. En Railway cargar GOOGLE_SHEETS_CREDENTIALS o GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON con el JSON completo de la service account."
    );
  }
  return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
}

async function accessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const cred = credentials();
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: cred.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  };
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode(claim)}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(cred.private_key, "base64url");
  const assertion = `${unsigned}.${signature}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error_description || payload.error || "No se pudo autenticar Google Sheets");
  cachedToken = { value: payload.access_token, expiresAt: Date.now() + (payload.expires_in || 3600) * 1000 };
  return cachedToken.value;
}

async function sheetsRequest(method, apiPath, body) {
  const token = await accessToken();
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}${apiPath}`, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Error de Google Sheets");
  return payload;
}

async function appendSheetRows(sheet, rows) {
  const columns = SCHEMA[sheet];
  const values = rows.map((row) => columns.map((column) => row[column] || ""));
  const range = encodeURIComponent(`'${sheet}'!A:AZ`);
  await sheetsRequest("POST", `/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, { values });
}

async function readSheet(sheet) {
  const range = encodeURIComponent(`'${sheet}'!A:AZ`);
  const payload = await sheetsRequest("GET", `/values/${range}`, null);
  const values = payload.values || [];
  const headers = values.shift() || SCHEMA[sheet] || [];
  return values
    .filter((row) => row.some((value) => String(value || "").trim()))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

// FIX concurrencia: antes esta función hacía CLEAR + PUT del array completo que mandaba
// el navegador, asumiendo que ese array era "todo lo que debe existir" en la hoja. Si dos
// personas (ej. dos administrativos cargando pasajeros) guardaban en paralelo, la última
// escritura pisaba por completo lo que la otra acababa de guardar, sin fusionar nada.
//
// Ahora: se lee el contenido REAL y actual de la hoja justo antes de escribir, se fusiona
// por "id" (cada fila que llega actualiza/agrega su propio id, preservando cualquier otra
// fila que ya exista en la hoja y que este navegador no conozca), y solo se eliminan filas
// cuyo id venga explícito en deleteIds. Esto no es un lock atómico real (Sheets no lo da),
// pero cubre el escenario real: ediciones de distintas personas separadas por segundos o
// minutos, no la misma fila en el mismo instante exacto.
async function writeSheet(sheet, rows, deleteIds = []) {
  const columns = SCHEMA[sheet];
  const deleteIdSet = new Set((deleteIds || []).map((id) => String(id || "")));

  let mergedRows = Array.isArray(rows) ? rows : [];
  if (columns.includes("id")) {
    const currentRows = await readSheet(sheet).catch(() => []);
    const byId = new Map();
    currentRows.forEach((row) => {
      const id = String(row.id || "");
      if (id) byId.set(id, row);
    });
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      const id = String(row.id || "");
      if (id) byId.set(id, row);
    });
    deleteIdSet.forEach((id) => byId.delete(id));
    mergedRows = [...byId.values()];
  }

  const values = [
    columns,
    ...mergedRows.map((row) => columns.map((column) => row[column] || ""))
  ];
  const range = encodeURIComponent(`'${sheet}'!A:AZ`);
  await sheetsRequest("POST", `/values/${range}:clear`, {});
  await sheetsRequest("PUT", `/values/${range}?valueInputOption=RAW`, { values });
}

// TURISMO/CONFIG son públicas por diseño (catálogo web). GRUPOS y CONTRATOS
// ya no se entregan completos: la inscripción usa un endpoint de búsqueda
// acotado que devuelve como máximo cinco coincidencias activas.
// PASAJEROS, FICHAS_ADHESION, PAGOS y CUOTAS SÍ tienen datos
// personales reales (DNI, teléfono, nombre de responsables, muchos
// de menores de edad) - antes cualquiera podía leerlas sin
// autenticarse, con solo saber la URL. Ahora exigen sesión de admin.
const PUBLIC_READ_SHEETS = new Set(["TURISMO", "CONFIG"]);

// SEGURIDAD: antes CUALQUIERA (sin login) podía escribir en /api/google-sheets
// para CUALQUIER hoja permitida (GRUPOS, CONTRATOS, PASAJEROS, TURISMO,
// FICHAS_ADHESION) - solo se chequeaba que la hoja existiera, nunca quién
// hacía el pedido. Eso significaba que alguien podía, sin loguearse:
//   - inyectar/corromper pasajeros, grupos, contratos o paquetes de turismo
//   - pisar la ficha de OTRA familia mandando el mismo "id" que ya existe
// Ahora ninguna hoja admite escritura sin sesión. La ficha pública (que era
// la única excepción) entra por POST /api/public/fichas, con validación
// completa y una sola ficha por pedido (ficha v2, 15/09/2026).
const PUBLIC_WRITE_SHEETS = new Set();

// FIX: el límite plano de 1000 caracteres por campo truncaba (corrompía)
// el itinerario y las fotos de Turismo en cuanto un viaje tenía un
// itinerario real de varios días o varias fotos - ambos se guardan como
// JSON serializado en un solo campo, y un itinerario de 7 días modesto
// ya ocupa ~1560 caracteres. Estos campos necesitan un límite bien más
// generoso; el resto de los campos (nombre, teléfono, etc.) se queda
// con el límite chico original.
const LONG_FIELD_LIMITS = {
  categorias: 3000,
  incluye: 8000,
  no_incluye: 5000,
  formas_pago: 5000,
  itinerario: 20000,
  fotos: 10000,
  descripcion_larga: 5000,
  observaciones: 3000,
  firma_data_url: 250000
};

function fieldLimitFor(column) {
  return LONG_FIELD_LIMITS[column] || MAX_FIELD_LENGTH;
}

function sanitizeRow(row, columns) {
  const clean = {};
  columns.forEach((column) => {
    clean[column] = String(row && typeof row === "object" ? row[column] || "" : "").slice(0, fieldLimitFor(column));
  });
  return clean;
}

function sanitizeRows(rows, columns) {
  return rows
    .filter((row) => row && typeof row === "object" && !Array.isArray(row))
    .map((row) => sanitizeRow(row, columns));
}

function sanitizeDeleteIds(deleteIds) {
  return deleteIds
    .map((id) => String(id || "").trim().slice(0, 200))
    .filter(Boolean);
}

async function handleSheets(req, res, url) {
  if (req.method === "GET") {
    const sheet = String(url.searchParams.get("sheet") || "");
    if (!SCHEMA[sheet]) return json(res, 400, { ok: false, error: "Hoja no permitida" });
    const adminSession = currentAdminSession(req);
    if (!PUBLIC_READ_SHEETS.has(sheet) && !adminSession) {
      return json(res, 401, { ok: false, error: "Necesitás iniciar sesión para ver esta información" });
    }
    // Auditoría 23/07: las fichas que entran por el formulario público
    // quedan en Supabase (más abajo, POST sin sesión), pero el admin acá
    // solo leía Sheets - una ficha nueva nunca aparecía en su bandeja. Se
    // combinan las dos fuentes (no se reemplaza Sheets, por si hay fichas
    // reales viejas cargadas ahí). Si CUALQUIERA de las dos falla, se deja
    // que el error se propague (mismo criterio que ya usa el admin en
    // app.js para no confundir "fetch falló" con "no hay datos") en vez de
    // devolver una lista silenciosamente incompleta.
    // Corrección (24/07): con POSTGRES_MIGRATION_ENABLED activo se decidió
    // no usar Google Sheets para nada, sin credenciales configuradas a
    // propósito - el merge de abajo (pensado para no perder fichas viejas
    // reales que quedaran en Sheets) llamaba a readSheet() igual, y sin
    // credenciales eso tira "Credenciales de Google Sheets no
    // configuradas" y devuelve 500 en vez de la lista de Postgres, que es
    // la única fuente real en este despliegue. Encontrado en el smoke test
    // de Hostinger antes de tocar ningún dato real.
    if (sheet === "FICHAS_ADHESION" && adminSession) {
      if (POSTGRES_MIGRATION_ENABLED) {
        return json(res, 200, { ok: true, sheet, rows: await db.listFichasAdmin() });
      }
      const [sheetsRows, postgresRows] = await Promise.all([readSheet(sheet), db.listFichasAdmin()]);
      return json(res, 200, { ok: true, sheet, rows: [...postgresRows, ...sheetsRows] });
    }
    if (POSTGRES_SHEETS.has(sheet)) {
      return json(res, 200, { ok: true, sheet, rows: await POSTGRES_LIST_FN[sheet]() });
    }
    return json(res, 200, { ok: true, sheet, rows: await readSheet(sheet) });
  }
  if (req.method === "POST") {
    if (requireSameOrigin(req, res)) return;
    const payload = await readJsonBody(req);
    const sheet = String(payload.sheet || "");
    if (!SCHEMA[sheet]) return json(res, 400, { ok: false, error: "Hoja no permitida" });
    if (!WRITE_ALLOWED.has(sheet)) return json(res, 403, { ok: false, error: "Escritura no habilitada para esta hoja" });

    const adminSession = currentAdminSession(req);
    const isAdmin = Boolean(adminSession);
    if (!PUBLIC_WRITE_SHEETS.has(sheet) && !isAdmin) {
      return json(res, 401, { ok: false, error: "Necesitás iniciar sesión para modificar esta información" });
    }

    let rows = Array.isArray(payload.rows) ? payload.rows : [];
    let deleteIds = Array.isArray(payload.deleteIds) ? payload.deleteIds : [];
    if (rows.length > MAX_ADMIN_ROWS_PER_WRITE) {
      return json(res, 413, { ok: false, error: "Demasiadas filas para una sola escritura" });
    }
    if (deleteIds.length > MAX_DELETE_IDS_PER_WRITE) {
      return json(res, 413, { ok: false, error: "Demasiadas eliminaciones para una sola escritura" });
    }

    rows = sanitizeRows(rows, SCHEMA[sheet]);
    deleteIds = sanitizeDeleteIds(deleteIds);

    // Auditoría 23/07: la edición/aprobación de fichas desde el admin
    // manda TODAS las fichas conocidas por el navegador en un solo POST
    // (mezcla de las que ya vivían en Sheets con las que ahora vienen de
    // Supabase, ver GET de arriba). Se separan por forma de id: las UUID
    // son de Supabase, el resto sigue el camino de Sheets de siempre sin
    // ningún cambio de comportamiento para esas.
    if (sheet === "FICHAS_ADHESION" && isAdmin) {
      const postgresRows = rows.filter((row) => db.isFichaPostgresId(row.id));
      const sheetsRows = rows.filter((row) => !db.isFichaPostgresId(row.id));
      const sheetsDeleteIds = deleteIds.filter((id) => !db.isFichaPostgresId(id));
      // updateFichasAdmin ya no lanza excepción por una ficha con problema
      // (ver lib/db.js) - devuelve {updated, failed} para que una falla
      // puntual (ej. intentar aprobar sin consentimiento) no bloquee la
      // escritura a Sheets del resto del lote.
      const result = postgresRows.length
        ? await db.updateFichasAdmin(postgresRows, adminSession?.user)
        : { updated: 0, failed: [] };
      // Mismo motivo que en el GET de arriba: con la migración activa no
      // hay Sheets al que escribir (ni credenciales para intentarlo). Las
      // filas con id "viejo" (sheetsRows) en este despliegue son restos de
      // caché local sin nada real detrás - se ignoran en vez de intentar
      // escribirlas a una hoja que no se va a usar nunca.
      if (!POSTGRES_MIGRATION_ENABLED) {
        await writeSheet(sheet, sheetsRows, sheetsDeleteIds);
      }
      if (result.failed.length) {
        return json(res, 200, {
          ok: false,
          sheet,
          error: `${result.updated} ficha(s) guardadas. ${result.failed.length} con error: ${result.failed.map((f) => f.error).join(" | ")}`
        });
      }
      return json(res, 200, { ok: true, sheet });
    }

    if (POSTGRES_SHEETS.has(sheet)) {
      const result = await POSTGRES_SAVE_FN[sheet](rows, deleteIds, adminSession?.user);
      if (result.failed.length) {
        return json(res, 200, {
          ok: false,
          sheet,
          error: `${result.updated} fila(s) guardada(s). ${result.failed.length} con error: ${result.failed.map((f) => f.error).join(" | ")}`
        });
      }
      return json(res, 200, { ok: true, sheet });
    }

    await writeSheet(sheet, rows, deleteIds);
    return json(res, 200, { ok: true, sheet });
  }
  json(res, 405, { ok: false, error: "Método no permitido" });
}

async function handleAdminAuth(req, res, url) {
  if (url.pathname === "/api/admin/me" && req.method === "GET") {
    return json(res, 200, { ok: true, ...adminSessionPayload(currentAdminSession(req)) });
  }
  if (url.pathname === "/api/admin/login" && req.method === "POST") {
    if (requireSameOrigin(req, res)) return;
    const ip = clientIp(req);
    if (loginRateLimited(ip)) {
      return json(res, 429, { ok: false, error: "Demasiados intentos fallidos. Esperá unos minutos antes de volver a intentar." });
    }
    const payload = await readJsonBody(req, 20_000);
    const username = String(payload.username || "").trim().toLowerCase().slice(0, 100);
    const password = String(payload.password || "").slice(0, 1000);
    const user = ADMIN_USERS[username];
    const configuredPassword = user?.password || "disabled-account-placeholder";
    if (!user?.password || !safePasswordEqual(configuredPassword, password)) {
      registerFailedLogin(ip);
      return json(res, 401, { ok: false, error: "Usuario o contraseña incorrectos" });
    }
    clearLoginAttempts(ip);
    // Una cuenta mantiene una sola sesión activa. Un nuevo ingreso invalida
    // tokens anteriores (útil al rotar claves o cerrar una sesión olvidada).
    for (const [existingToken, existingSession] of adminSessions) {
      if (existingSession.user === username) adminSessions.delete(existingToken);
    }
    const token = crypto.randomBytes(32).toString("base64url");
    const session = {
      user: username,
      role: user.role,
      label: user.label,
      createdAt: Date.now(),
      expiresAt: Date.now() + ADMIN_SESSION_TTL_MS
    };
    adminSessions.set(token, session);
    return jsonWithHeaders(req, res, 200, { ok: true, ...adminSessionPayload(session) }, {
      "Set-Cookie": sessionCookie(token, Math.floor(ADMIN_SESSION_TTL_MS / 1000), isHttpsRequest(req))
    });
  }
  if (url.pathname === "/api/admin/logout" && req.method === "POST") {
    if (requireSameOrigin(req, res)) return;
    const session = currentAdminSession(req);
    if (session) adminSessions.delete(session.token);
    return jsonWithHeaders(req, res, 200, { ok: true, authenticated: false }, {
      "Set-Cookie": sessionCookie("", 0, isHttpsRequest(req))
    });
  }
  if (["/api/admin/me", "/api/admin/login", "/api/admin/logout"].includes(url.pathname)) {
    return json(res, 405, { ok: false, error: "Método no permitido" });
  }
  json(res, 404, { ok: false, error: "Endpoint no encontrado" });
}

function staticFile(req, res, url) {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, { "Allow": "GET, HEAD", ...securityHeaders(req) });
    return res.end("Method not allowed");
  }
  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/") || url.pathname === "/admin-turismo" || url.pathname.startsWith("/admin-turismo/")) {
    const session = currentAdminSession(req);
    if (!session) {
      res.writeHead(302, {
        "Location": "/#/admin",
        "Cache-Control": "no-store"
      });
      return res.end();
    }
  }
  const cleanPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const publicPath = cleanPath.replace(/^\/+/, "");
  const normalizedPublicPath = path.posix.normalize(publicPath);
  const isPublicAsset = normalizedPublicPath.startsWith("assets/") && !normalizedPublicPath.includes("../");
  const isPublicEntry = publicPath === "index.html" || publicPath === "admin/index.html" || publicPath === "admin-turismo/index.html";
  if (!isPublicAsset && !isPublicEntry) {
    res.writeHead(404, securityHeaders(req));
    return res.end("Not found");
  }
  const filePath = path.normalize(path.join(ROOT, cleanPath));
  if (isPublicAsset && !filePath.startsWith(path.join(ROOT, "assets") + path.sep)) {
    res.writeHead(404, securityHeaders(req));
    return res.end("Not found");
  }
  // Auditoría 23/07: "filePath.startsWith(ROOT)" por sí solo deja pasar un
  // caso borde (si existiera un directorio hermano cuyo nombre empieza
  // igual que ROOT, ej. ROOT + "-algo", también "empieza con ROOT" sin
  // estar realmente adentro). Exigir el separador de carpeta después cierra
  // ese caso sin cambiar el comportamiento para pedidos legítimos.
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  const target = fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()
    ? path.join(filePath, "index.html")
    : filePath;
  if (!fs.existsSync(target)) {
    res.writeHead(404);
    return res.end("Not found");
  }
  const ext = path.extname(target);
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp"
  };
  const cacheControl = [".html", ".css", ".js", ".json"].includes(ext)
    ? "no-cache, no-store, must-revalidate"
    : "public, max-age=86400";
  res.writeHead(200, {
    "Content-Type": types[ext] || "application/octet-stream",
    "Cache-Control": cacheControl,
    ...securityHeaders(req)
  });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(target).pipe(res);
}

// Auditoría 23/07: loginAttempts/fichaSubmitAttempts/apiAttempts solo se
// limpian de forma perezosa (cuando esa misma IP vuelve a pedir algo
// después de vencida su ventana). Una IP que visita una sola vez y nunca
// vuelve queda para siempre en el Map. En un sitio público con tráfico
// real, sostenido durante semanas, esto es una fuga de memoria lenta
// pero real. adminSessions tiene el mismo problema si alguien cierra el
// navegador sin desloguearse. Barrido simple cada 15 minutos: no cambia
// ningún comportamiento visible, solo libera lo que ya venció.
function sweepExpiredEntries() {
  const now = Date.now();
  for (const [key, record] of loginAttempts) {
    if (now - record.firstAttemptAt > LOGIN_ATTEMPT_WINDOW_MS) loginAttempts.delete(key);
  }
  for (const [key, record] of fichaSubmitAttempts) {
    if (now - record.firstAttemptAt > FICHA_SUBMIT_WINDOW_MS) fichaSubmitAttempts.delete(key);
  }
  for (const [key, record] of apiAttempts) {
    if (now - record.firstAttemptAt > GENERAL_API_WINDOW_MS) apiAttempts.delete(key);
  }
  for (const [token, session] of adminSessions) {
    if (session.expiresAt <= now) adminSessions.delete(token);
  }
}
setInterval(sweepExpiredEntries, 15 * 60 * 1000).unref();

// ============ FICHA DE ADHESIÓN v2: rutas públicas y de admin ============
//
// El envío público usa rutas propias (antes iba por /api/google-sheets y el
// navegador mandaba TODAS las fichas acumuladas en localStorage, mostrando
// éxito sin esperar la respuesta). Se valida con el mismo módulo que usa el
// formulario (assets/js/modules/ficha-validation.js) y se responde 201 solo
// cuando la ficha quedó guardada.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_FICHA_BODY_BYTES = 400_000;

// Genera el PDF y envía el correo de una ficha ya guardada. Nunca lanza: el
// resultado queda en fichas_adhesion.email_estado para verlo en el admin.
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

async function recuperarCorreosPendientes() {
  if (!email.correoConfigurado()) return;
  try {
    const pendientes = await db.listFichaEmailsPendientes(25);
    for (const ficha of pendientes) {
      await procesarCorreoFicha(ficha.id, `ficha-${ficha.id}`);
    }
    if (pendientes.length) {
      console.log(`Correos pendientes procesados al iniciar: ${pendientes.length}`);
    }
  } catch (error) {
    // El sitio debe seguir disponible aunque la recuperación de correo falle.
    console.error("No se pudieron recuperar los correos pendientes:", safeErrorForLog(error));
  }
}

async function handlePublicFicha(req, res) {
  if (requireSameOrigin(req, res)) return;
  const ip = clientIp(req);
  if (fichaSubmitRateLimited(ip)) {
    return json(res, 429, { ok: false, error: "Se alcanzó el límite de envíos. Probá de nuevo más tarde o consultanos por WhatsApp." });
  }
  const body = await readJsonBody(req, MAX_FICHA_BODY_BYTES);
  // Primera pasada sin planes: descarta fichas incompletas antes de tocar la
  // base. El plan se valida en la segunda pasada, con los planes reales del
  // contrato.
  const previa = fichaValidation.validarFichaPax(body);
  if (Object.keys(previa.errores).length) {
    return json(res, 400, { ok: false, error: "Revisá los datos marcados.", errores: previa.errores });
  }
  try {
    body.firma = db.normalizeSignatureDataUrl(body.firma);
  } catch (error) {
    return json(res, 400, {
      ok: false,
      error: "Revisá los datos marcados.",
      errores: { firma: error.friendlyMessage || "Firma inválida." }
    });
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
    if (error.statusCode === 400) {
      return json(res, 400, { ok: false, error: error.message, errores: error.errores || {} });
    }
    console.error("Error al guardar ficha de adhesión:", safeErrorForLog(error));
    return json(res, 500, {
      ok: false,
      error: "No se pudo guardar la ficha. Tus datos siguen cargados: intentá de nuevo en unos minutos o consultanos por WhatsApp."
    });
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

// /api/admin/fichas/:id/pdf y /api/admin/fichas/:id/reenviar-correo.
// Devuelve false si la ruta no es de este handler.
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
    if (!fila) {
      json(res, 404, { ok: false, error: "Ficha no encontrada." });
      return true;
    }
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

function createAppServer() {
  return http.createServer(async (req, res) => {
    res.req = req;
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    try {
      if (url.pathname.startsWith("/api/") && apiRateLimited(req, url)) {
        return json(res, 429, { ok: false, error: "Demasiadas solicitudes. Probá de nuevo más tarde." });
      }
      if (url.pathname.startsWith("/api/admin/fichas/")) {
        if (await handleAdminFicha(req, res, url)) return;
      }
      if (url.pathname.startsWith("/api/admin/")) return await handleAdminAuth(req, res, url);
      if (url.pathname === "/api/public/colegios" && req.method === "GET") {
        return json(res, 200, { ok: true, colegios: await db.listColegiosPublicos() });
      }
      if (url.pathname === "/api/public/inscripcion-context" && req.method === "GET") {
        const params = url.searchParams;
        const contexto = await db.contextoInscripcion({
          colegioId: params.get("colegioId"),
          nivel: params.get("nivel"),
          viaje: params.get("viaje"),
          grado: params.get("grado"),
          division: params.get("division")
        });
        return json(res, 200, { ok: true, contrato: contexto.contrato, planes: contexto.planes });
      }
      if (url.pathname === "/api/public/fichas" && req.method === "POST") return await handlePublicFicha(req, res);
      if (url.pathname === "/api/public/fichas-tutor" && req.method === "POST") return await handlePublicFichaTutor(req, res);
      if (url.pathname === "/api/google-sheets") return await handleSheets(req, res, url);
      return staticFile(req, res, url);
    } catch (error) {
      const status = Number(error.statusCode || 500);
      const message = status >= 500 ? "Error interno" : (error.message || "Solicitud inválida");
      if (status >= 500) console.error("Error interno de solicitud:", safeErrorForLog(error));
      return json(res, status, { ok: false, error: message });
    }
  });
}

// Algunos hosts cargan el Entry file mediante un wrapper en vez de ejecutar
// `node server.js` directamente. En producción se debe escuchar siempre;
// solo se evita el auto-listen cuando la suite importa el módulo con
// NODE_ENV=test para levantar un puerto efímero controlado.
if (process.env.NODE_ENV !== "test" || require.main === module) {
  createAppServer().listen(PORT, "0.0.0.0", () => {
    console.log(`El Ángel Azul server listening on ${PORT}`);
    setImmediate(recuperarCorreosPendientes);
  });
}

module.exports = {
  createAppServer,
  __test: {
    isHttpsRequest,
    sameOriginRequest,
    sessionCookie,
    safePasswordEqual,
    safeErrorForLog,
    recuperarCorreosPendientes
  }
};
