const test = require("node:test");
const assert = require("node:assert/strict");
const { postgresTlsOptions } = require("../lib/postgres-tls");

test("Postgres exige certificado válido aun sin configuración adicional", () => {
  assert.deepEqual(postgresTlsOptions("https://database.invalid/", {}).ssl, { rejectUnauthorized: true });
});

test("la CA opcional se normaliza sin cambiar la verificación", () => {
  assert.deepEqual(postgresTlsOptions("https://database.invalid/", {
    EAA_POSTGRES_TLS_VERIFY_FULL: "true", SUPABASE_DB_CA_CERT: "  CA\\nLOCAL  "
  }).ssl, { rejectUnauthorized: true, ca: "CA\nLOCAL" });
});

test("las opciones de la URL no sustituyen la política TLS explícita", () => {
  const options = postgresTlsOptions("https://database.invalid/?sslmode=no-verify&ssl=false&sslcert=example&sslrootcert=example&sslkey=example&sslpassword=example&uselibpqcompat=true&application_name=local", {});
  assert.deepEqual([...new URL(options.connectionString).searchParams], [["application_name", "local"]]);
  assert.deepEqual(options.ssl, { rejectUnauthorized: true });
});

test("desactivar TLS falla sin incluir configuración sensible en el error", () => {
  assert.throws(() => postgresTlsOptions("https://database.invalid/", { EAA_POSTGRES_TLS_VERIFY_FULL: "false" }), {
    message: "La conexión a Postgres requiere verificación TLS. Revisá la configuración del hosting."
  });
});
