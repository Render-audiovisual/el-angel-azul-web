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

test("una ficha pública con firma falsa se rechaza antes de tocar la base", async () => {
  const origin = `http://127.0.0.1:${port}`;
  const response = await request({
    method: "POST",
    path: "/api/google-sheets",
    headers: { origin },
    body: {
      sheet: "FICHAS_ADHESION",
      rows: [{
        pasajero_dni: "99000999",
        pasajero_nombre: "PRUEBA SEGURIDAD",
        responsable_nombre: "RESPONSABLE SEGURIDAD",
        responsable_telefono: "3794000000",
        colegio: "Colegio QA",
        curso_division: "5 A",
        acepta_condiciones: "TRUE",
        firma_data_url: `data:image/png;base64,${Buffer.from("<svg></svg>").toString("base64")}`
      }]
    }
  });
  assert.equal(response.status, 400);
  assert.match(response.json?.error || "", /PNG válida/);
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
  assert.match(login.headers["set-cookie"][0], /SameSite=Lax/);

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

test("la búsqueda pública devuelve solo coincidencias activas y campos mínimos", () => {
  const grupos = [
    { id: "g1", nivel: "Secundaria", viaje: "Bariloche 2026", colegio: "Colegio San José", curso: "5to", division: "B", pasajeros_esperados: 30, created_at: "privado" },
    { id: "g2", nivel: "Secundaria", viaje: "Bariloche 2026", colegio: "Otro Colegio", curso: "5to", division: "B" }
  ];
  const contratos = [
    { id: "c1", codigo_contrato: "CON-1", colegio_nombre: "Colegio San José", grupo_id: "g1", nivel: "Secundaria", viaje: "Bariloche 2026", curso: "5to", division: "B", estado: "Activo", observaciones: "privado" },
    { id: "c2", codigo_contrato: "CON-2", colegio_nombre: "Otro Colegio", grupo_id: "g2", nivel: "Secundaria", viaje: "Bariloche 2026", curso: "5to", division: "B", estado: "Inactivo" }
  ];
  const params = new URLSearchParams({ nivel: "Secundaria", viaje: "Bariloche 2026", colegio: "San Jose", cursoDivision: "5to B" });
  const result = __test.publicInscripcionContext(grupos, contratos, params);
  assert.equal(result.grupos.length, 1);
  assert.equal(result.contratos.length, 1);
  assert.equal(result.grupos[0].pasajeros_esperados, undefined);
  assert.equal(result.contratos[0].observaciones, undefined);
});

test("HTML, CSS y JavaScript se revalidan para evitar versiones viejas", async () => {
  for (const path of ["/", "/assets/css/styles.css", "/assets/js/app.js"]) {
    const response = await request({ path });
    assert.equal(response.status, 200);
    assert.equal(response.headers["cache-control"], "no-cache, no-store, must-revalidate");
    assert.match(response.headers["content-security-policy"] || "", /default-src 'self'/);
  }
});
