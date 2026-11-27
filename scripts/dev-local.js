// Servidor local para ver la web con una base en memoria (PGlite) y datos de
// prueba. No toca Supabase ni necesita DATABASE_URL. Al cortarlo, los datos se pierden.
// Uso: npm run dev; npm run dev -- --libre para entrar directo al admin.
// El acceso libre solo existe en este servidor de prueba, enlazado a 127.0.0.1.
require("./helpers/sin-secretos");
process.env.NODE_ENV = "test"; // habilita db.__test.setPool y evita el auto-listen de server.js
process.env.DATABASE_URL = "postgresql://nadie:nadie@127.0.0.1:1/nada"; // nunca se usa: el pool es PGlite
process.env.EAA_POSTGRES_MIGRATION_ENABLED = "true";
process.env.EAA_ADMIN_PASSWORD = "TestAdmin-123456"; // nunca usar ni imprimir una contraseña real exportada
// Aunque estén exportadas en la terminal, acá nunca se usan servicios reales (Storage, correo).
for (const k of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY", "EAA_EMAIL_FROM", "EAA_EMAIL_COPIA"]) delete process.env[k];
const PORT = process.env.PORT === "0" ? 0 : Number(process.env.PORT) || 3057;
const accesoLibre = process.argv.includes("--libre");
process.env.PORT = String(PORT);

const db = require("../lib/db");
const { crearPoolLocal } = require("./helpers/pglite-pool");

async function sembrar(pool) {
  const colegios = [
    ["Escuela Normal N° 1", "Corrientes", "Goya"],
    ["Colegio San José", "Corrientes", "Corrientes"],
    ["Instituto Misiones", "Misiones", "Posadas"]
  ];
  const ids = [];
  for (const [nombre, provincia, localidad] of colegios) {
    const r = await pool.query("insert into colegios (nombre, provincia, localidad) values ($1,$2,$3) returning id", [nombre, provincia, localidad]);
    ids.push(r.rows[0].id);
  }
  const viaje = (await pool.query(
    "insert into viajes (legacy_id, categoria, nivel, destino, titulo, anio, estado) values ('viaje-local','estudiantil','Secundaria','Bariloche 2027','Bariloche 2027',2027,'activo') returning id"
  )).rows[0].id;
  const grupo = (await pool.query(
    "insert into grupos (legacy_id, viaje_id, colegio_id, curso, division, pasajeros_esperados) values ('grupo-local',$1,$2,'5°','B',30) returning id", [viaje, ids[0]]
  )).rows[0].id;
  const contrato = (await pool.query(
    "insert into contratos (legacy_id, codigo_contrato, viaje_id, grupo_id, estado) values ('contrato-local','LOCAL-001',$1,$2,'activo') returning id", [viaje, grupo]
  )).rows[0].id;
  await pool.query(
    "insert into planes_pago (contrato_id, nombre, cuotas, descripcion, orden) values ($1,'Contado',1,'Pago único',1), ($1,'12 cuotas',12,'Cuotas mensuales',2)", [contrato]
  );
}

(async () => {
  const pool = await crearPoolLocal();
  db.__test.setPool(pool);
  await sembrar(pool);
  const server = require("../server").createAppServer();
  if (accesoLibre) {
    // La autenticación normal del servidor se conserva. Solo este adaptador
    // local añade una sesión ficticia a los pedidos; nada se envía al navegador.
    const handlers = server.listeners("request");
    server.removeAllListeners("request");
    let cookieLocal = "";
    let cookieValidaHasta = 0;
    let ingresoPendiente = null;
    const ingresarLocal = () => {
      if (!ingresoPendiente) {
        const base = `http://127.0.0.1:${server.address().port}`;
        ingresoPendiente = fetch(`${base}/api/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: base },
          body: JSON.stringify({ username: "admin", password: process.env.EAA_ADMIN_PASSWORD })
        }).then(async (response) => {
          await response.arrayBuffer();
          if (!response.ok) throw new Error("No se pudo iniciar la sesión local de prueba.");
          cookieLocal = (response.headers.get("set-cookie") || "").split(";")[0];
          if (!cookieLocal) throw new Error("La sesión local de prueba no está disponible.");
          cookieValidaHasta = Date.now() + 7 * 60 * 60 * 1000;
        }).finally(() => { ingresoPendiente = null; });
      }
      return ingresoPendiente;
    };
    server.on("request", async (req, res) => {
      const pathname = new URL(req.url, "http://127.0.0.1").pathname;
      try {
        if (pathname.startsWith("/api/") && pathname !== "/api/admin/login") {
          if (!cookieLocal || Date.now() >= cookieValidaHasta) await ingresarLocal();
          if (pathname === "/api/admin/logout") res.once("finish", () => { cookieLocal = ""; });
          const nombreCookie = cookieLocal.split("=")[0];
          const otras = String(req.headers.cookie || "").split(";").map((part) => part.trim())
            .filter((part) => part && !part.startsWith(`${nombreCookie}=`));
          req.headers.cookie = [cookieLocal, ...otras].join("; ");
        }
        for (const handler of handlers) await handler.call(server, req, res);
      } catch (_) {
        res.writeHead(503, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "No se pudo abrir la sesión local. Reiniciá npm run dev." }));
      }
    });
  }
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`Local listo: http://localhost:${server.address().port}`);
    console.log(accesoLibre ? "Acceso libre al administrador (solo local, con datos ficticios)." : "Acceso con la cuenta local de prueba.");
    console.log("Datos de prueba: 3 colegios, Bariloche 2027, 5° B de Escuela Normal N° 1 con contrato LOCAL-001 y 2 planes.");
  });
})();
