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

const CAMPOS_SIN_AUDITAR = new Set(["_version", "created_at", "updated_at"]);

// Deja rastro de quién creó, editó o eliminó qué, en la misma transacción que el
// guardado. Guarda el id y los NOMBRES de los campos cambiados, no los valores:
// la bitácora no tiene por qué duplicar DNI, teléfonos ni domicilios.
// Las fichas de adhesión ya se auditan una por una en updateFichasAdmin.
async function auditar(client, { sheet, actor, rows, deleteIds, current }) {
  if (sheet === "FICHAS_ADHESION") return;
  const eventos = [
    ...rows.map((row) => {
      const previo = findRow(sheet, current, row);
      const campos = previo
        ? Object.keys(row).filter((k) => !CAMPOS_SIN_AUDITAR.has(k) && String(row[k] ?? "") !== String(previo[k] ?? ""))
        : [];
      return { id: String(row.id), accion: previo ? "editar" : "crear", detalle: { id: String(row.id), campos } };
    }),
    ...deleteIds.map((id) => ({ id: String(id), accion: "eliminar", detalle: { id: String(id) } }))
  ];
  if (!eventos.length) return;
  await client.query(
    `insert into eventos_administrativos (entidad, entidad_id, accion, actor_username, detalle)
     select $1, case when t.e ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then t.e::uuid end, t.a, $2, t.d::jsonb
     from unnest($3::text[], $4::text[], $5::text[]) as t(e, a, d)`,
    [sheet.toLowerCase(), String(actor || "desconocido").slice(0, 100),
      eventos.map((e) => e.id), eventos.map((e) => e.accion), eventos.map((e) => JSON.stringify(e.detalle))]
  );
}

async function write({ pool, sheet, rows, deleteIds, expectedVersions, list, save, actor }) {
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
      await auditar(client, { sheet, actor, rows, deleteIds, current });
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
