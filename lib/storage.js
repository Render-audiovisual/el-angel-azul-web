// lib/storage.js
// Firma de la ficha en Supabase Storage (bucket privado "fichas") por la API
// REST con la service role key, sin SDK. Solo el servidor accede al bucket: el
// admin descarga la firma a través de /api/admin/fichas/:id/firma.
// Sin SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY la firma sigue guardándose como
// data URL en la base (comportamiento anterior).
const BUCKET = "fichas";
const PREFIJO_DATA_URL = "data:image/png;base64,";

function storageConfigurado(env = process.env) {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

// firma_storage_path guarda una ruta ("firmas/<uuid>.png") o, en fichas
// anteriores, la data URL completa.
function esRutaStorage(valor) {
  return Boolean(valor) && !String(valor).startsWith("data:");
}

function urlObjeto(ruta, env) {
  const base = env.SUPABASE_URL.replace(/\/+$/, "");
  return `${base}/storage/v1/object/${BUCKET}/${ruta.split("/").map(encodeURIComponent).join("/")}`;
}

function cabeceras(env, extra = {}) {
  return { Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, apikey: env.SUPABASE_SERVICE_ROLE_KEY, ...extra };
}

function errorStorage(accion, respuesta) {
  const error = new Error(`Storage no pudo ${accion} la firma (HTTP ${respuesta.status}).`);
  error.statusCode = 502;
  return error;
}

async function subirFirma(dataUrl, id, { env = process.env, fetchImpl = fetch } = {}) {
  const ruta = `firmas/${id}.png`;
  const respuesta = await fetchImpl(urlObjeto(ruta, env), {
    method: "POST",
    headers: cabeceras(env, { "Content-Type": "image/png", "x-upsert": "false" }),
    body: Buffer.from(String(dataUrl).slice(PREFIJO_DATA_URL.length), "base64")
  });
  if (!respuesta.ok) throw errorStorage("guardar", respuesta);
  return ruta;
}

async function descargarFirma(ruta, { env = process.env, fetchImpl = fetch } = {}) {
  const respuesta = await fetchImpl(urlObjeto(ruta, env), { headers: cabeceras(env) });
  if (!respuesta.ok) throw errorStorage("leer", respuesta);
  return Buffer.from(await respuesta.arrayBuffer());
}

// Devuelve los bytes PNG de una ficha, sea ruta de Storage o data URL vieja.
async function bytesFirma(valor, opciones) {
  if (!valor) return null;
  if (esRutaStorage(valor)) return descargarFirma(valor, opciones);
  const m = /^data:image\/png;base64,(.+)$/.exec(valor);
  return m ? Buffer.from(m[1], "base64") : null;
}

module.exports = { BUCKET, storageConfigurado, esRutaStorage, subirFirma, descargarFirma, bytesFirma };
