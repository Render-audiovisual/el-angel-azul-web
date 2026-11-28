(() => {
  const drafts=new Map();
  const names={dni_frente:'DNI · frente',dni_dorso:'DNI · dorso',ficha_medica:'Ficha médica',autorizacion:'Autorización',comprobante_pago:'Comprobante de pago',otro:'Otro documento'};
  const states={aprobado:'Aprobado',pendiente:'Pendiente de revisión',rechazado:'Necesita corrección',faltante:'Falta adjuntar'};
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  async function request(path,body) {
    let response;try {response=await fetch(path,{cache:'no-store',credentials:'same-origin',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});}
    catch(_){throw Error('No recibimos la confirmación. Conservamos tu edición; volvé a consultar antes de repetir el guardado.');}
    const data=await response.json();
    if(response.status===401&&path.startsWith('/api/admin/'))window.dispatchEvent(new Event('eaa-admin-session-lost'));
    if(!response.ok||!data.ok)throw Object.assign(Error(data.error||'No pudimos consultar la información del contrato.'),{status:response.status});
    return data;
  }
  async function mount(root,{id,mode='admin',type='contratos',onSessionLost=()=>{}}) {
    if(!root||!id)return;
    const editor=mode==='admin'&&type==='contratos';
    const path=editor?`/api/admin/contratos/${encodeURIComponent(id)}/informacion`:`/api/${mode}/pasajeros/${encodeURIComponent(id)}/informacion`;
    root.classList.add('angel-documents','contract-information');
    let data,busy=false;
    const message=text=>{const node=root.querySelector('[data-information-message]');if(node){node.textContent=text;node.setAttribute('role','alert');}};
    const read=()=>{
      if(!editor||!drafts.has(id))return;
      const form=root.querySelector('[data-information-form]'),draft=drafts.get(id);if(!form)return;
      draft.requisitos=[...form.querySelectorAll('[name="requisito"]:checked')].map(node=>node.value);
      for(const notice of draft.avisos){const field=form.querySelector(`[data-notice-id="${notice.id}"]`);if(field){notice.titulo=field.querySelector('[name="titulo"]').value;notice.texto=field.querySelector('[name="texto"]').value;notice.publicado=field.querySelector('[name="publicado"]').checked;}}
    };
    async function load(discard=false) {
      const result=await request(path);if(!root.isConnected)return;
      data=result;
      if(editor&&(!drafts.has(id)||discard))drafts.set(id,{revision:data.revision,requisitos:[...data.requisitos],avisos:data.avisos.map(row=>({...row}))});
      render();
    }
    function render() {
      if(!root.isConnected)return;
      const draft=drafts.get(id);
      root.innerHTML=editor?`<h3>Documentación requerida y avisos</h3><p>Definí los requisitos de este contrato. Los avisos publicados se muestran únicamente a sus familias en Mi viaje.</p><div class="document-actions"><button type="button" data-information-refresh>Volver a consultar</button><button type="button" data-information-discard>Descartar edición y cargar lo actual</button></div><p data-information-message role="status">${draft.revision!==data.revision?'Hay una versión nueva. Tu edición mantiene la versión anterior para evitar sobrescribirla.':''}</p><form data-information-form><fieldset><legend>Documentos que pide este contrato</legend>${Object.entries(names).map(([key,name])=>`<label class="document-check"><input name="requisito" type="checkbox" value="${key}" ${draft.requisitos.includes(key)?'checked':''}>${escape(name)}</label>`).join('')}<p>Sin selección no se exige ningún tipo desde esta lista. Detallá en un aviso las instrucciones que necesiten las familias.</p></fieldset><fieldset><legend>Avisos para las familias</legend>${draft.avisos.length?draft.avisos.map((notice,index)=>`<fieldset data-notice-id="${notice.id}" class="contract-notice-editor"><legend>Aviso ${index+1}</legend><label>Título del aviso<input name="titulo" maxlength="150" required value="${escape(notice.titulo)}"></label><label>Texto del aviso<textarea name="texto" maxlength="5000" rows="4" required>${escape(notice.texto)}</textarea></label><label class="document-check"><input name="publicado" type="checkbox" ${notice.publicado?'checked':''}>Mostrar este aviso a las familias</label><p>Para ocultarlo, quitá la selección y guardá. Su historial se conserva.</p></fieldset>`).join(''):'<p>Todavía no hay avisos para este contrato.</p>'}<button type="button" data-information-add ${draft.avisos.length>=20?'disabled':''}>Agregar aviso</button></fieldset><button type="submit">Guardar requisitos y avisos</button></form>`:
      `<h3>Documentación requerida</h3><p data-information-message role="status"></p>${data.requisitos.length?`<ul class="contract-requirements">${data.requisitos.map(row=>`<li><strong>${escape(names[row.tipo]||row.tipo)}</strong><span>${escape(states[row.estado]||row.estado)}</span></li>`).join('')}</ul>`:'<p>La agencia todavía no definió una lista de documentos para este contrato. Consultanos antes de adjuntar información sensible.</p>'}<h3>Avisos del viaje</h3>${data.avisos.length?`<ul class="contract-notices">${data.avisos.map(row=>`<li><h4>${escape(row.titulo)}</h4><p>${escape(row.texto)}</p></li>`).join('')}</ul>`:'<p>No hay avisos publicados para este viaje.</p>'}<button type="button" data-information-refresh>Actualizar información del viaje</button>`;
      root.querySelector('[data-information-refresh]').onclick=()=>run(()=>load());
      if(!editor)return;
      root.querySelector('[data-information-discard]').onclick=()=>run(()=>load(true));
      const form=root.querySelector('[data-information-form]');form.oninput=read;form.onchange=read;
      root.querySelector('[data-information-add]').onclick=()=>{read();if(draft.avisos.length>=20)return;draft.avisos.push({id:crypto.randomUUID(),titulo:'',texto:'',publicado:false});render();root.querySelector('[data-notice-id="'+draft.avisos.at(-1).id+'"] input').focus();};
      form.onsubmit=event=>{event.preventDefault();read();run(async()=>{const saved=await request(path,draft);if(!root.isConnected)return;data=saved;drafts.set(id,{revision:saved.revision,requisitos:[...saved.requisitos],avisos:saved.avisos.map(row=>({...row}))});render();root.querySelector('[data-information-message]').textContent='Requisitos y avisos guardados.';});};
    }
    async function run(action) {
      if(busy)return;busy=true;read();const controls=[...root.querySelectorAll('button,input,textarea')].map(node=>[node,node.disabled]);controls.forEach(([node])=>node.disabled=true);
      try {await action();} catch(error) {if(error.status===401&&mode==='portal')onSessionLost();message(error.message);}
      finally {busy=false;controls.forEach(([node,disabled])=>{if(node.isConnected)node.disabled=disabled;});}
    }
    root.innerHTML='<h3>Información del contrato</h3><p role="status">Consultando requisitos y avisos…</p>';
    try {await load();}catch(error){if(!root.isConnected)return;if(error.status===401&&mode==='portal')onSessionLost();root.innerHTML='<h3>No pudimos consultar los requisitos y avisos</h3><p data-information-message role="alert"></p><button type="button" data-information-retry>Volver a intentar</button>';message(error.message);root.querySelector('[data-information-retry]').onclick=()=>run(()=>load());}
    root._refreshInformation=()=>run(()=>load());
  }
  window.addEventListener('eaa-document-updated',event=>document.querySelectorAll('[data-passenger-information]').forEach(root=>{if(root.dataset.passengerInformation===event.detail?.id)root._refreshInformation?.();}));
  window.ElAngelAzulContractInformation={mount,clear:()=>drafts.clear()};
})();
