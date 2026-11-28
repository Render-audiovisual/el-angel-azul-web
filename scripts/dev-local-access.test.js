const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

async function abrirLocal(libre) {
  const child = spawn(process.execPath, ['scripts/dev-local.js', ...(libre ? ['--libre'] : [])], {
    cwd: path.join(__dirname, '..'), env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe']
  });
  let salida = '';
  const base = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { child.kill(); reject(new Error('El servidor local no arrancó.')); }, 20000);
    child.stdout.on('data', (data) => {
      salida += data.toString();
      const match = salida.match(/Local listo: http:\/\/localhost:(\d+)/);
      if (match) { clearTimeout(timer); resolve(`http://127.0.0.1:${match[1]}`); }
    });
    child.stderr.on('data', () => {});
    child.once('exit', () => { clearTimeout(timer); reject(new Error('El servidor local terminó antes de arrancar.')); });
    child.once('error', reject);
  });
  return { base, close: () => new Promise(resolve => { child.once('exit', resolve); child.kill(); }) };
}

test('el acceso libre es optativo: el servidor local normal sigue pidiendo sesión', async () => {
  const local = await abrirLocal(false);
  try {
    const session = await fetch(local.base + '/api/admin/me');
    assert.equal(session.status, 200);
    assert.equal((await session.json()).authenticated, false);
    assert.equal((await fetch(local.base + '/api/google-sheets?sheet=COLEGIOS')).status, 401);
  } finally { await local.close(); }
});

test('modo local libre: entra sin clave, tolera cookies viejas y conserva la protección de origen', async () => {
  const local = await abrirLocal(true);
  try {
    const [me, colegios] = await Promise.all([
      fetch(local.base + '/api/admin/me'),
      fetch(local.base + '/api/google-sheets?sheet=COLEGIOS', { headers: { Cookie: 'eaa_admin_session=sesion-local-vieja' } })
    ]);
    assert.equal(me.status, 200);
    const usuario = await me.json();
    assert.equal(usuario.authenticated, true);
    assert.equal(usuario.role, 'admin');
    assert.equal(colegios.status, 200);
    assert.equal((await colegios.json()).rows.length, 3);
    assert.equal((await (await fetch(local.base + '/api/admin/catalogo/multimedia')).json()).disponible, true);
    const financial = await (await fetch(local.base + '/api/admin/finanzas/cuentas')).json();
    assert.equal(financial.cuentas.length, 1);
    assert.equal(financial.cuentas[0].total_centavos, '120000');
    assert.equal(financial.cuentas[0].cuotas.length, 12);
    const contracts = await (await fetch(local.base + '/api/google-sheets?sheet=CONTRATOS')).json();
    const documents = await (await fetch(local.base + '/api/admin/documentos/contratos/' + contracts.rows[0].id)).json();
    assert.equal(documents.almacenamientoDisponible, true);
    const bloqueado = await fetch(local.base + '/api/google-sheets', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://otro-sitio.invalid' },
      body: JSON.stringify({ sheet: 'COLEGIOS', rows: [] })
    });
    assert.equal(bloqueado.status, 403);
    assert.equal((await fetch(local.base + '/api/admin/logout', { method: 'POST', headers: { Origin: local.base } })).status, 200);
    assert.equal((await fetch(local.base + '/api/admin/me')).status, 200);
  } finally { await local.close(); }
});
