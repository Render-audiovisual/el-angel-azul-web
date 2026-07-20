# El Ángel Azul — Contexto del proyecto (traspaso a Claude Code)

> Documento de referencia generado por Claude (claude.ai) el 13/07/2026, para dar contexto completo al iniciar trabajo en Claude Code / VS Code. Cubre arquitectura, decisiones de diseño, criterios de contenido y estado actual.

---

## 1. Qué es el proyecto

**El Ángel Azul** es una agencia de viajes real, con sede en Corrientes Capital (Argentina), con dos líneas de negocio:
- **Turismo general**: paquetes nacionales e internacionales para familias, parejas y grupos.
- **Viajes estudiantiles**: viajes de egresados (primaria y secundaria), con foco fuerte en seguridad y confianza para las familias (dato clave: son menores de edad).

**Sucursales:** Corrientes Capital y Posadas (Misiones).
**Contacto real:** WhatsApp +54 9 3794 33-1380, dirección Córdoba 6660, Corrientes Capital.

---

## 2. Repo, deploy y stack técnico

| | |
|---|---|
| **Repo** | `https://github.com/Render-audiovisual/el-angel-azul-web` (público) |
| **Producción** | `https://el-angel-azul-web-production.up.railway.app` |
| **Deploy** | Automático — Railway escucha la rama `main` de GitHub |
| **Stack** | HTML/CSS/JS vanilla (SPA con hash routing, sin frameworks), Node.js puro (`server.js`, sin Express) |
| **Base de datos** | Google Sheets (vía service account), con endpoint propio `/api/google-sheets` en `server.js` |
| **Colaboración** | Dos agentes con push directo a `main`: Claude (yo, vía claude.ai) y **Wilson** (otro agente/dev, activo y siguiendo iterando — revisar `git log` antes de arrancar, hizo varios commits recientes sobre Turismo/Inscripción/Home que no llegué a auditar en detalle) |

### Archivos clave
- `server.js` — backend completo (auth admin, lectura/escritura Sheets, seguridad)
- `assets/js/app.js` — **archivo gigante (~8.400 líneas)**: router, todo el render público y admin, lógica de negocio. Es la mayor deuda técnica de arquitectura del proyecto.
- `assets/js/data.js` — datos/copy estático (textos, WhatsApp helper, etc.)
- `assets/js/modules/persistence.js` — capa de fetch hacia `/api/google-sheets`
- `assets/css/styles.css` — **~11.000+ líneas**, un solo archivo para todo el sitio (público + admin)
- `index.html` — entrada del sitio público (header/footer estáticos + `<div id="app">`)
- `admin/index.html` — entrada del panel admin

### Cache-busting manual (¡importante!)
Cada vez que se cambia `app.js` o `styles.css`, hay que actualizar a mano el `?v=...` en `index.html`/`admin/index.html`, si no el navegador sirve versión vieja cacheada. **No está automatizado.** Wilson y yo coincidimos en que convendría un script que hashee el contenido y reescriba esto solo — quedó pendiente, no implementado.

---

## 3. Identidad de marca (ya establecida, no inventar de nuevo)

```css
--color-primary: #0d69a1        /* azul principal */
--color-primary-strong: #0a4f79 /* azul oscuro */
--color-deep-blue: #083b7a      /* azul profundo (fondos oscuros) */
--color-accent: #eb3e8f         /* rosa/fucsia */
--color-whatsapp: #18a957       /* verde WhatsApp (CTA principal) */

--font-display: "Plus Jakarta Sans"  /* títulos generales */
--font-hero: "Poppins"               /* H1 del hero específicamente */
--font-body: "Inter"                 /* cuerpo de texto */
```

