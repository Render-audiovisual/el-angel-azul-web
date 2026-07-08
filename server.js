const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

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
// SEGURIDAD: antes había una contraseña hardcodeada como fallback
// directamente en el código fuente. Como este repo es PÚBLICO en GitHub,
// ese valor quedaba visible para cualquiera,
// y si la variable de entorno no estaba bien configurada en el host,
// el admin quedaba accesible con una clave conocida públicamente.
// Ahora: si la variable de entorno no está configurada, esa cuenta
// queda deshabilitada (password null = nunca hace match) en vez de
// caer a un valor por defecto inseguro.
const ADMIN_USERS = {
  admin: {
    password: process.env.EAA_ADMIN_PASSWORD || null,
    role: "admin",
    label: "Admin"
  },
  agencia: {
    password: process.env.EAA_AGENCIA_PASSWORD || null,
    role: "agencia",
    label: "Agencia"
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
const FICHA_SUBMIT_LIMIT = 10;
const FICHA_SUBMIT_WINDOW_MS = 60 * 60 * 1000;
const fichaSubmitAttempts = new Map();

const GENERAL_API_LIMIT = 240;
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
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket.remoteAddress || "unknown";
}

const SCHEMA = {
  GRUPOS: ["id", "nivel", "viaje", "colegio", "curso", "division", "pasajeros_esperados", "estado", "created_at", "updated_at"],
  CONTRATOS: ["id", "codigo_contrato", "colegio_id", "colegio_nombre", "grupo_id", "nivel", "viaje", "curso", "division", "estado", "fecha_creacion", "observaciones", "created_at", "updated_at"],
  PASAJEROS: ["id", "grupo_id", "contrato_id", "codigo_contrato", "nombre", "dni", "nacimiento", "telefono", "responsable_nombre", "responsable_dni", "responsable_telefono", "vinculo", "responsable_cuil_cuit", "estado", "documentacion_estado", "ficha_medica_estado", "pago_estado", "observaciones", "created_at", "updated_at"],
  FICHAS_ADHESION: ["id", "pasajero_dni", "pasajero_nombre", "responsable_nombre", "responsable_telefono", "nivel", "viaje", "colegio", "curso_division", "grupo_solicitado", "grupo_asignado_id", "contrato_id", "codigo_contrato", "estado_revision", "documentacion_estado", "ficha_medica_estado", "autorizacion_estado", "observaciones", "created_at", "updated_at"],
  PAGOS: ["id", "pasajero_id", "pasajero_dni", "contrato_codigo", "fecha", "monto", "medio", "estado", "cuota_id", "comprobante_url", "observaciones", "created_at"],
  CUOTAS: ["id", "pasajero_id", "pasajero_dni", "contrato_codigo", "numero", "nombre", "monto", "vencimiento", "estado", "created_at", "updated_at"],
  CONFIG: ["clave", "valor", "descripcion", "updated_at"],
  TURISMO: ["id", "slug", "destino", "titulo", "duracion", "temporada", "fecha_salida", "fecha_regreso", "salida_garantizada", "precio_desde", "precio_valor", "moneda", "precio_base_doble", "suplemento_single", "precio_menor", "condicion_venta", "categorias", "descripcion_corta", "descripcion_larga", "incluye", "no_incluye", "formas_pago", "itinerario", "fotos", "estado", "destacado", "orden", "created_at", "updated_at"]
};

const WRITE_ALLOWED = new Set(["GRUPOS", "CONTRATOS", "PASAJEROS", "FICHAS_ADHESION", "TURISMO"]);
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
  return `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly;${secureFlag} SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

// Railway (y la mayoría de los hosts con proxy) terminan HTTPS en el borde y
// reenvían por HTTP puro al contenedor, seteando x-forwarded-proto=https.
// En localhost (npm start) no hay proxy, así que esto da false correctamente
// y la cookie funciona igual en desarrollo sin el flag Secure (que el
// navegador ignoraría/bloquearía sobre HTTP de todos modos).
function isHttpsRequest(req) {
  if (!req || !req.headers) return false;
  return req.headers["x-forwarded-proto"] === "https";
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
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
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
    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > limitBytes) {
        reject(new Error("Payload demasiado grande"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
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

function sameOriginRequest(req) {
  if (!req || !req.headers) return false;
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const protocol = req.headers["x-forwarded-proto"] || (req.socket.encrypted ? "https" : "http");
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

// SEGURIDAD: TURISMO/CONFIG son públicas por diseño (catálogo web).
// GRUPOS y CONTRATOS también quedan públicas a propósito: no tienen
// datos personales (solo nivel/viaje/colegio/curso/estado), y la
// Inscripción pública NECESITA leerlas sin login para encontrar el
// contrato del colegio+curso que escribe la familia.
// PASAJEROS, FICHAS_ADHESION, PAGOS y CUOTAS SÍ tienen datos
// personales reales (DNI, teléfono, nombre de responsables, muchos
// de menores de edad) - antes cualquiera podía leerlas sin
// autenticarse, con solo saber la URL. Ahora exigen sesión de admin.
const PUBLIC_READ_SHEETS = new Set(["TURISMO", "CONFIG", "GRUPOS", "CONTRATOS"]);

// SEGURIDAD: antes CUALQUIERA (sin login) podía escribir en /api/google-sheets
// para CUALQUIER hoja permitida (GRUPOS, CONTRATOS, PASAJEROS, TURISMO,
// FICHAS_ADHESION) - solo se chequeaba que la hoja existiera, nunca quién
// hacía el pedido. Eso significaba que alguien podía, sin loguearse:
//   - inyectar/corromper pasajeros, grupos, contratos o paquetes de turismo
//   - pisar la ficha de OTRA familia mandando el mismo "id" que ya existe
// Ahora: solo FICHAS_ADHESION admite escritura sin sesión (porque la
// inscripción pública la necesita), y con reglas estrictas para ese caso
// puntual. Todo lo demás exige sesión de admin válida.
const PUBLIC_WRITE_SHEETS = new Set(["FICHAS_ADHESION"]);

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
  observaciones: 3000
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

function validPublicFicha(row) {
  const dni = String(row.pasajero_dni || "").replace(/\D/g, "");
  const hasPassenger = dni.length >= 6 && String(row.pasajero_nombre || "").trim().length >= 3;
  const hasResponsible = String(row.responsable_nombre || "").trim().length >= 3 &&
    String(row.responsable_telefono || "").replace(/\D/g, "").length >= 6;
  const hasTripContext = Boolean(
    String(row.codigo_contrato || row.contrato_id || row.grupo_asignado_id || row.colegio || row.curso_division || "").trim()
  );
  return hasPassenger && hasResponsible && hasTripContext;
}

async function handleSheets(req, res, url) {
  if (req.method === "GET") {
    const sheet = String(url.searchParams.get("sheet") || "");
    if (!SCHEMA[sheet]) return json(res, 400, { ok: false, error: "Hoja no permitida" });
    if (!PUBLIC_READ_SHEETS.has(sheet) && !currentAdminSession(req)) {
      return json(res, 401, { ok: false, error: "Necesitás iniciar sesión para ver esta información" });
    }
    return json(res, 200, { ok: true, sheet, rows: await readSheet(sheet) });
  }
  if (req.method === "POST") {
    if (requireSameOrigin(req, res)) return;
    const payload = await readJsonBody(req);
    const sheet = String(payload.sheet || "");
    if (!SCHEMA[sheet]) return json(res, 400, { ok: false, error: "Hoja no permitida" });
    if (!WRITE_ALLOWED.has(sheet)) return json(res, 403, { ok: false, error: "Escritura no habilitada para esta hoja" });

    const isAdmin = Boolean(currentAdminSession(req));
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

    if (sheet === "FICHAS_ADHESION" && !isAdmin) {
      const ip = clientIp(req);
      if (fichaSubmitRateLimited(ip)) {
        return json(res, 429, { ok: false, error: "Se alcanzó el límite de envíos. Probá de nuevo más tarde o consultanos por WhatsApp." });
      }
      // Envío público (familia sin login): máximo 1 ficha por pedido, el
      // servidor genera su propio id (ignora el que mande el cliente) para
      // que nadie pueda pisar la ficha de otra familia mandando un id que
      // ya exista, y se acotan los campos a un largo razonable.
      rows = rows.slice(0, 1).map((row) => ({
        ...sanitizeRow(row, SCHEMA.FICHAS_ADHESION),
        id: `ficha-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`
      }));
      deleteIds = [];
      if (!rows.length || !validPublicFicha(rows[0])) {
        return json(res, 400, { ok: false, error: "Ficha incompleta o inválida" });
      }
      registerFichaSubmit(ip);
      await appendSheetRows(sheet, rows);
      return json(res, 200, { ok: true, sheet });
    }

    rows = sanitizeRows(rows, SCHEMA[sheet]);
    deleteIds = sanitizeDeleteIds(deleteIds);
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
    const username = String(payload.username || "").trim().toLowerCase();
    const password = String(payload.password || "");
    const user = ADMIN_USERS[username];
    if (!user || !user.password || user.password !== password) {
      registerFailedLogin(ip);
      return json(res, 401, { ok: false, error: "Usuario o contraseña incorrectos" });
    }
    clearLoginAttempts(ip);
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
  json(res, 404, { ok: false, error: "Endpoint no encontrado" });
}

function staticFile(req, res, url) {
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
  const filePath = path.normalize(path.join(ROOT, cleanPath));
  if (!filePath.startsWith(ROOT)) {
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
  res.writeHead(200, {
    "Content-Type": types[ext] || "application/octet-stream",
    ...securityHeaders(req)
  });
  fs.createReadStream(target).pipe(res);
}

http.createServer(async (req, res) => {
  res.req = req;
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  try {
    if (url.pathname.startsWith("/api/") && apiRateLimited(req, url)) {
      return json(res, 429, { ok: false, error: "Demasiadas solicitudes. Probá de nuevo más tarde." });
    }
    if (url.pathname.startsWith("/api/admin/")) return await handleAdminAuth(req, res, url);
    if (url.pathname === "/api/google-sheets") return await handleSheets(req, res, url);
    return staticFile(req, res, url);
  } catch (error) {
    const status = Number(error.statusCode || 500);
    const message = status >= 500 ? "Error interno" : (error.message || "Solicitud inválida");
    if (status >= 500) console.error(error);
    return json(res, status, { ok: false, error: message });
  }
}).listen(PORT, "0.0.0.0", () => {
  console.log(`El Ángel Azul server listening on ${PORT}`);
});
