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
      ssl: { rejectUnauthorized: false },
      // Auditoría 23/07: este proyecto Supabase tiene max_connections=60
      // (verificado en vivo), con ~12 en uso por el propio Supabase. Se deja
      // explícito (antes usaba el default implícito de la librería) para
      // soportar picos de varias inscripciones simultáneas sin agotar la
      // base: hasta 15 conexiones reales en paralelo, el resto de los
      // pedidos esperan en la cola interna del pool (no se rechazan) hasta
      // 10s antes de fallar con un error claro.
      max: 15,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000
    });
  }
  return pool;
}

const FICHA_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isFichaPostgresId(id) {
  return FICHA_UUID_RE.test(String(id || ""));
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

// Auditoría 23/07 - hallazgo crítico: las fichas que entran por el
// formulario público (arriba) quedan en Supabase, pero el panel admin
// leía/escribía solo Google Sheets para FICHAS_ADHESION - una familia podía
// mandar su ficha con éxito y esa ficha nunca aparecía en la bandeja del
// admin. Las dos funciones de abajo cierran ese hueco: server.js las usa
// junto con Sheets (merge, no reemplazo) para no perder fichas viejas que
// ya estén en la hoja real.
async function listFichasAdmin() {
  const result = await getPool().query(`
    select
      f.id::text as id,
      p.numero_documento as pasajero_dni,
      f.pasajero_nombre,
      f.responsable_nombre,
      f.responsable_telefono,
      i.nivel,
      v.destino as viaje,
      coalesce(i.colegio_texto, '') as colegio,
      coalesce(i.curso_division_texto, '') as curso_division,
      '' as grupo_solicitado,
      '' as grupo_asignado_id,
      '' as contrato_id,
      '' as codigo_contrato,
      f.estado_revision,
      f.documentacion_estado,
      f.ficha_medica_estado,
      f.autorizacion_estado,
      f.observaciones,
      to_char(f.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
      to_char(f.updated_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
    from fichas_adhesion f
    join inscripciones i on i.id = f.inscripcion_id
    join personas p on p.id = i.persona_id
    join viajes v on v.id = i.viaje_id
    order by f.created_at desc
  `);
  return result.rows;
}

// Actualiza fichas que ya viven en Postgres (id con forma de UUID - ver
// isFichaPostgresId). No toca personas.numero_documento (cambiar la
// identidad de una persona por acá es riesgoso, requiere un flujo propio
// con detección de duplicados, fuera de alcance de este fix).
//
// OJO con "aprobada": fichas_adhesion tiene un CHECK legal real
// (estado_revision <> 'aprobada' or acepta_condiciones = true) sin
// excepción posible - y el formulario público actual todavía NO pide
// aceptar condiciones como campo separado (pendiente, ver plan v5 Fase 5).
// A propósito NO se fuerza acepta_condiciones=true acá para simular un
// consentimiento que la familia nunca dio - eso sería peor que el bug
// original. Si el admin intenta aprobar una ficha de Supabase hoy, la
// base va a rechazarlo con un error claro (se traduce abajo) hasta que el
// formulario capture consentimiento real.
async function updateFichasAdmin(rows, actorUsername) {
  const targetRows = rows.filter((row) => isFichaPostgresId(row.id));
  if (!targetRows.length) return { updated: 0 };
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    for (const row of targetRows) {
      const estadoRevision = normalizeText(row.estado_revision) || "pendiente";
      await client.query(
        `update fichas_adhesion set
           pasajero_nombre = $2,
           responsable_nombre = $3,
           responsable_telefono = $4,
           estado_revision = $5,
           documentacion_estado = $6,
           ficha_medica_estado = $7,
           autorizacion_estado = $8,
           observaciones = $9
         where id = $1`,
        [
          row.id,
          normalizeText(row.pasajero_nombre),
          normalizeText(row.responsable_nombre),
          normalizeText(row.responsable_telefono),
          estadoRevision,
          normalizeText(row.documentacion_estado) || "pendiente",
          normalizeText(row.ficha_medica_estado) || "pendiente",
          normalizeText(row.autorizacion_estado) || "pendiente",
          normalizeText(row.observaciones)
        ]
      );
      await client.query(
        `update inscripciones set colegio_texto = $2, curso_division_texto = $3, nivel = $4
         where id = (select inscripcion_id from fichas_adhesion where id = $1)`,
        [row.id, normalizeText(row.colegio), normalizeText(row.curso_division), normalizeText(row.nivel)]
      );
      await client.query(
        `insert into eventos_administrativos (entidad, entidad_id, accion, actor_username, detalle)
         values ('ficha_adhesion', $1, 'actualizar_desde_admin', $2, $3::jsonb)`,
        [row.id, normalizeText(actorUsername) || "desconocido", JSON.stringify({ estado_revision: estadoRevision })]
      );
    }
    await client.query("COMMIT");
    return { updated: targetRows.length };
  } catch (error) {
    await client.query("ROLLBACK");
    // 23514 = check_violation. Traducido a un mensaje accionable en vez de
    // un error crudo de Postgres.
    if (error.code === "23514" && String(error.message || "").includes("fichas_adhesion")) {
      const friendly = new Error(
        "No se puede aprobar: esta ficha vino del formulario web nuevo, que todavía no pide aceptar condiciones ni firma digital (funcionalidad pendiente). Marcá 'revisada' u 'observada' mientras tanto, o completá la aprobación manualmente sabiendo que falta ese consentimiento."
      );
      friendly.statusCode = 409;
      throw friendly;
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { getPool, insertFichaPublica, listFichasAdmin, updateFichasAdmin, isFichaPostgresId };
