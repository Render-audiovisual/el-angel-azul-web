# Handoff para Wilson — fix urgente de FICHAS_ADHESION pública (21/07/2026)

## Qué pasaba

El formulario público de ficha de adhesión mostraba éxito en la UI pero no guardaba nada. En `server.js`, la rama pública de `POST /api/google-sheets?sheet=FICHAS_ADHESION` llamaba a `appendSheetRows()` (Google Sheets), y fallaba con `"Credenciales de Google Sheets no configuradas"` — la escritura es fire-and-forget del lado del cliente, así que la familia nunca se enteraba del error real.

## Qué se hizo (alcance acotado a propósito)

**Solo se movió el POST público de `FICHAS_ADHESION` a Postgres/Supabase.** Todo lo demás (GRUPOS, CONTRATOS, PASAJEROS, TURISMO, y también el GET/las ediciones de fichas desde el panel admin) sigue exactamente igual que antes, en Google Sheets. No se tocó nada del adaptador completo — eso queda para lo que ya estabas armando vos.

Archivos:
- `supabase/migrations/0001_init.sql` — **nuevo, no existía en el repo.** Es el DDL de la v5 (`contexto proyecto/plan-base-de-datos-el-angel-azul-v5.md`), tal cual quedó aprobado.
- `lib/db.js` — nuevo. `Pool` de `pg` leyendo `DATABASE_URL`. Expone `insertFichaPublica(row)`: en una sola transacción, resuelve/crea `personas` (por DNI), resuelve/crea `viajes` (match por nivel+destino; si es nuevo queda en `'borrador'`, no se auto-publica), inserta `inscripciones` (`estado='ficha_enviada'`) y `fichas_adhesion` vinculada.
- `server.js` — la rama `if (sheet === "FICHAS_ADHESION" && !isAdmin)` ahora llama a `db.insertFichaPublica(rows[0])` en vez de `appendSheetRows`. Mismo rate-limit, misma validación (`validPublicFicha`), mismo sanitizado de antes — solo cambió el destino de la escritura.
- `scripts/db-check.js` + `npm run db:check` — chequea conexión y que existan las tablas clave. Nunca imprime el valor de `DATABASE_URL`.
- `package.json` — sumó `pg` como dependencia (primera dependencia real del proyecto).
- `README.md` — documentada la variable `DATABASE_URL`.

## Lo que NO se resolvió (a propósito, queda para el adaptador completo)

El admin sigue leyendo/editando fichas desde Google Sheets. Mientras ese lado no se conecte también a Postgres, **las fichas nuevas que entren por el formulario público no van a aparecer en el panel admin** — quedan guardadas en Supabase pero invisibles ahí hasta que el GET de `FICHAS_ADHESION` (y el resto de las hojas) también apunten al adaptador real.

## Verificado sin acceso a Supabase real

- `node --check` en los 3 archivos: limpio.
- Server local sin `DATABASE_URL`: el resto del sitio sigue igual que antes (nada se rompió).
- Ficha de prueba enviada: antes fallaba por Sheets, ahora falla con `"DATABASE_URL no configurada"` (error específico de Postgres) — confirma que el camino cambió, falta probar contra una base real.

## La pregunta para Wilson

**¿Ya existe un proyecto Supabase real con el schema aplicado de tu lado (el mismo `0001_init.sql`), o corro el que dejé en `supabase/migrations/0001_init.sql` contra un proyecto nuevo?** Y en cualquier caso, necesito el `DATABASE_URL` para probar el insert real — que lo cargue Franco directo en un `.env` local (no hace falta que circule por chat), o me confirmen el mismo proyecto/host que ya estén usando para no terminar con dos bases Supabase distintas por accidente.
