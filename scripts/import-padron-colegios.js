// Importa colegios de Corrientes y Misiones desde el Padrón Oficial de
// Establecimientos Educativos (.xlsx del Ministerio de Educación).
//
// Sin DATABASE_URL: solo lee el archivo y muestra qué importaría.
// Con DATABASE_URL: simula todo dentro de una transacción y la revierte.
// Con --aplicar: confirma los cambios (pedir OK al dueño antes en producción).
//
// Uso: node scripts/import-padron-colegios.js ruta/al/padron.xlsx [--aplicar] [--provincias=Corrientes,Misiones]
const fs = require("node:fs");
const { leerPadron, importarColegios, PROVINCIAS_POR_DEFECTO } = require("../lib/padron");

async function main() {
  const args = process.argv.slice(2);
  const archivo = args.find((a) => !a.startsWith("--"));
  const aplicar = args.includes("--aplicar");
  const provArg = args.find((a) => a.startsWith("--provincias="));
  const provincias = provArg ? provArg.split("=")[1].split(",").map((p) => p.trim()).filter(Boolean) : PROVINCIAS_POR_DEFECTO;
  if (!archivo) {
    console.error("Falta el archivo. Uso: node scripts/import-padron-colegios.js padron.xlsx [--aplicar]");
    process.exitCode = 1;
    return;
  }

  const colegios = leerPadron(fs.readFileSync(archivo), { provincias });
  const porProvincia = {};
  for (const c of colegios) porProvincia[c.provincia] = (porProvincia[c.provincia] || 0) + 1;
  console.log(`Padrón leído: ${colegios.length} establecimientos comunes con primario o secundario.`, porProvincia);

  if (!process.env.DATABASE_URL) {
    console.log("Sin DATABASE_URL: no se toca ninguna base (solo lectura del archivo).");
    return;
  }
  const pool = require("../lib/db").getPool();
  const cliente = await pool.connect();
  try {
    await cliente.query("begin");
    const resumen = await importarColegios(cliente, colegios);
    await cliente.query(aplicar ? "commit" : "rollback");
    console.log(aplicar ? "APLICADO:" : "SIMULACIÓN (revertida, usá --aplicar para guardar):", resumen);
  } catch (error) {
    await cliente.query("rollback").catch(() => {});
    console.error("Falló y se revirtió todo:", error.message);
    process.exitCode = 1;
  } finally {
    cliente.release();
    await pool.end();
  }
}

main();
