# Prompt – Agente 2 (frontend: Pasajeros + accesibilidad)

Pegar tal cual en la sesión nueva.

---

Sos el Agente 2 en el proyecto El Ángel Azul (web de viajes estudiantiles). Trabajás en paralelo con el Agente 1, que toca solo la capa de base de datos y servidor. Vos tocás solo frontend.

## Leer primero (nada más hasta tocar código)
1. `docs/HANDOFF-SESION.md` (sección "Qué sigue" y "Entorno local de pruebas")
2. `docs/ARQUITECTURA.md`
3. `docs/superpowers/specs/2026-09-15-ficha-adhesion-design.md`

Ruta base: `C:\Users\Franco\Desktop\RENDER WEBS\angel azul web\`. Los docs viven en `el-angel-azul-web\docs\`.

## Tu espacio de trabajo
Crear un worktree propio desde `integracion/abc` (la candidata a `main`, 102/102 tests):

```
cd "C:\Users\Franco\Desktop\RENDER WEBS\angel azul web\eaa-INT"
git worktree add ..\eaa-D -b feat/frontend-pasajeros-a11y integracion/abc
```

Después correr `npm ci` dentro de `eaa-D` (el worktree nace sin `node_modules`). Trabajá solo en `eaa-D`. Un agente = un worktree = una rama. Nunca `git add .`: agregá archivos por nombre.

## Tus tareas (ítems 3 y 4 del handoff)
**3. Pantalla Pasajeros sin selector de grupo.** En `assets/js/app.js` (~línea 6280) el formulario de pasajero usa siempre el primer grupo. Agregar selector de grupo y que guarde en el grupo elegido. Hacerlo antes de la carga real de datos.

**4. Accesibilidad pendiente de la ficha** (WCAG 2.2, usar la skill `accessibility-audit`/`webapp-testing` del repo):
- La firma es obligatoria y no tiene alternativa de teclado: bloquea a quien no usa mouse o pantalla táctil. Dar una alternativa accesible (por ejemplo, escribir el nombre completo como firma) **sin cambiar el contrato con el servidor**: mismo campo `firma_data_url` (PNG base64, máx 250 KB). Si no se puede sin tocar el servidor, parar y reportar.
- Foco en la pantalla de éxito después de enviar la ficha.
- Mensajes de error dentro del `<label>`: sacarlos y asociarlos con `aria-describedby`, como ya se hizo en Colegios.

## Fuera de tu alcance (es del Agente 1, no tocar)
`lib/db.js`, `server.js`, `supabase/migrations/*`, `lib/email.js`, `lib/ficha-pdf.js`. Si necesitás un cambio ahí, dejalo escrito en tu reporte final; no lo hagas.

## Reglas
- `assets/js/app.js` pesa ~474 KB y es CRLF: nunca leerlo entero. `grep -n` por nombre y leer solo el rango necesario. Editar preservando CRLF.
- Probar contra la base local (PGlite, `127.0.0.1:54329`), nunca contra Supabase de producción. Pasos para levantarla: sección "Entorno local de pruebas" del handoff.
- No pedir ni mostrar `DATABASE_URL`. No push a `main`. No `git push` sin mostrar antes el diff al dueño.
- Criterio de fin por ítem: `npm test` en verde (102 tests o más) + `npm run check` + prueba en navegador real con Playwright (capturas o snapshot de accesibilidad como evidencia).
- Un commit por ítem, mensaje estilo `fix(admin): ...` / `fix(a11y): ...`.
- Respuestas al dueño: español, terse.

## Entregable (≤15 líneas)
Archivos tocados, commits, resultado de tests, evidencia de las pruebas, pendientes o cambios que necesitás del Agente 1.
