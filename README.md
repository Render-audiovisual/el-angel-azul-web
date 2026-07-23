# El Angel Azul Web

Web publica y panel admin de El Angel Azul.

## Arranque local

```bash
npm start
```

El servidor escucha en `PORT` o, si no esta definido, en `8080`.

## Variables de entorno

Configurar estas variables en Railway:

```bash
EAA_ADMIN_PASSWORD=...
EAA_AGENCIA_PASSWORD=...
GOOGLE_SHEETS_SPREADSHEET_ID=17MlFV1VB32PUXm-J7wSocBRDxmepcsmbwRwJa2cGDnI
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account",...}'
```

Railway define `PORT` automaticamente. No hace falta cargarlo manualmente salvo que se quiera forzar un puerto en local.

Variables opcionales:

```bash
PORT=8080
GOOGLE_APPLICATION_CREDENTIALS=/ruta/local/google-sheets-service-account.json
```

`GOOGLE_APPLICATION_CREDENTIALS` sirve solo para desarrollo local con archivo. En Railway usar `GOOGLE_SHEETS_CREDENTIALS` o `GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON`.

## Base de datos (Supabase/Postgres)

El envío público de fichas de adhesión (`POST /api/google-sheets?sheet=FICHAS_ADHESION` sin sesión) guarda en Supabase/Postgres, no en Google Sheets. Requiere:

```bash
DATABASE_URL=postgres://usuario:password@host:puerto/basededatos
```

Cargarla en Railway como variable de entorno normal. **Nunca subir este valor a git ni pegarlo en un chat/PR** - es una credencial real.

Para desarrollo local, crear un archivo `.env` (ya está en `.gitignore`, no se sube) con esa misma variable y correr:

```bash
node --env-file=.env server.js
# o, solo para chequear la conexión:
node --env-file=.env scripts/db-check.js
```

Sin `.env` ni `DATABASE_URL` en el entorno, `npm run db:check` avisa explícitamente qué falta en vez de fallar en silencio. El esquema completo (tablas, constraints, RLS) vive en `supabase/migrations/0001_init.sql` - correrlo una sola vez contra el proyecto Supabase antes de usar esta variable.

El resto de las hojas (`GRUPOS`, `CONTRATOS`, `PASAJEROS`, `TURISMO`) siguen usando Google Sheets por ahora - la migración completa está documentada en `contexto proyecto/plan-base-de-datos-el-angel-azul-v5.md`.

### Fichas de adhesión: lectura/edición desde el admin (23/07/2026)

Corregido un hallazgo crítico de la auditoría pre-entrega: antes, el panel admin leía **solo** Google Sheets para `FICHAS_ADHESION`, así que una ficha enviada por el formulario público (que ya guardaba en Supabase) nunca aparecía en la bandeja del admin.

Ahora:

- `GET /api/google-sheets?sheet=FICHAS_ADHESION` **con sesión de admin** combina Sheets + Supabase (no reemplaza una fuente por la otra, por si hay fichas reales viejas en la hoja).
- `POST /api/google-sheets?sheet=FICHAS_ADHESION` **con sesión de admin** separa las filas por forma de `id`: las que tienen forma de UUID (nacidas en Supabase) se actualizan en Postgres; el resto sigue el camino de Sheets de siempre, sin cambios.
- Cada actualización de una ficha de Supabase queda registrada en `eventos_administrativos` (quién, qué acción, cuándo) - antes no había ningún registro de auditoría de estas ediciones.

**Limitación conocida y a propósito**: `fichas_adhesion` tiene un CHECK legal real (no se puede marcar `aprobada` sin `acepta_condiciones = true`). El formulario público actual todavía no pide aceptar condiciones ni firma digital como paso separado (funcionalidad pendiente, ver Fase 5 del plan v5). Si un admin intenta aprobar una ficha que vino de Supabase, la base lo rechaza con un mensaje explicando por qué (no se simula un consentimiento que la familia nunca dio). Mientras tanto se puede marcar `revisada`/`observada`/`rechazada` sin problema - solo `aprobada` queda bloqueada hasta que se implemente esa captura de consentimiento.

### Límites de envío (rate limiting)

Pensados para soportar picos reales (ej. varias familias de un mismo colegio completando el formulario desde la misma red/IP compartida a la vez):

- Fichas públicas: 50 por hora por IP (antes 10).
- Llamadas a `/api/` en general: 480 cada 15 minutos por IP (antes 240).

Probado en vivo: 30 envíos simultáneos de ficha completaron sin errores ni rechazos por límite, en ~5.6 segundos, todos guardados correctamente y sin duplicar personas.

## Credenciales de Google Sheets

En local, el servidor puede leer el archivo indicado por `GOOGLE_APPLICATION_CREDENTIALS`.

En Railway no se debe subir el archivo `google-sheets-service-account.json`. En su lugar:

1. Abrir el JSON de service account.
2. Copiar todo el contenido del archivo.
3. Crear la variable `GOOGLE_SHEETS_CREDENTIALS` en Railway.
4. Pegar el JSON completo como valor de esa variable.

La cuenta de servicio debe tener permiso de editor sobre el Google Sheet:

`17MlFV1VB32PUXm-J7wSocBRDxmepcsmbwRwJa2cGDnI`

## Deploy en Railway

1. Subir este proyecto a un repositorio Git.
2. Entrar a Railway.
3. Crear un nuevo proyecto.
4. Elegir "Deploy from GitHub repo".
5. Seleccionar el repo de El Angel Azul.
6. Si el repo contiene mas carpetas, configurar el root directory como:

```text
apps/el-angel-azul-web-v0
```

7. En Variables, cargar:

```text
EAA_ADMIN_PASSWORD
EAA_AGENCIA_PASSWORD
GOOGLE_SHEETS_SPREADSHEET_ID
GOOGLE_SHEETS_CREDENTIALS
```

8. Railway detecta `package.json` y ejecuta:

```bash
npm start
```

9. Abrir la URL publica que da Railway.
10. Probar:

```text
/
/#/admin
/api/admin/me
```

## Usuarios admin actuales

El servidor usa estos usuarios:

- `admin` con la password de `EAA_ADMIN_PASSWORD`
- `agencia` con la password de `EAA_AGENCIA_PASSWORD`

## Importante

- No subir `google-sheets-service-account.json`.
- No subir archivos `.env`.
- No subir `node_modules`.
- No definir contraseñas por defecto en scripts versionados. `start-public.sh` falla si no recibe `EAA_ADMIN_PASSWORD` y `EAA_AGENCIA_PASSWORD` desde el entorno.
- `/api/google-sheets` deja públicas solo las hojas necesarias para la web/inscripción (`TURISMO`, `CONFIG`, `GRUPOS`, `CONTRATOS`). Las hojas con datos personales y las escrituras internas requieren sesión admin.
