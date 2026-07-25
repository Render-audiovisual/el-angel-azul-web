const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");

process.env.NODE_ENV = "test";
process.env.EAA_ADMIN_PASSWORD = "test-admin-password";
process.env.EAA_AGENTE1_PASSWORD = "test-agent-password";

const { createAppServer } = require("../server");

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

function request({ method = "GET", path = "/", headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
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
});
