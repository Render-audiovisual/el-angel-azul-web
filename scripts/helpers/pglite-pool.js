// Pool falso sobre PGlite (Postgres en memoria) con las migraciones reales.
// Sirve para probar lib/db.js sin tocar Supabase.
const fs = require("node:fs");
const path = require("node:path");

async function crearPoolLocal() {
  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite();
  // Supabase trae el esquema storage; PGlite no. Stub mínimo para la migración 0005.
  await pg.exec("create schema if not exists storage; create table if not exists storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[])");
  const dir = path.join(__dirname, "../../supabase/migrations");
  for (const archivo of fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(fs.readFileSync(path.join(dir, archivo), "utf8").replace(/create extension[^;]*;/gi, ""));
  }
  const cliente = { query: (text, values) => pg.query(text, values), release() {} };
  return { query: cliente.query, connect: async () => cliente, on() {}, close: () => pg.close() };
}

module.exports = { crearPoolLocal };
