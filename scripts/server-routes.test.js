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

test("bug: POST fichas con cuerpo JSON null responde 400, no 500", async () => {
  const origin = `http://127.0.0.1:${port}`;
  for (const path of ["/api/public/fichas", "/api/public/fichas-tutor"]) {
    const response = await request({ method: "POST", path, headers: { origin }, rawBody: "null" });
    assert.equal(response.status, 400, path);
    assert.equal(response.json.ok, false);
  }
});

// Reenvío de la misma ficha (doble toque, reintento desde otro equipo): la base
// avisa con 409 y el formulario muestra el mensaje en vez de guardar un duplicado.
const PNG_1X1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const cuilConDigitoVerificador = (base) => {
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const resto = 11 - ([...base].reduce((suma, digito, i) => suma + Number(digito) * pesos[i], 0) % 11);
  return `${base}${resto === 11 ? 0 : resto === 10 ? 9 : resto}`;
};

test("fichas duplicadas: el 409 de la base llega al formulario con su mensaje", async () => {
  const db = require("../lib/db");
  const original = { pax: db.insertFichaPublica, tutor: db.insertFichaTutor };
  const duplicado = Object.assign(new Error("Ya recibimos esta ficha."), { statusCode: 409 });
  db.insertFichaPublica = async () => { throw duplicado; };
  db.insertFichaTutor = async () => { throw duplicado; };
  try {
    const origin = `http://127.0.0.1:${port}`;
    const cuil = cuilConDigitoVerificador("2720123456");
    const pax = await request({
      method: "POST",
      path: "/api/public/fichas",
      headers: { origin },
      body: {
        nivel: "Secundaria", destino: "Bariloche", anio: "2027", colegioTexto: "Escuela Normal 2", grado: "5°", division: "B",
        pasajeroNombre: "Lucía", pasajeroApellido: "Ibáñez", pasajeroTipoDocumento: "DNI", pasajeroNumeroDocumento: "48000111", pasajeroNacimiento: "2010-05-20", pasajeroSexo: "Femenino",
        responsableNombre: "Marta", responsableApellido: "Ibáñez", responsableTipoDocumento: "DNI", responsableNumeroDocumento: "20123456", responsableNacimiento: "1980-07-02",
        responsableParentesco: "Madre", responsableCuilCuit: cuil, responsableEmail: "marta@gmail.com", responsableCelular: "3794123456",
        domicilioCalle: "San Martín", domicilioNumero: "123", domicilioLocalidad: "Corrientes", domicilioProvincia: "Corrientes", domicilioCodigoPostal: "3400",
        aceptaCondiciones: true, firma: PNG_1X1
      }
    });
    assert.equal(pax.status, 409);
    assert.equal(pax.json.ok, false);
    assert.equal(pax.json.error, "Ya recibimos esta ficha.");
    const tutor = await request({
      method: "POST",
      path: "/api/public/fichas-tutor",
      headers: { origin },
      body: {
        pasajeroNombre: "Lucía", pasajeroApellido: "Ibáñez", pasajeroNumeroDocumento: "48000111",
        nombre: "Raúl", apellido: "Ibáñez", tipoDocumento: "DNI", numeroDocumento: "20123456", cuilCuit: cuil,
        parentesco: "Padre", celular: "3794555666", email: "raul@gmail.com", aceptaCondiciones: true
      }
    });
    assert.equal(tutor.status, 409);
    assert.equal(tutor.json.error, "Ya recibimos esta ficha.");
  } finally {
    db.insertFichaPublica = original.pax;
    db.insertFichaTutor = original.tutor;
  }
});
