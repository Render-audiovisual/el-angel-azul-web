# Prompt de testeo de seguridad para Wilson (actualizado tras revisar sus 15 commits)

Copiar y pegar tal cual en el agente que corra el testeo. Es el último filtro
antes de la entrega — el proyecto ya está funcionando en Hostinger.

---

Actuá como Auditor de Seguridad Ofensiva (pentest interno, autorizado por el
dueño del proyecto sobre su propio sistema).

**Proyecto**: El Ángel Azul. Node.js puro (`server.js`, sin framework),
Postgres/Supabase vía `lib/db.js`. Alojado en Hostinger
(`beige-beaver-153989`), `EAA_POSTGRES_MIGRATION_ENABLED=true`, Google Sheets
descartado por completo. 6 cuentas admin: `admin` + `agente1`...`agente5`,
todas por variable de entorno, sin fallback inseguro.

**Ya se auditó y corrigió** (ver `contexto proyecto/resumen-auditoria-25-07.md`,
commits hasta `7a964bc`): protección de mismo-origen sin header `Origin`
(corregido), `FICHAS_ADHESION` colgando de Sheets con Postgres activo
(corregido), un contrato "base" mal armado que escribía 100 contratos
ficticios de arrastre (corregido, revertido en producción), el selector de
contrato en Pasajeros ofreciendo placeholders no persistidos (corregido por
Wilson, con test de regresión). Wilson también implementó captura completa
de consentimiento/firma para fichas (antes pendiente), con test de
integración real que confirma cookie `Secure` bajo proxy HTTPS.
**Verificalo con pruebas propias, no lo des por sentado** — los hallazgos más
graves de rondas anteriores solo aparecieron probando en vivo, no leyendo
código.

## Objetivo de esta pasada

Que no quede ninguna API suelta ni ninguna ruta con permisos mal calculados,
y que la nueva captura de datos personales (fichas con domicilio, DNI del
responsable, firma) no abra una superficie nueva. Repaso sistemático de
**cada** endpoint real, no una muestra.

## Método

1. Listar TODAS las rutas que expone `server.js` (`/api/google-sheets`,
   `/api/admin/*`, estáticos, y cualquier otra que encuentres) y para cada
   una probar en vivo, no leer y asumir:
   - Sin sesión: ¿qué debería devolver (público real, o 401)? ¿Qué devuelve
     de verdad?
   - Con sesión de agente: ¿puede leer/escribir cosas que no debería
     (ej. Configuración, que ya está bloqueada por ruta directa - confirmar
     que también lo está a nivel API, no solo en el cliente)?
   - Con sesión de admin: ¿alguna ruta permite algo que no debería ni el
     admin (ej. ejecutar SQL arbitrario, leer archivos del server)?
   - Método equivocado (`GET` donde se espera `POST`) — confirmar 405, no
     crash.
   - Hoja/recurso inexistente (`?sheet=LO_QUE_SEA`) — confirmar 400, no 500
     con detalle interno filtrado.
2. **CSRF/Origin**: confirmar que TODOS los POST de escritura (no solo
   login) exigen `Origin` válido — probar cada uno con `curl` sin header
   `Origin` y con uno falso.
3. **Sesión**: cookie `HttpOnly` ✓, y ahora hay un test automatizado
   (`server-routes.test.js`) que simula proxy HTTPS y confirma `Secure` —
   igual, probarlo contra el dominio REAL de Hostinger, no solo el test
   simulado. Confirmar expiración real de sesión (8h), que logout invalida
   el token del lado del servidor (no solo borra la cookie), y que un token
   reenviado a mano después de logout no sirve.
4. **Fuerza bruta**: bloqueo de login (5 intentos / 15 min) contra las 6
   cuentas, no solo `admin`.
5. **Consentimiento/firma de fichas (superficie nueva de Wilson)**:
   - Confirmar que `acepta_condiciones` NO es editable desde ningún POST del
     panel admin — debe ser de solo lectura ahí. Intentar mandar un POST
     directo a `/api/google-sheets` con `sheet=FICHAS_ADHESION` y
     `acepta_condiciones` en `true` para una ficha que nunca lo aceptó, y
     confirmar que no se puede "aprobar" así sin que exista consentimiento
     real previo.
   - Mandar `firma_data_url` con un valor que no sea PNG base64 válido
     (texto plano, SVG, un payload gigante) y confirmar que se rechaza con
     mensaje claro, no que se guarda tal cual ni que tira 500.
   - Confirmar que el límite de tamaño (250KB para `firma_data_url`) se
     aplica de verdad mandando un payload más grande.
   - Los nuevos campos de domicilio/DNI del responsable son datos
     personales sensibles - confirmar que `FICHAS_ADHESION` sigue exigiendo
     sesión admin para lectura (no está en `PUBLIC_READ_SHEETS`).
6. **Inyección**:
   - SQL: confirmar mandando comillas simples, `;--`, etc. en cada campo de
     texto (nombre, observaciones, colegio, domicilio) vía la API real.
   - XSS: cargar un pasajero/grupo/contrato/ficha con `<script>`/`<img
     onerror=` en cualquier campo de texto y confirmar que al renderizarse
     en el admin queda escapado, no ejecutado.
7. **Límites/DoS**: `MAX_BODY_BYTES`, `MAX_ADMIN_ROWS_PER_WRITE`,
   `MAX_FIELD_LENGTH`, rate limit general (480/15min) y de fichas
   (50/hora) — confirmar que se aplican a las 5 hojas migradas
   (Grupos/Contratos/Pasajeros/Turismo/Fichas).
8. **Secretos**: `git log` completo por cualquier valor de
   `EAA_*_PASSWORD`, `DATABASE_URL` o clave de servicio comiteado alguna
   vez. Confirmar que ningún error 500 ni log de Hostinger expone
   connection string, stack trace con rutas de archivo, ni contraseñas.
9. **Dependencias**: `npm audit`.
10. **Postgres/RLS**: confirmar que RLS sigue habilitado en las 10 tablas
    con cero políticas (deny-by-default) y que solo `service_role` puede
    pasar.

## Fuera de alcance / no reportar como bug

- Que cualquier agente vea/edite los datos de cualquier otro agente es
  intencional (no hay ownership por registro, es diseño actual).
- `firma_bucket` en `fichas_adhesion` quedó sin usarse (la firma se guarda
  como base64 inline en `firma_storage_path`, no en un bucket real) - ya
  identificado, funciona bien así, no es un hallazgo nuevo.
- `npm test` con el glob `scripts/*.test.js` no expande en algunos shells de
  Windows - es de portabilidad del script, no de seguridad.

## Restricciones

- Nada de rutas nuevas ni cambios de arquitectura - esto es testeo, no
  refactor.
- No tocar los grupos/datos reales de producción sin autorización explícita
  en el momento - probar contra un entorno local o pedir permiso puntual
  para cada escritura de prueba en producción.
- No pushear nada sin mostrar antes el diff.

## Entregable

Informe con: endpoint por endpoint (tabla: ruta, método, quién debería
poder, qué puede en realidad), hallazgos con severidad (crítico/alto/
medio/bajo), evidencia reproducible (comando exacto que dispara cada uno),
y veredicto final: **Apto para producción: SÍ / NO / SÍ CON SALVEDADES**.
