// Guardas del repo: reglas de AGENTS.md convertidas en tests.
// Si uno falla, el mensaje dice qué regla se rompió. Los marcados `todo`
// son deuda conocida del Paso 3 (docs/HANDOFF-CODEX.md): se ven en cada
// `npm run check` sin ponerlo en rojo. El PR que resuelve cada punto le
// saca el `todo` para que quede como test real.
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.join(__dirname, "..");
const leer = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

function archivosTrackeados() {
  try {
    return execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8" }).split("\0").filter(Boolean);
  } catch {
    return null; // sin git (por ejemplo, un build de hosting): se saltean las guardas que lo necesitan
  }
}

const tracked = archivosTrackeados();
const sinGit = tracked ? false : "sin git";

// --- Secretos ---------------------------------------------------------------

const PATRONES_SECRETO = [
  { nombre: "URL de Postgres de Supabase con contraseña", re: /postgres(?:ql)?:\/\/[^\s:@/]+:[^\s@/]+@[^\s/]*supabase\.(?:co|com)/i },
  { nombre: "clave de Resend", re: /\bre_[A-Za-z0-9]{6,}_[A-Za-z0-9]{10,}/ },
  { nombre: "clave secreta de Supabase", re: /\bsb_secret_[A-Za-z0-9_-]{16,}/ },
  { nombre: "JWT (service_role de Supabase u otro)", re: /\beyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/ },
  { nombre: "variable secreta con valor en formato .env", re: /^\s*(?:export\s+)?[A-Z0-9_]*(?:PASSWORD|SECRET|API_KEY|SERVICE_ROLE_KEY|DATABASE_URL)\s*=\s*['"]?(?![^\s'"]*\.\.\.)[^\s'"<$]{8,}/m }
];
const BINARIOS = /\.(png|jpe?g|gif|webp|avif|ico|svg|pdf|xlsx?|docx?|woff2?|ttf|otf|mp4|webm|mov|zip|gz)$/i;

test("no hay secretos en archivos del repo (AGENTS.md: los secretos no pasan por el repo)", { skip: sinGit }, () => {
  const hallazgos = [];
  for (const rel of tracked) {
    // .agents/ son skills de terceros con ejemplos de configuración insegura a propósito.
    if (BINARIOS.test(rel) || rel === "package-lock.json" || rel.startsWith(".agents/")) continue;
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs) || fs.statSync(abs).size > 2_000_000) continue;
    const texto = fs.readFileSync(abs, "utf8");
    for (const { nombre, re } of PATRONES_SECRETO) {
      if (re.test(texto)) hallazgos.push(`${rel}: ${nombre}`);
    }
  }
  assert.deepEqual(hallazgos, [], "Sacá el secreto del archivo y rotalo: ya pasó por git.");
});

test("ningún .env está en el repo (salvo .env.example)", { skip: sinGit }, () => {
  const envs = tracked.filter((rel) => /(^|\/)\.env(\.|$)/.test(rel) && !rel.endsWith(".env.example"));
  assert.deepEqual(envs, []);
});

test("los tests no ven secretos de la terminal (scripts/helpers/sin-secretos.js)", () => {
  const pkg = JSON.parse(leer("package.json"));
  assert.match(pkg.scripts.test, /--import \.\/scripts\/helpers\/sin-secretos\.js/, "npm test tiene que cargar el limpiador de secretos");
  for (const key of ["RESEND_API_KEY", "SUPABASE_SERVICE_ROLE_KEY", "EAA_EMAIL_FROM"]) {
    assert.equal(process.env[key], undefined, `${key} llegó a los tests`);
  }
});

// --- Docs vigentes sin referencias rotas -------------------------------------

const DOCS_VIGENTES = ["AGENTS.md", "CLAUDE.md", "docs/HANDOFF-CODEX.md", "docs/ARQUITECTURA.md"];

