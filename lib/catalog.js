// Frontera pública del catálogo: nunca serializar el DTO administrativo completo.
const crypto = require('node:crypto');
const db = require('./db');
const adminWrite = require('./admin-write');
const visibility = require('./catalog-visibility');
const PUBLIC_FIELDS = ['slug','destino','titulo','duracion','temporada','fecha_salida','fecha_regreso','salida_garantizada','precio_desde','precio_valor','moneda','precio_base_doble','suplemento_single','precio_menor','condicion_venta','categorias','descripcion_corta','descripcion_larga','incluye','no_incluye','formas_pago','itinerario','fotos','estado','destacado','orden','alojamiento','transporte','regimen_comidas','disponibilidad','cupos','promocion','video_url'];
const invalid = message => Object.assign(new Error(message), { statusCode: 400, friendlyMessage: message });
function mediaUrl(value) {
  const raw = String(value || '').trim();
  if (/^\/api\/public\/catalogo\/media\/[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(raw)) return raw.toLowerCase();
  if (/^assets\/[a-z0-9_./% -]+$/i.test(raw) && !raw.includes('..')) return raw;
  try { const url = new URL(raw); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
function videoUrl(value) {
  if(!value)return '';
  let url;try{url=new URL(value);}catch{throw invalid('Pegá un enlace de YouTube o Vimeo.');}
  if(url.protocol!=='https:'||url.username||url.password)throw invalid('El video necesita un enlace HTTPS de YouTube o Vimeo.');
  const host=url.hostname.toLowerCase().replace(/^www\./,'');let id;
  if(host==='youtu.be')id=url.pathname.slice(1);
  if(['youtube.com','youtube-nocookie.com'].includes(host))id=url.pathname==='/watch'?url.searchParams.get('v'):/^\/(?:embed|shorts)\/([^/]+)$/.exec(url.pathname)?.[1];
  if(id&&/^[a-z0-9_-]{11}$/i.test(id))return 'https://www.youtube-nocookie.com/embed/'+id;
  if(['vimeo.com','player.vimeo.com'].includes(host)){id=/^\/(?:video\/)?(\d{6,12})\/?$/.exec(url.pathname)?.[1];if(id)return 'https://player.vimeo.com/video/'+id;}
  throw invalid('El enlace del video no corresponde a un video de YouTube o Vimeo.');
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
  for(const key of ['alojamiento','transporte','regimen_comidas','promocion']){if(row[key]!==undefined&&typeof row[key]!=='string')throw invalid('Completá los servicios y la promoción como texto.');output[key]=String(row[key]||'').trim();if(output[key].length>2000)throw invalid('Los servicios y la promoción admiten hasta 2.000 caracteres.');}
  output.video_url=videoUrl(row.video_url);
  output.disponibilidad=row.disponibilidad||'a_confirmar';
  if(!['a_confirmar','disponible','sin_cupo'].includes(output.disponibilidad))throw invalid('Elegí la disponibilidad del paquete.');
  const places=String(row.cupos??'').trim();
  if(places&&(!/^\d{1,10}$/.test(places)||Number(places)>2147483647))throw invalid('Los cupos deben ser un número entero no negativo o quedar vacíos.');
  output.cupos=places?Number(places):null;
  if(output.cupos===0&&output.disponibilidad==='disponible')throw invalid('Un paquete sin cupos no puede figurar disponible.');
  if(output.cupos>0&&output.disponibilidad==='sin_cupo')throw invalid('Revisá los cupos: el paquete figura sin disponibilidad.');
  output.archivado=row.archivado===true||String(row.archivado||'').toUpperCase()==='TRUE';
  if(row.archivado && typeof row.archivado!=='boolean' && !['TRUE','FALSE'].includes(String(row.archivado).toUpperCase()))throw invalid('Indicá si el paquete está archivado.');
  if(output.archivado&&row.estado==='activo')throw invalid('Despublicá el paquete antes de archivarlo.');
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
function publicRows(rows, today = visibility.today()) {
  return rows.filter(row => visibility.visible(row,today))
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
  for(const date of [start,end]) if(date && (!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)) throw invalid('Usá fechas válidas con formato AAAA-MM-DD.');
  if(start&&end&&end<start)throw invalid('La fecha hasta debe ser igual o posterior a la fecha desde.');
  if(start) rows = rows.filter(row => row.fecha_salida && row.fecha_salida >= start);
  if(end) rows = rows.filter(row => row.fecha_salida && row.fecha_salida <= end);
  return rows;
}
async function duplicate(id, expected, actor) {
  const source = (await db.listTurismoAdmin()).find(row => row.id === id);
  if (!source) throw Object.assign(new Error('No encontramos ese paquete.'), {statusCode:404});
  if (adminWrite.version(source) !== expected) throw Object.assign(new Error('El paquete cambió. Actualizá la lista antes de duplicarlo.'),{statusCode:409});
  const suffix = crypto.randomUUID();
  const row = {...source,id:suffix,slug:`${source.slug || 'paquete'}-copia-${suffix.slice(0,8)}`,titulo:`${source.titulo} (copia)`,estado:'borrador',destacado:'FALSE',archivado:'FALSE'};
  const result = await adminWrite.write({pool:db.getPool(),sheet:'TURISMO',rows:[row],deleteIds:[],expectedVersions:{[row.id]:null},list:db.listTurismoAdmin,save:()=>db.saveTurismoAdmin([row]),actor});
  if(result.failed.length) throw invalid(result.failed.map(item=>item.error).join(' '));
  return adminWrite.versionedRows((await db.listTurismoAdmin()).filter(item=>item.id === row.id))[0];
}
module.exports = { validate, publicRows, list, duplicate, mediaUrl };
