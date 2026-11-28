const test=require('node:test'),assert=require('node:assert/strict');
Object.assign(process.env,{NODE_ENV:'test',DATABASE_URL:'pglite-en-memoria'});
const db=require('../lib/db'),fixture=require('./helpers/ficha-ficticia'),{crearPoolLocal}=require('./helpers/pglite-pool');

test('activar correo no recupera fichas sin configurar, errores, envíos confirmados ni pendientes fuera de la ventana idempotente',async()=>{
 const pool=await crearPoolLocal();db.__test.setPool(pool);
 try {
  const school=(await pool.query("insert into colegios(nombre) values('Colegio ficticio de correo') returning id")).rows[0].id;
  await pool.query("insert into viajes(categoria,nivel,destino,titulo,anio,estado) values('estudiantil','Secundaria','Bariloche 2027','Bariloche 2027',2027,'activo')");
  const cases=[['sin_configurar',1,false],['pendiente',1,false],['pendiente',25,false],['error',1,false],['enviado',1,true],['pendiente',22,false],['pendiente',1,true]],ids=[];
  for(let i=0;i<cases.length;i++){
   const saved=await db.insertFichaPublica(fixture({colegioId:school,documento:String(45111660+i)}),{});ids.push(saved.id);
   const [state,hours,sent]=cases[i];
   await pool.query("update fichas_adhesion set email_estado=$2,created_at=now()-($3::int*interval '1 hour'),email_enviado_at=case when $4::boolean then now() else null end where id=$1",[saved.id,state,hours,sent]);
  }
  assert.deepEqual((await db.listFichaEmailsPendientes()).map(row=>row.id),[ids[5],ids[1]]);
  assert.deepEqual((await db.listFichaEmailsPendientes(1)).map(row=>row.id),[ids[5]]);
 } finally {await pool.close();}
});
