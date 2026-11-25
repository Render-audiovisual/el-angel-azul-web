# Página pública — propuesta visual

Actualizado el 25/11/2026. Rama: `feat/publica-experiencia`.

## Dirección

Referencia del dueño: https://maxdream.tur.ar/. Se toman la escala fotográfica, la jerarquía de titulares y el recorrido por experiencias. La identidad, textos, fotos y contenido de esta propuesta corresponden a El Ángel Azul. No se incorporan cifras de trayectoria, servicios exclusivos o coberturas no confirmadas.

La portada ayuda a estudiantes y familias a elegir un destino, conocer a la agencia y consultar o completar su inscripción. Mantiene las rutas y el sistema de fichas existentes.

- Azul profundo `#082b4a`, azul viaje `#155bc4`, hielo `#e4f3fa`, papel `#f6f9fc`, naranja `#ff7049` y tinta `#132e46`.
- Titulares: Barlow Condensed 800. Texto y controles: Plus Jakarta Sans. Reutiliza las fuentes ya cargadas.
- Rasgo principal: fotografía real del grupo y titular de gran escala «El viaje pasa. La historia queda».
- Recorrido: portada → destinos Bariloche/Carlos Paz → acompañamiento → galería real → preguntas de las familias → consulta e inscripción.
- Header y footer compartidos con el resto de la web pública. CSS nuevo aislado del panel y de los formularios.

## Cambios funcionales

- Accesos directos a los destinos, consulta por WhatsApp e inscripción.
- Galería de desplazamiento nativo, con controles y sin rotación automática.
- Preguntas frecuentes con `details` nativos, accesibles por teclado.
- Menú móvil, cierre con Escape y enlace para saltar al contenido.
- Cambio entre rutas públicas vuelve al inicio; los enlaces dentro de la portada hacen scroll a la sección.
- Foto principal precargada, prioridad alta; resto de imágenes con carga diferida. La portada no depende de Swiper ni de GSAP para ser visible.
- Se retira del footer el correo señalado como inexistente en los traspasos y se conserva el contacto por WhatsApp.

## Verificación

- `npm run check`: 130 pruebas aprobadas con PGlite, sin base real.
- Revisión en navegador de escritorio y a 390 × 844: sin desborde horizontal ni imágenes rotas.
- Comprobados el menú móvil y su acceso a inscripción, la vuelta a la portada, preguntas desplegables y desplazamiento de la galería.
- Capturas en `outputs/` del chat. No se publicó en `main` ni se cambió la base real.

Esta rama parte de `fix/admin-guardado-concurrente`; no modifica su comportamiento. La propuesta debe revisarse antes de incorporarla a la rama compartida y desplegarla.
