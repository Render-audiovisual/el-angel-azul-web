const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../assets/js/modules/persistence.js'),'utf8');
function browser(store) {
  const writes = [];
  const window = { location:{origin:'http://local.test'}, localStorage:{
    getItem:key => store.get(key) || null,
    setItem:(key,value) => { writes.push(key); store.set(key,value); },
    removeItem:key => store.delete(key)
  }};
  vm.runInNewContext(source,{window, URL, fetch:()=>{throw new Error('No debe acceder a la red.');}});
  return {p:window.ElAngelAzulPersistence,writes};
}
test('colecciones privadas eliminan cachés antiguas y no persisten datos de pasajeros',()=>{
  const store = new Map([['pax',JSON.stringify([{dni:'45111222',nombre:'Dato viejo'}])]]);
  const {p,writes} = browser(store);
  const collection = p.collection({key:'pax',privateData:true});
  assert.equal(store.has('pax'),false);
  assert.equal(collection.load().length,0);
  collection.save([{dni:'45222333',nombre:'Prueba'}]);
  assert.equal(collection.load()[0].nombre,'Prueba');
  assert.equal(writes.length,0);
  assert.equal(browser(store).p.collection({key:'pax',privateData:true}).load().length,0);
  p.clearPrivateCollections();
  assert.equal(collection.load().length,0);
});
test('cerrar sesión también elimina versiones de registros de la sesión anterior',()=>{
  const {p} = browser(new Map());
  p.captureAdminSheet('TURISMO',[{id:'x',titulo:'Ejemplo'}],[{id:'x',_version:'v1'}]);
  assert.equal(p.adminSheetVersion('TURISMO','x'),'v1');
  p.clearPrivateCollections();
  assert.equal(p.adminSheetVersion('TURISMO','x'),null);
});
test('colecciones públicas conservan su almacenamiento y las privadas funcionan si el navegador lo bloquea',()=>{
  const store = new Map();
  const {p,writes} = browser(store);
  p.collection({key:'catalogo'}).save([{titulo:'Paquete público'}]);
  assert.deepEqual(writes,['catalogo']);
  assert.equal(p.collection({key:'catalogo'}).load()[0].titulo,'Paquete público');
  const window={location:{origin:'http://local.test'},localStorage:{removeItem(){throw Error('Bloqueado');},getItem(){throw Error('Bloqueado');},setItem(){throw Error('Bloqueado');}}};
  vm.runInNewContext(source,{window,URL});
  const privateCollection=window.ElAngelAzulPersistence.collection({key:'privado',privateData:true});
  privateCollection.save([{nombre:'Solo memoria'}]);
  assert.equal(privateCollection.load()[0].nombre,'Solo memoria');
});
test('una revisión conserva la versión que vio al comenzar aunque se consulte otra versión antes de guardar',async()=>{
  const sent=[],window={location:{origin:'http://local.test'},localStorage:{getItem(){return null;},removeItem(){},setItem(){}}};
  vm.runInNewContext(source,{window,URL,fetch:async(_url,options)=>{sent.push(JSON.parse(options.body));return {ok:false,status:409,json:async()=>({ok:false,error:'El registro cambió.'})};}});
  const p=window.ElAngelAzulPersistence;
  p.captureAdminSheet('FICHAS_TUTOR',[{id:'tutor',estado_revision:'pendiente'}],[{id:'tutor',_version:'v2'}]);
  await assert.rejects(p.writeGoogleSheetRows('FICHAS_TUTOR',[{id:'tutor',estado_revision:'revisada'}],[],{tutor:'v1'}),/registro cambió/);
  assert.equal(sent[0].expectedVersions.tutor,'v1');assert.equal(p.adminSheetVersion('FICHAS_TUTOR','tutor'),'v2');
});
