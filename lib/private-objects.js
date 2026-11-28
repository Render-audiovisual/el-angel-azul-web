// Acceso exclusivo del servidor. Nunca devuelve URLs ni credenciales al cliente.
const storage = require('./storage');
const { LIMIT } = require('./document-validation');
const fail = status => Object.assign(new Error('No pudimos acceder al archivo privado. Volvé a intentar o consultá con la agencia.'), { statusCode: status });
async function object(bucket, path, method, bytes, mime) {
  if (!storage.storageConfigurado()) throw fail(503);
  if (!(bucket==='documentos'?/^privados\/[a-f0-9-]+\/[a-f0-9-]+\.(pdf|png|jpg)$/:/^fotos\/[a-f0-9-]+\/[a-f0-9-]+\.(png|jpg)$/).test(path) || !['documentos','catalogo'].includes(bucket)) throw fail(500);
  const root = new URL(process.env.SUPABASE_URL);
  if (root.protocol !== 'https:' || root.username || root.password) throw fail(503);
  let response;
  try {
    response = await fetch(`${root.origin}/storage/v1/object/${method === 'GET' ? 'authenticated/' : ''}${bucket}/${path}`, {
      method, headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, ...(bytes ? { 'Content-Type': mime, 'x-upsert': 'false' } : {}) },
      ...(bytes ? { body: bytes } : {}), signal: AbortSignal.timeout(15000)
    });
  } catch (_) { throw fail(502); }
  if (!response.ok && !(method === 'DELETE' && response.status === 404)) throw fail(502);
  if (method !== 'GET') return;
  const chunks = []; let size = 0;
  for await (const chunk of response.body) { size += chunk.length; if (size > LIMIT) throw fail(502); chunks.push(chunk); }
  return Buffer.concat(chunks);
}
const adapter=bucket=>({configured:()=>storage.storageConfigurado(),put:(path,bytes,mime)=>object(bucket,path,'POST',bytes,mime),get:path=>object(bucket,path,'GET'),remove:path=>object(bucket,path,'DELETE')});
module.exports = { ...adapter('documentos'), catalog:adapter('catalogo') };
