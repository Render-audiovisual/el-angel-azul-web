const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");

process.env.NODE_ENV = "test";
process.env.EAA_ADMIN_PASSWORD = "test-admin-password";
process.env.EAA_AGENTE1_PASSWORD = "test-agent-password";

const { createAppServer, __test } = require("../server");

let server;
let port;

test.before(async () => {
  server = createAppServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      port = server.address().port;
      resolve();
    });
  });
});

test.after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

function request({ method = "GET", path = "/", headers = {}, body, rawBody }) {
  return new Promise((resolve, reject) => {
    const payload = rawBody === undefined
      ? (body === undefined ? null : JSON.stringify(body))
      : rawBody;
    const req = http.request({
      hostname: "127.0.0.1",
      port,
      method,
      path,
      headers: {
        ...(payload ? {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(payload)
        } : {}),
        ...headers
      }
    }, (res) => {
      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { raw += chunk; });
      res.on("end", () => {
        let json = null;
        try {
          json = raw ? JSON.parse(raw) : null;
        } catch {
          // Algunas rutas estáticas no devuelven JSON.
        }
        resolve({ status: res.statusCode, headers: res.headers, json, raw });
      });
    });
    req.once("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test("login sin Origin se rechaza antes de autenticar", async () => {
  const response = await request({
    method: "POST",
    path: "/api/admin/login",
    body: { username: "admin", password: "test-admin-password" }
  });
  assert.equal(response.status, 403);
  assert.equal(response.json?.error, "Origen no permitido");
});

test("POST /api/public/fichas sin Origin se rechaza", async () => {
  const response = await request({ method: "POST", path: "/api/public/fichas", body: {} });
  assert.equal(response.status, 403);
});

test("POST /api/public/fichas incompleta devuelve errores por campo sin tocar la base", async () => {
  const origin = `http://127.0.0.1:${port}`;
  const response = await request({
    method: "POST",
    path: "/api/public/fichas",
    headers: { origin },
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
    method: "POST",
    path: "/api/public/fichas-tutor",
    headers: { origin },
    body: { nombre: "Carlos" }
  });
  assert.equal(response.status, 400);
  assert.ok(response.json.errores.cuilCuit);
});

test("la escritura pública vieja de FICHAS_ADHESION ya no existe", async () => {
  const origin = `http://127.0.0.1:${port}`;
  const response = await request({
    method: "POST",
    path: "/api/google-sheets",
    headers: { origin },
    body: { sheet: "FICHAS_ADHESION", rows: [{ pasajero_nombre: "X" }] }
  });
  assert.equal(response.status, 401);
});

test("el PDF y el reenvío de correo de una ficha exigen sesión", async () => {
  const id = "3f1c2a8e-5b6d-4c7e-8f9a-0b1c2d3e4f5a";
  assert.equal((await request({ path: `/api/admin/fichas/${id}/pdf` })).status, 401);
  const origin = `http://127.0.0.1:${port}`;
  assert.equal((await request({ method: "POST", path: `/api/admin/fichas/${id}/reenviar-correo`, headers: { origin } })).status, 401);
});

test("la CSP permite consultar Georef", async () => {
  const response = await request({ path: "/" });
  assert.match(response.headers["content-security-policy"], /connect-src 'self' https:\/\/apis\.datos\.gob\.ar/);
});

test("los métodos equivocados devuelven 405 en endpoints conocidos", async () => {
  for (const path of ["/api/admin/me", "/api/admin/login", "/api/admin/logout"]) {
    const response = await request({ method: path.endsWith("/me") ? "POST" : "GET", path });
    assert.equal(response.status, 405);
    assert.equal(response.json?.error, "Método no permitido");
  }
});

test("un body mayor al límite devuelve 413 sin resetear la conexión", async () => {
  const origin = `http://127.0.0.1:${port}`;
  const response = await request({
    method: "POST",
    path: "/api/google-sheets",
    headers: { origin, "content-type": "application/json" },
    rawBody: "a".repeat(1_000_001)
  });
  assert.equal(response.status, 413);
  assert.equal(response.json?.error, "Payload demasiado grande");
});

test("login, sesión, ruta privada y logout funcionan con mismo origen", async () => {
  const origin = `http://127.0.0.1:${port}`;
  const login = await request({
    method: "POST",
    path: "/api/admin/login",
    headers: { origin },
    body: { username: "admin", password: "test-admin-password" }
  });
  assert.equal(login.status, 200);
  assert.equal(login.json?.authenticated, true);
  assert.equal(login.json?.role, "admin");

  const cookie = String(login.headers["set-cookie"]?.[0] || "").split(";")[0];
  assert.ok(cookie.startsWith("eaa_admin_session="));
  assert.match(login.headers["set-cookie"][0], /HttpOnly/);
  assert.match(login.headers["set-cookie"][0], /SameSite=Strict/);
  assert.match(login.headers["set-cookie"][0], /Priority=High/);

  const me = await request({
    path: "/api/admin/me",
    headers: { cookie }
  });
  assert.equal(me.status, 200);
  assert.equal(me.json?.authenticated, true);
  assert.equal(me.json?.user, "admin");

  const privateWithoutSession = await request({
    path: "/api/google-sheets?sheet=PASAJEROS"
  });
  assert.equal(privateWithoutSession.status, 401);

  const privateWriteWithoutSession = await request({
    method: "POST",
    path: "/api/google-sheets",
    headers: { origin },
    body: { sheet: "PASAJEROS", rows: [] }
  });
  assert.equal(privateWriteWithoutSession.status, 401);

  const logout = await request({
    method: "POST",
    path: "/api/admin/logout",
    headers: { origin, cookie }
  });
  assert.equal(logout.status, 200);
  assert.equal(logout.json?.authenticated, false);
  assert.match(logout.headers["set-cookie"][0], /Max-Age=0/);

  const meAfterLogout = await request({
    path: "/api/admin/me",
    headers: { cookie }
  });
  assert.equal(meAfterLogout.status, 200);
  assert.equal(meAfterLogout.json?.authenticated, false);
});

test("el proxy HTTPS produce una cookie Secure", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const login = await request({
    method: "POST",
    path: "/api/admin/login",
    headers: {
      host: "app.example.test",
      "x-forwarded-host": "app.example.test",
      "x-forwarded-proto": "https",
      origin: "https://app.example.test"
    },
    body: { username: "agente1", password: "test-agent-password" }
  });
  assert.equal(login.status, 200);
  assert.equal(login.json?.role, "agencia");
  assert.match(login.headers["set-cookie"][0], /;\s*Secure;/);
  process.env.NODE_ENV = previousNodeEnv;
});

