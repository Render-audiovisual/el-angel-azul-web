const crypto=require('node:crypto');
const db=require('./db');
const {validate}=require('./document-validation');
const visibility=require('./catalog-visibility');
let objects=require('./private-objects').catalog;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const fail=(message,statusCode=400)=>Object.assign(new Error(message),{statusCode});
const dto=row=>({id:row.id,url:'/api/public/catalogo/media/'+row.id,nombre:row.nombre,mime_type:row.mime_type,tamano_bytes:row.tamano_bytes});
async function available(){return objects.configured()&&(await db.getPool().query("select public from storage.buckets where id='catalogo'")).rows[0]?.public===false;}
async function row(id,client=db.getPool()){return(await client.query('select * from catalogo_multimedia where id=$1',[id])).rows[0];}
const matches=(record,data,actor)=>record&&record.sha256===data.hash&&record.nombre===data.nombre&&record.mime_type===data.mime&&record.actor_username===actor;
async function cleanup(path){try{await objects.remove(path);}catch(_){console.error('Foto de catálogo: quedó un objeto sin confirmar; requiere conciliación de almacenamiento.');}}
async function upload(input,actor){
 if(typeof input.id!=='string'||!UUID.test(input.id)||!['image/png','image/jpeg'].includes(input.mime))throw fail('Elegí una foto JPG o PNG de hasta 5 MB.');
 if(!await available())throw fail('La carga de fotos todavía no está habilitada. Consultá con el administrador.',503);
 const data=await validate(input),previous=await row(input.id);
 if(previous){if(!matches(previous,data,actor))throw fail('Este envío corresponde a otra foto. Volvé a consultar antes de repetirlo.',409);return {creada:false,foto:dto(previous)};}
 const path=`fotos/${input.id.toLowerCase()}/${crypto.randomUUID()}.${data.extension}`;
 try{await objects.put(path,data.bytes,data.mime);}catch(error){await cleanup(path);throw error;}
 let client,commitAttempted=false;
 try{
  client=await db.getPool().connect();await client.query('BEGIN');
  const inserted=(await client.query('insert into catalogo_multimedia(id,storage_path,nombre,mime_type,tamano_bytes,sha256,actor_username) values($1,$2,$3,$4,$5,$6,$7) on conflict(id) do nothing returning id',[input.id,path,data.nombre,data.mime,data.bytes.length,data.hash,actor])).rows.length;
  const saved=await row(input.id,client);if(!matches(saved,data,actor))throw fail('Este envío corresponde a otra foto. Volvé a consultar antes de repetirlo.',409);
  if(inserted)await client.query("insert into eventos_administrativos(entidad,entidad_id,accion,actor_username,detalle) values('catalogo_multimedia',$1,'adjuntar',$2,$3::jsonb)",[saved.id,actor,JSON.stringify({tamano:data.bytes.length,sha256:data.hash})]);
  commitAttempted=true;await client.query('COMMIT');if(!inserted)await cleanup(path);
  return {creada:!!inserted,foto:dto(saved)};
 }catch(error){if(client)await client.query('ROLLBACK').catch(()=>{});if(!commitAttempted)await cleanup(path);throw error;}finally{client?.release();}
}
async function read(id,staff=false,etag){
 if(typeof id!=='string'||!UUID.test(id))throw fail('Foto no encontrada.',404);
 const record=await row(id);if(!record)throw fail('Foto no encontrada.',404);
 if(!staff&&!(await db.getPool().query(`select 1 from catalogo_paquete_medios pm join viajes v on v.id=pm.viaje_id join viajes_turismo_detalle d on d.viaje_id=v.id where pm.medio_id=$1 and v.categoria='turismo' and ${visibility.SQL} limit 1`,[id])).rows.length)throw fail('Foto no encontrada.',404);
 const tag='"'+record.sha256+'"';if(etag===tag)return {notModified:true,etag:tag};
 if(!await available())throw fail('La foto no está disponible en este momento.',503);
 const bytes=await objects.get(record.storage_path);
 if(bytes.length!==record.tamano_bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==record.sha256)throw fail('No pudimos verificar la foto del catálogo.',502);
 return {bytes,mime:record.mime_type,etag:tag};
}
module.exports={available,upload,read,__test:{setStorage(adapter){if(process.env.NODE_ENV!=='test')throw Error('Solo pruebas locales');objects=adapter;}}};
