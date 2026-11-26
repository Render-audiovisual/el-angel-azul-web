# Instrucciones para agentes (Codex, Claude Code u otro)

Web de viajes estudiantiles de El Ángel Azul: sitio público, ficha de adhesión online (PAX y Tutor) y panel de administración. Node sin framework (`server.js`) + SPA (`assets/js/app.js`) + Postgres en Supabase. Claude Code lee este archivo a través de `CLAUDE.md`.

## Fuentes vigentes
Leé en este orden: este archivo, `docs/HANDOFF-CODEX.md` (estado, tablero «En curso» y pasos), `docs/ARQUITECTURA.md` (mapa del código y fallas conocidas), `docs/correcciones-del-angel.md` y `docs/CONSIGNAS-CLIENTE.md` (pedido del cliente y estado de cada punto).
Lo escrito antes de noviembre de 2026 está desactualizado (por ejemplo, `contexto proyecto/` habla de Railway).
`assets/js/app.js` tiene ~9.500 líneas: nunca lo leas entero. Usá `grep -n` y leé solo el rango.

## Reglas
| Regla | Cómo se controla |
|---|---|
| Toda escritura en Supabase y todo push o merge a `main` necesita OK explícito del dueño. | El dueño |
| Los secretos (`DATABASE_URL`, claves de Supabase y Resend, contraseñas) nunca se piden, se muestran, se pegan en el chat ni se commitean. | `scripts/guardas.test.js` busca secretos en los archivos del repo |
| Tests y pruebas locales solo con PGlite (base en memoria) y datos ficticios. | `scripts/helpers/sin-secretos.js` borra las variables reales antes de cada test |
| `git add <archivo>` por nombre, nunca `git add .`. | Revisión del PR |
| Commits chicos. `npm run check` en verde antes de cada push. | `npm run check` |
| Los docs vigentes no nombran archivos ni `npm run` que no existen. | `scripts/guardas.test.js` |
| Respuestas al dueño en español, cortas. Textos de la web en español rioplatense (vos). | Revisión |

Si una regla nueva se puede chequear, agregala a `scripts/guardas.test.js` en vez de solo escribirla acá. La deuda conocida aparece como `todo` en la salida de `npm run check`; el PR que la resuelve le saca el `todo` y el test pasa a ser obligatorio.

## Inicio de sesión
1. Ubicate en la carpeta del repo: `git rev-parse --show-toplevel` tiene que responder sin error.
2. `git fetch --prune`, después `git log --oneline -5 origin/feat/colegios-padron` y `git branch -r` (ramas nuevas del otro programador).
3. Leé el tablero «En curso» y la sección 5 de `docs/HANDOFF-CODEX.md`.
4. Creá tu rama: `git switch -c <persona>/<tema> origin/feat/colegios-padron`.
5. `npm ci && npm run check`.

## Cierre de sesión
1. `npm run check` en verde.
2. `git add <archivos>` por nombre y commit chico.
3. Actualizá `docs/HANDOFF-CODEX.md`: tu fila del tablero, pasos hechos y lo que sigue.
4. `git push -u origin <tu-rama>` y abrí el PR hacia `feat/colegios-padron`.

## Ramas y reparto
- Una rama por persona o agente (`fran/<tema>`, `agustin/<tema>`), salida de `feat/colegios-padron`. Nunca dos en la misma rama.
- Un paso = una rama = un PR chico hacia `feat/colegios-padron`. A `main` solo entra el PR #3, con OK del dueño.
- Reparto por archivos: servidor y base (`server.js`, `lib/`, `supabase/migrations/`, tests de servidor) vs. frontend (`assets/`, HTML, CSS).
- Si un cambio toca las dos zonas, primero va el PR de servidor y después el de frontend.
- Antes de tocar archivos de la zona del otro, anotalo en el tablero y avisá.

## Prueba local
`npm run dev` levanta http://localhost:3057 con usuario `admin` y clave `TestAdmin-123456`. Usa una base en memoria con datos de prueba e ignora las claves reales. Datos cargados y trucos (viaje «Bariloche 2027», lista de colegios, scroll real): sección 3 de `docs/HANDOFF-CODEX.md`.

## Qué puede hacer un agente
| Solo | Con OK explícito del dueño | Nunca |
|---|---|---|
| Leer, buscar, correr tests, `npm run dev`, Playwright local | Cualquier conexión a Supabase, incluida la simulación del Padrón | Pedir, mostrar o pegar secretos |
| Código y commits en su propia rama; push de su rama | Migraciones, importar con `--aplicar`, cargar datos reales | `git add .` |
| Abrir PR hacia `feat/colegios-padron` | Mergear PRs (hasta que el dueño defina otra regla) | `git push --force` en ramas compartidas |
| Actualizar `docs/HANDOFF-CODEX.md` y los docs del paso que trabaja | Cualquier cosa en `main`, incluido el merge del PR #3 | Tests o pruebas contra la base real |
| | Variables de Hostinger, DNS y Resend; rotar contraseñas | |
| | Dependencias nuevas; cambiar este archivo o las guardas; configuración de GitHub; borrar ramas | |

Decisiones abiertas del dueño: cuándo mergear el PR #3, cuándo escribir en Supabase y qué pueden hacer los agentes de la agencia (rol agencia).
