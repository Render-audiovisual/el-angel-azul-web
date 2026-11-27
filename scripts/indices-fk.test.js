// Toda clave foránea de `public` tiene un índice que empieza por sus columnas
// (lo que pide el advisor de Supabase, unindexed_foreign_keys). Corre las
// migraciones reales en PGlite: no toca Supabase.
const assert = require("node:assert/strict");
const test = require("node:test");
const { crearPoolLocal } = require("./helpers/pglite-pool");

test("todas las claves foráneas tienen un índice que las cubre", async () => {
  const pool = await crearPoolLocal();
  try {
    const { rows } = await pool.query(`
      select c.conrelid::regclass::text as tabla, c.conname, c.conkey
      from pg_constraint c
      join pg_namespace n on n.oid = c.connamespace
      where c.contype = 'f' and n.nspname = 'public'
        and not exists (
          select 1 from pg_index i
          where i.indrelid = c.conrelid
            and (i.indkey::int2[])[0:cardinality(c.conkey) - 1] = c.conkey
        )
      order by 1, 2`);
    assert.deepEqual(rows.map((r) => `${r.tabla}.${r.conname}`), [], "Falta un índice para estas claves foráneas: agregalo en una migración nueva.");
  } finally {
    await pool.close();
  }
});
