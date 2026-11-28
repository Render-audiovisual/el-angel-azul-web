// Cuentas del administrador. Estado privado en memoria, nunca en almacenamiento web.
(() => {
  const fresh = () => ({ planId: '', passengerId: '', drafts: new Map(), allocation: null });
  let memory = fresh();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const money = cents => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(Number(cents || 0)/100);
  const decimal = cents => cents === null || cents === undefined ? '' : (Number(cents)/100).toFixed(2);
  const amount = value => { const parsed = window.ElAngelAzulPayments.amountText(value); if(!parsed || Number(parsed)<=0)throw Error('Revisá los importes: usá valores positivos con hasta dos decimales.'); return parsed; };
  async function request(path,body){
    let response;
    try { response=await fetch(path,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})}); }
    catch (_) { throw Error('No recibimos la confirmación del servidor. Conservamos los datos: revisá la conexión y volvé a intentar.'); }
    const payload=await response.json();if(!response.ok || !payload.ok){const error=Error(payload.error || 'No pudimos consultar la cuenta. Volvé a intentar.');error.status=response.status;throw error;}return payload;
  }
  async function mount(root,{initialPassenger='',onSessionLost=()=>{}}={}){
    if(!root)return;
    let plans=[],passengers=[],ticket=0;
    const notice=(node,error)=>{node.textContent=error.message||error;node.setAttribute('role',error instanceof Error?'alert':'status');node.classList.toggle('admin-form-error',error instanceof Error);if(error.status===401)onSessionLost();};
    root.innerHTML='<h2>Planes, cuotas y saldos</h2><p role="status">Consultando las cuentas…</p>';
    try{
      const [p,pax]=await Promise.all([request('/api/admin/finanzas/planes'),request('/api/google-sheets?sheet=PASAJEROS')]);
      if(!root.isConnected)return;
      plans=p.planes;passengers=pax.rows;
    }catch(error){if(!root.isConnected)return;root.innerHTML='<h2>Planes, cuotas y saldos</h2><p data-account-error class="admin-form-error"></p><button type="button" data-account-retry>Volver a consultar cuentas</button>';notice(root.querySelector('[data-account-error]'),error);root.querySelector('[data-account-retry]').onclick=()=>mount(root,{initialPassenger,onSessionLost});return;}
    if(initialPassenger)memory.passengerId=initialPassenger;
    root.innerHTML=`<h2>Planes, cuotas y saldos</h2><p>Configurá las condiciones acordadas y confirmá la cuenta de cada pasajero. Los cobros sin imputar reducen el saldo general; cada cuota se cancela al asignarle un pago.</p>
      <details class="admin-account-plans"><summary>Configurar importes y vencimientos de un plan</summary><p>Editar un plan cambia futuras cuentas. Las cuentas ya confirmadas conservan sus condiciones.</p>
      <label>Plan de pago<select data-account-plan><option value="">Elegí un plan</option>${plans.map(plan=>`<option value="${escape(plan.id)}">${escape(plan.nombre)} · Contrato ${escape(plan.codigo_contrato || 'sin código')}${plan.activo?'':' · Inactivo'}</option>`).join('')}</select></label><div data-account-plan-form></div></details>
      <div class="admin-account-passenger"><h3>Cuenta del pasajero</h3><label>Pasajero<select data-account-passenger><option value="">Elegí un pasajero</option>${passengers.map(pax=>`<option value="${escape(pax.id)}">${escape([pax.apellido,pax.nombre].filter(Boolean).join(', '))} · DNI ${escape(pax.dni)}</option>`).join('')}</select></label><div data-account-result aria-live="polite"></div></div>`;
    const select=root.querySelector('[data-account-plan]');const editor=root.querySelector('[data-account-plan-form]');
    function renderPlan(){
      const plan=plans.find(row=>row.id===select.value);memory.planId=select.value;if(!plan){editor.replaceChildren();return;}
      const draft=memory.drafts.get(plan.id)||{version:plan.version,planVersion:plan.planVersion,total:decimal(plan.total_centavos),condiciones:plan.condiciones,cuotas:Array.from({length:plan.cuotas},(_,index)=>{const row=plan.cronograma[index];return {concepto:row?.concepto || `Cuota ${index+1}`,vencimiento:row?.vencimiento || '',monto:row?decimal(row.monto_centavos):''};})};
      memory.drafts.set(plan.id,draft);
      editor.innerHTML=`<form data-account-conditions><fieldset><div class="admin-account-form-grid"><label>Precio acordado (ARS)<input name="total" inputmode="decimal" value="${escape(draft.total)}" required></label><p>${plan.cuotas} cuotas. Ingresá cada importe y fecha según el acuerdo.</p></div>
        <div class="admin-account-schedule">${draft.cuotas.map((row,index)=>`<div class="admin-account-schedule-row"><label>Concepto ${index+1}<input name="concepto_${index}" value="${escape(row.concepto)}" maxlength="200" required></label><label>Vencimiento ${index+1}<input type="date" name="vencimiento_${index}" value="${escape(row.vencimiento)}" required></label><label>Importe ${index+1} (ARS)<input name="monto_${index}" inputmode="decimal" value="${escape(row.monto)}" required></label></div>`).join('')}</div>
        <label>Condiciones acordadas<textarea name="condiciones" maxlength="10000" rows="3">${escape(draft.condiciones)}</textarea></label><p>La suma debe coincidir con el precio. No se generan intereses ni recargos.</p><div class="admin-payment-actions"><button type="submit" class="admin-pasajeros-primary">Guardar condiciones del plan</button><button type="button" data-account-plan-reload>Descartar edición y recargar</button></div></fieldset><p data-account-condition-message></p></form>`;
      const form=editor.querySelector('form');const message=editor.querySelector('[data-account-condition-message]');
      const remember=()=>{const data=new FormData(form);draft.total=data.get('total');draft.condiciones=data.get('condiciones');draft.cuotas=draft.cuotas.map((_,index)=>({concepto:data.get(`concepto_${index}`),vencimiento:data.get(`vencimiento_${index}`),monto:data.get(`monto_${index}`)}));};
      form.addEventListener('input',remember);form.addEventListener('change',remember);
      form.addEventListener('submit',async event=>{event.preventDefault();const fieldset=form.querySelector('fieldset');if(fieldset.disabled)return;remember();
        try{const payload={version:draft.version,planVersion:draft.planVersion,moneda:'ARS',total:amount(draft.total),condiciones:draft.condiciones,cuotas:draft.cuotas.map(row=>({...row,monto:amount(row.monto)}))};fieldset.disabled=true;notice(message,'Guardando condiciones…');const saved=await request('/api/admin/finanzas/planes/'+encodeURIComponent(plan.id),payload);plans=plans.map(row=>row.id===plan.id?saved.plan:row);memory.drafts.delete(plan.id);renderPlan();notice(editor.querySelector('[data-account-condition-message]'),'Condiciones guardadas. Las cuentas anteriores conservan sus importes.');if(memory.passengerId)await renderAccount();}
        catch(error){notice(message,error);}finally{fieldset.disabled=false;}
      });
      editor.querySelector('[data-account-plan-reload]').onclick=async()=>{if(!confirm('Se descartarán los cambios de este formulario. ¿Volver a consultar las condiciones guardadas?'))return;try{plans=(await request('/api/admin/finanzas/planes')).planes;memory.drafts.delete(plan.id);renderPlan();}catch(error){notice(message,error);}};
    }
    select.value=memory.planId;select.onchange=renderPlan;renderPlan();
    const passengerSelect=root.querySelector('[data-account-passenger]');const result=root.querySelector('[data-account-result]');
    async function renderAccount(){
      const id=passengerSelect.value;memory.passengerId=id;const current=++ticket;
      if(!id){result.innerHTML='<p>Elegí un pasajero para consultar su cuenta o confirmar su plan.</p>';return;}
      result.innerHTML='<p role="status">Consultando saldo y cuotas…</p>';
      try{
        const [data,paymentData]=await Promise.all([request('/api/admin/finanzas/pasajeros/'+encodeURIComponent(id)),request('/api/admin/pagos')]);if(current!==ticket || !root.isConnected)return;
        if(!data.cuenta){
          const plan=plans.find(plan=>plan.id===data.planId);
          result.innerHTML=`<p>No hay una cuenta confirmada. ${plan?`Plan asignado: <strong>${escape(plan.nombre)}</strong>.`:'Asigná primero un plan del contrato desde Pasajeros.'}</p>${plan?`<p>${plan.version?`${plan.cuotas} cuotas · Precio acordado: ${escape(money(plan.total_centavos))}. Revisá las condiciones antes de confirmar.`:'Este plan todavía no tiene importes y vencimientos. Configuralos arriba.'}</p>${plan.version?`<details><summary>Ver importes, fechas y condiciones antes de confirmar</summary><ol>${plan.cronograma.map(row=>`<li>${escape(row.concepto)} · ${escape(row.vencimiento.split('-').reverse().join('/'))} · ${escape(money(row.monto_centavos))}</li>`).join('')}</ol><p class="admin-account-terms">${escape(plan.condiciones)}</p></details>`:''}<button type="button" data-account-confirm ${plan.version&&plan.activo?'':'disabled'}>Revisar y confirmar cuenta</button>`:''}<p data-account-confirm-message></p>`;
          result.querySelector('[data-account-confirm]')?.addEventListener('click',async event=>{
            if(!confirm(`Confirmar la cuenta por ${money(plan.total_centavos)} en ${plan.cuotas} cuotas. Se conservarán estos importes y fechas como historial. ¿Confirmar?`))return;
            event.currentTarget.disabled=true;try{await request('/api/admin/finanzas/pasajeros/'+encodeURIComponent(id)+'/confirmar',{planId:plan.id,version:plan.version,planVersion:plan.planVersion});await renderAccount();}catch(error){notice(result.querySelector('[data-account-confirm-message]'),error);const button=result.querySelector('[data-account-confirm]');if(button)button.disabled=false;}
          });return;
        }
        const payments=paymentData.pagos.filter(row=>row.pasajero_id===data.cuenta.pasajero_id && row.estado==='confirmado');
        const quotas=data.cuotas.filter(row=>Number(row.pendiente_centavos)>0);
        result.innerHTML=`<dl class="admin-account-totals"><div><dt>Precio confirmado</dt><dd>${escape(money(data.cuenta.total_centavos))}</dd></div><div><dt>Cobros confirmados</dt><dd>${escape(money(data.pagado_centavos))}</dd></div><div><dt>Saldo pendiente</dt><dd data-account-balance>${escape(money(data.saldo_centavos))}</dd></div>${Number(data.saldo_favor_centavos)>0?`<div><dt>Saldo a favor</dt><dd>${escape(money(data.saldo_favor_centavos))}</dd></div>`:''}<div><dt>Cobros sin imputar</dt><dd>${escape(money(data.sin_imputar_centavos))}</dd></div></dl>
          <p>Condiciones del plan, versión ${data.cuenta.plan_version}. Confirmó: ${escape(data.cuenta.actor_username)}.</p>${data.cuenta.condiciones?`<details><summary>Ver condiciones confirmadas</summary><p class="admin-account-terms">${escape(data.cuenta.condiciones)}</p></details>`:''}
          <div class="admin-pasajeros-table-wrap"><table class="admin-pasajeros-table admin-account-table"><caption>Cuotas del pasajero</caption><thead><tr><th>Cuota</th><th>Vencimiento</th><th>Importe</th><th>Imputado</th><th>Pendiente</th><th>Estado</th></tr></thead><tbody>${data.cuotas.map(row=>`<tr><td>${row.numero} · ${escape(row.concepto)}</td><td>${escape(row.vencimiento.split('-').reverse().join('/'))}</td><td>${escape(money(row.monto_centavos))}</td><td>${escape(money(row.imputado_centavos))}</td><td>${escape(money(row.pendiente_centavos))}</td><td>${escape({pagada:'Pagada',pendiente:'Pendiente',vencida:'Vencida'}[row.estado])}</td></tr>`).join('')}</tbody></table></div>
          ${payments.length&&quotas.length?`<details class="admin-account-allocation"><summary>Asignar un cobro a una cuota</summary><p>Elegí el movimiento y el importe a imputar. El sistema verifica que no superen el pago disponible ni el saldo de la cuota.</p><form data-account-allocation><fieldset><div class="admin-account-form-grid"><label>Cobro confirmado<select name="pagoId" required><option value="">Elegí un cobro</option>${payments.map(row=>`<option value="${escape(row.id)}">${escape(row.fecha)} · ${escape(money(row.monto_centavos))} · ${escape(row.concepto)}</option>`).join('')}</select></label><label>Cuota<select name="cuotaId" required><option value="">Elegí una cuota</option>${quotas.map(row=>`<option value="${escape(row.id)}">${row.numero} · ${escape(row.concepto)} · Pendiente ${escape(money(row.pendiente_centavos))}</option>`).join('')}</select></label><label>Importe a imputar (ARS)<input name="monto" inputmode="decimal" required></label></div><button class="admin-pasajeros-primary" type="submit">Confirmar imputación</button></fieldset><p data-account-allocation-message></p></form></details>`:'<p>No hay cobros confirmados o cuotas pendientes para imputar.</p>'}
          <button type="button" data-account-refresh>Actualizar cuenta</button>`;
        result.querySelector('[data-account-refresh]').onclick=renderAccount;
        result.querySelector('[data-account-allocation]')?.addEventListener('submit',async event=>{
          event.preventDefault();const form=event.currentTarget;const fieldset=form.querySelector('fieldset');if(fieldset.disabled)return;const message=form.querySelector('[data-account-allocation-message]');
          try{const fields=Object.fromEntries(new FormData(form));fields.monto=amount(fields.monto);const fingerprint=JSON.stringify(fields);if(memory.allocation?.fingerprint!==fingerprint)memory.allocation={fingerprint,id:crypto.randomUUID()};fieldset.disabled=true;notice(message,'Guardando imputación…');await request('/api/admin/finanzas/imputaciones',{...fields,id:memory.allocation.id});memory.allocation=null;await renderAccount();}catch(error){notice(message,error);}finally{fieldset.disabled=false;}
        });
      }catch(error){if(current!==ticket || !root.isConnected)return;result.innerHTML='<p data-account-load-error class="admin-form-error"></p><button type="button" data-account-refresh>Volver a consultar la cuenta</button>';notice(result.querySelector('[data-account-load-error]'),error);result.querySelector('[data-account-refresh]').onclick=renderAccount;}
    }
    passengerSelect.value=memory.passengerId;passengerSelect.onchange=renderAccount;await renderAccount();
  }
  window.ElAngelAzulAccounts={mount,clear:()=>{memory=fresh();}};
})();