test("los archivos que nombran los docs vigentes existen", { skip: sinGit }, () => {
  const rotos = [];
  for (const doc of DOCS_VIGENTES) {
    for (const [, ref] of leer(doc).matchAll(/`([\w./-]+\.(?:md|js|json|html|ya?ml|css|sql|sh))`/g)) {
      const existe = ref.includes("/")
        ? tracked.includes(ref) || tracked.some((rel) => rel.startsWith(`${ref}/`))
        : tracked.some((rel) => rel === ref || rel.endsWith(`/${ref}`));
      if (!existe) rotos.push(`${doc} → ${ref}`);
    }
  }
  assert.deepEqual(rotos, [], "Corregí la referencia o el nombre del archivo.");
});

test("los `npm run` que nombran los docs vigentes existen en package.json", () => {
  const scripts = Object.keys(JSON.parse(leer("package.json")).scripts);
  const faltan = [];
  for (const doc of DOCS_VIGENTES) {
    for (const [, nombre] of leer(doc).matchAll(/npm run ([\w:-]+)/g)) {
      if (!scripts.includes(nombre)) faltan.push(`${doc} → npm run ${nombre}`);
    }
  }
  assert.deepEqual(faltan, []);
});

test("CLAUDE.md importa AGENTS.md (Claude Code y Codex leen las mismas reglas)", () => {
  assert.match(leer("CLAUDE.md"), /^@AGENTS\.md\s*$/m);
});

// --- Deuda del Paso 3 (todo) ---------------------------------------------------

function cuerpoDeFuncion(texto, nombre) {
  const inicio = texto.indexOf(`function ${nombre}(`);
  assert.notEqual(inicio, -1, `no encontré ${nombre}`);
  const siguiente = texto.slice(inicio + 1).search(/\n(?:async )?function /);
  return siguiente === -1 ? texto.slice(inicio) : texto.slice(inicio, inicio + 1 + siguiente);
}

test("la base verifica el certificado de Supabase por defecto", { todo: "Paso 3: rejectUnauthorized:false en lib/db.js" }, () => {
  assert.doesNotMatch(leer("lib/db.js"), /rejectUnauthorized:\s*false/);
});

test("los scripts y estilos de CDN tienen integrity y versión exacta", () => {
  const problemas = [];
  for (const rel of ["index.html", "admin/index.html", "admin-turismo/index.html"]) {
    if (!fs.existsSync(path.join(ROOT, rel))) continue;
    for (const [tag] of leer(rel).matchAll(/<(?:script|link)\b[^>]*https:\/\/cdn\.[^>]*>/g)) {
      if (!/\bintegrity=/.test(tag)) problemas.push(`${rel}: sin integrity → ${tag}`);
      if (/@\d+(?:\.\d+)?\//.test(tag)) problemas.push(`${rel}: versión no exacta → ${tag}`);
    }
  }
  assert.deepEqual(problemas, []);
});

test("CONFIG no se puede leer sin sesión", () => {
  const [, lista] = leer("server.js").match(/PUBLIC_READ_SHEETS = new Set\(\[([^\]]*)\]\)/);
  assert.doesNotMatch(lista, /"CONFIG"/);
});

test("la ficha pública no crea viajes desde texto libre", () => {
  assert.doesNotMatch(cuerpoDeFuncion(leer("lib/db.js"), "insertFichaPublica"), /findOrCreateViaje\(/);
});

test("los archivos estáticos manejan errores de lectura", () => {
  assert.doesNotMatch(leer("server.js"), /fs\.createReadStream\([^)]*\)\.pipe\(/);
});

test("la agencia no puede eliminar registros (prueba HTTP en scripts/server-routes.test.js)", () => {
  assert.match(leer("scripts/server-routes.test.js"), /el rol agencia puede editar pero no eliminar registros/);
  assert.match(leer("server.js"), /deleteIds\.length && adminSession\?\.role !== "admin"/);
});
