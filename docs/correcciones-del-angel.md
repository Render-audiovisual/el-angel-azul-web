# Correcciones y mejoras – Sistema de fichas de El Ángel Azul

Pedido del cliente, recibido el 18/11/2026. Texto original, sin cambios.

**Prioridad principal:** mejorar y simplificar el proceso de carga de la Ficha de Adhesión, asegurando que la información quede correctamente estructurada tanto en el formulario como en el administrador.

## 1. Gestión de colegios

- Desde el administrador se deben poder cargar y administrar los colegios activos.
- Mantener un historial/base de datos de colegios, evitando tener que cargarlos nuevamente.
- Cada pasajero debe quedar vinculado claramente al colegio al que pertenece.

## 2. Datos académicos

Agregar y ordenar los siguientes campos:

- Curso.
- Grado/Año → obligatorio.
- División → obligatoria.

## 3. Nombre y apellido

- Separar Nombre y Apellido en campos diferentes.
- Ambos obligatorios.
- Aclarar visualmente que deben ingresarse completos, correctamente escritos y respetando las tildes.
- En la ficha generada deben verse claramente diferenciados y correctamente delimitados.

## 4. Campos obligatorios

- Todos los campos necesarios de la ficha deben ser obligatorios.
- No permitir finalizar/enviar la ficha mientras falte información requerida.

## 5. Tipo de persona

Antes de completar la ficha, permitir seleccionar:

- Pasajero (PAX).
- Tutor.

El formulario debe adaptarse según la selección. Si es Tutor, mostrar un formulario más corto únicamente con los datos necesarios.

## 6. Datos del tutor

Solicitar obligatoriamente:

- CUIL/CUIT del tutor.
- Teléfono de contacto.
- Correo electrónico.
- Demás datos necesarios para identificar al responsable.

## 7. Envío de ficha

- Incorporar la posibilidad de enviar la ficha por Gmail/correo electrónico.
- Verificar que la ficha enviada tenga todos los datos correctamente formateados.

## 8. Plan de pago

- Agregar el plan de pago correspondiente dentro de la ficha.
- El plan seleccionado debe quedar visible también desde el administrador.

## 9. Dirección

- Corregir el campo y/o funcionamiento actual de Dirección.

## 10. Error de carga

- Revisar y solucionar el error actual al cargar/enviar fichas.
- Validar que la información quede guardada correctamente y no se pierdan datos.

## 11. Información del PAX en Admin

Dentro del administrador debe visualizarse claramente toda la información de pertenencia del pasajero:

**Colegio → Curso/Grado/Año → División → Plan → Tutor**, además de sus datos personales.

## 12. Exportación

- Incorporar la opción de exportar los pasajeros (PAX) a Excel.
- El Excel debe mantener los datos ordenados en columnas y permitir identificar fácilmente colegio, curso, división, tutor, plan y demás información relevante.

## Prioridad de desarrollo

La Ficha de Adhesión es la prioridad principal. Primero debe quedar estable, fácil de completar, con validaciones correctas y correctamente integrada al administrador.

Luego avanzar con las funciones complementarias como historial, exportación y envío por correo.

---

# Estado de cada punto (18/11/2026, rama `feat/colegios-padron`)

Criterio: «En código» = está en la rama y lo cubren tests o lo vi en el código. **Ninguno está desplegado** y todavía no se revisó punto por punto en el navegador. Contra la base real de Supabase no se probó nada: hoy está casi vacía y faltan las migraciones 0005 y 0006.

| # | Punto | Estado | Falta |
|---|---|---|---|
| 1 | Colegios | En código: pantalla Colegios en el admin con baja lógica (nunca se borran, así queda el historial), pasajero ligado por `colegio_id`, importador del Padrón (2.929 colegios de Corrientes y Misiones). | Cargar los colegios en la base real (con OK del dueño). Probar el buscador público con ~2.900 entradas. |
| 2 | Curso, grado, división | En código: obligatorios, con restricciones también en la base. | Revisar el orden visual en el navegador. |
| 3 | Nombre y apellido | En código: campos separados y obligatorios, aviso de tildes en el formulario PAX y en el de Tutor. | Revisar en el PDF generado que se vean bien delimitados. |
| 4 | Obligatorios | En código: validación compartida entre navegador y servidor; el servidor responde 400 con el error por campo. | Revisar casos raros (celular, CUIL). |
| 5 | PAX / Tutor | En código: selector inicial y formulario corto de Tutor. | Revisar en el navegador. |
| 6 | Datos del tutor | En código: CUIL/CUIT, celular, email, parentesco, documento. | — |
| 7 | Correo | **Implementado pero apagado.** Falta `RESEND_API_KEY`, `EAA_EMAIL_FROM`, `EAA_EMAIL_COPIA` y el DNS del dominio. La ficha de Tutor no envía correo. | Activar Resend y probar que llegue con todos los datos. Hoy sale como `sin_configurar`. |
| 8 | Plan de pago | En código: se elige en la ficha y se ve en el admin. | Cargar los planes reales por contrato (hoy hay 0 en producción: sin plan nadie puede enviar). |
| 9 | Dirección | En código: calle, número, barrio, localidad, provincia, código postal. | Revisar el teclado en celular. |
| 10 | Error de carga | En código: el envío espera confirmación del servidor, 409 por duplicado, índices contra doble envío (migración 0006), borra la firma suelta si falla. | Aplicar 0006 en Supabase. Probar un envío real con la base cargada. |
| 11 | Pertenencia en el admin | En código: Colegio → Curso → Grado → División → Plan → Contrato, más Tutor y datos personales. Selector de grupo en Pasajeros corregido. | Verificar en el navegador con datos de prueba. |
| 12 | Excel | En código: exporta pasajeros filtrados, 28 columnas, orden Colegio → Grado → División → Apellido. | Probar con datos reales. |

