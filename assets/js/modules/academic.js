// Organización operativa. Los borradores privados viven solo en esta sesión.
(() => {
  const fresh = () => ({ tab: 'promociones', selected: {}, drafts: {}, data: null });
  let state = fresh();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const title = { promociones: 'Promociones', contingentes: 'Salidas', grupos: 'Vincular grupos', pasajeros: 'Asignar pasajeros' };
  const option = (id, name, selected) => `<option value="${escape(id)}" ${id === selected ? 'selected' : ''}>${escape(name)}</option>`;
  const label = (text, content) => `<label>${text}${content}</label>`;
  const select = (name, rows, selected, empty = 'Elegí una opción') => `<select name="${name}">${option('', empty, selected)}${rows.map(row => option(row.id, row.label, selected)).join('')}</select>`;
  const input = (name, value, attrs = '') => `<input name="${name}" value="${escape(value)}" ${attrs}>`;
  async function request(path = '', body) {
    let response;
    try { response = await fetch('/api/admin/academico' + path, { credentials: 'same-origin', cache: 'no-store', ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) }); }
    catch (_) { throw Error('No recibimos la confirmación. Conservamos los campos: volvé a consultar antes de guardar otra vez.'); }
    const data = await response.json();
    if (response.status === 401) { state = fresh(); window.dispatchEvent(new Event('eaa-admin-session-lost')); }
    if (!response.ok || !data.ok) throw Error(data.error || 'No pudimos consultar la organización del viaje.');
    return data;
  }
  const schoolName = id => state.data.colegios.find(row => row.id === id)?.nombre || 'Colegio por confirmar';
  const tripName = id => { const row = state.data.viajes.find(row => row.id === id); return row ? `${row.titulo || row.destino} · ${row.nivel}` : 'Viaje por confirmar'; };
  const groupName = row => `${schoolName(row.colegio_id)} · ${row.curso} ${row.division || ''} · ${tripName(row.viaje_id)}`;
  const normalized = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function schoolOptions(value, query = '') {
    const rows = state.data.colegios.filter(row => (row.activo || row.id === value.colegioId) && normalized([row.nombre, row.localidad, row.provincia].join(' ')).includes(normalized(query)));
    const limited = rows.slice(0, 80);
    const selected = state.data.colegios.find(row => row.id === value.colegioId);
    if (selected && !limited.some(row => row.id === selected.id)) limited.unshift(selected);
    return { rows: limited.map(row => ({ id: row.id, label: [row.nombre, row.localidad, row.provincia].filter(Boolean).join(' · ') })), count: rows.length };
  }
  function draft(type, id) {
    const key = type + ':' + id;
    if (state.drafts[key]) return state.drafts[key];
    const row = state.data[type].find(row => row.id === id);
    let value;
    if (type === 'promociones') value = row ? { id, version: row._version, colegioId: row.colegio_id, nivel: row.nivel, anioEgreso: row.anio_egreso, nombre: row.nombre, activo: row.activo, observaciones: row.observaciones } : { id: crypto.randomUUID(), version: null, colegioId: '', nivel: '', anioEgreso: '', nombre: '', activo: true, observaciones: '' };
    if (type === 'contingentes') value = row ? { id, version: row._version, viajeId: row.viaje_id, fechaSalida: row.fecha_salida || '', fechaRegreso: row.fecha_regreso || '', nombre: row.nombre, activo: row.activo, observaciones: row.observaciones } : { id: crypto.randomUUID(), version: null, viajeId: '', fechaSalida: '', fechaRegreso: '', nombre: '', activo: true, observaciones: '' };
    if (type === 'grupos' && row) value = { version: row._version, promocionId: row.promocion_id || '', contingentes: [...row.contingentes] };
    if (type === 'pasajeros' && row) value = { version: row._version, contingenteId: row.contingente_id || '' };
    if (value) state.drafts[key] = value;
    return value;
  }
  function fields(type, id, value) {
    const data = state.data;
    if (type === 'promociones') return `${label('Buscar colegio por nombre o localidad', input('busquedaColegio', '', 'type="search" autocomplete="off"'))}${label('Colegio', select('colegioId', schoolOptions(value).rows, value.colegioId))}<p data-academic-school-count>${schoolOptions(value).count > 80 ? 'Mostramos hasta 80 opciones. Buscá el colegio para acotar la lista.' : ''}</p>${label('Nivel', select('nivel', ['Primaria', 'Secundaria'].map(id => ({ id, label: id })), value.nivel))}${label('Año de egreso', input('anioEgreso', value.anioEgreso, 'type="number" min="1900" max="9999" required'))}`;
    if (type === 'contingentes') return `${label('Viaje', select('viajeId', data.viajes.map(row => ({ id: row.id, label: tripName(row.id) })), value.viajeId))}${label('Salida · opcional', input('fechaSalida', value.fechaSalida, 'type="date"'))}${label('Regreso · opcional', input('fechaRegreso', value.fechaRegreso, 'type="date"'))}`;
    if (type === 'grupos') {
      const group = data.grupos.find(row => row.id === id);
      const promotions = data.promociones.filter(row => row.colegio_id === group.colegio_id && row.nivel.toLowerCase() === String(group.nivel).toLowerCase() && (row.activo || row.id === value.promocionId));
      const departures = data.contingentes.filter(row => row.viaje_id === group.viaje_id && (row.activo || value.contingentes.includes(row.id)));
      return `<p class="academic-context">${escape(groupName(group))}</p>${label('Promoción del colegio', select('promocionId', promotions.map(row => ({ id: row.id, label: `${row.nombre} · ${row.anio_egreso}${row.activo ? '' : ' · Inactiva'}` })), value.promocionId, 'Sin promoción asignada'))}<fieldset class="academic-departures"><legend>Salidas habilitadas para este grupo</legend><p>Podés compartir una salida con otros grupos del mismo viaje. Después asigná cada pasajero.</p>${departures.length ? departures.map(row => `<label><input type="checkbox" name="contingentes" value="${escape(row.id)}" ${value.contingentes.includes(row.id) ? 'checked' : ''}>${escape(row.nombre)}${row.fecha_salida ? ' · ' + escape(row.fecha_salida) : ' · Fecha por confirmar'}${row.activo ? '' : ' · Inactiva'}</label>`).join('') : '<p>Todavía no hay salidas para este viaje. Creá una en Salidas.</p>'}</fieldset>`;
    }
    const passenger = data.pasajeros.find(row => row.id === id);
    const group = data.grupos.find(row => row.id === passenger.grupo_id);
    const departures = data.contingentes.filter(row => group?.contingentes.includes(row.id) && (row.activo || row.id === value.contingenteId));
    return `<p class="academic-context">${escape(group ? groupName(group) : 'Este pasajero todavía no tiene un grupo vinculado.')}</p>${label('Salida del pasajero', select('contingenteId', departures.map(row => ({ id: row.id, label: `${row.nombre}${row.fecha_salida ? ' · ' + row.fecha_salida : ' · Fecha por confirmar'}${row.activo ? '' : ' · Inactiva'}` })), value.contingenteId, 'Sin salida asignada'))}<p>La asignación conserva su curso, contrato, plan y cuenta. Las opciones corresponden únicamente a su grupo y viaje.</p>`;
  }
  function read(form, value) {
    for (const name of ['colegioId', 'nivel', 'anioEgreso', 'nombre', 'observaciones', 'viajeId', 'fechaSalida', 'fechaRegreso', 'promocionId', 'contingenteId']) if (form.elements.namedItem(name)) value[name] = form.elements.namedItem(name).value;
    if (form.elements.namedItem('activo')) value.activo = form.elements.activo.checked;
    if (state.tab === 'grupos') value.contingentes = [...form.querySelectorAll('[name="contingentes"]:checked')].map(node => node.value);
  }
  function render(root, notice = '') {
    if (!root.isConnected) return;
    const type = state.tab, collection = state.data[type], creating = ['promociones', 'contingentes'].includes(type);
    const id = state.selected[type] || '', value = draft(type, id);
    root.innerHTML = `<h2>Promociones y salidas</h2><p>Separá la pertenencia al colegio de la salida en la que viaja cada pasajero.</p><nav class="academic-tabs" aria-label="Organización del viaje">${Object.entries(title).map(([key, name]) => `<button type="button" data-academic-tab="${key}" aria-pressed="${key === type}">${name}</button>`).join('')}</nav><div class="academic-toolbar">${label(creating ? 'Crear o editar' : title[type], select('registro', collection.map(row => ({ id: row.id, label: type === 'grupos' ? groupName(row) : type === 'pasajeros' ? `${row.apellido} ${row.nombre} · ${groupName(state.data.grupos.find(group => group.id === row.grupo_id) || {})}` : type === 'promociones' ? `${row.nombre} · ${schoolName(row.colegio_id)} · ${row.anio_egreso}${row.activo ? '' : ' · Inactiva'}` : `${row.nombre} · ${tripName(row.viaje_id)}${row.activo ? '' : ' · Inactiva'}` })), id, creating ? `Nueva ${type === 'promociones' ? 'promoción' : 'salida'}` : 'Elegí un registro'))}<button type="button" data-academic-refresh>Volver a consultar</button></div><p data-academic-notice role="status">${escape(notice)}</p>${value ? `<form data-academic-form><fieldset class="academic-fields">${fields(type, id, value)}${creating ? `${label('Nombre', input('nombre', value.nombre, 'required minlength="2" maxlength="150"'))}${label('Notas internas · opcional', `<textarea name="observaciones" maxlength="5000" rows="3">${escape(value.observaciones)}</textarea>`)}<label class="academic-check"><input type="checkbox" name="activo" ${value.activo ? 'checked' : ''}>Activa</label><p>Desactivar conserva el historial y sus vínculos.</p>` : ''}<div class="academic-actions"><button type="submit" class="admin-pasajeros-primary-button">${creating ? 'Guardar ' + (type === 'promociones' ? 'promoción' : 'salida') : type === 'grupos' ? 'Guardar vínculos del grupo' : 'Guardar asignación'}</button><button type="button" data-academic-discard>Descartar cambios del formulario</button></div></fieldset><p data-academic-message role="status"></p></form>` : `<p>${collection.length ? 'Elegí un registro para revisar y guardar sus vínculos.' : 'Todavía no hay ' + title[type].toLowerCase() + ' disponibles. Cargá primero el grupo y sus pasajeros.'}</p>`}`;
    root.querySelectorAll('[data-academic-tab]').forEach(button => button.onclick = () => { state.tab = button.dataset.academicTab; render(root); });
    root.querySelector('[name="registro"]').onchange = event => { state.selected[type] = event.target.value; render(root); };
    root.querySelector('[data-academic-refresh]').onclick = async event => { event.currentTarget.disabled = true; try { state.data = await request(); render(root, 'Datos consultados. Conservamos tus borradores; si había un conflicto, descartá el formulario para cargar la versión actual.'); } catch (error) { show(root.querySelector('[data-academic-notice]'), error); } finally { if (root.isConnected) root.querySelector('[data-academic-refresh]').disabled = false; } };
    const form = root.querySelector('form');
    if (!form) return;
    form.oninput = () => read(form, value);
    form.onchange = () => read(form, value);
    form.querySelector('[name="busquedaColegio"]')?.addEventListener('input', event => {
      const options = schoolOptions(value, event.target.value);
      form.elements.colegioId.innerHTML = option('', 'Elegí una opción', value.colegioId) + options.rows.map(row => option(row.id, row.label, value.colegioId)).join('');
      form.querySelector('[data-academic-school-count]').textContent = options.count > 80 ? 'Mostramos hasta 80 opciones. Escribí más para acotar la lista.' : `${options.count} colegios encontrados.`;
    });
    form.querySelector('[data-academic-discard]').onclick = () => { delete state.drafts[type + ':' + id]; render(root); };
    form.onsubmit = async event => {
      event.preventDefault(); read(form, value);
      const body = { ...value, ...(type === 'promociones' ? { anioEgreso: Number(value.anioEgreso) } : {}) };
      if (type === 'grupos') body.promocionId ||= null;
      if (type === 'pasajeros') body.contingenteId ||= null;
      root.querySelectorAll('button,select,input,textarea').forEach(node => node.disabled = true);
      show(form.querySelector('[data-academic-message]'), 'Guardando…');
      try {
        const result = await request('/' + type + (creating ? '' : '/' + encodeURIComponent(id)), body);
        if (!root.isConnected) return;
        const saved = result.registro || result.grupo || result.pasajero;
        const index = collection.findIndex(row => row.id === saved.id);
        if (index < 0) collection.push(saved); else collection[index] = saved;
        delete state.drafts[type + ':' + id]; state.selected[type] = saved.id;
        delete state.drafts[type + ':' + saved.id];
        render(root, type === 'grupos' ? 'Vínculos del grupo guardados.' : type === 'pasajeros' ? 'Asignación del pasajero guardada.' : 'Registro guardado.');
      } catch (error) { show(form.querySelector('[data-academic-message]'), error); }
      finally { if (root.isConnected) root.querySelectorAll('button,select,input,textarea').forEach(node => node.disabled = false); }
    };
  }
  function show(node, value) { node.textContent = value.message || value; node.setAttribute('role', value instanceof Error ? 'alert' : 'status'); }
  async function mount(root) {
    if (!root) return;
    root.innerHTML = '<h2>Promociones y salidas</h2><p role="status">Consultando la organización del viaje…</p>';
    try { state.data = await request(); render(root); }
    catch (error) { if (root.isConnected) { root.innerHTML = `<h2>Promociones y salidas</h2><p role="alert">${escape(error.message)}</p><button type="button" data-academic-retry>Volver a consultar</button>`; root.querySelector('button').onclick = () => mount(root); } }
  }
  window.ElAngelAzulAcademic = { mount, clear: () => { state = fresh(); } };
})();
