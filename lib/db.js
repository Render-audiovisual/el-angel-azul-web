// Adaptador Postgres/Supabase para FICHAS_ADHESION, GRUPOS, CONTRATOS,
// PASAJEROS y TURISMO. server.js mantiene el cambio de fuente detrás de una
// bandera para poder respaldar/migrar/verificar datos antes del corte.
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

function normalizeSignatureDataUrl(value) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  if (normalized.length > 250000) {
    throw friendlyError("La firma supera el límite máximo de 250 KB.");
  }
  const match = normalized.match(/^data:image\/png;base64,([a-z0-9+/]+={0,2})$/i);
  if (!match || match[1].length % 4 !== 0) {
    throw friendlyError("La firma no tiene un formato PNG válido.");
  }
  const image = Buffer.from(match[1], "base64");
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const hasPngStructure =
    image.length >= 33 &&
    image.subarray(0, 8).equals(pngSignature) &&
    image.toString("ascii", 12, 16) === "IHDR" &&
    image.subarray(-8, -4).toString("ascii") === "IEND";
  if (!hasPngStructure) {
    throw friendlyError("La firma no contiene una imagen PNG válida.");
  }
  return normalized;
}

function comparableText(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Migración a Supabase (24/07) - revisión de Wilson: el cliente (app.js)
// manda estados capitalizados en español ("Activo", "Al día") mientras que
// Postgres los tiene en minúscula/snake_case ("activo", "al_dia"). Se
// verificó CADA valor real contra los CHECK de la base (no en teoría):
// pasajeros.estado, documentacion_estado, ficha_medica_estado, pago_estado,
// grupos.estado y contratos.estado son simple diferencia de mayúsculas
// salvo pago_estado ("Al día" -> al_dia). viajes.estado/categoria ya viajan
// en minúscula desde el cliente (ver app.js:1903), sin mapeo.
//
// OJO: la sesión anterior había anotado que documentacion_estado le
// faltaba 'observada' en el CHECK porque el admin tenía esa opción - eso
// era un error de lectura (esa opción es de ficha_medica_estado, que YA
// admite 'observada'). Se confirmó contra el proyecto real con
// information_schema/pg_constraint: no hace falta ninguna migración de
// esquema para esto, los 4 CHECK de pasajeros ya cubren exactamente los
// valores que el cliente puede mandar.
//
// Revisión (24/07): un valor VACÍO cae al default de la tabla (mismo
// comportamiento que ya tenía el resto del sistema cuando un campo no se
// manda). Un valor NO VACÍO pero no reconocido (dato corrupto, un valor
// viejo que ya no existe, alguien mandando basura a mano) YA NO se
// convierte en silencio al default - antes lo hacía, y eso podía guardar
// un estado distinto al que el admin realmente escribió sin que nadie se
// entere. Ahora esa fila se rechaza con friendlyError (queda en "failed"
// con mensaje claro, no rompe el resto del lote - ver runBatch).
function makeEnumMap(pairs, dbDefault) {
  const toDb = new Map(pairs.map(([client, db]) => [client.toLowerCase(), db]));
  const toClient = new Map(pairs.map(([client, db]) => [db, client]));
  return {
    toDb(clientValue) {
      const normalized = normalizeText(clientValue);
      if (!normalized) return dbDefault;
      const mapped = toDb.get(normalized.toLowerCase());
      if (!mapped) {
        throw friendlyError(`Valor no reconocido: "${clientValue}".`);
      }
      return mapped;
    },
    toClient(dbValue) {
      return toClient.get(normalizeText(dbValue).toLowerCase()) || toClient.get(dbDefault);
    }
  };
}

const grupoEstadoMap = makeEnumMap(
  [["Activo", "activo"], ["Cerrado", "cerrado"], ["Cancelado", "cancelado"]],
  "activo"
);
const contratoEstadoMap = makeEnumMap(
  [["Activo", "activo"], ["Borrador", "borrador"], ["Inactivo", "inactivo"]],
  "borrador"
);
const pasajeroEstadoMap = makeEnumMap(
  [["Activo", "activo"], ["Pendiente", "pendiente"], ["Baja", "baja"]],
  "pendiente"
);
const documentacionEstadoMap = makeEnumMap(
  [["Pendiente", "pendiente"], ["Completa", "completa"], ["Rechazada", "rechazada"]],
  "pendiente"
);
const fichaMedicaEstadoMap = makeEnumMap(
  [["Pendiente", "pendiente"], ["Cargada", "cargada"], ["Observada", "observada"]],
  "pendiente"
);
const pagoEstadoMap = makeEnumMap(
  [["Pendiente", "pendiente"], ["Al día", "al_dia"], ["Vencido", "vencido"]],
  "pendiente"
);

// Busca un colegio por nombre (case-insensitive). Si no existe, lo crea.
// Mismo motivo que findOrCreatePersona para el "do update" no-op: solo
// existe para que "returning id" también funcione contra la fila ya
// existente. El nombre de un colegio ya existente nunca se sobreescribe
// (mismo criterio que personas), para que no cambie de mayúsculas/minúsculas
// según quién lo haya tipeado la última vez.
//
// OJO con la sintaxis del conflict target: colegios_nombre_uk es un índice
// de EXPRESIÓN (lower(nombre)), no una columna simple - "on conflict
// (nombre)" fallaría en runtime contra este índice. Mismo patrón ya
// probado en producción que usa findOrCreateViaje con lower(destino).
async function findOrCreateColegio(queryable, nombre) {
  const result = await queryable.query(
    `insert into colegios (nombre)
     values ($1)
     on conflict ((lower(nombre)))
       do update set nombre = colegios.nombre
     returning id`,
    [normalizeText(nombre)]
  );
  return result.rows[0].id;
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
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Migración a Supabase (24/07): Pasajeros trae nacimiento/telefono (viven en
// personas, no en pasajeros - ver 0001_init.sql) además de numeroDocumento/
// nombre. Se agregan como opcionales con COALESCE(excluded, actual) para no
// romper el llamado de fichas (insertFichaPublica), que nunca los manda -
// esos campos quedan tal cual estaban en vez de pisarse con null.
async function findOrCreatePersona(queryable, { numeroDocumento, nombre, nacimiento, telefono }) {
  const doc = normalizeDigits(numeroDocumento);
  const nacimientoValido = parseDate(nacimiento, "nacimiento");
  // "do update set numero_documento = excluded.numero_documento" es un
  // no-op a propósito (el valor en conflicto ya es idéntico) - existe solo
  // para que "returning id" funcione también cuando la fila ya existía.
  // Con "do nothing" no se puede devolver el id de la fila existente en la
  // misma consulta. El nombre de una persona ya existente NUNCA se
  // sobreescribe (mismo comportamiento que antes).
  const result = await queryable.query(
    `insert into personas (tipo_documento, numero_documento, nombre, nacimiento, telefono)
     values ('DNI', $1, $2, $3, $4)
     on conflict (tipo_documento, numero_documento)
       do update set
         numero_documento = excluded.numero_documento,
         nacimiento = coalesce(excluded.nacimiento, personas.nacimiento),
         telefono = coalesce(nullif(excluded.telefono, ''), personas.telefono)
     returning id`,
    [doc, normalizeText(nombre), nacimientoValido, normalizeText(telefono)]
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
    nombre: row.pasajero_nombre,
    nacimiento: row.pasajero_nacimiento
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
         (legacy_id, inscripcion_id,
          pasajero_nombre, pasajero_tipo_documento, pasajero_numero_documento, pasajero_nacimiento, pasajero_sexo,
          responsable_nombre, responsable_tipo_documento, responsable_numero_documento, responsable_nacimiento,
          responsable_parentesco, responsable_email, responsable_telefono, responsable_celular, responsable_cuil_cuit,
          domicilio_calle, domicilio_numero, domicilio_piso, domicilio_departamento, domicilio_localidad,
          domicilio_provincia, domicilio_codigo_postal, acepta_condiciones, firma_storage_path,
          estado_revision, documentacion_estado, ficha_medica_estado, autorizacion_estado, observaciones)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,
               'pendiente',$26,$27,$28,$29)
       returning id, created_at`,
      [
        row.id || null,
        inscripcionId,
        normalizeText(row.pasajero_nombre),
        normalizeText(row.pasajero_tipo_documento) || "DNI",
        normalizeDigits(row.pasajero_dni),
        parseDate(row.pasajero_nacimiento, "pasajero_nacimiento"),
        normalizeText(row.pasajero_sexo),
        normalizeText(row.responsable_nombre),
        normalizeText(row.responsable_tipo_documento) || "DNI",
        normalizeDigits(row.responsable_numero_documento) || null,
        parseDate(row.responsable_nacimiento, "responsable_nacimiento"),
        normalizeText(row.responsable_parentesco),
        normalizeText(row.responsable_email),
        normalizeText(row.responsable_telefono),
        normalizeText(row.responsable_celular),
        normalizeText(row.responsable_cuil_cuit),
        normalizeText(row.domicilio_calle),
        normalizeText(row.domicilio_numero),
        normalizeText(row.domicilio_piso),
        normalizeText(row.domicilio_departamento),
        normalizeText(row.domicilio_localidad),
        normalizeText(row.domicilio_provincia),
        normalizeText(row.domicilio_codigo_postal),
        parseBool(row.acepta_condiciones, "acepta_condiciones"),
        normalizeSignatureDataUrl(row.firma_data_url),
        normalizeText(row.documentacion_estado) || "pendiente",
        normalizeText(row.ficha_medica_estado) || "pendiente",
        normalizeText(row.autorizacion_estado) || (row.firma_data_url ? "Sí" : "pendiente"),
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
      f.pasajero_numero_documento as pasajero_dni,
      f.pasajero_nombre,
      f.pasajero_tipo_documento,
      to_char(f.pasajero_nacimiento, 'YYYY-MM-DD') as pasajero_nacimiento,
      f.pasajero_sexo,
      f.responsable_nombre,
      f.responsable_tipo_documento,
      f.responsable_numero_documento,
      to_char(f.responsable_nacimiento, 'YYYY-MM-DD') as responsable_nacimiento,
      f.responsable_parentesco,
      f.responsable_email,
      f.responsable_telefono,
      f.responsable_celular,
      f.responsable_cuil_cuit,
      f.domicilio_calle,
      f.domicilio_numero,
      f.domicilio_piso,
      f.domicilio_departamento,
      f.domicilio_localidad,
      f.domicilio_provincia,
      f.domicilio_codigo_postal,
      f.acepta_condiciones,
      coalesce(f.firma_storage_path, '') as firma_data_url,
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
      "No se puede aprobar: la ficha no tiene aceptación de condiciones o firma digital válida. Marcala como observada y pedí completar esos datos."
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
// OJO con "aprobada": fichas_adhesion tiene CHECKs legales reales para
// aceptación y firma. El formulario ya envía ambos datos; nunca se fuerzan
// desde el admin si la familia no los proporcionó.
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

      // Revisión (24/07): antes esto era un UPDATE no-op si el pasajero
      // todavía no existía (0 filas, sin error) y la ficha se aprobaba
      // igual, con la trazabilidad rota. Ahora, si se está aprobando, el
      // pasajero real se busca ANTES de tocar nada - si no existe, se
      // aborta toda la transacción (throw -> catch de abajo -> ROLLBACK)
      // y la ficha queda como estaba, NUNCA en "aprobada" sin su pasajero
      // ya creado y linkeado. El pasajero se crea en un POST PASAJEROS
      // aparte (el cliente sigue mandando dos pedidos separados) - esto
      // asegura que la aprobación en sí sea todo-o-nada respecto de esa
      // dependencia, aunque la creación del pasajero haya sido un pedido
      // HTTP anterior.
      let pasajeroId = null;
      if (estadoRevision === "aprobada") {
        const pasajeroLookup = await client.query(
          `select p.id
           from fichas_adhesion f
           join inscripciones i on i.id = f.inscripcion_id
           join personas per on per.numero_documento = $2
           join pasajeros p on p.persona_id = per.id and p.viaje_id = i.viaje_id
           where f.id = $1`,
          [row.id, normalizeDigits(row.pasajero_dni)]
        );
        if (!pasajeroLookup.rows.length) {
          throw friendlyError(
            "No se puede aprobar: todavía no existe el pasajero real para esta ficha (falta crearlo en Pasajeros con el mismo DNI y viaje)."
          );
        }
        pasajeroId = pasajeroLookup.rows[0].id;
      }

      await client.query(
        `update fichas_adhesion set
           pasajero_nombre = $2,
           pasajero_tipo_documento = $3,
           pasajero_nacimiento = $4,
           pasajero_sexo = $5,
           responsable_nombre = $6,
           responsable_tipo_documento = $7,
           responsable_numero_documento = $8,
           responsable_nacimiento = $9,
           responsable_parentesco = $10,
           responsable_email = $11,
           responsable_telefono = $12,
           responsable_celular = $13,
           responsable_cuil_cuit = $14,
           domicilio_calle = $15,
           domicilio_numero = $16,
           domicilio_piso = $17,
           domicilio_departamento = $18,
           domicilio_localidad = $19,
           domicilio_provincia = $20,
           domicilio_codigo_postal = $21,
           estado_revision = $22,
           documentacion_estado = $23,
           ficha_medica_estado = $24,
           autorizacion_estado = $25,
           observaciones = $26
         where id = $1`,
        [
          row.id,
          normalizeText(row.pasajero_nombre),
          normalizeText(row.pasajero_tipo_documento) || "DNI",
          parseDate(row.pasajero_nacimiento, "pasajero_nacimiento"),
          normalizeText(row.pasajero_sexo),
          normalizeText(row.responsable_nombre),
          normalizeText(row.responsable_tipo_documento) || "DNI",
          normalizeDigits(row.responsable_numero_documento) || null,
          parseDate(row.responsable_nacimiento, "responsable_nacimiento"),
          normalizeText(row.responsable_parentesco),
          normalizeText(row.responsable_email),
          normalizeText(row.responsable_telefono),
          normalizeText(row.responsable_celular),
          normalizeText(row.responsable_cuil_cuit),
          normalizeText(row.domicilio_calle),
          normalizeText(row.domicilio_numero),
          normalizeText(row.domicilio_piso),
          normalizeText(row.domicilio_departamento),
          normalizeText(row.domicilio_localidad),
          normalizeText(row.domicilio_provincia),
          normalizeText(row.domicilio_codigo_postal),
          estadoRevision,
          normalizeText(row.documentacion_estado) || "pendiente",
          normalizeText(row.ficha_medica_estado) || "pendiente",
          normalizeText(row.autorizacion_estado) || "pendiente",
          normalizeText(row.observaciones)
        ]
      );
      await client.query(
        `update inscripciones set
           colegio_texto = $2, curso_division_texto = $3, nivel = $4,
           pasajero_id = coalesce($5, pasajero_id)
         where id = (select inscripcion_id from fichas_adhesion where id = $1)`,
        [row.id, normalizeText(row.colegio), normalizeText(row.curso_division), normalizeText(row.nivel), pasajeroId]
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
      failed.push({ id: row.id, error: friendly.friendlyMessage || friendly.message });
    } finally {
      client.release();
    }
  }
  return { updated, failed };
}

// ============ GRUPOS / CONTRATOS (migración a Supabase, 24/07) ============
//
// A partir de acá: Grupos y Contratos, con el mismo principio ya probado en
// Fichas - preservar el contrato HTTP exacto (fila plana) para que app.js
// no necesite ningún cambio de lógica. Legacy_id es SIEMPRE el "id" que
// entra/sale por HTTP (el que genera el cliente); el uuid interno nunca se
// expone.
//
// A diferencia de insertFichaPublica (que sí necesitaba abrir una
// transacción real para inscripción+ficha juntas), acá cada fila es UN
// insert/upsert de una sola tabla - no hace falta BEGIN/COMMIT explícito,
// un solo statement ya es atómico. Evita además repetir el problema real de
// concurrencia que se encontró en fichas (mantener un lock de fila de
// viajes/colegios abierto durante toda una transacción larga).

// Error con mensaje ya listo para mostrar al admin - runBatch lo usa tal
// cual en vez de intentar traducir un código de Postgres genérico.
function friendlyError(message) {
  const error = new Error(message);
  error.friendlyMessage = message;
  return error;
}

// Traduce errores crudos de Postgres a mensajes accionables cuando no vino
// ya un friendlyError armado a mano (ej. "grupo no existe todavía").
function translateWriteError(error) {
  if (error.friendlyMessage) return error.friendlyMessage;
  if (error.code === "23503") {
    return "No se pudo guardar: hace referencia a un dato vinculado que no existe (o no se puede borrar porque todavía tiene datos vinculados).";
  }
  if (error.code === "23505") {
    return "Ya existe un registro con esos mismos datos (duplicado).";
  }
  if (error.code === "23514") {
    return "Uno de los valores no cumple una regla de la base de datos.";
  }
  return error.message || "Error desconocido al guardar.";
}

// Guardado por lote donde una fila con problemas NUNCA aborta a las demás -
// mismo criterio que ya usa updateFichasAdmin. `handler` recibe la fila y
// hace lo que corresponda (una query suelta, o su propia transacción si
// necesita varias tablas atómicas - ver savePasajerosAdmin).
async function runBatch(rows, handler) {
  const failed = [];
  let updated = 0;
  for (const row of rows) {
    try {
      await handler(row);
      updated += 1;
    } catch (error) {
      failed.push({ id: row.id, error: translateWriteError(error) });
    }
  }
  return { updated, failed };
}

// Mismo algoritmo que sheetMigrationSlug en app.js - solo para reconstruir
// el campo colegio_id (un slug puramente cosmético, nunca se usa como
// clave real en ningún lado del cliente, ver adminColegioId en app.js).
function slugify(value) {
  return (
    String(value || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "sin-dato"
  );
}

async function listGruposAdmin() {
  const result = await getPool().query(`
    select
      g.legacy_id as id,
      v.nivel,
      v.destino as viaje,
      col.nombre as colegio,
      g.curso,
      g.division,
      g.pasajeros_esperados,
      g.estado,
      to_char(g.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
      to_char(g.updated_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
    from grupos g
    join viajes v on v.id = g.viaje_id
    join colegios col on col.id = g.colegio_id
    order by g.created_at desc
  `);
  return result.rows.map((row) => ({ ...row, estado: grupoEstadoMap.toClient(row.estado) }));
}

// Nunca borra nada por omisión - solo legacy_id explícitos en deleteIds.
// grupos tiene FK on delete restrict desde contratos/pasajeros: borrar un
// grupo con datos vinculados falla con 23503, traducido a mensaje claro.
async function saveGruposAdmin(rows, deleteIds = [], actorUsername) {
  const pool = getPool();
  const deleteResult = await runBatch(deleteIds.map((id) => ({ id })), async (row) => {
    await pool.query(`delete from grupos where legacy_id = $1`, [row.id]);
  });
  const saveResult = await runBatch(rows, async (row) => {
    const legacyId = normalizeText(row.id);
    if (!legacyId) throw friendlyError("Falta el id del grupo.");
    const pasajerosEsperados = parseNumeric(row.pasajeros_esperados, "pasajeros_esperados") ?? 0;
    if (!Number.isInteger(pasajerosEsperados) || pasajerosEsperados < 0) {
      throw friendlyError('El campo "pasajeros_esperados" debe ser un entero mayor o igual a cero.');
    }
    const viajeId = await findOrCreateViaje(pool, { nivel: row.nivel, viajeTexto: row.viaje });
    const colegioId = await findOrCreateColegio(pool, row.colegio);
    await pool.query(
      `insert into grupos (legacy_id, viaje_id, colegio_id, curso, division, pasajeros_esperados, estado)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (legacy_id) where legacy_id is not null
         do update set
           viaje_id = excluded.viaje_id,
           colegio_id = excluded.colegio_id,
           curso = excluded.curso,
           division = excluded.division,
           pasajeros_esperados = excluded.pasajeros_esperados,
           estado = excluded.estado`,
      [
        legacyId,
        viajeId,
        colegioId,
        normalizeText(row.curso),
        normalizeText(row.division),
        pasajerosEsperados,
        grupoEstadoMap.toDb(row.estado)
      ]
    );
  });
  return {
    updated: saveResult.updated,
    failed: [...saveResult.failed, ...deleteResult.failed],
    deleted: deleteResult.updated
  };
}

async function listContratosAdmin() {
  const result = await getPool().query(`
    select
      c.legacy_id as id,
      c.codigo_contrato,
      col.nombre as colegio_nombre,
      g.legacy_id as grupo_id,
      v.nivel,
      v.destino as viaje,
      coalesce(g.curso, '') as curso,
      coalesce(g.division, '') as division,
      c.estado,
      to_char(c.fecha_creacion, 'YYYY-MM-DD') as fecha_creacion,
      c.observaciones,
      to_char(c.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
      to_char(c.updated_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
    from contratos c
    join viajes v on v.id = c.viaje_id
    left join grupos g on g.id = c.grupo_id
    left join colegios col on col.id = g.colegio_id
    order by c.created_at desc
  `);
  return result.rows.map((row) => ({
    ...row,
    estado: contratoEstadoMap.toClient(row.estado),
    colegio_id: `colegio-${slugify(row.colegio_nombre || "sin-colegio")}`
  }));
}

// grupo_id es opcional en la tabla, pero si la fila trae uno hay que poder
// resolverlo de verdad - un grupo_id colgante (typo, o el grupo todavía no
// se guardó) cae a failed en vez de guardar un contrato mal vinculado.
async function saveContratosAdmin(rows, deleteIds = [], actorUsername) {
  const pool = getPool();
  const deleteResult = await runBatch(deleteIds.map((id) => ({ id })), async (row) => {
    await pool.query(`delete from contratos where legacy_id = $1`, [row.id]);
  });
  const saveResult = await runBatch(rows, async (row) => {
    const legacyId = normalizeText(row.id);
    if (!legacyId) throw friendlyError("Falta el id del contrato.");
    let viajeId = null;
    let grupoId = null;
    const grupoLegacyId = normalizeText(row.grupo_id);
    if (grupoLegacyId) {
      const grupoResult = await pool.query(
        `select g.id, g.viaje_id, v.nivel, v.destino
         from grupos g
         join viajes v on v.id = g.viaje_id
         where g.legacy_id = $1`,
        [grupoLegacyId]
      );
      if (!grupoResult.rows.length) {
        throw friendlyError(`El grupo "${grupoLegacyId}" todavía no existe - guardalo antes que el contrato.`);
      }
      grupoId = grupoResult.rows[0].id;
      viajeId = grupoResult.rows[0].viaje_id;
      const nivelEnviado = comparableText(row.nivel);
      const viajeEnviado = comparableText(row.viaje);
      if (nivelEnviado && nivelEnviado !== comparableText(grupoResult.rows[0].nivel)) {
        throw friendlyError("El nivel del contrato no coincide con el nivel de su grupo.");
      }
      if (viajeEnviado && viajeEnviado !== comparableText(grupoResult.rows[0].destino)) {
        throw friendlyError("El viaje del contrato no coincide con el viaje de su grupo.");
      }
    } else {
      viajeId = await findOrCreateViaje(pool, { nivel: row.nivel, viajeTexto: row.viaje });
    }
    await pool.query(
      `insert into contratos (legacy_id, codigo_contrato, viaje_id, grupo_id, estado, fecha_creacion, observaciones)
       values ($1,$2,$3,$4,$5,coalesce($6::date, current_date),$7)
       on conflict (legacy_id) where legacy_id is not null
         do update set
           codigo_contrato = excluded.codigo_contrato,
           viaje_id = excluded.viaje_id,
           grupo_id = excluded.grupo_id,
           estado = excluded.estado,
           observaciones = excluded.observaciones`,
      [
        legacyId,
        normalizeText(row.codigo_contrato) || null,
        viajeId,
        grupoId,
        contratoEstadoMap.toDb(row.estado),
        parseDate(row.fecha_creacion, "fecha_creacion"),
        normalizeText(row.observaciones)
      ]
    );
  });
  return {
    updated: saveResult.updated,
    failed: [...saveResult.failed, ...deleteResult.failed],
    deleted: deleteResult.updated
  };
}

// ============ PASAJEROS + RESPONSABLE (migración a Supabase, 24/07) ============

// Busca un responsable por documento (case-insensitive vía tipo+numero). Si
// no trae documento (habitual - el formulario no lo exige), SIEMPRE crea uno
// nuevo: el índice único de responsables es parcial (where numero_documento
// is not null) a propósito, así que NULL nunca "conflictua" con otro NULL -
// no hay forma de correlacionar dos responsables sin un documento real, y
// forzarlo sería mezclar personas distintas.
async function findOrCreateResponsable(queryable, { nombre, numeroDocumento, telefono, cuilCuit }) {
  const doc = normalizeDigits(numeroDocumento) || null;
  const result = await queryable.query(
    `insert into responsables (nombre, tipo_documento, numero_documento, telefono, cuil_cuit)
     values ($1, 'DNI', $2, $3, $4)
     on conflict (tipo_documento, numero_documento) where numero_documento is not null
       do update set
         numero_documento = excluded.numero_documento,
         telefono = coalesce(nullif(excluded.telefono, ''), responsables.telefono),
         cuil_cuit = coalesce(nullif(excluded.cuil_cuit, ''), responsables.cuil_cuit)
     returning id`,
    [normalizeText(nombre), doc, normalizeText(telefono), normalizeText(cuilCuit)]
  );
  return result.rows[0].id;
}

async function listPasajerosAdmin() {
  const result = await getPool().query(`
    select
      p.legacy_id as id,
      g.legacy_id as grupo_id,
      coalesce(ct.legacy_id, '') as contrato_id,
      coalesce(ct.codigo_contrato, '') as codigo_contrato,
      per.nombre,
      per.numero_documento as dni,
      to_char(per.nacimiento, 'YYYY-MM-DD') as nacimiento,
      coalesce(per.telefono, '') as telefono,
      coalesce(r.nombre, '') as responsable_nombre,
      coalesce(r.numero_documento, '') as responsable_dni,
      coalesce(r.telefono, '') as responsable_telefono,
      coalesce(r.cuil_cuit, '') as responsable_cuil_cuit,
      coalesce(pr.vinculo, '') as vinculo,
      p.estado,
      p.documentacion_estado,
      p.ficha_medica_estado,
      p.pago_estado,
      coalesce(p.observaciones, '') as observaciones,
      to_char(p.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
      to_char(p.updated_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
    from pasajeros p
    join personas per on per.id = p.persona_id
    join grupos g on g.id = p.grupo_id
    left join contratos ct on ct.id = p.contrato_id
    left join pasajero_responsables pr on pr.pasajero_id = p.id and pr.es_principal = true
    left join responsables r on r.id = pr.responsable_id
    order by p.created_at desc
  `);
  return result.rows.map((row) => ({
    ...row,
    estado: pasajeroEstadoMap.toClient(row.estado),
    documentacion_estado: documentacionEstadoMap.toClient(row.documentacion_estado),
    ficha_medica_estado: fichaMedicaEstadoMap.toClient(row.ficha_medica_estado),
    pago_estado: pagoEstadoMap.toClient(row.pago_estado)
  }));
}

// grupo_id es obligatorio (un pasajero SIEMPRE cuelga de un grupo real ya
// guardado - ver riesgo del plan) y viaje_id se resuelve siempre A TRAVÉS
// del grupo, nunca de nivel/viaje propios (la fila plana de pasajero no
// trae esos campos). contrato_id es opcional.
//
// legacy_id NO es el row.id crudo del cliente (`pasajero-${dni}`, que se
// recalcula en cada guardado y el cliente nunca lee de vuelta - confirmado,
// no aparece en sheetPassengerFromRow) - se compone con el viaje_id interno
// (dni::viajeId) para que sea siempre único incluso si la MISMA persona
// tiene pasajeros en dos viajes distintos (dos años, dos destinos), que es
// exactamente el caso real que unique(persona_id, viaje_id) ya modela. Con
// el row.id crudo del cliente, ese caso normal chocaría contra
// pasajeros_legacy_id_uk aunque persona_id+viaje_id sean distintos.
//
// Persona se resuelve antes de abrir la transacción (mismo motivo que
// insertFichaPublica: no retener su lock bajo carga concurrente). Pasajero,
// responsable principal y el vínculo sí se escriben juntos.
async function savePasajerosAdmin(rows, deleteIds = [], actorUsername) {
  const pool = getPool();
  const deleteResult = await runBatch(deleteIds.map((id) => ({ id })), async (row) => {
    await pool.query(`delete from pasajeros where legacy_id = $1`, [row.id]);
  });
  const saveResult = await runBatch(rows, async (row) => {
    const dni = normalizeDigits(row.dni);
    if (dni.length < 6) throw friendlyError("El DNI del pasajero debe tener al menos 6 dígitos.");
    const grupoLegacyId = normalizeText(row.grupo_id);
    if (!grupoLegacyId) throw friendlyError("Falta el grupo del pasajero.");
    const grupoResult = await pool.query(`select id, viaje_id from grupos where legacy_id = $1`, [grupoLegacyId]);
    if (!grupoResult.rows.length) {
      throw friendlyError(`El grupo "${grupoLegacyId}" todavía no existe - guardalo antes que el pasajero.`);
    }
    const grupoId = grupoResult.rows[0].id;
    const viajeId = grupoResult.rows[0].viaje_id;

    let contratoId = null;
    const contratoLegacyId = normalizeText(row.contrato_id);
    if (contratoLegacyId) {
      const contratoResult = await pool.query(
        `select id, grupo_id, viaje_id from contratos where legacy_id = $1`,
        [contratoLegacyId]
      );
      if (!contratoResult.rows.length) {
        throw friendlyError(`El contrato "${contratoLegacyId}" todavía no existe.`);
      }
      if (String(contratoResult.rows[0].viaje_id) !== String(viajeId)) {
        throw friendlyError("El contrato elegido pertenece a otro viaje.");
      }
      if (
        contratoResult.rows[0].grupo_id &&
        String(contratoResult.rows[0].grupo_id) !== String(grupoId)
      ) {
        throw friendlyError("El contrato elegido pertenece a otro grupo.");
      }
      contratoId = contratoResult.rows[0].id;
    }

    const personaId = await findOrCreatePersona(pool, {
      numeroDocumento: row.dni,
      nombre: row.nombre,
      nacimiento: row.nacimiento,
      telefono: row.telefono
    });
    const legacyId = `${dni}::${viajeId}`;

    // Revisión (24/07): responsable, pasajero y el vínculo pasajero-
    // responsable van en la MISMA transacción - a diferencia de
    // persona/grupo/contrato (resueltos arriba, sobre el pool directo,
    // mismo motivo que insertFichaPublica: esos SÍ pueden tener muchas
    // escrituras concurrentes convergiendo en la misma fila bajo carga
    // real), un responsable es casi siempre exclusivo de este pasajero -
    // no hay el mismo riesgo de lock compartido bajo carga, y sí importa
    // que un responsable no quede huérfano si el guardado del pasajero
    // falla después.
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const pasajeroResult = await client.query(
        `insert into pasajeros
           (legacy_id, persona_id, viaje_id, grupo_id, contrato_id, estado,
            documentacion_estado, ficha_medica_estado, pago_estado, observaciones)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         on conflict (persona_id, viaje_id)
           do update set
             legacy_id = excluded.legacy_id,
             grupo_id = excluded.grupo_id,
             contrato_id = excluded.contrato_id,
             estado = excluded.estado,
             documentacion_estado = excluded.documentacion_estado,
             ficha_medica_estado = excluded.ficha_medica_estado,
             pago_estado = excluded.pago_estado,
             observaciones = excluded.observaciones
         returning id`,
        [
          legacyId,
          personaId,
          viajeId,
          grupoId,
          contratoId,
          pasajeroEstadoMap.toDb(row.estado),
          documentacionEstadoMap.toDb(row.documentacion_estado),
          fichaMedicaEstadoMap.toDb(row.ficha_medica_estado),
          pagoEstadoMap.toDb(row.pago_estado),
          normalizeText(row.observaciones)
        ]
      );
      const pasajeroId = pasajeroResult.rows[0].id;
      let responsableId = null;
      if (normalizeDigits(row.responsable_dni)) {
        responsableId = await findOrCreateResponsable(client, {
          nombre: row.responsable_nombre,
          numeroDocumento: row.responsable_dni,
          telefono: row.responsable_telefono,
          cuilCuit: row.responsable_cuil_cuit
        });
      } else {
        // Sin DNI no existe una clave natural segura. Al editar un pasajero
        // se reutiliza su responsable principal actual, evitando crear una
        // fila huérfana nueva en cada guardado. Solo se crea uno si todavía
        // no había vínculo.
        const existing = await client.query(
          `select r.id
           from pasajero_responsables pr
           join responsables r on r.id = pr.responsable_id
           where pr.pasajero_id = $1 and pr.es_principal = true
           limit 1`,
          [pasajeroId]
        );
        if (existing.rows.length) {
          responsableId = existing.rows[0].id;
          await client.query(
            `update responsables set
               nombre = coalesce(nullif($2, ''), nombre),
               telefono = coalesce(nullif($3, ''), telefono),
               cuil_cuit = coalesce(nullif($4, ''), cuil_cuit)
             where id = $1`,
            [
              responsableId,
              normalizeText(row.responsable_nombre),
              normalizeText(row.responsable_telefono),
              normalizeText(row.responsable_cuil_cuit)
            ]
          );
        } else {
          responsableId = await findOrCreateResponsable(client, {
            nombre: row.responsable_nombre,
            numeroDocumento: "",
            telefono: row.responsable_telefono,
            cuilCuit: row.responsable_cuil_cuit
          });
        }
      }
      // Reemplazo completo del vínculo (no upsert) - la fila plana solo
      // trae UN responsable por pasajero, así que "borrar los vínculos
      // viejos e insertar el actual" es el equivalente correcto a mandar
      // el estado completo, igual que hace el cliente con cada guardado.
      await client.query(`delete from pasajero_responsables where pasajero_id = $1`, [pasajeroId]);
      await client.query(
        `insert into pasajero_responsables (pasajero_id, responsable_id, vinculo, es_principal)
         values ($1, $2, $3, true)`,
        [pasajeroId, responsableId, normalizeText(row.vinculo) || "Responsable"]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  });
  return {
    updated: saveResult.updated,
    failed: [...saveResult.failed, ...deleteResult.failed],
    deleted: deleteResult.updated
  };
}

// ============ TURISMO admin (migración a Supabase, 24/07) ============
//
// Solo el almacenamiento interno del admin (crear/editar/listar viajes de
// Turismo) - la publicación pública sigue siendo el export manual a JSON
// (exportAdminTurismoJson en app.js), sin cambios acá. viajes.estado y
// categoria ya viajan en minúscula desde el cliente (app.js:1903), sin
// mapIn/mapOut. legacy_id de Turismo SÍ es estable de por vida (a
// diferencia del de pasajeros) - el cliente lo genera una sola vez
// (`viaje-${Date.now()}`) y lo reusa en cada guardado siguiente.

function parseNumeric(value, fieldName) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw friendlyError(`El campo "${fieldName}" debe ser numérico.`);
  }
  return n;
}

function parseDate(value, fieldName) {
  const text = normalizeText(value);
  if (!text) return null;
  if (!ISO_DATE_RE.test(text)) {
    throw friendlyError(`El campo "${fieldName}" debe tener formato YYYY-MM-DD.`);
  }
  const [year, month, day] = text.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw friendlyError(`El campo "${fieldName}" contiene una fecha inválida.`);
  }
  return text;
}

function parseBool(value, fieldName) {
  if (value === true || value === false) return value;
  const normalized = normalizeText(value).toUpperCase();
  if (!normalized) return false;
  if (normalized === "TRUE") return true;
  if (normalized === "FALSE") return false;
  throw friendlyError(`El campo "${fieldName}" debe ser TRUE o FALSE.`);
}

// Espeja safeJson/splitPipe de turismoRowToTrip en app.js. Los vacíos son
// listas vacías válidas; JSON corrupto se rechaza para no borrar datos en
// silencio.
function splitPipe(value) {
  return String(value || "").split("|").map((s) => s.trim()).filter(Boolean);
}

function safeJsonArray(value, fieldName) {
  if (value === "" || value === null || value === undefined) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      throw friendlyError(`El campo "${fieldName}" debe contener una lista JSON.`);
    }
    return parsed;
  } catch (error) {
    if (error.friendlyMessage) throw error;
    throw friendlyError(`El campo "${fieldName}" contiene JSON inválido.`);
  }
}

async function listTurismoAdmin() {
  const result = await getPool().query(`
    select
      v.legacy_id as id,
      v.slug,
      v.destino,
      v.titulo,
      d.duracion,
      d.temporada,
      to_char(v.fecha_salida, 'YYYY-MM-DD') as fecha_salida,
      to_char(v.fecha_regreso, 'YYYY-MM-DD') as fecha_regreso,
      v.salida_garantizada,
      d.precio_desde,
      d.precio_valor,
      d.moneda,
      d.precio_base_doble,
      d.suplemento_single,
      d.precio_menor,
      d.condicion_venta,
      coalesce(d.categorias, '[]'::jsonb) as categorias,
      d.descripcion_corta,
      d.descripcion_larga,
      coalesce(d.incluye, '[]'::jsonb) as incluye,
      coalesce(d.no_incluye, '[]'::jsonb) as no_incluye,
      coalesce(d.formas_pago, '[]'::jsonb) as formas_pago,
      coalesce(d.itinerario, '[]'::jsonb) as itinerario,
      coalesce(d.fotos, '[]'::jsonb) as fotos,
      v.estado,
      v.destacado,
      v.orden,
      to_char(v.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
      to_char(v.updated_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
    from viajes v
    join viajes_turismo_detalle d on d.viaje_id = v.id
    where v.categoria = 'turismo'
    order by v.orden nulls last, v.created_at desc
  `);
  return result.rows.map((row) => ({
    ...row,
    salida_garantizada: row.salida_garantizada ? "TRUE" : "FALSE",
    destacado: row.destacado ? "TRUE" : "FALSE",
    categorias: (row.categorias || []).join("|"),
    incluye: (row.incluye || []).join("|"),
    no_incluye: (row.no_incluye || []).join("|"),
    formas_pago: (row.formas_pago || []).join("|"),
    itinerario: JSON.stringify(row.itinerario || []),
    fotos: JSON.stringify(row.fotos || [])
  }));
}

// viajes + viajes_turismo_detalle son 1:1 (mismo viaje_id) - se escriben
// juntos en una transacción real, un viaje sin su detalle (o viceversa)
// sería un estado a medias. on delete cascade en viajes_turismo_detalle
// limpia el detalle solo cuando se borra el viaje.
async function saveTurismoAdmin(rows, deleteIds = [], actorUsername) {
  const pool = getPool();
  const deleteResult = await runBatch(deleteIds.map((id) => ({ id })), async (row) => {
    await pool.query(`delete from viajes where legacy_id = $1 and categoria = 'turismo'`, [row.id]);
  });
  const saveResult = await runBatch(rows, async (row) => {
    const legacyId = normalizeText(row.id);
    if (!legacyId) throw friendlyError("Falta el id del viaje de Turismo.");
    const estado = normalizeText(row.estado) || "borrador";
    if (!["borrador", "revision", "activo", "inactivo"].includes(estado)) {
      throw friendlyError(`Estado de Turismo no reconocido: "${row.estado}".`);
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const viajeResult = await client.query(
        `insert into viajes
           (legacy_id, slug, categoria, destino, titulo, fecha_salida, fecha_regreso,
            salida_garantizada, estado, destacado, orden)
         values ($1,$2,'turismo',$3,$4,$5,$6,$7,$8,$9,$10)
         on conflict (legacy_id) where legacy_id is not null
           do update set
             slug = excluded.slug,
             destino = excluded.destino,
             titulo = excluded.titulo,
             fecha_salida = excluded.fecha_salida,
             fecha_regreso = excluded.fecha_regreso,
             salida_garantizada = excluded.salida_garantizada,
             estado = excluded.estado,
             destacado = excluded.destacado,
             orden = excluded.orden
         returning id`,
        [
          legacyId,
          normalizeText(row.slug) || null,
          normalizeText(row.destino),
          normalizeText(row.titulo),
          parseDate(row.fecha_salida, "fecha_salida"),
          parseDate(row.fecha_regreso, "fecha_regreso"),
          parseBool(row.salida_garantizada, "salida_garantizada"),
          estado,
          parseBool(row.destacado, "destacado"),
          parseNumeric(row.orden, "orden") ?? 999
        ]
      );
      const viajeId = viajeResult.rows[0].id;
      await client.query(
        `insert into viajes_turismo_detalle
           (viaje_id, duracion, temporada, precio_desde, precio_valor, moneda,
            precio_base_doble, suplemento_single, precio_menor, condicion_venta,
            categorias, descripcion_corta, descripcion_larga, incluye, no_incluye,
            formas_pago, itinerario, fotos)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14::jsonb,$15::jsonb,$16::jsonb,$17::jsonb,$18::jsonb)
         on conflict (viaje_id) do update set
           duracion = excluded.duracion,
           temporada = excluded.temporada,
           precio_desde = excluded.precio_desde,
           precio_valor = excluded.precio_valor,
           moneda = excluded.moneda,
           precio_base_doble = excluded.precio_base_doble,
           suplemento_single = excluded.suplemento_single,
           precio_menor = excluded.precio_menor,
           condicion_venta = excluded.condicion_venta,
           categorias = excluded.categorias,
           descripcion_corta = excluded.descripcion_corta,
           descripcion_larga = excluded.descripcion_larga,
           incluye = excluded.incluye,
           no_incluye = excluded.no_incluye,
           formas_pago = excluded.formas_pago,
           itinerario = excluded.itinerario,
           fotos = excluded.fotos`,
        [
          viajeId,
          normalizeText(row.duracion),
          normalizeText(row.temporada),
          parseNumeric(row.precio_desde, "precio_desde"),
          parseNumeric(row.precio_valor, "precio_valor"),
          normalizeText(row.moneda) || "USD",
          parseNumeric(row.precio_base_doble, "precio_base_doble"),
          parseNumeric(row.suplemento_single, "suplemento_single"),
          parseNumeric(row.precio_menor, "precio_menor"),
          normalizeText(row.condicion_venta),
          JSON.stringify(splitPipe(row.categorias)),
          normalizeText(row.descripcion_corta),
          normalizeText(row.descripcion_larga),
          JSON.stringify(splitPipe(row.incluye)),
          JSON.stringify(splitPipe(row.no_incluye)),
          JSON.stringify(splitPipe(row.formas_pago)),
          JSON.stringify(safeJsonArray(row.itinerario, "itinerario")),
          JSON.stringify(safeJsonArray(row.fotos, "fotos"))
        ]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  });
  return {
    updated: saveResult.updated,
    failed: [...saveResult.failed, ...deleteResult.failed],
    deleted: deleteResult.updated
  };
}

// Mantenimiento de una sola ejecución para retirar el lote controlado usado
// durante el smoke test final de producción. Está deliberadamente acotado a
// identificadores QA exactos y aborta la transacción completa ante cualquier
// relación inesperada. El respaldo queda persistido como JSONB en la tabla de
// auditoría antes de borrar; respaldo y bajas se confirman en el mismo COMMIT.
const QA_CLEANUP_ACTION = "qa_smoketest_backup_y_limpieza_20260728_v1";
const QA_GROUP_LEGACY_ID = "secundaria-prueba-qa-smoketest-colegio-prueba-qa-1ro-z-test";
const QA_DNIS = ["99000001", "99000002", "99000003", "99000004"];
const QA_CONTRACT_CODE = "CON-SEC-COLEGIO-PRUEBA-1RO-Z-TEST-PRUEBA-QA-SMOKETEST";

async function cleanupQaSmoketestOnce() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("select pg_advisory_xact_lock(hashtext($1))", [QA_CLEANUP_ACTION]);

    const completed = await client.query(
      `select id
       from eventos_administrativos
       where accion = $1
       limit 1`,
      [QA_CLEANUP_ACTION]
    );
    if (completed.rows.length) {
      const remaining = await client.query(
        `select
           (select count(*)::int from grupos where legacy_id = $1) as grupos,
           (select count(*)::int from personas where numero_documento = any($2::text[])) as personas,
           (select count(*)::int from fichas_adhesion where pasajero_numero_documento = any($2::text[])) as fichas`,
        [QA_GROUP_LEGACY_ID, QA_DNIS]
      );
      await client.query("COMMIT");
      return { state: "already_done", remaining: remaining.rows[0] };
    }

    const groupResult = await client.query(
      `select
         g.*, v.destino as viaje_destino, v.categoria as viaje_categoria,
         col.nombre as colegio_nombre
       from grupos g
       join viajes v on v.id = g.viaje_id
       join colegios col on col.id = g.colegio_id
       where g.legacy_id = $1
       for update of g`,
      [QA_GROUP_LEGACY_ID]
    );
    if (groupResult.rows.length !== 1) {
      throw new Error(`Limpieza QA abortada: se esperaba 1 grupo y se encontraron ${groupResult.rows.length}.`);
    }
    const group = groupResult.rows[0];
    if (
      group.viaje_destino !== "PRUEBA QA SMOKETEST" ||
      group.viaje_categoria !== "estudiantil" ||
      group.colegio_nombre !== "Colegio Prueba QA" ||
      group.curso !== "1ro" ||
      group.division !== "Z-TEST"
    ) {
      throw new Error("Limpieza QA abortada: la identidad del grupo no coincide exactamente con el lote controlado.");
    }

    const contractsResult = await client.query(
      `select *
       from contratos
       where grupo_id = $1
       for update`,
      [group.id]
    );
    if (
      contractsResult.rows.length !== 1 ||
      contractsResult.rows[0].codigo_contrato !== QA_CONTRACT_CODE ||
      contractsResult.rows[0].observaciones !== "QA-CRUD-001" ||
      contractsResult.rows[0].estado !== "activo"
    ) {
      throw new Error("Limpieza QA abortada: el contrato vinculado no coincide exactamente con el contrato de prueba.");
    }
    const contract = contractsResult.rows[0];

    const peopleResult = await client.query(
      `select *
       from personas
       where numero_documento = any($1::text[])
       order by numero_documento
       for update`,
      [QA_DNIS]
    );
    if (
      peopleResult.rows.length !== 4 ||
      peopleResult.rows.some((row, index) =>
        row.numero_documento !== QA_DNIS[index] ||
        !String(row.nombre || "").toUpperCase().includes("PRUEBA QA")
      )
    ) {
      throw new Error("Limpieza QA abortada: las cuatro personas QA no coinciden con el lote esperado.");
    }
    const personIds = peopleResult.rows.map((row) => row.id);

    const inscriptionsResult = await client.query(
      `select *
       from inscripciones
       where persona_id = any($1::uuid[])
       order by created_at
       for update`,
      [personIds]
    );
    if (
      inscriptionsResult.rows.length !== 4 ||
      inscriptionsResult.rows.some((row) =>
        String(row.viaje_id) !== String(group.viaje_id) ||
        (row.grupo_id && String(row.grupo_id) !== String(group.id)) ||
        (row.contrato_id && String(row.contrato_id) !== String(contract.id))
      )
    ) {
      throw new Error("Limpieza QA abortada: las inscripciones no coinciden con el viaje QA o apuntan a otro grupo/contrato.");
    }
    const inscriptionIds = inscriptionsResult.rows.map((row) => row.id);

    const fichasResult = await client.query(
      `select *
       from fichas_adhesion
       where inscripcion_id = any($1::uuid[])
       order by pasajero_numero_documento
       for update`,
      [inscriptionIds]
    );
    if (
      fichasResult.rows.length !== 4 ||
      fichasResult.rows.some((row, index) =>
        row.pasajero_numero_documento !== QA_DNIS[index] ||
        !String(row.pasajero_nombre || "").toUpperCase().includes("PRUEBA QA")
      )
    ) {
      throw new Error("Limpieza QA abortada: las cuatro fichas no coinciden exactamente con el lote esperado.");
    }
    const fichaIds = fichasResult.rows.map((row) => row.id);

    const passengersResult = await client.query(
      `select p.*, per.numero_documento
       from pasajeros p
       join personas per on per.id = p.persona_id
       where p.persona_id = any($1::uuid[])
          or p.grupo_id = $2
          or p.contrato_id = $3
       for update of p`,
      [personIds, group.id, contract.id]
    );
    if (
      passengersResult.rows.length !== 1 ||
      passengersResult.rows[0].numero_documento !== "99000002" ||
      String(passengersResult.rows[0].grupo_id) !== String(group.id) ||
      String(passengersResult.rows[0].contrato_id) !== String(contract.id)
    ) {
      throw new Error("Limpieza QA abortada: Pasajeros contiene relaciones distintas a la única pasajera QA esperada.");
    }
    const passenger = passengersResult.rows[0];

    const externalRefs = await client.query(
      `select
         (select count(*)::int
            from inscripciones
           where (viaje_id = $1 or grupo_id = $2 or contrato_id = $3)
             and not (id = any($4::uuid[]))) as inscripciones,
         (select count(*)::int
            from inscripciones
           where duplicada_de_id = any($4::uuid[])
             and not (id = any($4::uuid[]))) as duplicadas,
         (select count(*)::int
            from pasajeros
           where (viaje_id = $1 or grupo_id = $2 or contrato_id = $3)
             and id <> $5) as pasajeros,
         (select count(*)::int from grupos where viaje_id = $1 and id <> $2) as grupos_viaje,
         (select count(*)::int from grupos where colegio_id = $6 and id <> $2) as grupos_colegio,
         (select count(*)::int from contratos where viaje_id = $1 and id <> $3) as contratos,
         (select count(*)::int from viajes_turismo_detalle where viaje_id = $1) as turismo`,
      [group.viaje_id, group.id, contract.id, inscriptionIds, passenger.id, group.colegio_id]
    );
    if (Object.values(externalRefs.rows[0]).some((value) => Number(value) !== 0)) {
      throw new Error("Limpieza QA abortada: existen referencias externas al lote de prueba.");
    }

    const responsibilityLinks = await client.query(
      `select pr.*, to_jsonb(r.*) as responsable
       from pasajero_responsables pr
       join responsables r on r.id = pr.responsable_id
       where pr.pasajero_id = $1`,
      [passenger.id]
    );
    const responsibleIds = responsibilityLinks.rows.map((row) => row.responsable_id);

    const entityIds = [
      group.id,
      contract.id,
      passenger.id,
      group.viaje_id,
      group.colegio_id,
      ...personIds,
      ...inscriptionIds,
      ...fichaIds,
      ...responsibleIds
    ];
    const documentsResult = await client.query(
      `select *
       from documentos
       where entidad_id = any($1::uuid[])`,
      [entityIds]
    );
    const legacyMapResult = await client.query(
      `select *
       from legacy_id_map
       where entidad_id = any($1::uuid[])`,
      [entityIds]
    );

    const backup = {
      cleanupAction: QA_CLEANUP_ACTION,
      capturedAt: new Date().toISOString(),
      grupos: [group],
      contratos: contractsResult.rows,
      personas: peopleResult.rows,
      inscripciones: inscriptionsResult.rows,
      fichas_adhesion: fichasResult.rows,
      pasajeros: passengersResult.rows,
      pasajero_responsables: responsibilityLinks.rows,
      documentos: documentsResult.rows,
      legacy_id_map: legacyMapResult.rows
    };
    await client.query(
      `insert into eventos_administrativos
         (entidad, entidad_id, accion, actor_username, detalle)
       values ('lote_qa', $1, $2, 'wilson-maintenance', $3::jsonb)`,
      [group.id, QA_CLEANUP_ACTION, JSON.stringify(backup)]
    );

    await client.query(`delete from documentos where entidad_id = any($1::uuid[])`, [entityIds]);
    await client.query(`delete from legacy_id_map where entidad_id = any($1::uuid[])`, [entityIds]);
    await client.query(`delete from fichas_adhesion where id = any($1::uuid[])`, [fichaIds]);
    await client.query(`delete from inscripciones where id = any($1::uuid[])`, [inscriptionIds]);
    await client.query(`delete from pasajeros where id = $1`, [passenger.id]);
    await client.query(`delete from contratos where id = $1`, [contract.id]);
    await client.query(`delete from grupos where id = $1`, [group.id]);
    await client.query(`delete from personas where id = any($1::uuid[])`, [personIds]);
    if (responsibleIds.length) {
      await client.query(
        `delete from responsables r
         where r.id = any($1::uuid[])
           and not exists (
             select 1 from pasajero_responsables pr where pr.responsable_id = r.id
           )`,
        [responsibleIds]
      );
    }
    await client.query(`delete from colegios where id = $1`, [group.colegio_id]);
    await client.query(`delete from viajes where id = $1`, [group.viaje_id]);

    const remaining = await client.query(
      `select
         (select count(*)::int from grupos where legacy_id = $1) as grupos,
         (select count(*)::int from contratos where codigo_contrato = $2) as contratos,
         (select count(*)::int from personas where numero_documento = any($3::text[])) as personas,
         (select count(*)::int from fichas_adhesion where pasajero_numero_documento = any($3::text[])) as fichas,
         (select count(*)::int
            from pasajeros p
            join personas per on per.id = p.persona_id
           where per.numero_documento = any($3::text[])) as pasajeros`,
      [QA_GROUP_LEGACY_ID, QA_CONTRACT_CODE, QA_DNIS]
    );
    if (Object.values(remaining.rows[0]).some((value) => Number(value) !== 0)) {
      throw new Error("Limpieza QA abortada: quedaron registros objetivo después de las bajas.");
    }

    await client.query("COMMIT");
    return {
      state: "done",
      deleted: {
        grupos: 1,
        contratos: 1,
        personas: peopleResult.rows.length,
        inscripciones: inscriptionsResult.rows.length,
        fichas: fichasResult.rows.length,
        pasajeros: passengersResult.rows.length,
        responsables: responsibleIds.length,
        documentos: documentsResult.rows.length,
        legacyMap: legacyMapResult.rows.length
      },
      remaining: remaining.rows[0]
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getPool,
  insertFichaPublica,
  listFichasAdmin,
  updateFichasAdmin,
  isFichaPostgresId,
  listGruposAdmin,
  saveGruposAdmin,
  listContratosAdmin,
  saveContratosAdmin,
  listPasajerosAdmin,
  savePasajerosAdmin,
  listTurismoAdmin,
  saveTurismoAdmin,
  cleanupQaSmoketestOnce,
  findOrCreateColegio,
  normalizeSignatureDataUrl,
  grupoEstadoMap,
  contratoEstadoMap,
  pasajeroEstadoMap,
  documentacionEstadoMap,
  fichaMedicaEstadoMap,
  pagoEstadoMap
};

if (process.env.NODE_ENV === "test") {
  module.exports.__test = {
    parseNumeric,
    parseDate,
    parseBool,
    safeJsonArray,
    normalizeSignatureDataUrl
  };
}
