// Adaptador Postgres/Supabase para FICHAS_ADHESION, GRUPOS, CONTRATOS,
// PASAJEROS y TURISMO. server.js mantiene el cambio de fuente detrás de una
// bandera para poder respaldar/migrar/verificar datos antes del corte.
const { Pool } = require("pg");

let pool = null;

function safeDatabaseErrorForLog(error) {
  return {
    name: String(error?.name || "Error").slice(0, 80),
    code: String(error?.code || "DATABASE_ERROR").slice(0, 80)
  };
}

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL no configurada. Cargarla en Railway o en un .env local (ver README)."
    );
  }
  if (!pool) {
    const ca = String(process.env.SUPABASE_DB_CA_CERT || "").replace(/\\n/g, "\n").trim();
    const verifyFull = process.env.EAA_POSTGRES_TLS_VERIFY_FULL === "true";
    if (verifyFull && !ca) {
      throw new Error("EAA_POSTGRES_TLS_VERIFY_FULL=true requiere SUPABASE_DB_CA_CERT.");
    }
    const connectionUrl = new URL(process.env.DATABASE_URL);
    if (verifyFull) {
      // node-postgres reemplaza el objeto `ssl` si estos parámetros están
      // presentes en la URL. Quitarlos asegura que use el CA configurado.
      ["sslmode", "sslcert", "sslkey", "sslrootcert"].forEach((key) => connectionUrl.searchParams.delete(key));
    }
    pool = new Pool({
      connectionString: connectionUrl.toString(),
      // La validación completa se activa solo junto con el CA de Supabase;
      // así una variable incompleta no corta producción silenciosamente.
      ssl: verifyFull
        ? { rejectUnauthorized: true, ca }
        : { rejectUnauthorized: false },
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
      console.error(
        "Error en una conexión inactiva del pool de Postgres (no se cae el servidor):",
        safeDatabaseErrorForLog(error)
      );
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
async function findOrCreatePersona(queryable, { numeroDocumento, nombre, apellido, nacimiento, telefono }) {
  // Ficha v2: el documento puede ser un pasaporte alfanumérico; el
  // validador compartido ya lo normalizó (solo dígitos para DNI/LC/LE).
  const doc = normalizeText(numeroDocumento).toUpperCase();
  const nacimientoValido = parseDate(nacimiento, "nacimiento");
  // "do update set numero_documento = excluded.numero_documento" es un
  // no-op a propósito (el valor en conflicto ya es idéntico) - existe solo
  // para que "returning id" funcione también cuando la fila ya existía.
  // Con "do nothing" no se puede devolver el id de la fila existente en la
  // misma consulta. El nombre de una persona ya existente NUNCA se
  // sobreescribe (mismo comportamiento que antes).
  const result = await queryable.query(
    `insert into personas (tipo_documento, numero_documento, nombre, apellido, nacimiento, telefono)
     values ('DNI', $1, $2, $5, $3, $4)
     on conflict (tipo_documento, numero_documento)
       do update set
         numero_documento = excluded.numero_documento,
         apellido = coalesce(personas.apellido, excluded.apellido),
         nacimiento = coalesce(excluded.nacimiento, personas.nacimiento),
         telefono = coalesce(nullif(excluded.telefono, ''), personas.telefono)
     returning id`,
    [doc, normalizeText(nombre), nacimientoValido, normalizeText(telefono), normalizeText(apellido) || null]
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

// Ficha v2 - coincidencia EXACTA de contrato: colegio + curso (nivel) +
// destino + grado + división. Reemplaza la búsqueda difusa por texto. El
// grado se compara por dígitos para tolerar "5°", "5to" o "5".
async function listColegiosPublicos() {
  const result = await getPool().query(
    `select id::text as id, nombre, coalesce(localidad, '') as localidad, coalesce(provincia, '') as provincia
     from colegios where activo order by nombre`
  );
  return result.rows;
}

async function contextoInscripcion({ colegioId, nivel, viaje, grado, division }) {
  const vacio = { contrato: null, grupoId: null, planes: [] };
  if (!FICHA_UUID_RE.test(String(colegioId || ""))) return vacio;
  const contrato = await getPool().query(
    `select c.id::text as id, coalesce(c.codigo_contrato, '') as codigo, g.id::text as grupo_id
     from contratos c
     join grupos g on g.id = c.grupo_id
     join viajes v on v.id = c.viaje_id
     where g.colegio_id = $1 and c.estado = 'activo'
       and lower(coalesce(v.nivel, '')) = lower($2) and lower(v.destino) = lower($3)
       and regexp_replace(g.curso, '\\D', '', 'g') = regexp_replace($4, '\\D', '', 'g')
       and upper(g.division) = upper($5)
     order by c.created_at desc
     limit 1`,
    [colegioId, normalizeText(nivel), normalizeText(viaje), normalizeText(grado), normalizeText(division)]
  );
  if (!contrato.rows.length) return vacio;
  const planes = await getPool().query(
    `select id::text as id, nombre, cuotas, coalesce(descripcion, '') as descripcion
     from planes_pago where contrato_id = $1 and activo
     order by orden nulls last, cuotas`,
    [contrato.rows[0].id]
  );
  const { id, codigo, grupo_id: grupoId } = contrato.rows[0];
  return { contrato: { id, codigo }, grupoId, planes: planes.rows };
}

const vacioANull = (valor) => (normalizeText(valor) ? normalizeText(valor) : null);

// Traduce los datos ya validados por assets/js/modules/ficha-validation.js
// a las filas de inscripciones y fichas_adhesion. Función pura (testeable).
function mapFichaParaInsert(datos, contexto) {
  return {
    viajeTexto: `${datos.destino} ${datos.anio}`,
    inscripcion: {
      colegio_id: datos.colegioId || null,
      colegio_texto: datos.colegioId ? null : datos.colegioTexto,
      nivel: datos.nivel,
      grado: datos.grado,
      division: datos.division,
      grupo_id: contexto.grupoId || null,
      contrato_id: contexto.contrato?.id || null,
      plan_pago_id: datos.planPagoId || null
    },
    ficha: {
      pasajero_nombre: datos.pasajeroNombre,
      pasajero_apellido: datos.pasajeroApellido,
      pasajero_tipo_documento: datos.pasajeroTipoDocumento,
      pasajero_numero_documento: datos.pasajeroNumeroDocumento,
      pasajero_nacimiento: datos.pasajeroNacimiento,
      pasajero_sexo: datos.pasajeroSexo,
      responsable_nombre: datos.responsableNombre,
      responsable_apellido: datos.responsableApellido,
      responsable_tipo_documento: datos.responsableTipoDocumento,
      responsable_numero_documento: datos.responsableNumeroDocumento,
      responsable_nacimiento: datos.responsableNacimiento,
      responsable_parentesco: datos.responsableParentesco,
      responsable_cuil_cuit: datos.responsableCuilCuit,
      responsable_email: datos.responsableEmail,
      responsable_celular: datos.responsableCelular,
      responsable_telefono: vacioANull(datos.responsableTelefono),
      domicilio_calle: datos.domicilioCalle,
      domicilio_numero: datos.domicilioNumero,
      domicilio_piso: vacioANull(datos.domicilioPiso),
      domicilio_departamento: vacioANull(datos.domicilioDepartamento),
      domicilio_barrio: vacioANull(datos.domicilioBarrio),
      domicilio_localidad: datos.domicilioLocalidad,
      domicilio_provincia: datos.domicilioProvincia,
      domicilio_codigo_postal: datos.domicilioCodigoPostal,
      acepta_condiciones: datos.aceptaCondiciones === true,
      firma_storage_path: datos.firma
    }
  };
}

// Las columnas salen siempre de código propio (nunca del cliente), así que
// interpolarlas en el SQL es seguro; los valores van parametrizados.
function insertSql(tabla, fila) {
  const columnas = Object.keys(fila);
  return {
    text: `insert into ${tabla} (${columnas.join(", ")}) values (${columnas.map((_, i) => `$${i + 1}`).join(", ")})`,
    values: Object.values(fila)
  };
}

// Inserta una ficha de adhesión pública ya validada. Persona y viaje se
// resuelven con upserts atómicos FUERA de la transacción (auditoría 23/07:
// adentro serializaba una ráfaga de 30 fichas del mismo viaje y agotaba el
// pool); inscripción + ficha van juntas en una transacción real.
async function insertFichaPublica(datos, contexto) {
  const m = mapFichaParaInsert(datos, contexto);
  if (m.inscripcion.colegio_id) {
    const activo = await getPool().query(`select 1 from colegios where id = $1 and activo`, [m.inscripcion.colegio_id]);
    if (!activo.rows.length) {
      const error = friendlyError("El colegio elegido ya no está disponible. Elegilo de nuevo.");
      error.statusCode = 400;
      error.errores = { colegio: error.message };
      throw error;
    }
  }
  const personaId = await findOrCreatePersona(getPool(), {
    numeroDocumento: datos.pasajeroNumeroDocumento,
    nombre: datos.pasajeroNombre,
    apellido: datos.pasajeroApellido,
    nacimiento: datos.pasajeroNacimiento
  });
  const viajeId = await findOrCreateViaje(getPool(), { nivel: datos.nivel, viajeTexto: m.viajeTexto });
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const insc = insertSql("inscripciones", { persona_id: personaId, viaje_id: viajeId, ...m.inscripcion });
    const inscripcion = await client.query(`${insc.text} returning id`, insc.values);
    const fic = insertSql("fichas_adhesion", { inscripcion_id: inscripcion.rows[0].id, ...m.ficha });
    const ficha = await client.query(`${fic.text} returning id::text as id, created_at`, fic.values);
    await client.query("COMMIT");
    return { id: ficha.rows[0].id, createdAt: ficha.rows[0].created_at };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function insertFichaTutor(datos) {
  const sql = insertSql("fichas_tutor", {
    pasajero_nombre: datos.pasajeroNombre,
    pasajero_apellido: datos.pasajeroApellido,
    pasajero_numero_documento: datos.pasajeroNumeroDocumento,
    nombre: datos.nombre,
    apellido: datos.apellido,
    tipo_documento: datos.tipoDocumento,
    numero_documento: datos.numeroDocumento,
    cuil_cuit: datos.cuilCuit,
    celular: datos.celular,
    email: datos.email,
    parentesco: datos.parentesco,
    acepta_condiciones: datos.aceptaCondiciones === true
  });
  const result = await getPool().query(`${sql.text} returning id::text as id`, sql.values);
  return { id: result.rows[0].id };
}

async function setFichaEmailResultado(id, { estado, error = null }) {
  await getPool().query(
    `update fichas_adhesion
     set email_estado = $2, email_error = $3,
         email_enviado_at = case when $2 = 'enviado' then now() else email_enviado_at end
     where id = $1`,
    [id, estado, error]
  );
}

// Fila plana para el admin (contrato HTTP /api/google-sheets) y para el
// PDF/correo. Con `id` devuelve solo esa ficha.
async function listFichasAdmin(id = null) {
  const result = await getPool().query(`
    select
      f.id::text as id,
      'pax' as tipo,
      f.pasajero_numero_documento as pasajero_dni,
      f.pasajero_nombre, f.pasajero_apellido, f.pasajero_tipo_documento,
      to_char(f.pasajero_nacimiento, 'YYYY-MM-DD') as pasajero_nacimiento,
      f.pasajero_sexo,
      f.responsable_nombre, f.responsable_apellido, f.responsable_tipo_documento,
      f.responsable_numero_documento,
      to_char(f.responsable_nacimiento, 'YYYY-MM-DD') as responsable_nacimiento,
      f.responsable_parentesco, f.responsable_email,
      coalesce(f.responsable_telefono, '') as responsable_telefono,
      f.responsable_celular, f.responsable_cuil_cuit,
      f.domicilio_calle, f.domicilio_numero,
      coalesce(f.domicilio_piso, '') as domicilio_piso,
      coalesce(f.domicilio_departamento, '') as domicilio_departamento,
      coalesce(f.domicilio_barrio, '') as domicilio_barrio,
      f.domicilio_localidad, f.domicilio_provincia, f.domicilio_codigo_postal,
      case when f.acepta_condiciones then 'true' else 'false' end as acepta_condiciones,
      f.firma_storage_path as firma_data_url,
      i.nivel,
      v.destino as viaje,
      coalesce(i.colegio_id::text, '') as colegio_id,
      coalesce(col.nombre, i.colegio_texto, '') as colegio,
      coalesce(i.colegio_texto, '') as colegio_texto,
      case when i.colegio_id is null then 'FALSE' else 'TRUE' end as colegio_vinculado,
      i.grado, i.division,
      i.grado || ' ' || i.division as curso_division,
      coalesce(i.plan_pago_id::text, '') as plan_pago_id,
      coalesce(pp.nombre, '') as plan_nombre,
      coalesce(pp.cuotas::text, '') as plan_cuotas,
      coalesce(g.legacy_id, '') as grupo_asignado_id,
      coalesce(ct.legacy_id, '') as contrato_id,
      coalesce(ct.codigo_contrato, '') as codigo_contrato,
      f.estado_revision, f.documentacion_estado, f.ficha_medica_estado, f.autorizacion_estado,
      coalesce(f.motivo_rechazo, '') as motivo_rechazo,
      coalesce(f.observaciones, '') as observaciones,
      f.email_estado,
      coalesce(f.email_error, '') as email_error,
      coalesce(to_char(f.email_enviado_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '') as email_enviado_at,
      to_char(f.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
      to_char(f.updated_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
    from fichas_adhesion f
    join inscripciones i on i.id = f.inscripcion_id
    join viajes v on v.id = i.viaje_id
    left join colegios col on col.id = i.colegio_id
    left join planes_pago pp on pp.id = i.plan_pago_id
    left join grupos g on g.id = i.grupo_id
    left join contratos ct on ct.id = i.contrato_id
    where ($1::uuid is null or f.id = $1::uuid)
    order by f.created_at desc
  `, [id]);
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
  return friendlyError("No se pudo guardar la ficha por un error interno. Volvé a intentar.");
}

// Actualiza desde el admin solo lo que gestiona la agencia: estados de
// revisión y la pertenencia (colegio, plan, grupo, contrato). Los datos
// personales, el consentimiento y la firma los carga la familia y no se
// reescriben desde acá. Cada ficha en su propia transacción (auditoría
// 23/07): una que falla no revierte a las demás; devuelve {updated, failed}.
//
// Aprobar exige que el pasajero real ya exista (se crea antes con un POST
// PASAJEROS): si no existe, se aborta y la ficha queda como estaba.
async function updateFichasAdmin(rows, actorUsername) {
  const targetRows = rows.filter((row) => isFichaPostgresId(row.id));
  if (!targetRows.length) return { updated: 0, failed: [] };
  const pool = getPool();
  const failed = [];
  let updated = 0;
  for (const row of targetRows) {
    const client = await pool.connect();
    try {
      for (const campo of ["colegio_id", "plan_pago_id"]) {
        if (normalizeText(row[campo]) && !isFichaPostgresId(row[campo])) {
          throw friendlyError(`Valor inválido en ${campo}.`);
        }
      }
      await client.query("BEGIN");
      const estadoRevision = normalizeText(row.estado_revision) || "pendiente";
      let pasajeroId = null;
      if (estadoRevision === "aprobada") {
        const pasajeroLookup = await client.query(
          `select p.id
           from fichas_adhesion f
           join inscripciones i on i.id = f.inscripcion_id
           join personas per on per.numero_documento = upper($2)
           join pasajeros p on p.persona_id = per.id and p.viaje_id = i.viaje_id
           where f.id = $1`,
          [row.id, normalizeText(row.pasajero_dni)]
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
           estado_revision = $2,
           documentacion_estado = $3,
           ficha_medica_estado = $4,
           autorizacion_estado = $5,
           motivo_rechazo = $6,
           observaciones = $7
         where id = $1`,
        [
          row.id,
          estadoRevision,
          normalizeText(row.documentacion_estado) || "pendiente",
          normalizeText(row.ficha_medica_estado) || "pendiente",
          normalizeText(row.autorizacion_estado) || "pendiente",
          vacioANull(row.motivo_rechazo),
          normalizeText(row.observaciones)
        ]
      );
      await client.query(
        `update inscripciones set
           colegio_id = coalesce($2::uuid, colegio_id),
           plan_pago_id = coalesce($3::uuid, plan_pago_id),
           grupo_id = coalesce((select id from grupos where legacy_id = nullif($4, '')), grupo_id),
           contrato_id = coalesce((select id from contratos where legacy_id = nullif($5, '')), contrato_id),
           pasajero_id = coalesce($6, pasajero_id)
         where id = (select inscripcion_id from fichas_adhesion where id = $1)`,
        [
          row.id,
          vacioANull(row.colegio_id),
          vacioANull(row.plan_pago_id),
          normalizeText(row.grupo_asignado_id),
          normalizeText(row.contrato_id),
          pasajeroId
        ]
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
      const friendly = error.friendlyMessage ? error : translateFichaUpdateError(error);
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
  return "No se pudo guardar por un error interno. Volvé a intentar.";
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
      col.id::text as colegio_id,
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
    // Ficha v2: el colegio se elige de la lista administrada (ya no se crea
    // desde texto libre, que duplicaba colegios escritos distinto).
    const colegioId = normalizeText(row.colegio_id);
    if (!isFichaPostgresId(colegioId)) throw friendlyError("Elegí un colegio de la lista.");
    const colegioExiste = await pool.query(`select 1 from colegios where id = $1`, [colegioId]);
    if (!colegioExiste.rows.length) throw friendlyError("El colegio elegido no existe.");
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
async function findOrCreateResponsable(queryable, { nombre, apellido, numeroDocumento, telefono, email, cuilCuit }) {
  const doc = normalizeText(numeroDocumento).toUpperCase() || null;
  const result = await queryable.query(
    `insert into responsables (nombre, apellido, tipo_documento, numero_documento, telefono, email, cuil_cuit)
     values ($1, $5, 'DNI', $2, $3, $6, $4)
     on conflict (tipo_documento, numero_documento) where numero_documento is not null
       do update set
         numero_documento = excluded.numero_documento,
         apellido = coalesce(nullif(excluded.apellido, ''), responsables.apellido),
         telefono = coalesce(nullif(excluded.telefono, ''), responsables.telefono),
         email = coalesce(nullif(excluded.email, ''), responsables.email),
         cuil_cuit = coalesce(nullif(excluded.cuil_cuit, ''), responsables.cuil_cuit)
     returning id`,
    [normalizeText(nombre), doc, normalizeText(telefono), normalizeText(cuilCuit), normalizeText(apellido), normalizeText(email)]
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
      coalesce(per.apellido, '') as apellido,
      coalesce(r.apellido, '') as responsable_apellido,
      coalesce(r.email, '') as responsable_email,
      coalesce(p.plan_pago_id::text, '') as plan_pago_id,
      coalesce(pp.nombre, '') as plan_nombre,
      coalesce(pp.cuotas::text, '') as plan_cuotas,
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
    left join planes_pago pp on pp.id = p.plan_pago_id
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
      apellido: row.apellido,
      nacimiento: row.nacimiento,
      telefono: row.telefono
    });
    const legacyId = `${dni}::${viajeId}`;
    const planPagoId = vacioANull(row.plan_pago_id);
    if (planPagoId && !isFichaPostgresId(planPagoId)) throw friendlyError("Plan de pago inválido.");

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
            documentacion_estado, ficha_medica_estado, pago_estado, observaciones, plan_pago_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         on conflict (persona_id, viaje_id)
           do update set
             legacy_id = excluded.legacy_id,
             grupo_id = excluded.grupo_id,
             contrato_id = excluded.contrato_id,
             plan_pago_id = excluded.plan_pago_id,
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
          normalizeText(row.observaciones),
          planPagoId
        ]
      );
      const pasajeroId = pasajeroResult.rows[0].id;
      let responsableId = null;
      if (normalizeDigits(row.responsable_dni)) {
        responsableId = await findOrCreateResponsable(client, {
          nombre: row.responsable_nombre,
          apellido: row.responsable_apellido,
          numeroDocumento: row.responsable_dni,
          telefono: row.responsable_telefono,
          email: row.responsable_email,
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
      // Tutores adicionales: los registrados con el formulario corto de
      // Tutor (fichas_tutor) para el mismo DNI de pasajero, salvo rechazados.
      const adicionales = await client.query(
        `select nombre, apellido, numero_documento, cuil_cuit, celular, email, parentesco
         from fichas_tutor
         where pasajero_numero_documento = $1 and estado_revision <> 'rechazada'`,
        [dni]
      );
      for (const tutor of adicionales.rows) {
        if (normalizeDigits(tutor.numero_documento) === normalizeDigits(row.responsable_dni)) continue;
        const tutorId = await findOrCreateResponsable(client, {
          nombre: tutor.nombre,
          apellido: tutor.apellido,
          numeroDocumento: tutor.numero_documento,
          telefono: tutor.celular,
          email: tutor.email,
          cuilCuit: tutor.cuil_cuit
        });
        await client.query(
          `insert into pasajero_responsables (pasajero_id, responsable_id, vinculo, es_principal)
           values ($1, $2, $3, false)
           on conflict do nothing`,
          [pasajeroId, tutorId, tutor.parentesco]
        );
      }
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

// CONFIG forma parte del esquema Postgres desde la migración inicial. En
// producción ya no hay credenciales de Google Sheets, por lo que mantener
// esta lectura en el adaptador legado hacía que /api/google-sheets?sheet=CONFIG
// devolviera 500 aunque la base estuviera disponible.
async function listConfigAdmin() {
  const result = await getPool().query(`
    select
      clave,
      coalesce(valor, '') as valor,
      coalesce(descripcion, '') as descripcion,
      to_char(updated_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
    from config
    order by clave
  `);
  return result.rows;
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

// ============ FICHAS DE TUTOR, PLANES DE PAGO Y COLEGIOS (ficha v2) ============
//
// Mismo contrato plano que el resto de las hojas del admin. Planes y
// colegios usan un uuid generado en el navegador (crypto.randomUUID) como
// id estable; "borrar" desactiva, nunca elimina (conserva el historial y
// las referencias desde inscripciones/pasajeros/grupos).

async function listFichasTutorAdmin() {
  const result = await getPool().query(`
    select id::text as id, 'tutor' as tipo, pasajero_nombre, pasajero_apellido,
      pasajero_numero_documento as pasajero_dni, nombre, apellido, tipo_documento, numero_documento,
      cuil_cuit, celular, email, parentesco, estado_revision, coalesce(observaciones, '') as observaciones,
      to_char(created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
      to_char(updated_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
    from fichas_tutor
    order by created_at desc
  `);
  return result.rows;
}

async function saveFichasTutorAdmin(rows) {
  const result = await runBatch(rows, async (row) => {
    if (!isFichaPostgresId(row.id)) throw friendlyError("Ficha de tutor inválida.");
    await getPool().query(
      `update fichas_tutor set estado_revision = $2, observaciones = $3 where id = $1`,
      [row.id, normalizeText(row.estado_revision) || "pendiente", normalizeText(row.observaciones)]
    );
  });
  return { ...result, deleted: 0 };
}

async function listPlanesPagoAdmin() {
  const result = await getPool().query(`
    select pp.id::text as id, c.legacy_id as contrato_id, pp.nombre, pp.cuotas::text as cuotas,
      coalesce(pp.descripcion, '') as descripcion,
      case when pp.activo then 'TRUE' else 'FALSE' end as activo,
      coalesce(pp.orden::text, '') as orden
    from planes_pago pp
    join contratos c on c.id = pp.contrato_id
    order by c.legacy_id, pp.orden nulls last, pp.cuotas
  `);
  return result.rows;
}

async function savePlanesPagoAdmin(rows, deleteIds = []) {
  const pool = getPool();
  const desactivados = await runBatch(deleteIds.map((id) => ({ id })), async (row) => {
    if (!isFichaPostgresId(row.id)) throw friendlyError("Plan de pago con id inválido.");
    await pool.query(`update planes_pago set activo = false where id = $1`, [row.id]);
  });
  const guardados = await runBatch(rows, async (row) => {
    if (!isFichaPostgresId(row.id)) throw friendlyError("Plan de pago con id inválido.");
    const cuotas = parseNumeric(row.cuotas, "cuotas");
    if (!Number.isInteger(cuotas) || cuotas < 1 || cuotas > 18) {
      throw friendlyError("Las cuotas deben ser entre 1 y 18.");
    }
    if (normalizeText(row.nombre).length < 2) throw friendlyError("Poné un nombre al plan de pago.");
    const contrato = await pool.query(`select id from contratos where legacy_id = $1`, [normalizeText(row.contrato_id)]);
    if (!contrato.rows.length) throw friendlyError("Guardá el contrato antes de cargarle planes.");
    await pool.query(
      `insert into planes_pago (id, contrato_id, nombre, cuotas, descripcion, activo, orden)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update set
         nombre = excluded.nombre,
         cuotas = excluded.cuotas,
         descripcion = excluded.descripcion,
         activo = excluded.activo,
         orden = excluded.orden`,
      [
        row.id,
        contrato.rows[0].id,
        normalizeText(row.nombre),
        cuotas,
        vacioANull(row.descripcion),
        parseBool(row.activo || "TRUE", "activo"),
        parseNumeric(row.orden, "orden")
      ]
    );
  });
  return {
    updated: guardados.updated,
    failed: [...guardados.failed, ...desactivados.failed],
    deleted: desactivados.updated
  };
}

async function listColegiosAdmin() {
  const result = await getPool().query(`
    select id::text as id, nombre, coalesce(provincia, '') as provincia, coalesce(localidad, '') as localidad,
      coalesce(codigo_oficial, '') as codigo_oficial,
      case when activo then 'TRUE' else 'FALSE' end as activo
    from colegios
    order by nombre
  `);
  return result.rows;
}

async function saveColegiosAdmin(rows, deleteIds = []) {
  const pool = getPool();
  const desactivados = await runBatch(deleteIds.map((id) => ({ id })), async (row) => {
    if (!isFichaPostgresId(row.id)) throw friendlyError("Colegio con id inválido.");
    await pool.query(`update colegios set activo = false where id = $1`, [row.id]);
  });
  const guardados = await runBatch(rows, async (row) => {
    if (!isFichaPostgresId(row.id)) throw friendlyError("Colegio con id inválido.");
    if (normalizeText(row.nombre).length < 3) throw friendlyError("El nombre del colegio es muy corto.");
    await pool.query(
      `insert into colegios (id, nombre, provincia, localidad, codigo_oficial, activo)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do update set
         nombre = excluded.nombre,
         provincia = excluded.provincia,
         localidad = excluded.localidad,
         codigo_oficial = excluded.codigo_oficial,
         activo = excluded.activo`,
      [
        row.id,
        normalizeText(row.nombre),
        vacioANull(row.provincia),
        vacioANull(row.localidad),
        vacioANull(row.codigo_oficial),
        parseBool(row.activo || "TRUE", "activo")
      ]
    );
  });
  return {
    updated: guardados.updated,
    failed: [...guardados.failed, ...desactivados.failed],
    deleted: desactivados.updated
  };
}

module.exports = {
  getPool,
  insertFichaPublica,
  insertFichaTutor,
  listColegiosPublicos,
  contextoInscripcion,
  setFichaEmailResultado,
  listFichasAdmin,
  updateFichasAdmin,
  listFichasTutorAdmin,
  saveFichasTutorAdmin,
  listPlanesPagoAdmin,
  savePlanesPagoAdmin,
  listColegiosAdmin,
  saveColegiosAdmin,
  isFichaPostgresId,
  listGruposAdmin,
  saveGruposAdmin,
  listContratosAdmin,
  saveContratosAdmin,
  listPasajerosAdmin,
  savePasajerosAdmin,
  listConfigAdmin,
  listTurismoAdmin,
  saveTurismoAdmin,
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
    normalizeSignatureDataUrl,
    mapFichaParaInsert
  };
}
