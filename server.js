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
const GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON || "";
const ADMIN_SESSION_COOKIE = "eaa_admin_session";
const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const ADMIN_USERS = {
  admin: {
    password: process.env.EAA_ADMIN_PASSWORD || "aguselmejor1",
    role: "admin",
    label: "Admin"
  },
  agencia: {
    password: process.env.EAA_AGENCIA_PASSWORD || "aguselmejor1",
    role: "agencia",
    label: "Agencia"
  }
};
const adminSessions = new Map();

const SCHEMA = {
  GRUPOS: ["id", "nivel", "viaje", "colegio", "curso", "division", "pasajeros_esperados", "estado", "created_at", "updated_at"],
  CONTRATOS: ["id", "codigo_contrato", "colegio_id", "colegio_nombre", "grupo_id", "nivel", "viaje", "curso", "division", "estado", "fecha_creacion", "observaciones", "created_at", "updated_at"],
  PASAJEROS: ["id", "grupo_id", "contrato_id", "codigo_contrato", "nombre", "dni", "nacimiento", "telefono", "responsable_nombre", "responsable_dni", "responsable_telefono", "vinculo", "responsable_cuil_cuit", "estado", "documentacion_estado", "ficha_medica_estado", "pago_estado", "observaciones", "created_at", "updated_at"],
  FICHAS_ADHESION: ["id", "pasajero_dni", "pasajero_nombre", "responsable_nombre", "responsable_telefono", "nivel", "viaje", "colegio", "curso_division", "grupo_solicitado", "grupo_asignado_id", "contrato_id", "codigo_contrato", "estado_revision", "documentacion_estado", "ficha_medica_estado", "autorizacion_estado", "observaciones", "created_at", "updated_at"],
  PAGOS: ["id", "pasajero_id", "pasajero_dni", "contrato_codigo", "fecha", "monto", "medio", "estado", "cuota_id", "comprobante_url", "observaciones", "created_at"],
  CUOTAS: ["id", "pasajero_id", "pasajero_dni", "contrato_codigo", "numero", "nombre", "monto", "vencimiento", "estado", "created_at", "updated_at"],
  CONFIG: ["clave", "valor", "descripcion", "updated_at"]
};

const WRITE_ALLOWED = new Set(["GRUPOS", "CONTRATOS", "PASAJEROS", "FICHAS_ADHESION"]);
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

function sessionCookie(token, maxAgeSeconds) {
  return `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
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

function json(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function jsonWithHeaders(res, status, payload, headers) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error("Payload demasiado grande"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function credentials() {
  if (GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON);
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

async function readSheet(sheet) {
  const range = encodeURIComponent(`'${sheet}'!A:AZ`);
  const payload = await sheetsRequest("GET", `/values/${range}`, null);
  const values = payload.values || [];
  const headers = values.shift() || SCHEMA[sheet] || [];
  return values
    .filter((row) => row.some((value) => String(value || "").trim()))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

async function writeSheet(sheet, rows) {
  const columns = SCHEMA[sheet];
  const values = [
    columns,
    ...rows.map((row) => columns.map((column) => row[column] || ""))
  ];
  const range = encodeURIComponent(`'${sheet}'!A:AZ`);
  await sheetsRequest("POST", `/values/${range}:clear`, {});
  await sheetsRequest("PUT", `/values/${range}?valueInputOption=RAW`, { values });
}

async function handleSheets(req, res, url) {
  if (req.method === "GET") {
    const sheet = String(url.searchParams.get("sheet") || "");
    if (!SCHEMA[sheet]) return json(res, 400, { ok: false, error: "Hoja no permitida" });
    return json(res, 200, { ok: true, sheet, rows: await readSheet(sheet) });
  }
  if (req.method === "POST") {
    const payload = JSON.parse(await readBody(req) || "{}");
    const sheet = String(payload.sheet || "");
    if (!SCHEMA[sheet]) return json(res, 400, { ok: false, error: "Hoja no permitida" });
    if (!WRITE_ALLOWED.has(sheet)) return json(res, 403, { ok: false, error: "Escritura no habilitada para esta hoja" });
    await writeSheet(sheet, Array.isArray(payload.rows) ? payload.rows : []);
    return json(res, 200, { ok: true, sheet });
  }
  json(res, 405, { ok: false, error: "Método no permitido" });
}

async function handleAdminAuth(req, res, url) {
  if (url.pathname === "/api/admin/me" && req.method === "GET") {
    return json(res, 200, { ok: true, ...adminSessionPayload(currentAdminSession(req)) });
  }
  if (url.pathname === "/api/admin/login" && req.method === "POST") {
    const payload = JSON.parse(await readBody(req) || "{}");
    const username = String(payload.username || "").trim().toLowerCase();
    const password = String(payload.password || "");
    const user = ADMIN_USERS[username];
    if (!user || user.password !== password) {
      return json(res, 401, { ok: false, error: "Usuario o contraseña incorrectos" });
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
    return jsonWithHeaders(res, 200, { ok: true, ...adminSessionPayload(session) }, {
      "Set-Cookie": sessionCookie(token, Math.floor(ADMIN_SESSION_TTL_MS / 1000))
    });
  }
  if (url.pathname === "/api/admin/logout" && req.method === "POST") {
    const session = currentAdminSession(req);
    if (session) adminSessions.delete(session.token);
    return jsonWithHeaders(res, 200, { ok: true, authenticated: false }, {
      "Set-Cookie": sessionCookie("", 0)
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
  res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
  fs.createReadStream(target).pipe(res);
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  try {
    if (url.pathname.startsWith("/api/admin/")) return await handleAdminAuth(req, res, url);
    if (url.pathname === "/api/google-sheets") return await handleSheets(req, res, url);
    return staticFile(req, res, url);
  } catch (error) {
    return json(res, 500, { ok: false, error: error.message || "Error interno" });
  }
}).listen(PORT, "0.0.0.0", () => {
  console.log(`El Ángel Azul server listening on ${PORT}`);
});
