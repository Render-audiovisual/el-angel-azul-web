// Selecciones y borradores de archivos: solo memoria, nunca almacenamiento del navegador.
(() => {
  const memory = new Map();
  const names = { contrato_firmado:'Contrato firmado',dni_frente:'DNI · frente',dni_dorso:'DNI · dorso',ficha_medica:'Ficha médica',autorizacion:'Autorización',comprobante_pago:'Comprobante de pago',otro:'Otro documento' };
  const states = { pendiente:'Pendiente de revisión',aprobado:'Aprobado',rechazado:'Necesita corrección' };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[char]));
  async function request(path, body) {
    let response;
    try { response=await fetch(path,{cache:'no-store',credentials:'same-origin',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})}); }
    catch (_) { throw Error('No recibimos la confirmación. Conservamos tu selección: volvé a consultar antes de repetir el envío.'); }
    const data=await response.json();
    if(response.status===401 && path.startsWith('/api/admin/'))window.dispatchEvent(new Event('eaa-admin-session-lost'));
    if(!response.ok||!data.ok)throw Object.assign(Error(data.error||'No pudimos consultar los documentos.'),{status:response.status});
    return data;
  }
  const readFile = file => new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('No pudimos leer el archivo. Elegilo de nuevo.'));reader.readAsDataURL(file);});
  async function prepare(file) {
    let source=file, mime=file.type || (/\.pdf$/i.test(file.name)?'application/pdf':/\.png$/i.test(file.name)?'image/png':/\.jpe?g$/i.test(file.name)?'image/jpeg':'');
    let nombre=file.name;
    if(!['application/pdf','image/png','image/jpeg'].includes(mime)||!file.size||file.size>5*1024*1024)throw Error('Elegí un PDF, JPG o PNG de hasta 5 MB.');
    if(mime!=='application/pdf') {
      const url=URL.createObjectURL(file);
      try {
        const image=new Image();image.src=url;await image.decode();
        if(mime==='image/jpeg'||image.naturalWidth*image.naturalHeight>3800000){
          const scale=Math.min(1,Math.sqrt(3800000/(image.naturalWidth*image.naturalHeight)));
          const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.floor(image.naturalWidth*scale));canvas.height=Math.max(1,Math.floor(image.naturalHeight*scale));
          const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
          source=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.9));
          if(!source)throw Error('No pudimos preparar la foto. Probá con otra copia o un PDF.');
          nombre=nombre.replace(/\.[^.]+$/,'')+'.jpg';mime='image/jpeg';
        }
      } catch(error) { throw Error(error.message||'No pudimos preparar la foto. Probá con otra copia o un PDF.'); }
      finally { URL.revokeObjectURL(url); }
    }
    if(source.size>5*1024*1024)throw Error('El archivo preparado supera 5 MB. Elegí una copia más liviana.');
    return {nombre,mime,contenidoBase64:await readFile(source)};
  }
  async function mount(root,{mode='admin',type='pasajeros',id,onSessionLost=()=>{}}) {
    if(!root||!id)return;
    const key=mode+':'+type+':'+id;
    if(!memory.has(key))memory.set(key,{file:null,tipo:type==='contratos'?'contrato_firmado':'',id:null,prepared:null,reviews:new Map()});
    const draft=memory.get(key),portal=mode==='portal';
    const path=portal?`/api/portal/pasajeros/${encodeURIComponent(id)}/documentos`:`/api/admin/documentos/${type}/${encodeURIComponent(id)}`;
    let data,busy=false,disabledStates=[];
    const lock=()=>{disabledStates=[...root.querySelectorAll('button,input,select,textarea')].map(node=>[node,node.disabled]);for(const [node]of disabledStates)node.disabled=true;};
    const unlock=()=>{for(const [node,disabled]of disabledStates)if(node.isConnected)node.disabled=disabled;disabledStates=[];};
    root.classList.add('angel-documents');root.innerHTML='<h3>Documentos privados</h3><p role="status">Consultando los archivos del viaje…</p>';
    const notice=(node,message)=>{if(!root.isConnected)return;node.textContent=message.message||message;node.setAttribute('role',message instanceof Error?'alert':'status');if(message.status===401&&portal)onSessionLost();};
    const load=async()=>{data=await request(path);if(draft.id&&data.documentos.some(row=>row.id===draft.id)){draft.file=null;draft.prepared=null;draft.id=null;}render();};
    const download=async doc=>{
      const url=portal?`${path}/${encodeURIComponent(doc.id)}/archivo`:`/api/admin/documentos/${encodeURIComponent(doc.id)}/archivo`;
      try {
        const response=await fetch(url,{credentials:'same-origin',cache:'no-store'});
        if(!response.ok){if(response.status===401&&!portal)window.dispatchEvent(new Event('eaa-admin-session-lost'));const result=await response.json();throw Object.assign(Error(result.error||'No pudimos descargar el archivo.'),{status:response.status});}
        const blob=await response.blob(),object=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=object;anchor.download=doc.nombre_original;anchor.click();setTimeout(()=>URL.revokeObjectURL(object),1000);
      } catch(error){notice(root.querySelector('[data-document-notice]'),error);}
    };
    function reviewFields(doc) {
      if(!draft.reviews.has(doc.id))draft.reviews.set(doc.id,{version:doc._version,estado:doc.estado,visibleFamilia:doc.visible_familia,observaciones:doc.observaciones||''});
      const value=draft.reviews.get(doc.id);
      return `<details class="document-review"><summary>Revisar documento</summary><form data-document-review="${escape(doc.id)}"><label>Estado<select name="estado">${Object.entries(states).map(([key,name])=>`<option value="${key}" ${value.estado===key?'selected':''}>${name}</option>`).join('')}</select></label><label>Mensaje para la familia<textarea name="observaciones" rows="2" maxlength="2000">${escape(value.observaciones)}</textarea></label><label class="document-check"><input type="checkbox" name="visibleFamilia" ${value.visibleFamilia?'checked':''}>${doc.contrato_id?'Compartir con las familias de este contrato, una vez aprobado':'Compartir con el pasajero y sus responsables'}</label><div class="document-actions"><button type="submit">Guardar revisión</button><button type="button" data-document-discard="${escape(doc.id)}">Descartar revisión</button></div><p data-document-review-message role="status"></p></form></details>`;
    }
    function render(message='') {
      if(!root.isConnected)return;
      root.innerHTML=`<h3>${type==='contratos'?'Contrato firmado y archivos':'Documentos privados'}</h3><p>${type==='contratos'?'Adjuntá el PDF firmado. Sus importes, planes y condiciones se administran por separado; no se extraen ni activan automáticamente desde el archivo.':'Adjuntá la documentación del pasajero. La agencia revisa cada archivo; subir un comprobante no registra ni confirma un pago.'}</p><button type="button" data-document-refresh>Volver a consultar documentos</button><p data-document-notice role="status">${escape(message)}</p>${data.documentos.length?`<ul class="document-list">${data.documentos.map(doc=>`<li><div class="document-description"><strong>${escape(doc.nombre_original)}</strong><p>${escape(names[doc.tipo_documento]||'Documento')} · ${escape(states[doc.estado]||doc.estado)} · ${new Intl.NumberFormat('es-AR',{maximumFractionDigits:0}).format(doc.tamano_bytes/1024)} KB</p>${doc.observaciones?`<p>${escape(doc.observaciones)}</p>`:''}${!portal?`<p>${doc.visible_familia?'Compartido con su familia'+(doc.contrato_id&&doc.estado!=='aprobado'?' al aprobarse':''):'Solo administración'}</p>`:''}</div><button type="button" data-document-download="${escape(doc.id)}" ${data.almacenamientoDisponible?'':'disabled'}>Descargar archivo</button>${portal?'':reviewFields(doc)}</li>`).join('')}</ul>`:'<p>Todavía no hay documentos para mostrar.</p>'}${data.siguiente?'<button type="button" data-document-more>Ver documentos anteriores</button>':''}<form class="document-upload" data-document-upload><fieldset ${data.almacenamientoDisponible?'':'disabled'}><legend>Adjuntar ${type==='contratos'?'contrato firmado':'documento'}</legend>${type==='contratos'?'':`<label>Tipo de documento<select name="tipo" required><option value="">Elegí el documento</option>${Object.entries(names).filter(([key])=>key!=='contrato_firmado').map(([key,name])=>`<option value="${key}" ${draft.tipo===key?'selected':''}>${name}</option>`).join('')}</select></label>`}<label>${draft.file?'Cambiar archivo seleccionado':'Elegí un archivo'}<input type="file" name="archivo" accept="${type==='contratos'?'.pdf':'.pdf,.jpg,.jpeg,.png'}" ${draft.file?'':'required'}></label><p data-document-selection>${draft.file?escape('Seleccionado: '+draft.file.name):'Ningún archivo seleccionado.'}</p><p>${type==='contratos'?'PDF de hasta 5 MB y 100 páginas.':'PDF, JPG o PNG de hasta 5 MB. Las fotos se ajustan para enviarlas; tu original no se modifica.'}</p><button type="submit">Adjuntar ${type==='contratos'?'PDF firmado':'documento'}</button></fieldset><p data-document-upload-message role="status"></p></form>${data.almacenamientoDisponible?'':'<p>La carga y descarga de archivos todavía no está habilitada. Consultá con la agencia.</p>'}`;
      root.querySelector('[data-document-refresh]').onclick=async()=>{if(busy)return;busy=true;lock();try{await load();}catch(error){notice(root.querySelector('[data-document-notice]'),error);}finally{busy=false;unlock();}};
      root.querySelectorAll('[data-document-download]').forEach(button=>button.onclick=()=>download(data.documentos.find(doc=>doc.id===button.dataset.documentDownload)));
      root.querySelector('[data-document-more]')?.addEventListener('click',async()=>{if(busy)return;busy=true;lock();try{const next=await request(path+'?antes='+encodeURIComponent(data.siguiente));data.documentos=[...new Map([...data.documentos,...next.documentos].map(row=>[row.id,row])).values()];data.siguiente=next.siguiente;render();}catch(error){notice(root.querySelector('[data-document-notice]'),error);}finally{busy=false;unlock();}});
      const form=root.querySelector('[data-document-upload]');
      form.querySelector('[name="archivo"]').onchange=event=>{const file=event.target.files[0];if(!file)return;draft.file=file;draft.id=crypto.randomUUID();draft.prepared=null;root.querySelector('[data-document-selection]').textContent='Seleccionado: '+file.name;};
      form.querySelector('[name="tipo"]')?.addEventListener('change',event=>{draft.tipo=event.target.value;draft.id=crypto.randomUUID();});
      form.onsubmit=async event=>{
        event.preventDefault();if(busy)return;
        const output=form.querySelector('[data-document-upload-message]');
        if(!draft.file){notice(output,Error('Elegí primero un archivo.'));return;}
        busy=true;lock();
        try {
          notice(output,'Preparando y adjuntando el archivo…');
          draft.prepared ||= await prepare(draft.file);draft.id ||= crypto.randomUUID();
          const result=await request(path,{id:draft.id,tipo:draft.tipo,...draft.prepared});
          draft.file=null;draft.id=null;draft.prepared=null;
          data.documentos=[result.documento,...data.documentos.filter(doc=>doc.id!==result.documento.id)];
          render('Archivo guardado. '+(states[result.documento.estado]||'Pendiente de revisión')+'.');
        }catch(error){notice(output,error);}
        finally{busy=false;unlock();}
      };
      root.querySelectorAll('[data-document-review]').forEach(form=>{
        const doc=data.documentos.find(row=>row.id===form.dataset.documentReview),value=draft.reviews.get(doc.id);
        const read=()=>{value.estado=form.elements.estado.value;value.observaciones=form.elements.observaciones.value;value.visibleFamilia=form.elements.visibleFamilia.checked;};
        form.oninput=read;form.onchange=read;
        form.onsubmit=async event=>{
          event.preventDefault();if(busy)return;read();
          if(doc.contrato_id&&value.visibleFamilia&&value.estado==='aprobado'&&(!doc.visible_familia||doc.estado!=='aprobado')&&!confirm('¿Compartir este PDF con todos los pasajeros y responsables de este contrato? Verificá que no contenga datos privados de otras personas.'))return;
          busy=true;lock();
          try{const result=await request('/api/admin/documentos/'+encodeURIComponent(doc.id)+'/revisar',value);data.documentos=data.documentos.map(row=>row.id===doc.id?result.documento:row);draft.reviews.delete(doc.id);render('Revisión guardada.');}
          catch(error){notice(form.querySelector('[data-document-review-message]'),error);}
          finally{busy=false;unlock();}
        };
      });
      root.querySelectorAll('[data-document-discard]').forEach(button=>button.onclick=()=>{draft.reviews.delete(button.dataset.documentDiscard);render();});
    }
    try{await load();}
    catch(error){if(root.isConnected){root.innerHTML=`<h3>Documentos privados</h3><p role="alert">${escape(error.message)}</p><button type="button">Volver a consultar documentos</button>`;root.querySelector('button').onclick=()=>mount(root,{mode,type,id,onSessionLost});if(error.status===401&&portal)onSessionLost();}}
  }
  window.ElAngelAzulDocuments={mount,clear:scope=>{for(const key of memory.keys())if(!scope||key.startsWith(scope+':'))memory.delete(key);}};
})();
