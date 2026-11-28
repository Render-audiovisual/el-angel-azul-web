// Frontera pública del catálogo: nunca serializar el DTO administrativo completo.
const crypto = require('node:crypto');
const db = require('./db');
const adminWrite = require('./admin-write');
const PUBLIC_FIELDS = ['slug','destino','titulo','duracion','temporada','fecha_salida','fecha_regreso','salida_garantizada','precio_desde','precio_valor','moneda','precio_base_doble','suplemento_single','precio_menor','condicion_venta','categorias','descripcion_corta','descripcion_larga','incluye','no_incluye','formas_pago','itinerario','fotos','estado','destacado','orden'];
const invalid = message => Object.assign(new Error(message), { statusCode: 400, friendlyMessage: message });
function mediaUrl(value) {
  const raw = String(value || '').trim();
  if (/^assets\/[a-z0-9_./% -]+$/i.test(raw) && !raw.includes('..')) return raw;
  try { const url = new URL(raw); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
function photos(value) {
  let parsed = value ?? [];
  if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed || '[]'); } catch { throw invalid('La galería no tiene un formato válido.'); } }
  if (!Array.isArray(parsed) || parsed.length > 30) throw invalid('La galería admite hasta 30 fotos.');
  return parsed.map(photo => {
    if (!photo || typeof photo !== 'object' || !mediaUrl(photo.url)) throw invalid('Cada foto necesita una dirección HTTPS o un recurso del sitio.');
    return { url: mediaUrl(photo.url), alt: String(photo.alt || '').slice(0,200), principal: Boolean(photo.principal) };
  });
}
function validate(row) {
  const output = { ...row };
  for (const key of ['precio_desde','precio_valor','precio_base_doble','suplemento_single','precio_menor']) {
    const text = String(row[key] ?? '').trim();
    if (text && (!/^\d{1,10}(?:\.\d{1,2})?$/.test(text) || !Number.isFinite(Number(text)))) throw invalid(`Revisá ${key}: usá un importe no negativo con hasta dos decimales.`);
  }
  if (row.moneda && !['ARS','USD','Consultar'].includes(row.moneda)) throw invalid('La moneda debe ser ARS, USD o Consultar.');
  for (const key of ['fecha_salida','fecha_regreso']) {
    const date = row[key];
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date)) throw invalid('Ingresá fechas válidas para el paquete.');
  }
  if (row.fecha_salida && row.fecha_regreso && row.fecha_regreso < row.fecha_salida) throw invalid('La fecha de regreso debe ser igual o posterior a la salida.');
  if (row.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug)) throw invalid('La dirección del paquete admite letras minúsculas, números y guiones.');
  const gallery = photos(row.fotos);
  output.fotos = JSON.stringify(gallery);
  if (row.estado === 'activo') {
    if (String(row.titulo || '').trim().length < 3 || String(row.destino || '').trim().length < 2 || !row.slug) throw invalid('Para publicar, completá título, destino y dirección del paquete.');
    if (!String(row.descripcion_corta || '').trim() || !String(row.duracion || '').trim() || !gallery.length) throw invalid('Para publicar, completá descripción, duración y al menos una foto.');
  }
  return output;
}
function publicRows(rows, today = new Date().toISOString().slice(0,10)) {
  return rows.filter(row => row.estado === 'activo' && row.slug && (!row.fecha_salida || row.fecha_salida >= today) && (!row.fecha_regreso || row.fecha_regreso >= today))
    .map(row => Object.fromEntries(PUBLIC_FIELDS.filter(key => row[key] !== undefined).map(key => [key,row[key]])));
}
async function list(params = new URLSearchParams()) {
  let rows = publicRows(await db.listTurismoAdmin({publicOnly:true}));
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const q = normalize(params.get('q'));
  if (q) rows = rows.filter(row => normalize(`${row.titulo} ${row.destino} ${row.descripcion_corta}`).includes(q));
  const destino = normalize(params.get('destino'));
  if (destino) rows = rows.filter(row => normalize(row.destino) === destino);
  const category = params.get('categoria');
  if (category) rows = rows.filter(row => String(row.categorias || '').split('|').includes(category));
  const start = params.get('desde'), end = params.get('hasta');
  for(const date of [start,end]) if(date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw invalid('Usá fechas con formato AAAA-MM-DD.');
  if(start) rows = rows.filter(row => row.fecha_salida && row.fecha_salida >= start);
  if(end) rows = rows.filter(row => row.fecha_salida && row.fecha_salida <= end);
  return rows;
}
async function duplicate(id, expected, actor) {
  const source = (await db.listTurismoAdmin()).find(row => row.id === id);
  if (!source) throw Object.assign(new Error('No encontramos ese paquete.'), {statusCode:404});
  if (adminWrite.version(source) !== expected) throw Object.assign(new Error('El paquete cambió. Actualizá la lista antes de duplicarlo.'),{statusCode:409});
  const suffix = crypto.randomUUID();
  const row = {...source,id:suffix,slug:`${source.slug || 'paquete'}-copia-${suffix.slice(0,8)}`,titulo:`${source.titulo} (copia)`,estado:'borrador',destacado:'FALSE'};
  const result = await adminWrite.write({pool:db.getPool(),sheet:'TURISMO',rows:[row],deleteIds:[],expectedVersions:{[row.id]:null},list:db.listTurismoAdmin,save:()=>db.saveTurismoAdmin([row]),actor});
  if(result.failed.length) throw invalid(result.failed.map(item=>item.error).join(' '));
  return adminWrite.versionedRows((await db.listTurismoAdmin()).filter(item=>item.id === row.id))[0];
}
module.exports = { validate, publicRows, list, duplicate, mediaUrl };
