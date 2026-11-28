// La URL se procesa únicamente en memoria; nunca se registra su contenido.
function postgresTlsOptions(connectionString, env = process.env) {
  const flag = String(env.EAA_POSTGRES_TLS_VERIFY_FULL || "").trim();
  if (flag && flag !== "true") {
    throw new Error("La conexión a Postgres requiere verificación TLS. Revisá la configuración del hosting.");
  }
  const connectionUrl = new URL(connectionString);
  // pg-connection-string puede sustituir el objeto ssl con opciones de la URL.
  for (const key of [...connectionUrl.searchParams.keys()]) {
    if (/^ssl/i.test(key) || key.toLowerCase() === "uselibpqcompat") connectionUrl.searchParams.delete(key);
  }
  const ca = String(env.SUPABASE_DB_CA_CERT || "").replace(/\\n/g, "\n").trim();
  return {
    connectionString: connectionUrl.toString(),
    ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) }
  };
}

module.exports = { postgresTlsOptions };
