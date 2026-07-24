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
    // Auditoría 23/07 - riesgo crítico encontrado: sin este handler, un
    // cliente inactivo del pool que pierde la conexión (ej. un corte de
    // red transitorio entre Railway y Supabase) emite un evento "error"
    // que Node trata como no manejado y TIRA ABAJO TODO EL PROCESO - no
    // solo la parte de Supabase, el sitio entero. Es un gotcha conocido
    // de la librería "pg". Con este handler, ese error se loguea y el
    // pool simplemente descarta esa conexión y sigue funcionando.
    pool.on("error", (error) => {
      console.error("Error en una conexión inactiva del pool de Postgres (no se cae el servidor):", error);
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

// Auditoría 23/07 - riesgo real de concurrencia encontrado: la versión
// anterior hacía "buscar, si no existe insertar" en dos pasos separados.
// Si la MISMA persona se manda dos veces casi al mismo tiempo (doble clic
// en "Enviar", o un reintento automático del navegador tras un timeout),
// las dos consultas podían no encontrar nada todavía y las dos intentar
// insertar - la segunda chocaba contra el unique(tipo_documento,
// numero_documento) con un error crudo de Postgres, y esa familia veía
// un 500 en vez de que su ficha se guardara. Ahora es una sola operación
// atómica (INSERT ... ON CONFLICT), sin ventana de carrera posible.
//
// Recibe "queryable" (el pool directo o un client con transacción
// abierta, ambos tienen .query()) - insertFichaPublica la llama sobre el
// pool directo (auto-commit), a propósito, ver el comentario ahí sobre
// por qué no conviene hacerlo dentro de la transacción principal.
async function findOrCreatePersona(queryable, { numeroDocumento, nombre }) {
  const doc = normalizeDigits(numeroDocumento);
  // "do update set numero_documento = excluded.numero_documento" es un
  // no-op a propósito (el valor en conflicto ya es idéntico) - existe solo
  // para que "returning id" funcione también cuando la fila ya existía.
  // Con "do nothing" no se puede devolver el id de la fila existente en la
  // misma consulta. El nombre de una persona ya existente NUNCA se
  // sobreescribe (mismo comportamiento que antes).
  const result = await queryable.query(
    `insert into personas (tipo_documento, numero_documento, nombre)
     values ('DNI', $1, $2)
     on conflict (tipo_documento, numero_documento)
       do update set numero_documento = excluded.numero_documento
     returning id`,
    [doc, normalizeText(nombre)]
  );
  return result.rows[0].id;
}

// Busca un viaje existente por nivel+destino (case-insensitive). Si no
// existe, lo crea en estado 'borrador' (default de la tabla) - queda
// pendiente de que un admin lo revise/complete, no se publica solo.
//
// Auditoría 23/07 - riesgo real de concurrencia confirmado con una prueba
// de carga: el mismo patrón "buscar, si no existe insertar" en dos pasos
// que tenía findOrCreatePersona también estaba acá. Con 30 fichas para el
// MISMO destino llegando juntas (el caso normal, no uno raro - varias
// familias de un colegio anotándose al mismo viaje), la búsqueda no
// encontraba nada todavía en varias conexiones a la vez y cada una
// insertaba su propio viaje - confirmado: una ráfaga de 30 generó 15
// filas duplicadas de "Bariloche 2026" en vez de reusar una sola. Se
// agregó el índice único que faltaba (migración 0002) y acá se usa el
// mismo patrón atómico INSERT ... ON CONFLICT que ya se usa para personas.
// Mismo motivo que arriba para recibir "queryable" en vez de forzar una
// transacción: ver el comentario en insertFichaPublica.
async function findOrCreateViaje(queryable, { nivel, viajeTexto }) {
  const nivelNorm = normalizeText(nivel);
  const viajeNorm = normalizeText(viajeTexto);
  const result = await queryable.query(
    `insert into viajes (categoria, nivel, destino, titulo)
     values ('estudiantil', $1, $2, $2)
     on conflict (categoria, (lower(coalesce(nivel, ''))), (lower(destino)))
       where categoria = 'estudiantil'
       do update set destino = excluded.destino
     returning id`,
    [nivelNorm, viajeNorm]
  );
  return result.rows[0].id;
}

// Inserta una ficha de adhesión pública: resuelve/crea la persona y el
// viaje, crea la inscripción (estado 'ficha_enviada') y la ficha.
// `row` ya viene sanitizado y validado por validPublicFicha() en
// server.js - acá solo se persiste.
//
// Auditoría 23/07 - regresión encontrada y corregida en el momento:
// persona/viaje se resuelven ANTES de abrir la transacción principal, en
// su propia consulta suelta (auto-commit, sobre el pool directo). Se
// probó primero resolviéndolos ADENTRO de la misma transacción que crea
// inscripción+ficha, y con una ráfaga real de 30 fichas para el MISMO
// viaje eso serializaba tanto (cada transacción retiene el lock de fila
// del upsert de "viajes" durante TODO su tiempo de vida, no solo esa
// consulta) que 6 de las 30 terminaron agotando el pool de conexiones
// (10s de espera). Resolviendo aparte, el lock de esa fila se libera casi
// al instante y solo la creación de inscripción+ficha (que no compite por
// ninguna fila compartida, cada una es siempre nueva) queda en la
// transacción real.
async function insertFichaPublica(row) {
  const personaId = await findOrCreatePersona(getPool(), {
    numeroDocumento: row.pasajero_dni,
    nombre: row.pasajero_nombre
  });
  const viajeId = await findOrCreateViaje(getPool(), {
    nivel: row.nivel,
    viajeTexto: row.viaje
  });

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");

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

// Traduce un error crudo de Postgres a un mensaje accionable cuando se
// puede reconocer la causa. error.table/error.constraint son campos
// estructurados que ya vienen parseados por el driver "pg" - más
// confiable que buscar texto suelto dentro de error.message.
function translateFichaUpdateError(error) {
  if (error.code === "23514" && error.table === "fichas_adhesion") {
    const friendly = new Error(
      "No se puede aprobar: esta ficha vino del formulario web nuevo, que todavía no pide aceptar condiciones ni firma digital (funcionalidad pendiente). Marcá 'revisada' u 'observada' mientras tanto, o completá la aprobación manualmente sabiendo que falta ese consentimiento."
    );
    friendly.statusCode = 409;
    return friendly;
  }
  return error;
}

// Actualiza fichas que ya viven en Postgres (id con forma de UUID - ver
// isFichaPostgresId). No toca personas.numero_documento (cambiar la
// identidad de una persona por acá es riesgoso, requiere un flujo propio
// con detección de duplicados, fuera de alcance de este fix).
//
// Auditoría 23/07 - corregido: antes todas las fichas del lote se
// actualizaban en UNA sola transacción - si UNA fallaba (típicamente por
// el CHECK de "aprobada" de abajo), se revertían también los cambios de
// las demás fichas del mismo guardado, aunque esas no tuvieran ningún
// problema. Ahora cada ficha tiene su propia transacción independiente:
// una que falla no afecta a las demás. La función nunca lanza excepción
// por una falla de negocio esperada (el CHECK de aprobación) - devuelve
// {updated, failed} y quien llama decide qué hacer con los fallos.
//
// OJO con "aprobada": fichas_adhesion tiene un CHECK legal real
// (estado_revision <> 'aprobada' or acepta_condiciones = true) sin
// excepción posible - y el formulario público actual todavía NO pide
// aceptar condiciones como campo separado (pendiente, ver plan v5 Fase 5).
// A propósito NO se fuerza acepta_condiciones=true acá para simular un
// consentimiento que la familia nunca dio - eso sería peor que el bug
// original. Si el admin intenta aprobar una ficha de Supabase hoy, queda
// reportada en "failed" con un mensaje claro en vez de romper el resto.
async function updateFichasAdmin(rows, actorUsername) {
  const targetRows = rows.filter((row) => isFichaPostgresId(row.id));
  if (!targetRows.length) return { updated: 0, failed: [] };
  const pool = getPool();
  const failed = [];
  let updated = 0;
  for (const row of targetRows) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
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
      await client.query("COMMIT");
      updated += 1;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      const friendly = translateFichaUpdateError(error);
      failed.push({ id: row.id, error: friendly.message });
    } finally {
      client.release();
    }
  }
  return { updated, failed };
}

module.exports = { getPool, insertFichaPublica, listFichasAdmin, updateFichasAdmin, isFichaPostgresId };
