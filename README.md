# El Ángel Azul Web

Web pública y panel interno de El Ángel Azul.

## Arranque local

```bash
npm install
npm start
```

El servidor escucha en `PORT` o, si no está definido, en `8080`.

## Producción

- Hosting: Hostinger Web App.
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
```

Hostinger define `PORT` automáticamente. No configurar variables de Google
Sheets: el adaptador legado se conserva temporalmente como rollback, pero no es
la fuente activa de producción.

Nunca subir a Git ni compartir por chat `DATABASE_URL`, contraseñas, archivos
`.env` o credenciales de servicios.

## Base de datos

`GRUPOS`, `CONTRATOS`, `PASAJEROS`, `FICHAS_ADHESION` y `TURISMO` operan sobre
PostgreSQL. El esquema vive en `supabase/migrations/`.

Chequeo de conexión:

```bash
node --env-file=.env scripts/db-check.js
```

### Fichas de adhesión

- El formulario público guarda la ficha en PostgreSQL.
- El panel autenticado lee y actualiza esa misma ficha.
- Las actualizaciones quedan registradas en `eventos_administrativos`.
- No se permite aprobar una ficha sin consentimiento válido; se puede marcar
  como revisada, observada o rechazada mientras esa captura siga pendiente.

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
- Captura completa de consentimiento/firma para aprobación digital de fichas.
- Retirar el adaptador muerto de Google Sheets solo después de un período
  estable en PostgreSQL.
