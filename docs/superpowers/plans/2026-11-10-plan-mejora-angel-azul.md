# Plan de mejora El Ángel Azul – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar la Ficha de Adhesión estable y lista para carga real: sin doble envío, sin datos pisados, accesible, con pantalla Pasajeros correcta, y entregada a `main`/Hostinger/Supabase con OK del dueño.

**Architecture:** Dos agentes en worktrees separados, repartidos por archivo: Agente 1 = capa servidor/base (`lib/`, `server.js`, `supabase/migrations/`); Agente 2 = frontend (`assets/js/app.js`, CSS, HTML). Cada tarea trae su Plan B. Todo se integra en `integracion/abc`; nada va a `main` ni a Supabase sin OK explícito.

**Tech Stack:** Node ≥20 sin framework, Postgres (Supabase), `pg`, `pdf-lib`, PGlite (tests), Playwright (E2E), `node --test`.

## Global Constraints

- Repo: `C:\Users\Franco\Desktop\RENDER WEBS\angel azul web\`. Base de integración: rama `integracion/abc` (`eaa-INT`).
- Un agente = un worktree = una rama. Nunca `git add .`: agregar archivos por nombre.
- Archivos CRLF: `lib/db.js`, `server.js`, `assets/js/app.js`, migraciones y tests. Editar con script que normalice a LF y vuelva a CRLF (patrón de `/tmp/patch.cjs`), o verificar con `file`.
- `assets/js/app.js` pesa ~474 KB: nunca leerlo entero; `grep -n` y leer solo el rango.
- Probar siempre contra la base local PGlite. Escribir en Supabase de producción solo con OK del dueño. No pedir ni mostrar `DATABASE_URL`.
- Criterio de fin de toda tarea: `npm run check` en verde (hoy 105 tests en `eaa-E`) + commit. Mensajes de commit terminan con `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Contrato de la firma (no cambiar sin avisar): campo `firma_data_url`/`firma`, PNG base64, máx 250 KB.
- Respuestas al dueño: español, terse.

## Protocolo de falla y Plan B (aplica a todas las tareas)

1. Un test o prueba falla: diagnosticar la causa raíz (skill `superpowers:systematic-debugging`) y reintentar **una vez**.
2. Falla otra vez: **no insistir**. Aplicar el **Plan B** escrito en la tarea.
3. El Plan B también falla: marcar la tarea `BLOQUEADA`, anotar causa y evidencia en la sección "Registro de fallas" al final, y seguir con la tarea siguiente que no dependa de ella.
4. Cada falla resuelta o bloqueada deja un test de regresión o una regla en `docs/ARQUITECTURA.md` (skill `harness-engineering`) para que no se repita.
5. Nunca saltarse hooks, borrar tests ni tocar producción para "hacer pasar" una tarea.

## Reparto

| Agente | Worktree / rama | Archivos propios |
|---|---|---|
| 1 (servidor/base) | `eaa-E` / `feat/db-doble-envio` | `lib/db.js`, `lib/storage.js`, `lib/email.js`, `lib/ficha-pdf.js`, `server.js`, `supabase/migrations/*`, `assets/js/modules/ficha-validation.js` |
| 2 (frontend) | `eaa-D` / `feat/frontend-pasajeros-a11y` (desde `integracion/abc`) | `assets/js/app.js`, `assets/css/*`, HTML |

`ficha-validation.js` es de Agente 1 aunque corra en el navegador; Agente 2 no lo toca.

---

## Fase 0 – Hecho

- [x] **T1: Migración 0006, índices únicos contra doble envío** – commit `574e001` en `eaa-E`. 105/105 tests.

---

## Fase A – Trabajo en paralelo

### Task 2 (Agente 1): No pisar datos de una persona existente y validar edad con fecha Argentina

**Files:**
- Modify: `lib/db.js` (`findOrCreatePersona`, línea ~202; caller en alta de Pasajeros, línea ~1000)
- Modify: `assets/js/modules/ficha-validation.js` (`edadEn`, línea ~78; `crearValidador`, ~88)
- Test: `scripts/doble-envio.test.js` (agregar) y `scripts/ficha-validation.test.js` (agregar)

**Interfaces:**
- Produces: `findOrCreatePersona(queryable, { numeroDocumento, nombre, apellido, nacimiento, telefono, sobrescribir = false })`. Con `sobrescribir=false` (fichas públicas) un dato ya cargado NO se pisa; con `true` (admin editando un pasajero) el dato nuevo gana.

- [ ] **Step 1: Test que falla (persona existente no se pisa desde la ficha)**

Agregar a `scripts/doble-envio.test.js`:

