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
  "fichas_tutor",
  "planes_pago",
  "documentos"
];

const REQUIRED_COLUMNS = {
  colegios: ["activo", "provincia", "localidad", "codigo_oficial"],
  personas: ["apellido"],
  responsables: ["apellido"],
  pasajeros: ["plan_pago_id"],
  fichas_adhesion: ["inscripcion_id", "pasajero_apellido", "responsable_apellido", "firma_storage_path", "email_estado"],
  inscripciones: ["colegio_id", "colegio_texto", "grado", "division", "plan_pago_id"]
};

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
      const missingColumns = [];
      for (const [table, columns] of Object.entries(REQUIRED_COLUMNS)) {
        const result = await pool.query(
          `select column_name from information_schema.columns
           where table_schema = 'public' and table_name = $1 and column_name = any($2::text[])`,
          [table, columns]
        );
        const present = new Set(result.rows.map((row) => row.column_name));
        for (const column of columns) {
          const exists = present.has(column);
          console.log(`  columna ${table}.${column}:`, exists ? "OK" : "FALTA");
          if (!exists) missingColumns.push(`${table}.${column}`);
        }
      }

      const counts = await pool.query(
        `select
           (select count(*)::int from fichas_adhesion) as fichas,
           (select count(*)::int from inscripciones) as inscripciones,
           (select count(*)::int from fichas_tutor) as fichas_tutor`
      );
      console.log("\nFilas actuales (sin mostrar datos personales):", counts.rows[0]);

      if (missingColumns.length) {
        console.error(`\nFaltan ${missingColumns.length} columna(s) de Fase 1: ${missingColumns.join(", ")}`);
        process.exitCode = 1;
      } else {
        console.log("\nEsquema de Fase 1 completo. Listo para el smoke test.");
      }
    }
  } catch (error) {
    console.error("No se pudo conectar o consultar Postgres:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
