const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');
const crypto = require('node:crypto');
const LIMIT = 5 * 1024 * 1024;
const extensions = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg' };
const fail = message => Object.assign(new Error(message), { statusCode: 400 });
let active = 0;
async function validate(input) {
  const extension = extensions[input.mime];
  if (!extension || typeof input.nombre !== 'string' || typeof input.contenidoBase64 !== 'string') throw fail('Elegí un PDF, JPG o PNG de hasta 5 MB.');
  const name = input.nombre.normalize('NFC').replace(/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069/\\]/g, ' ').trim();
  if (!name || name.length > 200 || !(new RegExp(extension === 'jpg' ? '\\.(jpe?g)$' : '\\.' + extension + '$', 'i')).test(name)) throw fail('El nombre del archivo debe tener una extensión que coincida con su formato.');
  const encoded = input.contenidoBase64;
  if (!encoded || encoded.length > 4 * Math.ceil(LIMIT / 3) || encoded.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw fail('El archivo está vacío, supera 5 MB o no se pudo leer.');
  const bytes = Buffer.from(encoded, 'base64');
  if (!bytes.length || bytes.length > LIMIT || bytes.toString('base64') !== encoded) throw fail('El archivo no se pudo leer o supera 5 MB.');
  if (active >= 2) throw Object.assign(Error("Estamos procesando otros archivos. Esperá unos segundos y volvé a intentar."),{statusCode:429});
  active++;
  try { await new Promise((resolve, reject) => {
    let settled = false;
    const worker = new Worker(__filename, { workerData: { bytes, mime: input.mime }, stdout: true, stderr: true, resourceLimits: { maxOldGenerationSizeMb: 96, maxYoungGenerationSizeMb: 16 } });
    const done = error => { if (settled) return; settled = true; clearTimeout(timer); worker.terminate(); error ? reject(fail('El archivo no es válido, está protegido o no se pudo procesar. Probá con otra copia.')) : resolve(); };
    const timer = setTimeout(() => done(true), 5000);
    worker.once('message', result => done(!result.ok));
    worker.once('error', () => done(true));
    worker.once('exit', code => { if (code) done(true); });
  }); } finally { active--; }
  return { bytes, nombre: name, mime: input.mime, extension, hash: crypto.createHash('sha256').update(bytes).digest('hex') };
}
if (!isMainThread) {
  (async () => {
    const { PDFDocument } = require('pdf-lib');
    const bytes = Buffer.from(workerData.bytes);
    const doc = await PDFDocument.create();
    if (workerData.mime === 'application/pdf') {
      if (bytes.subarray(0, 5).toString() !== '%PDF-') throw Error();
      const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
      if (pdf.getPageCount() < 1 || pdf.getPageCount() > 100) throw Error();
    } else {
      let image;
      if (workerData.mime === 'image/png') {
        if (bytes.length < 33 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || bytes.subarray(12, 16).toString() !== 'IHDR') throw Error();
        const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
        if (!width || !height || width * height > 4000000) throw Error();
        const chunks = [];
        for (let offset = 8; offset + 12 <= bytes.length;) {
          const length = bytes.readUInt32BE(offset);
          if (offset + length + 12 > bytes.length) throw Error();
          if (bytes.subarray(offset + 4, offset + 8).toString() === 'IDAT') chunks.push(bytes.subarray(offset + 8, offset + 8 + length));
          offset += length + 12;
        }
        require('node:zlib').inflateSync(Buffer.concat(chunks), { maxOutputLength: 32 * 1024 * 1024 });
        image = await doc.embedPng(bytes);
      } else image = await doc.embedJpg(bytes);
      if (!image.width || !image.height || image.width * image.height > 4000000) throw Error();
    }
    parentPort.postMessage({ ok: true });
  })().catch(() => parentPort.postMessage({ ok: false }));
}
module.exports = { validate, LIMIT };
