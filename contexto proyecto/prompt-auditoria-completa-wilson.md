# Prompt para Wilson — auditoría de punta a punta (versión resumida)

Copiar y pegar tal cual en el agente que vaya a correr la auditoría.

---

Actuá como Arquitecto de Software Senior y Auditor de Código.

**Proyecto**: El Ángel Azul (sitio público + panel admin). Node.js puro, sin framework. Persistencia dual: **Google Sheets** (legado, sigue siendo la fuente real para Grupos/Contratos/Pasajeros/Turismo y toda la gestión del admin) + **Supabase/Postgres** (nuevo, cubre solo el envío público de fichas de adhesión vía `lib/db.js`). Deploy en Railway.

**Ya auditado y corregido antes** (ver `contexto proyecto/auditoria-pre-entrega-23-07.md` y `auditoria-estabilidad-23-07.md`): seguridad de `server.js`/`lib/db.js`, RLS de Supabase, fichas ya no se pierden ni quedan invisibles en el admin, pool de Postgres sin manejador de error (corregido), condición de carrera que duplicaba viajes bajo carga (corregida y probada con 30 simultáneos), fuga de memoria en rate-limiting (corregida). **Verificalo con pruebas propias, no lo des por sentado.**

**Lo que falta auditar con el mismo rigor** (foco de esta pasada):
1. Todo el resto del panel admin (Grupos, Contratos, Pasajeros, Turismo, Pagos/Cuotas) en `assets/js/app.js` — sigue 100% en Google Sheets, nunca se revisó a fondo. Duplicados, manejo de errores en escrituras a Sheets, consistencia admin↔público (sobre todo Turismo).
2. Consistencia entre Sheets y Supabase — mapear qué vive en cuál y qué pasa en los puntos de fricción.
3. Código muerto/duplicado, patrones inconsistentes entre lo viejo y lo nuevo.
4. Seguridad de `app.js` y `assets/js/modules/` (no solo el backend) — XSS, permisos que dependan solo del cliente.
5. Errores silenciosos: catches que tragan errores, promesas sin manejo de rechazo.

**Método**: no audites solo leyendo código — corré pruebas reales (server local, flujos completos, casos límite). Los hallazgos más graves de rondas anteriores solo aparecieron probando en vivo.

**Restricciones**: no implementes cambios todavía, solo informe. No reactivar Estudiantil en nav. No asumir acceso a Railway.

**Entregable**: informe con Estado general, Funcionalidades operativas, Problemas detectados (con severidad), Riesgos de arquitectura/datos, Riesgos de seguridad, Código muerto encontrado, Recomendaciones priorizadas, y Apto para producción: SÍ/NO/SÍ CON SALVEDADES.