- Logo: `assets/img/logo-completo-azul.svg` — es **azul medio (#0d69a1)**, no blanco. Sobre fondos oscuros se invierte con CSS `filter: brightness(0) invert(1)`, no hay una versión blanca del archivo.
- Material Symbols Outlined como sistema de íconos (Google Fonts), no SVGs custom sueltos.

---

## 4. REGLA DE ORO — Selección de fotos (child safety, no negociable)

Es un viaje de egresados = **hay menores de edad en la mayoría de las fotos disponibles**. Criterio aplicado de forma consistente toda la sesión:

- ✅ Tomas grupales, amplias, de ambiente (cena de gala, día de nieve, fiesta temática con ropa completa)
- ❌ **Nunca** encuadres cerrados que enfoquen el cuerpo, ropa reveladora (crop tops, shorts muy cortos en contexto de boliche/after), ambientes de nightclub con foco en una persona
- Cuando el cliente mandó 5 fotos de Instagram para el carrusel del hero, **descarté 1 de las 5** por este motivo exacto (foto de after/boliche con encuadre cercano) — se lo expliqué directamente al cliente, quien lo entendió sin problema

**Fotos reales ya en el repo**, organizadas en:
- `assets/img/bariloche/cena-de-velas/` y `assets/img/bariloche/fiesta-fluo/` — fotos de eventos reales (revisar antes de usar cualquiera, no todas pasan el filtro de arriba)
- `assets/img/turismo/hero/` — paisajes sin personas (Cataratas, Patagonia, playa, nieve)
- `assets/img/home/hero-carousel/` — las fotos aprobadas para el carrusel del hero de Home (Wilson agregó más recientemente: revisar carpeta actualizada)

---

## 5. REGLA DE ORO — No inventar datos/estadísticas

En **ningún momento** inventar cifras como "+20 años de experiencia", "+10.000 viajeros", "atención 24/7", "empresa oficial", etc. Hay una nota interna real en el código (`companyData.pending` en `data.js`) que dice literalmente *"años de experiencia si corresponde"* — es decir, **no está confirmado**, y por eso nunca se usó. Cuando se necesitó contenido de ese tipo (bloques de beneficios, badges), siempre se usó texto cualitativo real y verificable en su lugar (destinos reales, servicios reales confirmados).

---

## 6. Seguridad — trabajo ya hecho (auditado 2 veces, por mí y por Wilson)

Esto se hizo en profundidad y está cerrado, pero vale la pena que quien siga sepa qué se arregló:

1. **PII de menores expuesta sin auth** — `GET /api/google-sheets?sheet=PASAJEROS` (y FICHAS_ADHESION/PAGOS/CUOTAS) devolvía DNI/teléfono/datos de menores a cualquiera sin login. Arreglado: esas 4 hojas exigen sesión admin. `GRUPOS`/`CONTRATOS`/`TURISMO`/`CONFIG` siguen públicas a propósito (sin PII, la Inscripción pública las necesita).
2. **Escritura sin auth** — mismo problema pero para `POST`, aún más grave (cualquiera podía corromper datos). Arreglado igual, con excepción de `FICHAS_ADHESION` que sigue pública para el envío del formulario (con límites: 1 fila por pedido, id generado por el servidor, rate limit de 10/hora por IP).
3. **Contraseña hardcodeada** (`aguselmejor1`) como fallback en el código — commiteada en un repo público de GitHub. Se sacó del código, pero **sigue expuesta en el historial de git para siempre**. Se le avisó al cliente que hay que rotar `EAA_ADMIN_PASSWORD`/`EAA_AGENCIA_PASSWORD` en Railway — **verificar si ya lo hizo**, la última vez que se habló del tema el acceso a Railway lo tenía "el jefe" y quedó pendiente.
4. Rate limiting en login (5 intentos/15min por IP), límites de payload, sanitización de campos, headers de seguridad (`X-Content-Type-Options`, `X-Frame-Options`, HSTS condicional), cookie con `Secure` cuando hay HTTPS real.
5. **Bug encontrado en la propia sanitización**: un límite parejo de 1000 caracteres por campo corrompía el `itinerario`/`fotos` de Turismo (se guardan como JSON en un solo campo, un itinerario de 7 días ya supera 1500 caracteres). Arreglado con límites específicos más generosos para esos campos.

---

## 7. Estado actual por sección

### Home (`/`)
- **Header**: siempre sólido/blanco (ya no hay efecto "vidrio" transparente — se unificó a pedido del cliente). Logo agrandado (88px desktop / 48px mobile), sin texto "Ángel Azul" al lado (se sacó a pedido explícito).
- **Hero**: carrusel automático de 4 fotos reales (rota cada 3s con crossfade, respeta `prefers-reduced-motion` pero SIN bloquear la rotación — ojo con esto, hubo un bug ahí, ver sección de bugs abajo). Título con `text-wrap: balance` + `white-space: nowrap` en la frase destacada para evitar palabras huérfanas en cualquier ancho. CTA de WhatsApp verde + botón "Ver destinos" + 4 chips de beneficios.
- **Sección CTA grande**: **se eliminó** — el cliente consideró que quedaba repetida con el CTA del hero.
- Estructura final pedida por el cliente: Hero (con CTA integrado) → Quiénes somos → Sucursales → Footer. Corto, directo, sin secciones largas de más.
- Wilson hizo cambios recientes sobre esto (`0986c60 Actualizar fotos del header principal`, `22c39dd Redisenar hero mobile de inicio`) — **revisar el estado real actual antes de asumir que sigue exactamente así**.

### Turismo (`/turismo`)
- Catálogo con buscador + filtros, cards con carousel de fotos, tags de categoría con color propio, itinerario en acordeón en el detalle, barra fija de precio + WhatsApp.
- **Problema real detectado y sin resolver del todo**: la descripción de uno de los paquetes reales (Bariloche) tenía literalmente texto de prueba ("Viaje demo para validar la carga manual...") — esto es **contenido de Sheets**, no del código, hay que corregirlo desde el admin o directamente en la hoja.
- El cliente pidió una pasada de pulido completa (hero más emocional, filtros más livianos, cards más premium, resolver el layout cuando hay pocos paquetes cargados) — **quedó sin implementar**, es de las últimas cosas pedidas antes de la migración. Wilson movió algo ahí también (`6ae7297 Pulir pagina de turismo`, `f07750c Ajustar detalles finales de turismo`) — revisar qué tanto de la lista original ya está cubierto.

### Inscripción (`/inscripcion`)
- Reestructurada de 5 pasos a 2 macro-pasos (Selección / Ficha y firma).
- **El bloqueo por colegio no encontrado se sacó a propósito** — cualquier familia puede enviar su ficha aunque su colegio no esté cargado en el sistema. El admin ya soporta esto (marca la ficha como "Bloqueada" para revisión manual).
- Fecha de nacimiento: campo custom de 3 partes (día/mes/año) con autoavance, reemplaza el `<input type="date">` nativo que tenía un bug de rango de años.
- Wilson siguió ajustando esto después (`5b222af Pulir flujo de inscripcion`, `26e4724 Ajustar progreso de inscripcion`) — revisar estado actual.

### Admin (`/admin`)
- Turismo: CRUD completo con sync a Sheets.
- Pasajeros/Grupos/Contratos: funcional.
- **Pagos/Cuotas: sigue sin sincronización real a Sheets**, opera parcialmente con datos locales. El cliente confirmó que esto no bloquea la entrega — es la deuda pendiente más grande del proyecto junto con partir `app.js` en módulos.
- Ruta vieja `/admin-portal`: prototipo muerto, desconectado, lee de un Excel simulado que ya no se usa en ningún otro lado. Nadie puede llegar ahí (sin links activos) — candidato a limpieza, no es urgente.

### Portal de Pasajeros (`/portal-pasajeros`, nav "Mi Viaje")
- Reconectado (antes redirigía a Inscripción sin mostrar nada) y leyendo datos reales de Sheets en vez de un Excel simulado que tenía antes.
- Limitación honesta: el sistema no trackea montos de pago reales por pasajero todavía, así que el portal no inventa cifras de saldo — muestra estado general y deriva a WhatsApp para el monto exacto.

---

## 8. Deuda técnica conocida (documentada, no urgente)

1. `app.js` en ~8.400 líneas, mezclando router + render público + admin + lógica de negocio. Recomendación de Wilson (con la que coincidí): dividir en módulos por dominio (`home.js`, `turismo.js`, `inscripcion.js`, `admin-turismo.js`, `router.js`, `ui/helpers.js`) — no partir todo de golpe.
2. Cache-busting manual del `?v=` — automatizar con hash de contenido.
3. Google Sheets como base de datos: funciona con merge-by-id para evitar pérdida de datos por escrituras simultáneas, pero sigue siendo una limitación de escala a mediano plazo.
4. Sesiones de admin en memoria (se pierden si el server reinicia) — aceptable a esta escala, revisar si Railway pasa a correr múltiples instancias.
5. CSS con algunas clases muertas de iteraciones viejas (Wilson ya limpió una tanda grande, `033e850 Limpia CSS muerto del front publico`) — puede haber quedado más desde entonces.

---

## 9. Cosas puntuales para tener en cuenta al rediseñar

- **Botones de acción compartidos** (`.btn-fuchsia`, `.btn-whatsapp`, `.btn-ghost-light`) están definidos en una regla base usada en varias secciones (Home, CTA, Turismo). Si se necesita un tamaño distinto en un lugar puntual, escribir un selector **acotado** (ej. `.hero-clean-actions .btn-whatsapp`) en vez de tocar la regla compartida — ya hubo que corregir esto una vez porque un cambio "de alcance chico" terminó afectando otras secciones sin querer.
- El header/nav es compartido entre TODAS las páginas vía `main { padding-top: Xpx }` — si se cambia la altura del header, hay que actualizar este valor en paralelo o el contenido de otras páginas queda tapado (pasó una vez con el hero de Turismo).
- Antes de dar por buena una sección, verificar balance de llaves del CSS (`content.count('{') == content.count('}')`) y `node --check` sobre los `.js` — costumbre que evitó varios bugs de sintaxis a lo largo de la sesión.

---

## 10. Cómo correr local

```bash
git clone https://github.com/Render-audiovisual/el-angel-azul-web.git
cd el-angel-azul-web
npm install
npm start
# público: http://localhost:8080
# admin:   http://localhost:8080/admin
```

Variables de entorno necesarias (pedirlas a quien tenga acceso a Railway):
`EAA_ADMIN_PASSWORD`, `EAA_AGENCIA_PASSWORD`, `GOOGLE_SHEETS_CREDENTIALS`, `GOOGLE_SHEETS_SPREADSHEET_ID`

Sin credenciales de Sheets configuradas, el sitio corre igual pero con datos de demo en localStorage — no rompe nada.

---

## 11. Lo último que quedó pedido, sin implementar

El cliente pidió una pasada de pulido grande en **Turismo** (hero más emocional/humano, buscador y filtros más livianos visualmente, cards más premium, resolver el layout vacío cuando hay pocos paquetes, corregir el texto placeholder de Bariloche) tomando como base la versión actual, **sin** convertirla en un catálogo frío tipo Booking. Se había empezado a revisar el código pero no se llegó a implementar antes de la migración — es el punto de partida más directo para arrancar en Claude Code.