test("un nuevo login invalida la sesión anterior de la misma cuenta", async () => {
  const origin = `http://127.0.0.1:${port}`;
  const first = await request({
    method: "POST",
    path: "/api/admin/login",
    headers: { origin },
    body: { username: "admin", password: "test-admin-password" }
  });
  const firstCookie = String(first.headers["set-cookie"]?.[0] || "").split(";")[0];
  const second = await request({
    method: "POST",
    path: "/api/admin/login",
    headers: { origin },
    body: { username: "admin", password: "test-admin-password" }
  });
  assert.equal(second.status, 200);
  const oldSession = await request({ path: "/api/admin/me", headers: { cookie: firstCookie } });
  assert.equal(oldSession.json?.authenticated, false);
});

test("comparación de claves y logs no exponen valores sensibles", () => {
  assert.equal(__test.safePasswordEqual("clave-correcta", "clave-correcta"), true);
  assert.equal(__test.safePasswordEqual("clave-correcta", "otra"), false);
  const summary = __test.safeErrorForLog({
    name: "DatabaseError",
    code: "23505",
    message: "DNI 12345678 y contraseña secreta",
    detail: "teléfono privado"
  });
  assert.deepEqual(summary, { name: "DatabaseError", code: "23505" });
});

test("cabeceras forwarded falsificadas no permiten suplantar el origen", async () => {
  const response = await request({
    method: "POST",
    path: "/api/admin/login",
    headers: {
      host: `127.0.0.1:${port}`,
      "x-forwarded-host": "evil.example",
      "x-forwarded-proto": "https",
      origin: "https://evil.example"
    },
    body: { username: "admin", password: "test-admin-password" }
  });
  assert.equal(response.status, 403);
  assert.equal(response.json?.error, "Origen no permitido");
});

test("archivos internos no se publican desde la raíz del proyecto", async () => {
  for (const path of ["/server.js", "/lib/db.js", "/package.json", "/.git/HEAD", "/supabase/migrations/0001_init.sql", "/assets/%2e%2e/server.js"]) {
    const response = await request({ path });
    assert.equal(response.status, 404, path);
  }
  assert.equal((await request({ path: "/assets/js/app.js" })).status, 200);
});

test("rutas estáticas rechazan métodos que no sean GET o HEAD", async () => {
  const response = await request({ method: "DELETE", path: "/" });
  assert.equal(response.status, 405);
  assert.equal(response.headers.allow, "GET, HEAD");
});

test("Grupos y Contratos completos exigen sesión", async () => {
  for (const sheet of ["GRUPOS", "CONTRATOS"]) {
    const response = await request({ path: `/api/google-sheets?sheet=${sheet}` });
    assert.equal(response.status, 401);
  }
});

test("HTML, CSS y JavaScript se revalidan para evitar versiones viejas", async () => {
  for (const path of ["/", "/assets/css/styles.css", "/assets/js/app.js"]) {
    const response = await request({ path });
    assert.equal(response.status, 200);
    assert.equal(response.headers["cache-control"], "no-cache, no-store, must-revalidate");
    assert.match(response.headers["content-security-policy"] || "", /default-src 'self'/);
    assert.match(response.headers["content-security-policy"] || "", /frame-ancestors 'none'/);
    assert.equal(response.headers["x-frame-options"], "DENY");
    assert.equal(response.headers["referrer-policy"], "no-referrer");
    assert.equal(response.headers["cross-origin-opener-policy"], "same-origin");
    assert.equal(response.headers["cross-origin-resource-policy"], "same-origin");
  }
});