Dependen de la base real (todavía no): puntos 1, 8 y 10. Depende de configuración externa: punto 7.

---

# Revisión a mano en el navegador (Paso 4, 25/11/2026)

Rama `b830cbb` (`feat/colegios-padron` con el PR #4). Servidor local con `npm run dev` (base en memoria, datos ficticios), Playwright a 1280 px y a 390 px. No se escribió en Supabase ni se mandaron correos.

## Qué se probó y cómo salió

| Qué | Resultado |
|---|---|
| Formulario de Tutor (`#/inscripcion/tutor`), 1280 px | OK. Vacío lista los 11 datos faltantes, cada campo marca su error. Con DNI de 2 dígitos, CUIL de dígito verificador incorrecto, celular corto y correo sin `@` marca los 4 errores. Con datos válidos: HTTP 201 y pantalla de confirmación. |
| Tutor y selector PAX/Tutor, 390 px | OK. Sin desborde horizontal, letra de 16 px o más en todos los campos (iPhone no hace zoom), controles de 40 px o más. |
| Ficha PAX completa, 390 px | OK. Se completó entera en celular con nombres con tildes, domicilio `S/N`, plan de 12 cuotas y firma escrita: HTTP 201, «Recibimos tu ficha correctamente», correo `sin_configurar`. Sin desborde, letra de 16 px o más. Único control bajo 40 px: «Limpiar firma» (34 px). |
| Pantalla Fichas del admin, 1280 px | OK. Lista con colegio, viaje, curso, contrato, plan, tutor, estado y correo. Detalle con la pertenencia completa (punto 11): Colegio → Curso → Grado/Año → División → Plan → Contrato → Tutor, más datos del pasajero, tutor, domicilio, firma y asignación de grupo y contrato. |
| Aprobar ficha | OK: «Marcar en revisión» y «Aprobar y crear pasajero» devuelven 200 y la ficha pasa a Aprobadas. |
| Pasajeros y Excel (punto 12) | OK. Descarga `EAA_pasajeros_AAAA-MM-DD.xlsx`, hoja «Pasajeros», 28 columnas: Colegio, Curso, Grado/Año, División, Contrato, Plan, Cuotas, Apellido, Nombre, DNI, Nacimiento, Sexo, datos del tutor, domicilio, estados. Las tildes llegan bien. |
| PDF (puntos 3, 8) | OK salvo la falla 1. Una página, «APELLIDO, NOMBRE» separados con coma, colegio, contrato, destino, plan, domicilio, CUIL y firma. |
| Admin a 390 px | Sin desborde de página; las tablas (Fichas ~2.200 px, Pasajeros ~1.250 px) scrollean dentro de su contenedor. |

## Fallas y observaciones

| # | Gravedad | Qué pasa | Dónde |
|---|---|---|---|
| 1 | **Media** | El PDF pierde las letras fuera de Latin-1: «Fernández Mićić» sale **«FERNÁNDEZ MII»**. El admin y el Excel conservan el nombre bien. Afecta apellidos croatas, polacos, etc. | `textoSeguro` en `lib/ficha-pdf.js` (ya estaba en la limpieza menor del HANDOFF; ahora está confirmado). |
| 2 | Media | Si la sesión del admin se pierde (vence, o alguien inicia sesión con el mismo usuario), el guardado devuelve 401. La pantalla muestra el aviso «No se pudo guardar en la base de datos: Necesitás iniciar sesión…», pero el selector sigue mostrando el valor nuevo (sin guardar) y no manda al login. Quien no lea el aviso cree que quedó guardado. Al recargar vuelve el valor anterior. | Frontend del admin (`assets/js/app.js`). |
| 3 | Baja | Iniciar sesión borra las demás sesiones del mismo usuario. Dos personas que comparten `admin` se echan entre sí. Con un usuario por persona no pasa. | `server.js` ~793. Definirlo junto con los roles (Paso 3). |
| 4 | Baja | Cabecera del admin: la etiqueta «Admin» sale en negro sobre azul oscuro (poco contraste). | CSS del admin. |
| 5 | Baja | En celular, las tablas de Fichas y Pasajeros obligan a scrollear de costado dentro de la tabla. Sirve, pero es incómodo. Mejor decidirlo con el rediseño (Paso 8). | Frontend del admin. |
| 6 | Baja | Los placeholders (`20-12345678-6`, `3794 123456`, `1234`, `3400`) son gris oscuro (`rgb(92,108,118)`, contraste suficiente) y pueden parecer datos cargados. | CSS de la ficha. |
| 7 | Baja | «Limpiar firma» mide 34 px de alto (menos de 40 px). | CSS de la ficha. |
| 8 | Ya conocida | El footer muestra `contacto@elangelazul.com.ar`, que no existe. | Paso 6. |
| 9 | A verificar | Las secciones de la ficha PAX están en `visibility: hidden` hasta que el scroll las revela (GSAP). No se probó la navegación solo con teclado ni con lector de pantalla: si el foco salta campos ocultos, es un problema de accesibilidad. | `bindFichaAdhesionAnimations` en `assets/js/app.js`. |

## Estado de los puntos tras la revisión

Puntos revisados a mano con datos de prueba, sin fallas bloqueantes: 2, 3, 4, 5, 6, 8, 9, 11 y 12. El 3 tiene la falla 1 en el PDF. Siguen dependiendo de la base real o de configuración externa: 1, 8 (planes reales), 10 (migración 0006) y 7 (Resend).

No se revisó: la ficha con ~2.900 colegios en el buscador (requiere importar el Padrón), un envío real de correo, ni Safari/iPhone reales.
