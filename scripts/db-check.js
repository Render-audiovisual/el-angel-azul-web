// Chequeo rápido de conexión a Postgres/Supabase. No imprime ni loguea el
// valor de DATABASE_URL en ningún momento.
// Uso local: node --env-file=.env scripts/db-check.js
// Uso con la variable ya exportada en el entorno (Railway, CI): node scripts/db-check.js
const { Pool } = require("pg");

const REQUIRED_TABLES = [
  "colegios",
  "viajes",
  "personas",
  "responsables",
  "grupos",
  "contratos",
  "pasajeros",
  "inscripciones",
  "fichas_adhesion",
  "documentos"
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "DATABASE_URL no está configurada.\n" +
      "Local: creá un archivo .env con DATABASE_URL=... y corré\n" +
      "  node --env-file=.env scripts/db-check.js\n" +
      "Railway: confirmá que la variable esté cargada en el servicio."
    );
    process.exitCode = 1;
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const ping = await pool.query("select now() as now");
    console.log("Conexión OK. Hora del servidor Postgres:", ping.rows[0].now);

    let missing = [];
    for (const table of REQUIRED_TABLES) {
      const check = await pool.query("select to_regclass($1) as reg", [`public.${table}`]);
      const exists = Boolean(check.rows[0].reg);
      console.log(`  tabla ${table}:`, exists ? "OK" : "FALTA");
      if (!exists) missing.push(table);
    }

    if (missing.length) {
      console.error(
        `\nFaltan ${missing.length} tabla(s). Correr supabase/migrations/0001_init.sql contra este proyecto Supabase.`
      );
      process.exitCode = 1;
    } else {
      console.log("\nEsquema completo. Listo para usar.");
    }
  } catch (error) {
    console.error("No se pudo conectar o consultar Postgres:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
