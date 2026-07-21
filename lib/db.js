// Adaptador Postgres/Supabase. Hoy cubre solo el flujo público de
// FICHAS_ADHESION (ver server.js) - el resto de las hojas (GRUPOS,
// CONTRATOS, PASAJEROS, TURISMO) siguen en Google Sheets hasta que se
// migre el adaptador completo (ver contexto proyecto/plan-base-de-datos-
// el-angel-azul-v5.md).
const { Pool } = require("pg");

let pool = null;

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL no configurada. Cargarla en Railway o en un .env local (ver README)."
    );
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // ponytail: rejectUnauthorized:false evita empaquetar el cert CA de
      // Supabase. Suficiente para esta etapa (conexión directa al host de
      // Supabase); si hace falta validación estricta más adelante, pasar a
      // sslmode=verify-full con el CA real.
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

function normalizeDigits(value) {
  return String(value || "").replace(/\D+/g, "");
}

function normalizeText(value) {
  return String(value || "").trim();
}

async function findOrCreatePersona(client, { numeroDocumento, nombre }) {
  const doc = normalizeDigits(numeroDocumento);
  const existing = await client.query(
    `select id from personas where tipo_documento = 'DNI' and numero_documento = $1`,
    [doc]
  );
  if (existing.rows.length) return existing.rows[0].id;
  const inserted = await client.query(
    `insert into personas (tipo_documento, numero_documento, nombre)
     values ('DNI', $1, $2)
     returning id`,
    [doc, normalizeText(nombre)]
  );
  return inserted.rows[0].id;
}

// Busca un viaje existente por nivel+destino (case-insensitive). Si no
// existe, lo crea en estado 'borrador' (default de la tabla) - queda
// pendiente de que un admin lo revise/complete, no se publica solo.
async function findOrCreateViaje(client, { nivel, viajeTexto }) {
  const nivelNorm = normalizeText(nivel);
  const viajeNorm = normalizeText(viajeTexto);
  const existing = await client.query(
    `select id from viajes
     where categoria = 'estudiantil'
       and lower(coalesce(nivel, '')) = lower($1)
       and lower(destino) = lower($2)
     limit 1`,
    [nivelNorm, viajeNorm]
  );
  if (existing.rows.length) return existing.rows[0].id;
  const inserted = await client.query(
    `insert into viajes (categoria, nivel, destino, titulo)
     values ('estudiantil', $1, $2, $2)
     returning id`,
    [nivelNorm, viajeNorm]
  );
  return inserted.rows[0].id;
}

// Inserta una ficha de adhesión pública: resuelve/crea la persona y el
// viaje, crea la inscripción (estado 'ficha_enviada') y la ficha en la
// MISMA transacción. `row` ya viene sanitizado y validado por
// validPublicFicha() en server.js - acá solo se persiste.
async function insertFichaPublica(row) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");

    const personaId = await findOrCreatePersona(client, {
      numeroDocumento: row.pasajero_dni,
      nombre: row.pasajero_nombre
    });
    const viajeId = await findOrCreateViaje(client, {
      nivel: row.nivel,
      viajeTexto: row.viaje
    });

    const inscripcion = await client.query(
      `insert into inscripciones
         (persona_id, viaje_id, colegio_texto, curso_division_texto, nivel, estado, origen)
       values ($1, $2, $3, $4, $5, 'ficha_enviada', 'web')
       returning id`,
      [
        personaId,
        viajeId,
        normalizeText(row.colegio),
        normalizeText(row.curso_division),
        normalizeText(row.nivel)
      ]
    );
    const inscripcionId = inscripcion.rows[0].id;

    const ficha = await client.query(
      `insert into fichas_adhesion
         (legacy_id, inscripcion_id, pasajero_nombre, pasajero_numero_documento,
          responsable_nombre, responsable_telefono, estado_revision, observaciones)
       values ($1, $2, $3, $4, $5, $6, 'pendiente', $7)
       returning id, created_at`,
      [
        row.id || null,
        inscripcionId,
        normalizeText(row.pasajero_nombre),
        normalizeDigits(row.pasajero_dni),
        normalizeText(row.responsable_nombre),
        normalizeText(row.responsable_telefono),
        normalizeText(row.observaciones)
      ]
    );

    await client.query("COMMIT");
    return { id: ficha.rows[0].id, createdAt: ficha.rows[0].created_at, inscripcionId };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { getPool, insertFichaPublica };