```js
test("una ficha pública no pisa nacimiento ni teléfono de una persona ya cargada", async () => {
  await pool.query(
    `insert into personas (tipo_documento, numero_documento, nombre, nacimiento, telefono)
     values ('DNI', '45000077', 'Ana', '2008-01-01', '3794000000')`
  );
  await db.insertFichaPublica(datosPax("45000077"), CTX); // la ficha trae nacimiento 2009-03-14
  const { rows } = await pool.query(`select nacimiento::text as n, telefono from personas where numero_documento = '45000077'`);
  assert.equal(rows[0].n, "2008-01-01");
  assert.equal(rows[0].telefono, "3794000000");
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `node --test scripts/doble-envio.test.js`
Expected: FAIL, `'2009-03-14' !== '2008-01-01'`.

- [ ] **Step 3: Implementar**

En `findOrCreatePersona` agregar el parámetro `sobrescribir = false` y reemplazar las dos líneas del `do update set`:

```js
async function findOrCreatePersona(queryable, { numeroDocumento, nombre, apellido, nacimiento, telefono, sobrescribir = false }) {
  // ...igual hasta el insert...
  const nacimientoSql = sobrescribir
    ? "coalesce(excluded.nacimiento, personas.nacimiento)"
    : "coalesce(personas.nacimiento, excluded.nacimiento)";
  const telefonoSql = sobrescribir
    ? "coalesce(nullif(excluded.telefono, ''), personas.telefono)"
    : "coalesce(personas.telefono, nullif(excluded.telefono, ''))";
  // Las dos expresiones salen de código propio, nunca del cliente: interpolar es seguro.
  const result = await queryable.query(
    `insert into personas (tipo_documento, numero_documento, nombre, apellido, nacimiento, telefono)
     values ('DNI', $1, $2, $5, $3, $4)
     on conflict (tipo_documento, numero_documento)
       do update set
         numero_documento = excluded.numero_documento,
         apellido = coalesce(personas.apellido, excluded.apellido),
         nacimiento = ${nacimientoSql},
         telefono = ${telefonoSql}
     returning id`,
    [doc, normalizeText(nombre), nacimientoValido, normalizeText(telefono), normalizeText(apellido) || null]
  );
  return result.rows[0].id;
}
```

En el caller de Pasajeros (`grep -n "findOrCreatePersona(pool" lib/db.js`, ~línea 1000) agregar `sobrescribir: true` al objeto. Las llamadas de `insertFichaPublica` no cambian.

- [ ] **Step 4: Test de edad en fecha Argentina**

Agregar a `scripts/ficha-validation.test.js`:

```js
test("la edad mínima se calcula con la fecha de Argentina, no UTC", () => {
  // 15/09/2026 01:00 UTC = 14/09/2026 22:00 en Argentina: el pasajero aún tiene 4 años.
  const hoy = new Date("2026-09-15T01:00:00Z");
  const r = v.validarFichaPax({ pasajeroNacimiento: "2021-09-15" }, { hoy });
  assert.ok(r.errores.pasajeroNacimiento);
  const ok = v.validarFichaPax({ pasajeroNacimiento: "2021-09-14" }, { hoy });
  assert.equal(ok.errores.pasajeroNacimiento, undefined);
});
```

(Si `v` no está importado en ese archivo, copiar el `require` del test existente.)

- [ ] **Step 5: Implementar fecha AR**

En `ficha-validation.js`, antes de usar `hoy` en `edadEn` (línea ~83) convertirla una sola vez:

```js
// Argentina = UTC-3 todo el año (sin horario de verano).
function fechaArgentina(fecha) { return new Date(fecha.getTime() - 3 * 3600 * 1000); }
```

y dentro de `crearValidador(input, hoy)` empezar con `hoy = fechaArgentina(hoy);` (las comparaciones siguen usando `getUTC*` sobre ese valor ya desplazado).

- [ ] **Step 6: Correr todo**

Run: `npm run check`
Expected: todos los tests en verde (≥107).

- [ ] **Step 7: Commit**

```bash
git add lib/db.js assets/js/modules/ficha-validation.js scripts/doble-envio.test.js scripts/ficha-validation.test.js
git commit -m "fix(fichas): no pisar nacimiento/telefono de una persona existente y edad con fecha Argentina"
```

**Plan B:** si el cambio de `sobrescribir` rompe tests de Pasajeros que dependen del comportamiento viejo, dejar `sobrescribir=true` como default solo para el caller admin y documentar el caso en el Registro de fallas. Si la fecha AR rompe otros tests de validación, limitar el desplazamiento solo a `edadEn` (no a todo el validador).

---

### Task 3 (Agente 1): Borrar la firma suelta en Storage si la ficha falla

**Files:**
- Modify: `lib/storage.js` (agregar `borrarFirma`, exportarla)
- Modify: `server.js` (`handlePublicFicha`, línea ~1000)
- Test: `scripts/storage.test.js` (agregar)

**Interfaces:**
- Produces: `storage.borrarFirma(ruta, { env, fetchImpl }) -> Promise<void>`. Tolera 404; lanza error con `statusCode 502` en otro fallo.

- [ ] **Step 1: Test que falla**

Agregar a `scripts/storage.test.js` (usar el mismo `env` y estilo de stub `fetchImpl` que los tests existentes del archivo):

```js
test("borrarFirma hace DELETE sobre la ruta y tolera 404", async () => {
  const env = { SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k" };
  const llamadas = [];
  const fetchImpl = async (url, opts) => { llamadas.push([url, opts.method]); return { ok: false, status: 404 }; };
  await storage.borrarFirma("firmas/abc.png", { env, fetchImpl });
  assert.deepEqual(llamadas, [["https://x.supabase.co/storage/v1/object/fichas/firmas/abc.png", "DELETE"]]);
  await assert.rejects(
    storage.borrarFirma("firmas/abc.png", { env, fetchImpl: async () => ({ ok: false, status: 500 }) }),
    (e) => e.statusCode === 502
  );
});
```

- [ ] **Step 2: Ver que falla**

Run: `node --test scripts/storage.test.js`
Expected: FAIL, `storage.borrarFirma is not a function`.

- [ ] **Step 3: Implementar en `lib/storage.js`**

```js
async function borrarFirma(ruta, { env = process.env, fetchImpl = fetch } = {}) {
  const respuesta = await fetchImpl(urlObjeto(ruta, env), { method: "DELETE", headers: cabeceras(env) });
  if (!respuesta.ok && respuesta.status !== 404) throw errorStorage("borrar", respuesta);
}
```

y agregar `borrarFirma` al `module.exports`.

- [ ] **Step 4: Usarla en `server.js`**

Reemplazar el bloque `try` de `handlePublicFicha` (líneas ~1001-1015):

```js
  let guardada;
  let firmaSubida = null;
  try {
    if (storage.storageConfigurado()) {
      firmaSubida = await storage.subirFirma(validacion.datos.firma, crypto.randomUUID());
      validacion.datos.firma = firmaSubida;
    }
    guardada = await db.insertFichaPublica(validacion.datos, contexto);
  } catch (error) {
    // La ficha no se guardó: la firma ya subida quedaría huérfana en el bucket.
    if (firmaSubida) {
      await storage.borrarFirma(firmaSubida).catch((e) => console.error("No se pudo borrar la firma huérfana:", safeErrorForLog(e)));
    }
    // ...resto del catch igual (400 / 409 / 500)...
```

- [ ] **Step 5: Correr todo y commitear**

Run: `npm run check`
Expected: verde.

```bash
git add lib/storage.js server.js scripts/storage.test.js
git commit -m "fix(fichas): borrar la firma de Storage si la ficha da 400/409/500"
```

**Plan B:** si borrar dentro del `catch` complica el flujo, mover la subida a *después* de `insertFichaPublica` con un `update fichas_adhesion set firma_storage_path` (la ficha ya está guardada con la data URL; si la subida falla, queda con data URL, que es el comportamiento legado y válido). No borrar nada de Storage sin la ruta exacta.

---

### Task 4 (Agente 2): Selector de grupo en Pasajeros

**Files:**
- Modify: `assets/js/app.js` (formulario de alta de pasajero en `renderAdminPasajeros`, ~línea 6280; `grep -n "adminPasajerosFormError\|renderAdminPasajeros" assets/js/app.js`)
- Test: `scripts/frontend-regression.test.js` (agregar) y prueba Playwright manual

**Interfaces:**
- Consumes: la lista de grupos que ya carga la pantalla (misma fuente que usa el selector de contrato).
- Produces: el alta de pasajero guarda en el grupo elegido en un `<select name="grupoId">` con `<label>`. Si hay un solo grupo, queda preseleccionado.

- [ ] **Step 1:** `grep -n "grupos\[0\]\|groups\[0\]\|\[0\]\.id" assets/js/app.js | head -20` dentro del rango del formulario; anotar dónde se fija el grupo por defecto.
- [ ] **Step 2: Test que falla** en `scripts/frontend-regression.test.js`, siguiendo el estilo de ese archivo (revisa el HTML/JS fuente con `fs.readFileSync` y `assert.match`): afirmar que el formulario contiene `name="grupoId"` y que el guardado ya no usa el primer grupo fijo.
- [ ] **Step 3: Implementar** el `<select>` con `<label for>` y usar su valor al guardar. Sin valor elegido: error claro "Elegí un grupo", sin guardar.
- [ ] **Step 4:** `npm run check` en verde. Probar con Playwright: con 2 grupos, crear un pasajero en el segundo y verificar en la lista que quedó en ese grupo. Guardar captura como evidencia.
- [ ] **Step 5: Commit**

```bash
git add assets/js/app.js scripts/frontend-regression.test.js
git commit -m "fix(admin): selector de grupo en el alta de pasajeros"
```

**Plan B:** si el estado compartido de la pantalla hace frágil el selector, mostrar el grupo activo como texto fijo y avisar con un mensaje cuando haya más de uno ("Cambiá de grupo desde la lista antes de cargar"). Anotar en Registro de fallas y pedir decisión al dueño.

---

### Task 5 (Agente 2): Firma accesible por teclado

**Files:**
- Modify: `assets/js/app.js` (bloque `ficha-adhesion-signature`, líneas ~8712-8800)
- Modify: `assets/css/*` solo si hace falta estilo para el campo nuevo
- Test: `scripts/frontend-regression.test.js` y prueba Playwright con teclado

**Interfaces:**
- Produces: alternativa de firma "Escribir mi nombre": un `<input type="text">` con `<label>` que, al confirmar, dibuja el nombre en el `<canvas data-ficha-signature>` con `ctx.fillText` y deja la firma lista. El valor que viaja al servidor sigue siendo el mismo PNG base64 de siempre (mismo campo, mismo límite).

- [ ] **Step 1:** Leer solo `sed -n 8700,8830p assets/js/app.js` y ubicar cómo se marca la firma como "hecha" (variable o flag).
- [ ] **Step 2: Test que falla:** afirmar que el markup incluye el input de nombre con `<label>` y un botón accesible que genera la firma.
- [ ] **Step 3: Implementar.** Al confirmar: limpiar canvas, fondo blanco, `ctx.font = "64px cursive"`, `fillText(nombre, 20, 130)`, marcar firma hecha igual que el trazo con mouse. El botón "Limpiar firma" ya existente borra ambos modos.
- [ ] **Step 4: Prueba Playwright solo con teclado** (Tab, escribir, Enter): enviar una ficha completa contra la base local y verificar 201. Guardar evidencia.
- [ ] **Step 5:** `npm run check` y commit:

```bash
git add assets/js/app.js scripts/frontend-regression.test.js
git commit -m "fix(a11y): firma de la ficha con alternativa de teclado (nombre escrito)"
```

**Plan B:** si el PNG generado supera 250 KB o el servidor lo rechaza, achicar el canvas de salida (por ejemplo 360×110) antes de `toDataURL`. Si igual hace falta cambiar el servidor, **parar**: pasar la tarea a Agente 1 como T5b y anotar el motivo.

---

### Task 6 (Agente 2): Foco en la pantalla de éxito y errores fuera del `<label>`

**Files:**
- Modify: `assets/js/app.js` (render de éxito de la ficha; helper de errores ~líneas 8498-8525, que ya usa `aria-describedby` para Colegios)
- Test: `scripts/frontend-regression.test.js` y Playwright

- [ ] **Step 1: Test que falla:** afirmar que el contenedor de éxito tiene `tabindex="-1"` y se le llama `.focus()` al mostrarse; y que el mensaje de error de un campo ya no queda anidado dentro de su `<label>`.
- [ ] **Step 2: Implementar.** Éxito: `contenedor.setAttribute("tabindex", "-1"); contenedor.focus();` con `role="status"`. Errores: crear el nodo de error como hermano del input, con `id`, y enlazarlo con `aria-describedby` (reutilizar el helper existente de las líneas ~8498-8525, ajustar `closest("label, .ficha-adhesion-signature")`).
- [ ] **Step 3: Playwright:** enviar ficha inválida, verificar que el lector/snapshot de accesibilidad lee el error asociado al campo; enviar válida y verificar que el foco quedó en el mensaje de éxito.
- [ ] **Step 4:** `npm run check` y commit:

```bash
git add assets/js/app.js scripts/frontend-regression.test.js
git commit -m "fix(a11y): foco en la pantalla de exito y errores asociados fuera del label"
```

**Plan B:** si mover los errores rompe el layout, dejar el nodo donde está pero fuera del texto del `<label>` (envolver ambos en un `div.field`) y mantener el `aria-describedby`.

---

## Fase B – Integración y consignas del cliente

### Task 7 (ambos): Integrar A y B en `integracion/abc`

- [ ] **Step 1:** Cuando T2–T6 estén commiteadas y en verde, desde `eaa-INT`: `git merge feat/db-doble-envio` y luego `git merge feat/frontend-pasajeros-a11y`. Archivos disjuntos: no se esperan conflictos.
- [ ] **Step 2:** `npm run check` (≥108 tests) y E2E: `PLAYWRIGHT_PATH=<node_modules/playwright> node scripts/e2e/ficha.e2e.js` y `colegios.e2e.js` contra la base local.
- [ ] **Step 3:** Mostrar al dueño `git log --oneline` y resumen. No push.

**Plan B:** si el merge da conflicto, no resolver a ciegas: abortar (`git merge --abort`), listar archivos en conflicto y resolver con el dueño. Si falla un test tras integrar, bisecar con `git bisect` entre las dos ramas y devolver el arreglo al agente dueño del archivo.

### Task 8 (dueño + Agente 1): Consignas del cliente (12 puntos)

Las 12 consignas originales no están en el repo. Procedimiento, no placeholder:

- [ ] **Step 1:** El dueño pega las consignas en `docs/CONSIGNAS-CLIENTE.md` (una por línea numerada).
- [ ] **Step 2:** Agente 1 cruza cada consigna con las tareas T1–T6 y el spec `docs/superpowers/specs/2026-09-15-ficha-adhesion-design.md`; escribe una tabla `consigna → cubierta por Tn | pendiente`.
- [ ] **Step 3:** Cada consigna `pendiente` pasa a ser una tarea nueva en este plan, con archivos, test y Plan B, asignada por archivo al Agente 1 o 2.

**Plan B:** si el dueño no encuentra las consignas, reconstruirlas desde el spec y los correos/WhatsApp del cliente y validar la lista con el dueño antes de implementar.

---

## Fase C – Entrega (cada paso exige OK explícito del dueño)

### Task 9: Aplicar migraciones 0005 y 0006 y cargar datos reales en Supabase
- [ ] Ensayar migraciones en base local. Mostrar SQL y pedir OK. Aplicar 0005 y 0006 al proyecto `gruwkiuswpnbzywcoftz`.
- [ ] Cargar colegios reales, viajes ("Bariloche 2027" exacto), grupos, contratos y planes. **Todo registro lleva `legacy_id`.** Script revisado por el dueño antes de correr.
- **Plan B:** si una migración falla, no forzar: revisar el error, restaurar (las migraciones corren sin datos vivos) y corregir en una 0007.

### Task 10: Subir a `main` y configurar Hostinger
- [ ] Mergear `integracion/abc` a `main`, mostrar el diff, pedir OK, `git push`. Cargar variables en Hostinger: `EAA_POSTGRES_MIGRATION_ENABLED=true` (y las de Storage/correo si se activan).
- **Plan B:** si el deploy rompe, revertir con `git revert` del merge (no `reset --hard`) y volver a desplegar.

### Task 11: Correo (Resend)
- [ ] `RESEND_API_KEY`, `EAA_EMAIL_FROM`, `EAA_EMAIL_COPIA` + DNS de `elangelazul.tur.ar`.
- **Plan B:** si el DNS no está listo, dejar el correo apagado: la ficha igual se guarda (`email_estado = sin_configurar`) y el admin usa "reenviar correo" cuando esté activo.

### Task 12: Endurecer
- [ ] IP real tras el proxy de Hostinger (`X-Forwarded-For`), admin sin 200 pasajeros demo cuando falla la base, calle sin HTML, rotar `EAA_ADMIN_PASSWORD`/`EAA_AGENCIA_PASSWORD`, decidir sobre `admin/colegios/index.html`, actualizar `docs/ARQUITECTURA.md` (migraciones 0001–0006, nº de tests).
- **Plan B:** si no se puede confirmar la IP real, limitar por usuario (ya existe) y documentar el riesgo.

---

## Registro de fallas

| Tarea | Falla | Causa | Qué se hizo | Regresión agregada |
|---|---|---|---|---|
| – | – | – | – | – |

## Self-review

- **Cobertura:** ítems 1–9 del handoff cubiertos por T1–T6, T9–T12. Consignas del cliente: T8 (pendiente de recibirlas).
- **Pendientes viejos fuera de plan (decidir con el dueño):** "Bariloche placeholder en Sheets", "Sucursales en Home", rediseño final.
- **Tipos:** `findOrCreatePersona(..., sobrescribir)` y `storage.borrarFirma(ruta, opts)` definidos en T2/T3 y usados solo ahí.
