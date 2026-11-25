# Inscripción online — consignas de El Ángel Azul

Pedido recibido el 20/11/2026. La familia debe completar toda la inscripción en la web, sin volver a cargar la misma información en papel o en administración. La revisión y aprobación siguen siendo tareas del administrador.

Prioridad: ficha estable, fácil de completar y correctamente integrada al administrador. Luego, funciones complementarias de historial, Excel y correo.

## Requisitos y estado en la rama de trabajo

Esto describe el código de `feat/colegios-padron`, no una validación de producción.

| # | Requisito | Implementación y verificación |
|---|---|---|
| 1 | Administrar colegios activos, conservar historial y vincular cada PAX | Admin Colegios; baja lógica, sin borrar el registro; vinculación por ID. Pruebas `colegios-admin.test.js`. El importador del Padrón está implementado, sin ejecución contra la base real en esta sesión. |
| 2 | Curso, Grado/Año y División obligatorios | Curso identifica Primaria/Secundaria; Grado/Año y División separados. Validación en navegador y servidor. |
| 3 | Nombre y apellido separados y completos, con tildes | Campos separados, obligatorios y con aclaración visible. Admin conserva ambos; PDF delimita apellido y nombre con coma. |
| 4 | Impedir enviar fichas incompletas | Validación compartida, errores por campo y rechazo HTTP 400. Solo HTTP 201 muestra la confirmación de guardado. |
| 5 | Selección PAX/Tutor, con ficha corta para Tutor | Selector previo y formulario específico de tutor adicional. |
| 6 | CUIL/CUIT, teléfono, correo y datos del tutor | Campos obligatorios; verificación del CUIL y coincidencia con DNI, formato de teléfono y correo. |
| 7 | Enviar ficha por correo con formato correcto | PDF en servidor, envío y reenvío con Resend. Gmail puede ser el destinatario; no hay envío desde una cuenta Gmail. Falta comprobar configuración de dominio/remitente en el entorno real. La confirmación de guardado ya no afirma que el correo fue enviado. |
| 8 | Plan de pago visible en ficha y admin | Planes activos del contrato; selección obligatoria cuando hay planes; se conserva al aprobar al PAX y está en el PDF. |
| 9 | Corregir Dirección | Calle, número o S/N, provincia, localidad y CP/CPA obligatorios. Piso, departamento y barrio opcionales. La sugerencia de localidad no impide escribirla manualmente. |
| 10 | Solucionar errores de envío y preservar datos | El formulario espera el guardado real; conserva los campos ante errores y permite reintentar. Duplicados devuelven 409. |
| 11 | Pertenencia completa en Admin | Detalle de ficha con Colegio → Curso → Grado/Año → División → Plan → Contrato → Tutor. Datos personales y domicilio separados. |
| 12 | Exportar PAX a Excel con columnas ordenadas | Botón existente en Pasajeros, exportación de filas filtradas, 28 columnas y orden por colegio, grado, división y apellido. |

## Verificación del 20/11/2026

- `npm run check`: 117 pruebas aprobadas.
- Nueva prueba `scripts/inscripcion-online.test.js`: servidor HTTP real y Postgres en memoria con las migraciones del repositorio. Configura colegio, grupo, contrato y plan mediante las rutas del admin; consulta el selector público; rechaza dirección y plan incompletos; guarda una ficha con nombres acentuados y domicilio S/N/CPA; comprueba su lectura autenticada; rechaza el duplicado; registra un tutor adicional; descarga el PDF autenticado; guarda el pasajero y aprueba la ficha; verifica plan y ambos vínculos de tutor.
- Esta prueba no sustituye la prueba visual en celular ni una comprobación del entorno de producción.
- No se enviaron correos reales ni se escribió en Supabase.

## Pendientes para habilitar la inscripción real

1. Dar acceso a la cuenta de Supabase que contiene «Angel Azul base». Ese proyecto no aparece en las conexiones disponibles en esta sesión; no se pudo verificar el estado actual de sus datos ni migraciones.
2. Revisar las migraciones aplicadas y los datos existentes antes de preparar cambios en producción. El traspaso del 17/11 señala pendientes las migraciones 0005 y 0006; es información histórica, todavía sin revalidar.
3. Cargar o verificar colegios, grupos, viajes, contratos y planes reales. No inventar precios, destinos ni condiciones de pago. Los registros usados por el admin necesitan su `legacy_id`.
4. Con la aprobación explícita del dueño, aplicar los cambios necesarios y publicar la rama revisada. `AGENTS.md` requiere esa aprobación para escrituras en Supabase y push a `main`.
5. Configurar las variables privadas en Hostinger y, para el correo, dominio/remitente verificados. Ninguna credencial debe pasar por el chat o el repositorio.
6. Probar desde celular la inscripción completa en el entorno acordado: selección, firma, confirmación, ficha en admin, aprobación y PDF; probar Excel y correo cuando estén habilitados.

La previsualización independiente creada el 17/11, `devoted-sienna-fox-25.hostingersite.com`, se creó sin base de producción ni contraseñas de admin. No constituye por sí sola un sistema de inscripción operativo. Su disponibilidad no se revalidó el 20/11.
