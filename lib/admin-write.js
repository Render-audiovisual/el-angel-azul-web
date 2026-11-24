// Control optimista por registro. La comprobación y el guardado comparten
// conexión y transacción; otro proceso no puede pasar entre ambos.
const { AsyncLocalStorage } = require("node:async_hooks");
const { createHash } = require("node:crypto");
const scope = new AsyncLocalStorage();
const targets = {
  GRUPOS: ["grupos", "legacy_id"], CONTRATOS: ["contratos", "legacy_id"],
  PASAJEROS: ["pasajeros", "legacy_id"], TURISMO: ["viajes", "legacy_id"],
  FICHAS_ADHESION: ["fichas_adhesion", "id"], FICHAS_TUTOR: ["fichas_tutor", "id"],
  PLANES_PAGO: ["planes_pago", "id"], COLEGIOS: ["colegios", "id"]
};

function version(row) {
  const values = Object.keys(row).filter((key) => key !== "_version").sort().map((key) => [key, row[key]]);
  return createHash("sha256").update(JSON.stringify(values)).digest("hex");
}
const versionedRows = (rows) => rows.map((row) => ({ ...row, _version: version(row) }));
const currentPool = () => scope.getStore();

// Los adaptadores existentes usan BEGIN/COMMIT en sus operaciones compuestas.
// Dentro del guardado protegido se convierten en savepoints, sin confirmar
// prematuramente la transacción que protege todo el pedido.
function scopedPool(client) {
  let sequence = 0;
  const stack = [];
  const query = async (sql, args) => {
    const command = typeof sql === "string" ? sql.trim().toUpperCase() : "";
    if (command === "BEGIN") {
      const name = `admin_save_${++sequence}`;
      stack.push(name);
      return client.query(`SAVEPOINT ${name}`);
    }
    if (command === "COMMIT" || command === "ROLLBACK") {
      const name = stack.pop();
      if (!name) throw new Error("Transacción interna desbalanceada");
      if (command === "ROLLBACK") await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
      return client.query(`RELEASE SAVEPOINT ${name}`);
    }
    return client.query(sql, args);
  };
  const connection = { query, release() {} };
  return { query, connect: async () => connection };
}

function findRow(sheet, rows, input) {
  // El adaptador de pasajeros crea un legacy_id con DNI + viaje. Un alta
  // todavía tiene un id temporal en el navegador: devolver su versión bajo
  // ese mismo id permite seguir editando hasta la próxima lectura completa.
  return rows.find((row) => String(row.id) === String(input.id))
    || (sheet === "PASAJEROS" ? rows.find((row) => row.dni === input.dni && row.grupo_id === input.grupo_id) : undefined);
}

async function write({ pool, sheet, rows, deleteIds, expectedVersions, list, save }) {
  if (!targets[sheet]) throw new Error("Colección sin control de versión");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // También protege altas concurrentes del mismo id y funciona entre
    // procesos Node diferentes, sin depender de un mutex en memoria.
    await client.query("select pg_advisory_xact_lock(hashtext($1))", [`admin:${sheet}`]);
    const result = await scope.run(scopedPool(client), async () => {
      const beforeLock = await list();
      const inputs = [...rows, ...deleteIds.map((id) => ({ id }))];
      const ids = inputs.map((input) => findRow(sheet, beforeLock, input)?.id).filter(Boolean);
      const [table, key] = targets[sheet];
      // Espera también las escrituras ajenas al admin (por ej. estado del
      // correo de una ficha), antes de comparar la versión vigente.
      await client.query(`select id from ${table} where ${key}::text = any($1::text[]) order by id for update`, [ids]);
      const current = await list();
      const conflicts = inputs.filter((input) => {
        const existing = findRow(sheet, current, input);
        const expected = expectedVersions?.[input.id];
        return existing ? expected !== version(existing) : Boolean(expected);
      });
      if (conflicts.length) {
        const error = new Error("Otro usuario modificó o eliminó este registro. No se guardaron los cambios de este pedido. Recargá el panel y revisá la versión actual antes de volver a guardar.");
        error.statusCode = 409;
        error.conflictIds = conflicts.map((row) => row.id);
        throw error;
      }
      const saved = await save();
      if (saved.failed.length) return saved;
      const latest = await list();
      const versions = Object.fromEntries(rows.map((input) => {
        const row = findRow(sheet, latest, input);
        return [input.id, row ? version(row) : null];
      }));
      return { ...saved, versions };
    });
    await client.query(result.failed.length ? "ROLLBACK" : "COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { write, currentPool, versionedRows, version };
