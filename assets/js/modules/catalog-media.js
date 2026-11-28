// La foto se incorpora al borrador; publicarla exige guardar/publicar el paquete.
(() => {
 const memory=new Map();
 const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
 async function request(body){let response;try{response=await fetch('/api/admin/catalogo/multimedia',{credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});}catch(_){throw Error('No recibimos la confirmación. Conservamos la selección para reintentar sin duplicar la foto.');}const data=await response.json();if(response.status===401)window.dispatchEvent(new Event('eaa-admin-session-lost'));if(!response.ok||!data.ok)throw Error(data.error||'No pudimos cargar la foto.');return data;}
 async function mount(root,{key,onPhoto}){
  if(!root)return;
  if(!memory.has(key))memory.set(key,{file:null,id:null,prepared:null,busy:false,photo:null,message:''});
  const draft=memory.get(key);draft.root=root;draft.deliver=onPhoto;
  function paint(){
   if(!root.isConnected)return;
   root.innerHTML=`<label>Foto desde tu dispositivo<input type="file" data-catalog-file accept=".jpg,.jpeg,.png,.webp" ${draft.busy||draft.photo||!draft.available?'disabled':''}></label><p>${escape(draft.file?'Seleccionada: '+draft.file.name:'JPG, PNG o WebP de hasta 5 MB. La foto se ajusta para la web; tu original no cambia.')}</p><button type="button" data-catalog-upload ${draft.busy||draft.photo||!draft.available?'disabled':''}>${draft.busy?'Cargando foto…':'Agregar foto desde archivo'}</button>${draft.photo?'<button type="button" data-catalog-use-photo>Agregar la foto ya cargada</button><button type="button" data-catalog-discard-photo>Descartar esta selección</button>':''}<p role="${draft.error?'alert':'status'}">${escape(draft.message||'')}</p>${draft.available?'':'<p>La carga de archivos todavía no está habilitada. Podés conservar las fotos existentes o usar un enlace.</p>'}`;
   root.querySelector('[data-catalog-file]').onchange=event=>{const file=event.target.files[0];if(file){draft.file=file;draft.prepared=null;draft.id=crypto.randomUUID();draft.error=false;draft.message='Seleccionada: '+file.name;paint();}};
   const deliver=()=>{const photo=draft.photo;if(!photo)return;draft.photo=null;draft.message='Foto incorporada al borrador. Guardá los cambios para incluirla en el paquete.';try{if(draft.deliver(photo)===false)draft.photo=photo;}catch(_){draft.photo=photo;draft.error=true;draft.message='La foto está cargada. Volvé a abrir el paquete para incorporarla.';}};
   root.querySelector('[data-catalog-use-photo]')?.addEventListener('click',()=>{deliver();paint();});
   root.querySelector('[data-catalog-discard-photo]')?.addEventListener('click',()=>{draft.photo=null;draft.file=null;draft.id=null;draft.prepared=null;draft.message='Selección descartada.';paint();});
   root.querySelector('[data-catalog-upload]').onclick=async()=>{
    if(draft.busy)return;if(!draft.file){draft.error=true;draft.message='Elegí primero una foto.';paint();return;}
    draft.busy=true;draft.error=false;draft.message='Preparando y cargando la foto…';paint();
    try{draft.prepared||=await window.ElAngelAzulFileInput.prepare(draft.file,{maxPixels:1600000,quality:.86,allowWebp:true,photosOnly:true});draft.id||=crypto.randomUUID();const result=await request({id:draft.id,...draft.prepared});draft.photo=result.foto;draft.file=null;draft.id=null;draft.prepared=null;draft.message='Foto cargada. Incorporala al borrador del paquete.';if(draft.root?.isConnected)deliver();}
    catch(error){draft.error=true;draft.message=error.message;}
    finally{draft.busy=false;if(draft.root===root)paint();else draft.repaint?.();}
   };
  }
  draft.repaint=paint;
  root.innerHTML='<p role="status">Consultando la carga de fotos…</p>';
  try{draft.available=(await request()).disponible;paint();}catch(error){if(root.isConnected){root.innerHTML=`<p role="alert">${escape(error.message)}</p><button type="button">Volver a consultar fotos</button>`;root.querySelector('button').onclick=()=>mount(root,{key,onPhoto});}}
 }
 window.ElAngelAzulCatalogMedia={mount,clear:()=>memory.clear()};
})();
