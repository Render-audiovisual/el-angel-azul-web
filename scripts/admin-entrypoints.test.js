const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const normalize=text=>text.replace(/<title>.*?<\/title>/,'<title>Panel</title>').replace(/<base href="[^"]+">/,'<base href="/">');
test('los accesos directos del panel cargan las mismas capacidades y protecciones que su entrada principal',()=>{
 const canonical=normalize(fs.readFileSync(path.join(root,'admin/index.html'),'utf8'));
 for(const area of ['colegios','configuracion','contratos','fichas','grupos','pagos','pasajeros','turismo']){
  assert.equal(normalize(fs.readFileSync(path.join(root,'admin',area,'index.html'),'utf8')),canonical,area+': faltan recursos o protecciones respecto del panel principal');
 }
});
