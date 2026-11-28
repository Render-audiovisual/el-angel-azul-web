// El enlace identifica el contrato de la ficha; nunca una sesión personal.
(() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  async function request(path, body) {
    let response;
    try { response = await fetch(path, { cache: 'no-store', credentials: 'same-origin', ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) }); }
    catch (_) { throw Error('No recibimos la confirmación. Revisá tu conexión y volvé a consultar antes de repetir el cambio.'); }
    const data = await response.json();
    if (response.status === 401 && path.startsWith('/api/admin/')) window.dispatchEvent(new Event('eaa-admin-session-lost'));
    if (!response.ok || !data.ok) throw Error(data.error || 'No pudimos consultar la inscripción.');
    return data;
  }
  async function open(root, code) {
    const hash = location.hash;
    root.innerHTML = '<div class="layout adhesion-page enrollment-entry"><h1>Tu ficha de adhesión</h1><p role="status">Consultando el grupo de tu viaje…</p></div>';
    const fail = message => {
      if (location.hash !== hash) return;
      root.innerHTML = `<div class="layout adhesion-page enrollment-entry"><h1>Revisemos el enlace de tu ficha</h1><p role="alert">${escape(message)}</p><p>Pedí a El Ángel Azul el enlace vigente de tu grupo. Este enlace no permite consultar información privada de otros pasajeros.</p><a href="https://wa.me/5493794331380" target="_blank" rel="noopener">Consultar a la agencia</a><button type="button" data-enrollment-retry>Volver a consultar</button></div>`;
      root.querySelector('[data-enrollment-retry]').onclick = () => open(root, code);
    };
    try {
      const data = await request('/api/public/inscripcion-context?codigo=' + encodeURIComponent(code));
      if (location.hash !== hash) return;
      if (data.estado !== 'habilitada') { fail(data.estado === 'pausada' ? 'La inscripción de este grupo está pausada o todavía no se activó.' : 'El enlace no está vigente. Puede haber sido renovado por la agencia.'); return; }
      const selected = data.seleccion;
      const suffix = /\s(20\d{2})$/.exec(selected.viaje);
      const year = String(suffix?.[1] || selected.anio || '');
      const destination = suffix ? selected.viaje.slice(0, suffix.index) : selected.viaje;
      if (!/^20\d{2}$/.test(year)) { fail('La agencia todavía tiene que completar el año de este viaje.'); return; }
      const params = new URLSearchParams({ contrato: code, nivel: selected.nivel, destino: destination, anio: year, colegioId: selected.colegioId, colegioNombre: selected.colegio, grado: selected.grado, division: selected.division });
      root.innerHTML = `<div class="layout adhesion-page enrollment-entry"><h1>Tu ficha de adhesión</h1><p>La agencia te compartió la ficha de este grupo. Revisá que sea el tuyo antes de completar tus datos.</p><dl><div><dt>Viaje</dt><dd>${escape(selected.titulo || selected.viaje)}</dd></div><div><dt>Colegio</dt><dd>${escape(selected.colegio)}</dd></div><div><dt>Curso y división</dt><dd>${escape(selected.nivel)} · ${escape(selected.grado)} ${escape(selected.division)}</dd></div><div><dt>Contrato</dt><dd>${escape(data.contrato.codigo || 'Contrato activo')}</dd></div></dl><a class="enrollment-continue" href="#/inscripcion/ficha-adhesion?${escape(params)}">Completar mi ficha de adhesión</a><p>Enviar la ficha registra tu solicitud. La agencia revisa los datos y confirma la inscripción.</p></div>`;
    } catch (error) { fail(error.message); }
  }
  async function mountAdmin(root, id, confirmed) {
    if (!root || !id) return;
    root.innerHTML = '<h3>Inscripción online del grupo</h3><p role="status">Consultando el enlace…</p>';
    const path = '/api/admin/inscripciones/contratos/' + encodeURIComponent(id);
    let row;
    try { row = confirmed || (await request(path)).contrato; }
    catch (error) { if (root.isConnected) { root.innerHTML = `<h3>Inscripción online del grupo</h3><p role="alert">${escape(error.message)}</p><button type="button">Volver a consultar</button>`; root.querySelector('button').onclick = () => mountAdmin(root, id); } return; }
    if (!root.isConnected) return;
    const enabled = row.estado === 'activo' && row.grupo_estado === 'activo' && row.colegio_activo && row.inscripcion_abierta;
    root.innerHTML = `<h3>Inscripción online del grupo</h3><p>${enabled ? 'Abierta: el enlace permite completar la ficha de este contrato.' : 'Pausada: se requiere contrato, grupo y colegio activos, además de habilitar la inscripción.'}</p><label>Enlace compartido del grupo<input data-enrollment-link readonly value="${escape(new URL(row.enlace, location.origin).href)}"></label><div class="enrollment-admin-actions"><button type="button" data-enrollment-copy>Copiar enlace del grupo</button><button type="button" data-enrollment-refresh>Volver a consultar</button></div><form data-enrollment-settings><label class="enrollment-check"><input type="checkbox" name="abierta" ${row.inscripcion_abierta ? 'checked' : ''}>Habilitar inscripción del contrato</label><div class="enrollment-admin-actions"><button type="submit">Guardar habilitación</button><button type="button" data-enrollment-rotate>Renovar enlace</button></div></form><p>El enlace no muestra contratos privados ni da acceso a Mi viaje. Renovarlo invalida el anterior y conserva las fichas recibidas.</p><p data-enrollment-message role="status"></p>`;
    const notice = root.querySelector('[data-enrollment-message]');
    const show = message => { notice.textContent = message.message || message; notice.setAttribute('role', message instanceof Error ? 'alert' : 'status'); };
    root.querySelector('[data-enrollment-copy]').onclick = async () => { try { await navigator.clipboard.writeText(root.querySelector('[data-enrollment-link]').value); show('Enlace del grupo copiado.'); } catch (_) { root.querySelector('[data-enrollment-link]').select(); show('Seleccionamos el enlace. Copialo con el teclado.'); } };
    root.querySelector('[data-enrollment-refresh]').onclick = () => mountAdmin(root, id);
    const save = async rotate => {
      const body = { abierta: root.querySelector('[name="abierta"]').checked, rotar: rotate, version: row._version };
      root.querySelectorAll('button,input').forEach(node => node.disabled = true);
      try {
        show('Guardando…');
        const saved = await request(path, body);
        if (root.isConnected) { await mountAdmin(root, id, saved.contrato); const message = root.querySelector("[data-enrollment-message]"); if(message) message.textContent = rotate ? "Enlace renovado. Compartí el nuevo enlace con el grupo." : "Habilitación guardada."; }
      } catch (error) { if (root.isConnected) show(error); }
      finally { if (root.isConnected) root.querySelectorAll('button,input').forEach(node => node.disabled = false); }
    };
    root.querySelector('form').onsubmit = event => { event.preventDefault(); save(false); };
    root.querySelector('[data-enrollment-rotate]').onclick = () => { if (confirm('¿Renovar el enlace del grupo? El enlace anterior dejará de abrir la ficha. Las solicitudes recibidas se conservan.')) save(true); };
  }
  window.ElAngelAzulEnrollment = { open, mountAdmin };
})();
