// lib/email.js
// Envío de la ficha por correo con la API HTTP de Resend (sin SDK). Queda
// inactivo hasta cargar RESEND_API_KEY y EAA_EMAIL_FROM: el dominio de la
// agencia todavía no tiene DNS operativos (ver spec §9).
const { nombreArchivoPdf } = require("./ficha-pdf");

const RESEND_URL = "https://api.resend.com/emails";
const WHATSAPP = "+54 9 3794 33-1380";

function correoConfigurado(env = process.env) {
  return Boolean(env.RESEND_API_KEY && env.EAA_EMAIL_FROM);
}

function escapar(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function enmascararEmail(valor) {
  const [usuario, dominio] = String(valor || "").split("@");
  return usuario && dominio ? `${usuario[0]}***@${dominio}` : "";
}

function armarCorreoFicha(fila, pdfBytes, env = process.env) {
  const pasajero = `${fila.pasajero_apellido}, ${fila.pasajero_nombre}`;
  const tutor = `${fila.responsable_apellido}, ${fila.responsable_nombre}`;
  const filas = [
    ["Colegio", fila.colegio],
    ["Curso", [fila.nivel, fila.grado, fila.division].filter(Boolean).join(" ")],
    ["Viaje", fila.viaje],
    ["Plan de pago", fila.plan_nombre || "A definir con administración"],
    ["Pasajero", `${pasajero} (DNI ${fila.pasajero_dni})`],
    ["Tutor", `${tutor} · ${fila.responsable_celular}`]
  ];
  const html = `
    <div style="font-family:Arial,sans-serif;color:#10202b;max-width:560px">
      <h2 style="color:#0d69a1;margin:0 0 12px">Recibimos la ficha de adhesión</h2>
      <p>Hola ${escapar(fila.responsable_nombre)}, te enviamos una copia de la ficha que completaste. Queda pendiente de revisión por administración.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        ${filas.map(([k, v]) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #d9e7ef;font-weight:bold">${escapar(k)}</td><td style="padding:6px 8px;border-bottom:1px solid #d9e7ef">${escapar(v)}</td></tr>`).join("")}
      </table>
      <p>La ficha completa va adjunta en PDF. Si encontrás un dato incorrecto, escribinos por WhatsApp al ${WHATSAPP}.</p>
      <p style="color:#44545f;font-size:13px">El Ángel Azul · Viajes estudiantiles</p>
    </div>`;
  const payload = {
    from: env.EAA_EMAIL_FROM,
    to: [fila.responsable_email],
    subject: `Ficha de adhesión – ${pasajero} – ${fila.viaje}`,
    html,
    attachments: [{ filename: nombreArchivoPdf(fila), content: Buffer.from(pdfBytes).toString("base64") }]
  };
  if (env.EAA_EMAIL_COPIA) payload.bcc = [env.EAA_EMAIL_COPIA];
  return payload;
}

async function enviarCorreoFicha(fila, pdfBytes, { env = process.env, fetchImpl = fetch, idempotencyKey = `ficha-${fila.id}` } = {}) {
  const respuesta = await fetchImpl(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify(armarCorreoFicha(fila, pdfBytes, env))
  });
  if (respuesta.ok) return (await respuesta.json()).id;
  const mensaje = respuesta.status === 429
    ? "Límite de envíos de correo alcanzado. Reintentá más tarde."
    : [401, 403].includes(respuesta.status)
      ? "Resend rechazó el envío: revisá la clave o que el dominio esté verificado."
      : respuesta.status === 422
        ? "Resend rechazó los datos del correo (revisá el email del tutor)."
        : `No se pudo enviar el correo (Resend respondió ${respuesta.status}).`;
  const error = new Error(mensaje);
  error.friendlyMessage = mensaje;
  throw error;
}

module.exports = { correoConfigurado, enmascararEmail, armarCorreoFicha, enviarCorreoFicha };
