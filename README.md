# El Ángel Azul Web

Web pública y panel interno de El Ángel Azul.

## Arranque local

```bash
npm install
npm start
```

El servidor escucha en `PORT` o, si no está definido, en `8080`.

## Producción

- Hosting: Render (`el-angel-azul-web`).
- Rama desplegada: `main`.
- Entrada: `server.js` mediante `npm start`.
- Base activa: PostgreSQL/Supabase.
- El endpoint `/api/google-sheets` conserva su nombre histórico para no romper
  el frontend, pero con la migración activa opera contra PostgreSQL.

## Variables privadas

```bash
DATABASE_URL=postgresql://...
EAA_POSTGRES_MIGRATION_ENABLED=true
EAA_ADMIN_PASSWORD=...
EAA_AGENTE1_PASSWORD=...
EAA_AGENTE2_PASSWORD=...
EAA_AGENTE3_PASSWORD=...
EAA_AGENTE4_PASSWORD=...
EAA_AGENTE5_PASSWORD=...
NODE_ENV=production
# Activar juntos después de descargar el certificado CA desde Supabase:
EAA_POSTGRES_TLS_VERIFY_FULL=true
SUPABASE_DB_CA_CERT="-----BEGIN CERTIFICATE-----\\n...\\n-----END CERTIFICATE-----"
# Correo de la ficha (Resend). Sin estas variables las fichas se guardan igual
# y quedan con email_estado = sin_configurar.
RESEND_API_KEY=...
EAA_EMAIL_FROM="El Ángel Azul <fichas@DOMINIO-VERIFICADO>"
EAA_EMAIL_COPIA=agencia@DOMINIO   # opcional, copia oculta
```

El correo necesita el dominio de la agencia verificado en Resend (registros DNS).
Hoy `elangelazul.tur.ar` no tiene DNS operativos: ver
`docs/superpowers/specs/2026-09-15-ficha-adhesion-design.md` §9.

Render define `PORT` automáticamente. No configurar variables de Google
Sheets: el adaptador legado se conserva temporalmente como rollback, pero no es
la fuente activa de producción.

Nunca subir a Git ni compartir por chat `DATABASE_URL`, contraseñas, archivos
`.env` o credenciales de servicios.

Para validación TLS completa, descargar el certificado CA desde Database >
SSL Configuration en Supabase, cargarlo como `SUPABASE_DB_CA_CERT` en Render y
recién entonces activar `EAA_POSTGRES_TLS_VERIFY_FULL=true`.
El adaptador elimina automáticamente `sslmode`, `sslcert`, `sslkey` y
`sslrootcert` de `DATABASE_URL` cuando la validación completa está activa para
evitar que `node-postgres` reemplace el certificado configurado.

## Base de datos

`GRUPOS`, `CONTRATOS`, `PASAJEROS`, `FICHAS_ADHESION`, `FICHAS_TUTOR`,
`PLANES_PAGO`, `COLEGIOS` y `TURISMO` operan sobre PostgreSQL. El esquema vive en
`supabase/migrations/` (la ficha v2 es `0003_ficha_adhesion_v2.sql`: colegios
administrables, planes de pago por contrato, fichas de tutor y obligatorios
exigidos en la propia base).

Chequeo de conexión:

```bash
node --env-file=.env scripts/db-check.js
```

### Fichas de adhesión

- Al iniciar la inscripción se elige **Pasajero (PAX)** o **Tutor**.
- PAX: `POST /api/public/fichas` (una ficha por pedido). Tutor:
  `POST /api/public/fichas-tutor`. La pantalla de éxito se muestra solo con
  respuesta `201`; si falla, los datos cargados se conservan.
- Las reglas de validación viven en `assets/js/modules/ficha-validation.js` y
  las usan el formulario y el servidor (CUIL con dígito verificador, email,
  domicilio, grado/división, plan del contrato).
- Colegio de la lista (`GET /api/public/colegios`) o "Mi colegio no está";
  contrato y planes por coincidencia exacta (`GET /api/public/inscripcion-context`).
- Localidades sugeridas con la API oficial Georef (`apis.datos.gob.ar`).
- PDF generado en el servidor: `GET /api/admin/fichas/:id/pdf` (con sesión).
- Correo automático al tutor con el PDF adjunto; reenvío desde el admin con
  `POST /api/admin/fichas/:id/reenviar-correo`. Estados: `pendiente`,
  `enviado`, `error`, `sin_configurar`.
- Las actualizaciones del panel quedan registradas en `eventos_administrativos`.

### Límites de envío

- Fichas públicas: 50 por hora por IP.
- API general: 480 solicitudes cada 15 minutos por IP.
- El flujo fue probado con 30 envíos simultáneos.

## Usuarios internos

- `admin`: rol administrador, único con acceso a Configuración.
- `agente1` a `agente5`: rol agencia.

Una cuenta sin su variable de contraseña queda deshabilitada. No existen
contraseñas por defecto.

## Rutas principales

```text
/
/#/turismo
/#/inscripcion
/#/inscripcion/tutor
/#/admin
/#/admin/fichas
/#/admin/grupos
/#/admin/pasajeros
/#/admin/pagos
/#/admin/turismo
/#/admin/configuracion
```

Las rutas físicas bajo `/admin/` siguen disponibles. Las rutas con hash se
reconocen como entradas privadas y cargan los datos autenticados.

## Pruebas

```bash
npm test
node --check server.js
node --check assets/js/app.js
```

## Caché

HTML, CSS, JavaScript y JSON se sirven con revalidación obligatoria. Así, un
deploy nuevo no depende de cambiar manualmente el sufijo `?v=` para que el
navegador reciba la versión actual.

## Pendientes de producto

- Pagos todavía usa datos de demostración; no representa cobranza real.
- Sección Colegios del admin e importación del Padrón oficial (Fase 2).
- Exportación de pasajeros a Excel y Supabase Storage (Fase 3).
- Retirar el adaptador muerto de Google Sheets solo después de un período
  estable en PostgreSQL.
