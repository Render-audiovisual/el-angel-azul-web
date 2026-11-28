// Fechas comerciales en Argentina: una salida no vence a las 21 h locales
// por usar el cambio de día UTC del servidor o de Postgres.
const today = (now=new Date()) => now.toLocaleDateString('sv-SE',{timeZone:'America/Argentina/Buenos_Aires'});
const SQL = "v.estado='activo' and v.slug is not null and v.slug<>'' and not d.archivado and (v.fecha_salida is null or v.fecha_salida >= (now() at time zone 'America/Argentina/Buenos_Aires')::date) and (v.fecha_regreso is null or v.fecha_regreso >= (now() at time zone 'America/Argentina/Buenos_Aires')::date)";
const visible = (row,date=today()) => row.estado==='activo' && row.archivado!==true && String(row.archivado||'').toUpperCase()!=='TRUE' && row.slug && (!row.fecha_salida||row.fecha_salida>=date) && (!row.fecha_regreso||row.fecha_regreso>=date);
module.exports={today,SQL,visible};
