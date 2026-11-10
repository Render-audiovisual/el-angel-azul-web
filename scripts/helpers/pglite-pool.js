// Pool falso sobre PGlite (Postgres en memoria) con las migraciones reales.
// Sirve para probar lib/db.js sin tocar Supabase.
const fs = require("node:fs");
const path = require("node:path");

async function crearPoolLocal() {
  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite();
  const dir = path.join(__dirname, "../../supabase/migrations");
  for (const archivo of fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(fs.readFileSync(path.join(dir, archivo), "utf8").replace(/create extension[^;]*;/gi, ""));
  }
  const cliente = { query: (text, values) => pg.query(text, values), release() {} };
  return { query: cliente.query, connect: async () => cliente, on() {}, close: () => pg.close() };
}

module.exports = { crearPoolLocal };
